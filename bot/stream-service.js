const http = require("http");
const path = require("path");
const {
  IngressClient,
  RoomServiceClient,
  EgressClient,
  AccessToken,
} = require("livekit-server-sdk");

// Load .env from project root
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const PORT = process.env.STREAM_PORT || 3939;
const PUBLIC_WS_URL = process.env.LIVEKIT_PUBLIC_WS_URL || "wss://plgames-voice.ru/livekit";

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error("[STREAM] Missing required env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET");
  process.exit(1);
}

const ingressClient = new IngressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
const egressClient = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

function createViewerToken(roomName, identity) {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    ttl: "6h",
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
  });
  return token.toJwt();
}

// --- Caller authentication ---
//
// /stream/active exposes room names (which are channel ids), streamer
// identities and viewer counts. Served anonymously that let anyone on the
// internet enumerate who was streaming in which channel, including private
// ones. Callers must now present a session the API recognises.
//
// Validated tokens are cached briefly: the home page polls this endpoint every
// 30s per open tab, and we do not want a /users/@me round-trip for each poll.
const API_URL = process.env.API_URL;
const AUTH_TTL_MS = 60_000;
const AUTH_CACHE_MAX = 1000;
const authCache = new Map();

async function isAuthenticated(req) {
  const botToken = req.headers["x-bot-token"];
  const sessionToken = req.headers["x-session-token"];
  const token = botToken || sessionToken;
  if (!token || typeof token !== "string") return false;

  const expiry = authCache.get(token);
  if (expiry && expiry > Date.now()) return true;
  if (expiry) authCache.delete(token);

  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/users/@me`, {
      headers: { [botToken ? "X-Bot-Token" : "X-Session-Token"]: token },
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  // Cheap bound on the cache: drop the oldest entry once it grows too large.
  // Map preserves insertion order, so the first key is the oldest.
  if (authCache.size >= AUTH_CACHE_MAX) {
    authCache.delete(authCache.keys().next().value);
  }
  authCache.set(token, Date.now() + AUTH_TTL_MS);
  return true;
}

// Only rooms fed by an active RTMP/WHIP ingress are public streams. Voice
// channels share the same LiveKit namespace (room name == channel id) but
// never have an ingress, so gating on this prevents anonymous viewers from
// minting a subscribe token for a private voice channel they can't access.
async function isActiveStreamRoom(roomName) {
  const ingresses = await ingressClient.listIngress();
  return ingresses.some(
    (ing) => ing.roomName === roomName && ing.status && ing.status.startedAt,
  );
}

// --- Viewer page ---

// The page used to pull livekit-client from cdn.jsdelivr.net, but the CSP added
// in 0ea8d12a says `script-src 'self' ...` with no CDN host, so the browser has
// been blocking it — and the viewer page with it — since 2026-05-17. Serve the
// bundle ourselves instead of poking a hole in the CSP for a third-party host.
const LIVEKIT_CLIENT_UMD = (() => {
  try {
    // The package's "." export maps the `require` condition straight at
    // dist/livekit-client.umd.js, which is exactly the browser bundle we serve.
    return require("fs").readFileSync(require.resolve("livekit-client"), "utf8");
  } catch (e) {
    console.error("[STREAM] Could not load livekit-client UMD bundle:", e.message);
    return null;
  }
})();

const VIEWER_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PLGames Stream</title>
  <script src="/stream/livekit-client.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #eee; font-family: system-ui, sans-serif; }
    .header { background: #16213e; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
    .header h1 { font-size: 18px; color: #e94560; }
    .header .viewers { margin-left: auto; font-size: 14px; color: #888; }
    .container { display: flex; height: calc(100vh - 48px); }
    .video-area { flex: 1; display: flex; align-items: center; justify-content: center; background: #000; position: relative; }
    .video-area video { max-width: 100%; max-height: 100%; }
    .waiting { color: #888; font-size: 20px; }
    .status { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 4px; font-size: 13px; }
    .live-badge { color: #e94560; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PLGames LIVE</h1>
    <span id="streamName"></span>
    <span class="viewers" id="viewers"></span>
  </div>
  <div class="container">
    <div class="video-area" id="videoArea">
      <div class="waiting" id="waiting">Ожидание стрима...</div>
    </div>
  </div>
  <script>
    const params = new URLSearchParams(location.search);
    const room = params.get("room");
    const tokenUrl = "/stream/token?room=" + encodeURIComponent(room);
    document.getElementById("streamName").textContent = room || "";

    async function connect() {
      const res = await fetch(tokenUrl);
      const { token, wsUrl } = await res.json();
      const lk = new LivekitClient.Room({ adaptiveStream: true, dynacast: true });

      lk.on(LivekitClient.RoomEvent.TrackSubscribed, (track, pub, participant) => {
        const el = track.attach();
        document.getElementById("waiting").style.display = "none";
        document.getElementById("videoArea").appendChild(el);
        const status = document.createElement("div");
        status.className = "status";
        status.innerHTML = '<span class="live-badge">LIVE</span> ' + participant.identity;
        document.getElementById("videoArea").appendChild(status);
      });

      lk.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(el => el.remove());
      });

      lk.on(LivekitClient.RoomEvent.ParticipantConnected, () => updateViewers(lk));
      lk.on(LivekitClient.RoomEvent.ParticipantDisconnected, () => updateViewers(lk));
      lk.on(LivekitClient.RoomEvent.Disconnected, () => {
        document.getElementById("waiting").style.display = "";
        document.getElementById("waiting").textContent = "Стрим завершён";
      });

      await lk.connect(wsUrl, token);
      updateViewers(lk);
    }

    function updateViewers(lk) {
      const count = lk.remoteParticipants.size + 1;
      document.getElementById("viewers").textContent = count + " зрителей";
    }

    if (room) connect().catch(e => {
      document.getElementById("waiting").textContent = "Ошибка: " + e.message;
    });
    else document.getElementById("waiting").textContent = "Не указана комната (?room=...)";
  </script>
</body>
</html>`;

// --- Rate limiting ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
}, 300_000);

// --- HTTP Server ---

const ALLOWED_ORIGIN = process.env.PUBLIC_URL || "https://plgames-voice.ru";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const clientIp = req.headers["x-real-ip"] || req.socket.remoteAddress;

  // CORS — restrict to our domain
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === "/stream/" || url.pathname === "/stream") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(VIEWER_HTML);

  } else if (url.pathname === "/stream/livekit-client.js") {
    if (!LIVEKIT_CLIENT_UMD) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("livekit-client bundle missing");
    }
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    });
    res.end(LIVEKIT_CLIENT_UMD);

  } else if (url.pathname === "/stream/active") {
    if (isRateLimited(clientIp)) {
      res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "60" });
      return res.end(JSON.stringify({ error: "Too many requests" }));
    }
    if (!(await isAuthenticated(req))) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "authentication required" }));
    }
    try {
      const ingresses = await ingressClient.listIngress();
      const active = [];
      for (const ing of ingresses) {
        if (ing.status && ing.status.startedAt) {
          const rooms = await roomService.listRooms([ing.roomName]);
          const room = rooms[0];
          active.push({
            name: ing.name,
            room: ing.roomName,
            streamer: ing.participantIdentity || ing.participantName,
            viewers: room ? room.numParticipants - 1 : 0,
            startedAt: Number(ing.status.startedAt) * 1000,
            viewUrl: `/stream/?room=${encodeURIComponent(ing.roomName)}`,
          });
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ streams: active }));
    } catch {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ streams: [] }));
    }

  } else if (url.pathname === "/stream/token") {
    if (isRateLimited(clientIp)) {
      res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "60" });
      return res.end(JSON.stringify({ error: "Too many requests" }));
    }
    const room = url.searchParams.get("room");
    if (!room || !/^[\w-]{1,64}$/.test(room)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "room required (alphanumeric, max 64 chars)" }));
    }
    const viewerId = `viewer-${Math.random().toString(36).slice(2, 8)}`;
    try {
      if (!(await isActiveStreamRoom(room))) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "no active stream for this room" }));
      }
      const token = await createViewerToken(room, viewerId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token, wsUrl: PUBLIC_WS_URL }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }

  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// Export LiveKit clients for use by bot
module.exports = { ingressClient, roomService, egressClient, createViewerToken };

// Always start the HTTP server — the bot requires this module, so the
// previous `require.main === module` guard meant /stream/* never had a
// listener and every request returned 502 via nginx. Set STREAM_PORT=0
// to disable explicitly.
if (PORT !== "0" && PORT !== 0) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[STREAM] Stream service running on port ${PORT}`);
  });
}

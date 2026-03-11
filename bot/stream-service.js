const http = require("http");
const {
  IngressClient,
  IngressInput,
  RoomServiceClient,
  EgressClient,
  AccessToken,
} = require("livekit-server-sdk");

const LIVEKIT_URL = process.env.LIVEKIT_URL || "http://127.0.0.1:7880";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "070015acb35d";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "1ebd13d2a06a44456961489157de89c8ff9263880d148cb2";
const PORT = process.env.STREAM_PORT || 3939;

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

// --- Viewer page ---

const VIEWER_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PLGames Stream</title>
  <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.js"></script>
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

// --- HTTP Server ---

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === "/stream/" || url.pathname === "/stream") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(VIEWER_HTML);

  } else if (url.pathname === "/stream/active") {
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
    } catch (e) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ streams: [] }));
    }

  } else if (url.pathname === "/stream/token") {
    const room = url.searchParams.get("room");
    if (!room) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "room required" }));
    }
    const viewerId = `viewer-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const token = await createViewerToken(room, viewerId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token, wsUrl: "wss://plgames-voice.ru/livekit" }));
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

// Only start HTTP server when run directly (not when required by bot)
if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[STREAM] Stream service running on port ${PORT}`);
  });
}

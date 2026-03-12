const WebSocket = require("ws");
const { IngressInput } = require("livekit-server-sdk");
const { ingressClient, roomService, egressClient } = require("./stream-service");

const BOT_TOKEN = process.env.BOT_TOKEN || "JvOmSsjwDuRPAJTbVJ0X4Bh33vVMkis5oeO4Ano9v5cdXMPu1kk4FFoKMVr4YwD3";
const API_URL = process.env.API_URL || "https://plgames-voice.ru/api";
const WS_URL = process.env.WS_URL || "wss://plgames-voice.ru/ws";
const PREFIX = process.env.PREFIX || "!";
const PUBLIC_URL = "https://plgames-voice.ru";

const SERVER_ID = "01KJ3E82WMT4EEAJ4NMJ7H7V3Z";
const WELCOME_CHANNEL = "01KJ5VGBTASNYK698NN4563D1B";

let ws;
let pingInterval;
let botUserId;

const activeStreams = new Map();

// --- Temp Voice Channels ---
const TRIGGER_MARKER = "[TRIGGER:TEMP_VOICE]";
const TEMP_MARKER_PREFIX = "[TEMP_VOICE:";
const tempChannels = new Map(); // channelId -> { creatorId, serverId }
const triggerChannelIds = new Set();

function isTriggerChannel(channel) {
  return channel.description && channel.description.includes(TRIGGER_MARKER);
}

function isTempChannel(channel) {
  return channel.description && channel.description.includes(TEMP_MARKER_PREFIX);
}

function extractTempCreator(description) {
  if (!description) return null;
  const match = description.match(/\[TEMP_VOICE:([A-Z0-9]+)\]/);
  return match ? match[1] : null;
}

async function checkAndDeleteTempChannel(channelId) {
  try {
    const channel = await api("GET", `/channels/${channelId}`);
    // Check if channel still has voice participants
    // Use the LiveKit room service to check participant count
    const roomName = channelId;
    try {
      const rooms = await roomService.listRooms([roomName]);
      const room = rooms.find((r) => r.name === roomName);
      if (room && room.numParticipants > 0) return; // still has participants
    } catch {
      // If room doesn't exist in LiveKit, it means nobody is in voice
    }
    // Delete the empty temp channel
    await api("DELETE", `/channels/${channelId}`);
    tempChannels.delete(channelId);
    console.log(`[TEMP] Deleted empty temp channel ${channelId}`);
  } catch (e) {
    // Channel may already be deleted
    tempChannels.delete(channelId);
  }
}

// Periodic cleanup sweep for temp channels
setInterval(async () => {
  for (const [channelId] of tempChannels) {
    await checkAndDeleteTempChannel(channelId);
  }
}, 60000);

// --- API helpers ---

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "X-Bot-Token": BOT_TOKEN,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path}: ${res.status} ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : null;
}

function sendMessage(channelId, content) {
  return api("POST", `/channels/${channelId}/messages`, { content });
}

// --- Commands ---

const COMMANDS = {
  async help(msg) {
    const text = [
      "**Команды администратора:**",
      `\`${PREFIX}help\` — список команд`,
      `\`${PREFIX}ping\` — проверка связи`,
      `\`${PREFIX}info\` — информация о сервере`,
      `\`${PREFIX}kick @user\` — кикнуть пользователя`,
      `\`${PREFIX}ban @user [причина]\` — забанить`,
      `\`${PREFIX}unban <user_id>\` — разбанить`,
      `\`${PREFIX}mute @user [минуты]\` — замьютить`,
      `\`${PREFIX}purge <N>\` — удалить N сообщений`,
      "",
      "**Стриминг:**",
      `\`${PREFIX}stream start <название>\` — создать RTMP-стрим`,
      `\`${PREFIX}stream stop\` — остановить стрим`,
      `\`${PREFIX}stream list\` — активные стримы`,
      `\`${PREFIX}stream record <комната>\` — записать комнату`,
      `\`${PREFIX}stream recordings\` — список записей`,
      "",
      "**Временные каналы:**",
      `\`${PREFIX}trigger <channel_id>\` — сделать канал триггером для временных голосовых`,
      `\`${PREFIX}untrigger <channel_id>\` — убрать триггер с канала`,
    ].join("\n");
    await sendMessage(msg.channel, text);
  },

  async ping(msg) {
    const start = Date.now();
    const sent = await sendMessage(msg.channel, "Понг...");
    const latency = Date.now() - start;
    await api("PATCH", `/channels/${msg.channel}/messages/${sent._id}`, {
      content: `Понг! Задержка: **${latency}ms**`,
    });
  },

  async info(msg) {
    const server = await api("GET", `/servers/${SERVER_ID}`);
    const members = await api("GET", `/servers/${SERVER_ID}/members`);
    const rooms = await roomService.listRooms();
    const activeRooms = rooms.filter((r) => r.numParticipants > 0);
    const text = [
      `**${server.name}**`,
      `Участников: ${members.members.length}`,
      `Каналов: ${server.channels.length}`,
      `Голосовых комнат: ${activeRooms.length}`,
      `Владелец: <@${server.owner}>`,
    ].join("\n");
    await sendMessage(msg.channel, text);
  },

  async kick(msg, args) {
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!kick @user`");
    try {
      await api("DELETE", `/servers/${SERVER_ID}/members/${userId}`);
      await sendMessage(msg.channel, `<@${userId}> кикнут с сервера.`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async ban(msg, args) {
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!ban @user`");
    const reason = args.slice(1).join(" ") || "Нарушение правил";
    try {
      await api("PUT", `/servers/${SERVER_ID}/bans/${userId}`, { reason });
      await sendMessage(msg.channel, `<@${userId}> забанен. Причина: ${reason}`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async unban(msg, args) {
    const userId = args[0];
    if (!userId) return sendMessage(msg.channel, "Укажите ID: `!unban <user_id>`");
    try {
      await api("DELETE", `/servers/${SERVER_ID}/bans/${userId}`);
      await sendMessage(msg.channel, `Пользователь ${userId} разбанен.`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async mute(msg, args) {
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!mute @user`");
    const minutes = parseInt(args[1]) || 10;
    const timeout = new Date(Date.now() + minutes * 60000).toISOString();
    try {
      await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, { timeout });
      await sendMessage(msg.channel, `<@${userId}> замьючен на ${minutes} мин.`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async purge(msg, args) {
    const count = Math.min(parseInt(args[0]) || 10, 100);
    try {
      const messages = await api("GET", `/channels/${msg.channel}/messages?limit=${count}&sort=Latest`);
      const ids = messages.map((m) => m._id);
      for (const id of ids) {
        await api("DELETE", `/channels/${msg.channel}/messages/${id}`);
      }
      const notice = await sendMessage(msg.channel, `Удалено ${ids.length} сообщений.`);
      setTimeout(() => {
        api("DELETE", `/channels/${msg.channel}/messages/${notice._id}`).catch(() => {});
      }, 3000);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async stream(msg, args) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "start") {
      const name = args.slice(1).join(" ") || `stream-${Date.now()}`;
      const roomName = `stream-${msg.author}-${Date.now()}`;
      try {
        const ingress = await ingressClient.createIngress(IngressInput.RTMP_INPUT, {
          name,
          roomName,
          participantName: name,
          participantIdentity: `streamer-${msg.author}`,
        });
        activeStreams.set(msg.author, { ingressId: ingress.ingressId, roomName, name });
        const viewerUrl = `${PUBLIC_URL}/stream/?room=${encodeURIComponent(roomName)}`;
        const text = [
          `**Стрим "${name}" создан**`,
          "",
          "Настройки OBS:",
          `Сервер: \`rtmp://plgames-voice.ru/live\``,
          `Ключ стрима: \`${ingress.streamKey}\``,
          "",
          `Ссылка для зрителей: ${viewerUrl}`,
          "",
          "Нажми **Начать трансляцию** в OBS.",
        ].join("\n");
        await sendMessage(msg.channel, text);
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка создания стрима: ${e.message}`);
      }
    } else if (sub === "stop") {
      const stream = activeStreams.get(msg.author);
      if (!stream) return sendMessage(msg.channel, "У тебя нет активного стрима.");
      try {
        await ingressClient.deleteIngress(stream.ingressId);
        activeStreams.delete(msg.author);
        await sendMessage(msg.channel, `Стрим "${stream.name}" остановлен.`);
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка: ${e.message}`);
      }
    } else if (sub === "list") {
      try {
        const ingresses = await ingressClient.listIngress();
        if (!ingresses.length) return sendMessage(msg.channel, "Нет активных стримов.");
        const lines = ingresses.map(
          (i) => `- **${i.name}** (${i.status?.startedAt ? "в эфире" : "ожидает"}) — комната: ${i.roomName}`
        );
        await sendMessage(msg.channel, "**Активные стримы:**\n" + lines.join("\n"));
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка: ${e.message}`);
      }
    } else if (sub === "record") {
      const roomName = args.slice(1).join(" ");
      if (!roomName) return sendMessage(msg.channel, "Укажи имя комнаты: `!stream record <room>`");
      try {
        const egress = await egressClient.startRoomCompositeEgress(roomName, {
          file: { fileType: 0, filepath: `/recordings/${roomName}-${Date.now()}.mp4` },
        });
        await sendMessage(msg.channel, `Запись комнаты **${roomName}** начата. ID: \`${egress.egressId}\``);
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка записи: ${e.message}`);
      }
    } else if (sub === "recordings") {
      try {
        const egresses = await egressClient.listEgress();
        if (!egresses.length) return sendMessage(msg.channel, "Нет записей.");
        const lines = egresses.slice(-10).map(
          (e) => `- \`${e.egressId.slice(0, 8)}\` ${e.roomName || "?"} — ${e.status === 0 ? "активна" : "завершена"}`
        );
        await sendMessage(msg.channel, "**Записи:**\n" + lines.join("\n"));
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка: ${e.message}`);
      }
    } else {
      await sendMessage(msg.channel, "Подкоманды: `start`, `stop`, `list`, `record`, `recordings`");
    }
  },

  async trigger(msg, args) {
    const channelId = args[0];
    if (!channelId) return sendMessage(msg.channel, "Укажите ID канала: `!trigger <channel_id>`");
    try {
      const channel = await api("GET", `/channels/${channelId}`);
      const desc = (channel.description || "") + (channel.description ? "\n" : "") + TRIGGER_MARKER;
      await api("PATCH", `/channels/${channelId}`, { description: desc });
      triggerChannelIds.add(channelId);
      await sendMessage(msg.channel, `Канал **${channel.name}** теперь триггер для временных голосовых.`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },

  async untrigger(msg, args) {
    const channelId = args[0];
    if (!channelId) return sendMessage(msg.channel, "Укажите ID канала: `!untrigger <channel_id>`");
    try {
      const channel = await api("GET", `/channels/${channelId}`);
      const desc = (channel.description || "").replace(TRIGGER_MARKER, "").trim();
      await api("PATCH", `/channels/${channelId}`, { description: desc || null });
      triggerChannelIds.delete(channelId);
      await sendMessage(msg.channel, `Триггер убран с канала **${channel.name}**.`);
    } catch (e) {
      await sendMessage(msg.channel, `Ошибка: ${e.message}`);
    }
  },
};

function extractUserId(mention) {
  if (!mention) return null;
  const match = mention.match(/^<@([A-Z0-9]+)>$/);
  return match ? match[1] : mention.match(/^[A-Z0-9]{26}$/) ? mention : null;
}

// --- Event handlers ---

function handleMessage(data) {
  if (data.author === botUserId) return;
  const content = data.content || "";
  if (!content.startsWith(PREFIX)) return;

  const parts = content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (COMMANDS[cmd]) {
    console.log(`[CMD] ${cmd} from ${data.author} in ${data.channel}`);
    COMMANDS[cmd](data, args).catch((e) => console.error(`[CMD ERROR] ${cmd}:`, e.message));
  }
}

function handleMemberJoin(data) {
  const userId = data.member?.id?.user || data.user;
  if (!userId || userId === botUserId) return;
  console.log(`[JOIN] ${userId} joined server`);
  sendMessage(WELCOME_CHANNEL, `Добро пожаловать на сервер, <@${userId}>!`)
    .catch((e) => console.error("[WELCOME ERROR]", e.message));
}

function handleMemberLeave(data) {
  console.log(`[LEAVE] ${data.user} left server (${data.reason})`);
}

// --- WebSocket connection ---

function connect() {
  console.log("[WS] Connecting...");
  ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("[WS] Connected, authenticating...");
    ws.send(JSON.stringify({ type: "Authenticate", token: BOT_TOKEN }));
  });

  ws.on("message", (raw) => {
    let event;
    try { event = JSON.parse(raw); } catch { return; }

    switch (event.type) {
      case "Authenticated":
        console.log("[WS] Authenticated successfully");
        break;
      case "Ready":
        console.log(`[WS] Ready — ${event.servers?.length || 0} servers, ${event.channels?.length || 0} channels`);
        if (event.users) {
          const bot = event.users.find((u) => u.bot);
          if (bot) botUserId = bot._id;
        }
        console.log(`[BOT] User ID: ${botUserId}`);
        // Scan channels for trigger/temp markers
        if (event.channels) {
          for (const ch of event.channels) {
            if (isTriggerChannel(ch)) {
              triggerChannelIds.add(ch._id);
              console.log(`[TEMP] Found trigger channel: ${ch.name} (${ch._id})`);
            }
            if (isTempChannel(ch)) {
              const creatorId = extractTempCreator(ch.description);
              tempChannels.set(ch._id, { creatorId, serverId: ch.server });
              console.log(`[TEMP] Found temp channel: ${ch.name} (${ch._id})`);
            }
          }
          console.log(`[TEMP] ${triggerChannelIds.size} triggers, ${tempChannels.size} temp channels`);
        }
        break;
      case "Message":
        handleMessage(event);
        break;
      case "ServerMemberJoin":
        if (event.id === SERVER_ID) handleMemberJoin(event);
        break;
      case "ServerMemberLeave":
        if (event.id === SERVER_ID) handleMemberLeave(event);
        break;
      case "ChannelCreate":
        if (isTriggerChannel(event)) {
          triggerChannelIds.add(event._id || event.id);
          console.log(`[TEMP] New trigger channel created: ${event.name}`);
        }
        if (isTempChannel(event)) {
          const id = event._id || event.id;
          const creatorId = extractTempCreator(event.description);
          tempChannels.set(id, { creatorId, serverId: event.server });
          console.log(`[TEMP] New temp channel created: ${event.name}`);
        }
        break;
      case "ChannelDelete":
        triggerChannelIds.delete(event.id);
        tempChannels.delete(event.id);
        break;
      case "VoiceChannelLeave": {
        const chId = event.id || event.channel;
        if (tempChannels.has(chId)) {
          console.log(`[TEMP] User left temp channel ${chId}, checking in 3s...`);
          setTimeout(() => checkAndDeleteTempChannel(chId), 3000);
        }
        break;
      }
      case "Pong":
        break;
      default:
        break;
    }
  });

  ws.on("close", (code) => {
    console.log(`[WS] Disconnected (code: ${code}), reconnecting in 5s...`);
    clearInterval(pingInterval);
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("[WS] Error:", err.message);
  });

  clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "Ping", data: { time: Date.now() } }));
    }
  }, 30000);
}

// --- Start ---
console.log("[BOT] Нерзул Admin Bot starting...");
connect();

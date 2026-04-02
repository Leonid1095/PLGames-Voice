const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { IngressInput } = require("livekit-server-sdk");

// Load .env from project root
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { ingressClient, roomService, egressClient } = require("./stream-service");

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = process.env.API_URL;
const WS_URL = process.env.WS_URL;
const PREFIX = process.env.PREFIX || "!";
const PUBLIC_URL = process.env.PUBLIC_URL || "https://plgames-voice.ru";

const SERVER_ID = process.env.SERVER_ID;
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL;

// --- Persistent settings (JSON file) ---
const SETTINGS_FILE = path.resolve(__dirname, "settings.json");

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[SETTINGS] Failed to load:", e.message);
  }
  return {};
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
  } catch (e) {
    console.error("[SETTINGS] Failed to save:", e.message);
  }
}

const settings = loadSettings();

// Defaults
if (!settings.welcome) settings.welcome = {
  enabled: true,
  channel: WELCOME_CHANNEL || "",
  template: "Добро пожаловать на сервер, {user}! Ты участник #{count} 🎉",
  leaveEnabled: false,
  leaveChannel: "",
  leaveTemplate: "{user} покинул(а) сервер.",
  autoRoleId: "",
  dmEnabled: false,
  dmTemplate: "Привет! Добро пожаловать на **{server}**! Ознакомься с правилами.",
};
if (!settings.starboard) settings.starboard = {
  enabled: false,
  channel: "",
  threshold: 3,
  emoji: "⭐",
  posted: [], // message IDs already posted
};
saveSettings(settings);

if (!BOT_TOKEN || !API_URL || !WS_URL) {
  console.error("[BOT] Missing required env vars: BOT_TOKEN, API_URL, WS_URL");
  process.exit(1);
}

if (!SERVER_ID || !WELCOME_CHANNEL) {
  console.warn("[BOT] Warning: SERVER_ID or WELCOME_CHANNEL not set — some features disabled");
}

let ws;
let pingInterval;
let botUserId;

const activeStreams = new Map();

// --- Input validation helpers ---

const VALID_ID = /^[A-Z0-9]{26}$/;
const VALID_ROOM_NAME = /^[\w-]{1,64}$/;
const MAX_REASON_LENGTH = 200;
const MAX_STREAM_NAME = 50;
const MAX_MUTE_MINUTES = 10080; // 7 days

function validateId(id) {
  return id && VALID_ID.test(id) ? id : null;
}

function sanitizeText(text, maxLen) {
  return (text || "").slice(0, maxLen).replace(/[`*_~|]/g, "");
}

function safeErrorMessage(e) {
  const status = e.message?.match(/:\s*(\d{3})\s/)?.[1];
  if (status) return `Ошибка сервера (${status})`;
  return "Произошла ошибка";
}

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
    await api("GET", `/channels/${channelId}`);
    const roomName = channelId;
    try {
      const rooms = await roomService.listRooms([roomName]);
      const room = rooms.find((r) => r.name === roomName);
      if (room && room.numParticipants > 0) return;
    } catch {
      // Room doesn't exist in LiveKit — nobody is in voice
    }
    console.log(`[TEMP] Channel ${channelId} is empty, deleting...`);
    await api("DELETE", `/channels/${channelId}`);
    tempChannels.delete(channelId);
    console.log(`[TEMP] Deleted empty temp channel ${channelId}`);
  } catch (e) {
    console.error(`[TEMP] Error deleting temp channel ${channelId}:`, e.message || e);
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

async function api(method, apiPath, body) {
  const opts = {
    method,
    headers: {
      "X-Bot-Token": BOT_TOKEN,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${apiPath}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${apiPath}: ${res.status} ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : null;
}

function sendMessage(channelId, content) {
  return api("POST", `/channels/${channelId}/messages`, { content });
}

// --- Permission check ---

async function isAdmin(serverId, userId) {
  try {
    const member = await api("GET", `/servers/${serverId}/members/${userId}`);
    // Server owner is always admin
    const server = await api("GET", `/servers/${serverId}`);
    if (server.owner === userId) return true;
    // Check if member has any roles (basic permission check)
    return member.roles && member.roles.length > 0;
  } catch {
    return false;
  }
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
      "",
      "**Приветствия:**",
      `\`${PREFIX}welcome\` — текущие настройки`,
      `\`${PREFIX}welcome channel <channel_id>\` — канал приветствий`,
      `\`${PREFIX}welcome template <текст>\` — шаблон ({user}, {server}, {count})`,
      `\`${PREFIX}welcome leave <channel_id>\` — канал прощаний`,
      `\`${PREFIX}welcome leavetext <текст>\` — шаблон прощания ({user})`,
      `\`${PREFIX}welcome autorole <role_id>\` — авто-роль при входе`,
      `\`${PREFIX}welcome dm <текст>\` — ЛС новичку ({user}, {server})`,
      `\`${PREFIX}welcome off\` / \`on\` — вкл/выкл`,
      "",
      "**Starboard:**",
      `\`${PREFIX}starboard\` — текущие настройки`,
      `\`${PREFIX}starboard channel <channel_id>\` — канал starboard`,
      `\`${PREFIX}starboard threshold <N>\` — порог (по умолчанию 3)`,
      `\`${PREFIX}starboard emoji <эмодзи>\` — эмодзи (по умолчанию ⭐)`,
      `\`${PREFIX}starboard off\` / \`on\` — вкл/выкл`,
    ].join("\n");
    await sendMessage(msg.channel, text);
  },

  async ping(msg) {
    const start = Date.now();
    const sent = await sendMessage(msg.channel, "Понг...");
    const latency = Date.now() - start;
    await api("PATCH", `/channels/${msg.channel}/messages/${sent._id}`, {
      content: `Понг! Задержка: **${latency}мс**`,
    });
  },

  async info(msg) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
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
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!kick @user`");
    try {
      await api("DELETE", `/servers/${SERVER_ID}/members/${userId}`);
      await sendMessage(msg.channel, `<@${userId}> кикнут с сервера.`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async ban(msg, args) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!ban @user`");
    const reason = sanitizeText(args.slice(1).join(" "), MAX_REASON_LENGTH) || "Нарушение правил";
    try {
      await api("PUT", `/servers/${SERVER_ID}/bans/${userId}`, { reason });
      await sendMessage(msg.channel, `<@${userId}> забанен. Причина: ${reason}`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async unban(msg, args) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const userId = validateId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите корректный ID: `!unban <user_id>`");
    try {
      await api("DELETE", `/servers/${SERVER_ID}/bans/${userId}`);
      await sendMessage(msg.channel, `Пользователь разбанен.`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async mute(msg, args) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const userId = extractUserId(args[0]);
    if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!mute @user`");
    const minutes = Math.max(1, Math.min(parseInt(args[1]) || 10, MAX_MUTE_MINUTES));
    const timeout = new Date(Date.now() + minutes * 60000).toISOString();
    try {
      await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, { timeout });
      await sendMessage(msg.channel, `<@${userId}> замьючен на ${minutes} мин.`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async purge(msg, args) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const count = Math.max(1, Math.min(parseInt(args[0]) || 10, 100));
    try {
      const messages = await api("GET", `/channels/${msg.channel}/messages?limit=${count}&sort=Latest`);
      if (!messages || !messages.length) return sendMessage(msg.channel, "Нет сообщений для удаления.");
      const ids = messages.map((m) => m._id);
      for (const id of ids) {
        await api("DELETE", `/channels/${msg.channel}/messages/${id}`);
      }
      const notice = await sendMessage(msg.channel, `Удалено ${ids.length} сообщений.`);
      setTimeout(() => {
        api("DELETE", `/channels/${msg.channel}/messages/${notice._id}`).catch(() => {});
      }, 3000);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async stream(msg, args) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "start") {
      const name = sanitizeText(args.slice(1).join(" "), MAX_STREAM_NAME) || `stream-${Date.now()}`;
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
          `Сервер: \`rtmp://${new URL(PUBLIC_URL).hostname}/live\``,
          `Ключ стрима: \`${ingress.streamKey}\``,
          "",
          `Ссылка для зрителей: ${viewerUrl}`,
          "",
          "Нажми **Начать трансляцию** в OBS.",
        ].join("\n");
        await sendMessage(msg.channel, text);
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка создания стрима: ${safeErrorMessage(e)}`);
      }
    } else if (sub === "stop") {
      const stream = activeStreams.get(msg.author);
      if (!stream) return sendMessage(msg.channel, "У тебя нет активного стрима.");
      try {
        await ingressClient.deleteIngress(stream.ingressId);
        activeStreams.delete(msg.author);
        await sendMessage(msg.channel, `Стрим "${stream.name}" остановлен.`);
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }
    } else if (sub === "list") {
      try {
        const ingresses = await ingressClient.listIngress();
        if (!ingresses.length) return sendMessage(msg.channel, "Нет активных стримов.");
        const lines = ingresses.map(
          (i) => `- **${sanitizeText(i.name, 50)}** (${i.status?.startedAt ? "в эфире" : "ожидает"}) — комната: ${i.roomName}`
        );
        await sendMessage(msg.channel, "**Активные стримы:**\n" + lines.join("\n"));
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }
    } else if (sub === "record") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const roomName = args.slice(1).join(" ");
      if (!roomName || !VALID_ROOM_NAME.test(roomName)) {
        return sendMessage(msg.channel, "Укажите имя комнаты (буквы, цифры, дефис, до 64 символов): `!stream record <room>`");
      }
      try {
        const egress = await egressClient.startRoomCompositeEgress(roomName, {
          file: { fileType: 0, filepath: `/recordings/${roomName}-${Date.now()}.mp4` },
        });
        await sendMessage(msg.channel, `Запись комнаты **${roomName}** начата. ID: \`${egress.egressId}\``);
      } catch (e) {
        await sendMessage(msg.channel, `Ошибка записи: ${safeErrorMessage(e)}`);
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
        await sendMessage(msg.channel, safeErrorMessage(e));
      }
    } else {
      await sendMessage(msg.channel, "Подкоманды: `start`, `stop`, `list`, `record`, `recordings`");
    }
  },

  async trigger(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const channelId = validateId(args[0]);
    if (!channelId) return sendMessage(msg.channel, "Укажите корректный ID канала: `!trigger <channel_id>`");
    try {
      const channel = await api("GET", `/channels/${channelId}`);
      const desc = (channel.description || "") + (channel.description ? "\n" : "") + TRIGGER_MARKER;
      await api("PATCH", `/channels/${channelId}`, { description: desc });
      triggerChannelIds.add(channelId);
      await sendMessage(msg.channel, `Канал **${sanitizeText(channel.name, 50)}** теперь триггер для временных голосовых.`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  async untrigger(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const channelId = validateId(args[0]);
    if (!channelId) return sendMessage(msg.channel, "Укажите корректный ID канала: `!untrigger <channel_id>`");
    try {
      const channel = await api("GET", `/channels/${channelId}`);
      const desc = (channel.description || "").replace(TRIGGER_MARKER, "").trim();
      await api("PATCH", `/channels/${channelId}`, { description: desc || null });
      triggerChannelIds.delete(channelId);
      await sendMessage(msg.channel, `Триггер убран с канала **${sanitizeText(channel.name, 50)}**.`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  // --- Welcome settings ---
  async welcome(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const w = settings.welcome;
    const sub = (args[0] || "").toLowerCase();

    if (!sub) {
      const lines = [
        `**Настройки приветствий:**`,
        `Статус: ${w.enabled ? "✅ включено" : "❌ выключено"}`,
        `Канал: ${w.channel ? `<#${w.channel}>` : "не задан"}`,
        `Шаблон: \`${w.template}\``,
        `Прощание: ${w.leaveEnabled ? "✅" : "❌"} ${w.leaveChannel ? `<#${w.leaveChannel}>` : ""}`,
        `Шаблон прощания: \`${w.leaveTemplate}\``,
        `Авто-роль: ${w.autoRoleId || "не задана"}`,
        `ЛС новичку: ${w.dmEnabled ? "✅" : "❌"}`,
      ];
      return sendMessage(msg.channel, lines.join("\n"));
    }

    if (sub === "on") {
      w.enabled = true;
      saveSettings(settings);
      return sendMessage(msg.channel, "✅ Приветствия включены.");
    }
    if (sub === "off") {
      w.enabled = false;
      saveSettings(settings);
      return sendMessage(msg.channel, "❌ Приветствия выключены.");
    }
    if (sub === "channel") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала.");
      w.channel = id;
      saveSettings(settings);
      return sendMessage(msg.channel, `Канал приветствий: <#${id}>`);
    }
    if (sub === "template") {
      const tmpl = args.slice(1).join(" ");
      if (!tmpl) return sendMessage(msg.channel, "Укажите шаблон. Переменные: {user}, {server}, {count}");
      w.template = tmpl;
      saveSettings(settings);
      return sendMessage(msg.channel, `Шаблон приветствия: \`${tmpl}\``);
    }
    if (sub === "leave") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала для прощаний.");
      w.leaveChannel = id;
      w.leaveEnabled = true;
      saveSettings(settings);
      return sendMessage(msg.channel, `Канал прощаний: <#${id}>`);
    }
    if (sub === "leavetext") {
      const tmpl = args.slice(1).join(" ");
      if (!tmpl) return sendMessage(msg.channel, "Укажите шаблон. Переменные: {user}");
      w.leaveTemplate = tmpl;
      saveSettings(settings);
      return sendMessage(msg.channel, `Шаблон прощания: \`${tmpl}\``);
    }
    if (sub === "autorole") {
      const roleId = args[1] || "";
      if (roleId === "off" || roleId === "none") {
        w.autoRoleId = "";
        saveSettings(settings);
        return sendMessage(msg.channel, "Авто-роль убрана.");
      }
      w.autoRoleId = roleId;
      saveSettings(settings);
      return sendMessage(msg.channel, `Авто-роль при входе: \`${roleId}\``);
    }
    if (sub === "dm") {
      const tmpl = args.slice(1).join(" ");
      if (!tmpl || tmpl === "off") {
        w.dmEnabled = false;
        saveSettings(settings);
        return sendMessage(msg.channel, "ЛС новичкам выключено.");
      }
      w.dmEnabled = true;
      w.dmTemplate = tmpl;
      saveSettings(settings);
      return sendMessage(msg.channel, `ЛС новичкам: \`${tmpl}\``);
    }
    return sendMessage(msg.channel, "Подкоманды: `channel`, `template`, `leave`, `leavetext`, `autorole`, `dm`, `on`, `off`");
  },

  // --- Starboard settings ---
  async starboard(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const sb = settings.starboard;
    const sub = (args[0] || "").toLowerCase();

    if (!sub) {
      const lines = [
        `**Настройки Starboard:**`,
        `Статус: ${sb.enabled ? "✅ включено" : "❌ выключено"}`,
        `Канал: ${sb.channel ? `<#${sb.channel}>` : "не задан"}`,
        `Порог: ${sb.threshold} ${sb.emoji}`,
        `Эмодзи: ${sb.emoji}`,
      ];
      return sendMessage(msg.channel, lines.join("\n"));
    }

    if (sub === "on") {
      if (!sb.channel) return sendMessage(msg.channel, "Сначала задайте канал: `!starboard channel <id>`");
      sb.enabled = true;
      saveSettings(settings);
      return sendMessage(msg.channel, "✅ Starboard включён.");
    }
    if (sub === "off") {
      sb.enabled = false;
      saveSettings(settings);
      return sendMessage(msg.channel, "❌ Starboard выключен.");
    }
    if (sub === "channel") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала.");
      sb.channel = id;
      saveSettings(settings);
      return sendMessage(msg.channel, `Канал starboard: <#${id}>`);
    }
    if (sub === "threshold") {
      const n = parseInt(args[1]);
      if (!n || n < 1 || n > 50) return sendMessage(msg.channel, "Порог: число от 1 до 50.");
      sb.threshold = n;
      saveSettings(settings);
      return sendMessage(msg.channel, `Порог: ${n} ${sb.emoji}`);
    }
    if (sub === "emoji") {
      const e = args[1];
      if (!e) return sendMessage(msg.channel, "Укажите эмодзи.");
      sb.emoji = e;
      saveSettings(settings);
      return sendMessage(msg.channel, `Эмодзи starboard: ${e}`);
    }
    return sendMessage(msg.channel, "Подкоманды: `channel`, `threshold`, `emoji`, `on`, `off`");
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

async function handleMemberJoin(data) {
  const userId = data.member?.id?.user || data.user;
  if (!userId || userId === botUserId) return;
  console.log(`[JOIN] ${userId} joined server`);

  const w = settings.welcome;
  if (!w.enabled || !w.channel) return;

  try {
    // Get member count for {count} template
    let count = "?";
    try {
      const members = await api("GET", `/servers/${SERVER_ID}/members`);
      count = members.members?.length || "?";
    } catch { /* ignore */ }

    // Get server name for {server} template
    let serverName = "сервер";
    try {
      const server = await api("GET", `/servers/${SERVER_ID}`);
      serverName = server.name || "сервер";
    } catch { /* ignore */ }

    // Send welcome message
    const text = w.template
      .replace(/\{user\}/g, `<@${userId}>`)
      .replace(/\{count\}/g, String(count))
      .replace(/\{server\}/g, serverName);
    await sendMessage(w.channel, text);

    // Auto-role
    if (w.autoRoleId) {
      try {
        await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, {
          roles: [w.autoRoleId],
        });
        console.log(`[JOIN] Auto-role ${w.autoRoleId} assigned to ${userId}`);
      } catch (e) {
        console.error(`[JOIN] Auto-role error:`, e.message);
      }
    }

    // DM welcome
    if (w.dmEnabled && w.dmTemplate) {
      try {
        const dm = await api("GET", `/users/${userId}/dm`);
        const dmText = w.dmTemplate
          .replace(/\{user\}/g, `<@${userId}>`)
          .replace(/\{server\}/g, serverName);
        await sendMessage(dm._id, dmText);
      } catch (e) {
        console.error(`[JOIN] DM error:`, e.message);
      }
    }
  } catch (e) {
    console.error("[WELCOME ERROR]", e.message);
  }
}

async function handleMemberLeave(data) {
  const userId = data.user;
  console.log(`[LEAVE] ${userId} left server (${data.reason})`);

  const w = settings.welcome;
  if (!w.leaveEnabled || !w.leaveChannel) return;

  try {
    const text = w.leaveTemplate
      .replace(/\{user\}/g, userId);
    await sendMessage(w.leaveChannel, text);
  } catch (e) {
    console.error("[LEAVE ERROR]", e.message);
  }
}

// --- Starboard handler ---
async function handleReaction(data) {
  const sb = settings.starboard;
  if (!sb.enabled || !sb.channel) return;

  try {
    const msgId = data.id; // message ID
    const channelId = data.channel_id;
    const emoji = data.emoji_id || data.emoji;

    // Only track configured emoji
    if (emoji !== sb.emoji) return;

    // Don't re-post already posted messages
    if (sb.posted.includes(msgId)) return;

    // Fetch message to check reaction count
    const msg = await api("GET", `/channels/${channelId}/messages/${msgId}`);
    if (!msg || !msg.reactions) return;

    // Find matching reaction count
    let count = 0;
    for (const [key, reaction] of Object.entries(msg.reactions)) {
      if (key === sb.emoji || key === emoji) {
        count = Array.isArray(reaction) ? reaction.length : 0;
        break;
      }
    }

    if (count < sb.threshold) return;

    // Post to starboard channel
    const author = msg.author;
    const content = msg.content || "(вложение)";
    const starText = [
      `${sb.emoji} **${count}** | <#${channelId}>`,
      "",
      `> ${content.split("\n").join("\n> ")}`,
      "",
      `— <@${author}>`,
    ].join("\n");

    await sendMessage(sb.channel, starText);
    sb.posted.push(msgId);
    // Keep only last 500 IDs
    if (sb.posted.length > 500) sb.posted = sb.posted.slice(-500);
    saveSettings(settings);
    console.log(`[STARBOARD] Message ${msgId} posted (${count} ${sb.emoji})`);
  } catch (e) {
    console.error("[STARBOARD ERROR]", e.message);
  }
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
      case "MessageReact":
        handleReaction(event);
        break;
      case "ServerMemberJoin":
        if (SERVER_ID && event.id === SERVER_ID) handleMemberJoin(event);
        break;
      case "ServerMemberLeave":
        if (SERVER_ID && event.id === SERVER_ID) handleMemberLeave(event);
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
console.log("[BOT] PLG Voice Admin Bot starting...");
connect();

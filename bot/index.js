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
if (!settings.reactionRoles) settings.reactionRoles = [];
// Each: { messageId, channelId, emoji, roleId, mode: "toggle"|"exclusive_group" }
if (!settings.levels) settings.levels = {
  enabled: false,
  xpPerMessage: 10,
  cooldown: 60, // seconds
  notifyChannel: "",
  roleRewards: [], // { level, roleId }
  users: {}, // { [userId]: { xp, level, lastXpTime } }
};
if (!settings.auditLog) settings.auditLog = {
  enabled: false,
  channel: "",
};
if (!settings.events) settings.events = [];
if (!settings.premium) settings.premium = {
  users: {}, // { [userId]: { since, expires, tier: "premium"|"premium_plus" } }
};
if (!settings.boosts) settings.boosts = {
  users: {}, // { [userId]: timestamp }
  level: 0,  // calculated: 0-3
};
if (!settings.stickers) settings.stickers = [];
if (!settings.autoTranslate) settings.autoTranslate = {};
// { [channelId]: { targetLang: "ru"|"en", enabled: true } }
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
      "",
      "**Розыгрыши:**",
      `\`${PREFIX}giveaway start <время> [N] <приз>\` — создать (1h, 2d)`,
      `\`${PREFIX}giveaway end <msg_id>\` — завершить досрочно`,
      `\`${PREFIX}giveaway reroll <msg_id>\` — перевыбрать`,
      `\`${PREFIX}giveaway list\` — активные розыгрыши`,
      "",
      "**Опросы:**",
      `\`${PREFIX}poll "Вопрос?" "Вариант 1" "Вариант 2"\` — создать опрос`,
      "",
      "**Автомодерация:**",
      `\`${PREFIX}automod\` — текущие настройки`,
      `\`${PREFIX}automod spam <N> <сек>\` — лимит спама`,
      `\`${PREFIX}automod spamaction <mute|kick|ban> [мин]\` — действие`,
      `\`${PREFIX}automod addword <слово>\` / \`removeword\` / \`words\``,
      `\`${PREFIX}automod duplicates <on|off|N>\` — антидубликаты`,
      `\`${PREFIX}automod log <channel_id>\` — канал логов`,
      `\`${PREFIX}automod on\` / \`off\` — вкл/выкл`,
      "",
      "**Reaction Roles:**",
      `\`${PREFIX}rr create <эмодзи> <role_id> [текст]\` — создать`,
      `\`${PREFIX}rr add <msg_id> <эмодзи> <role_id>\` — добавить к сообщению`,
      `\`${PREFIX}rr list\` / \`remove <N>\` — список / удалить`,
      "",
      "**XP/Уровни:**",
      `\`${PREFIX}level [@user]\` — посмотреть уровень`,
      `\`${PREFIX}leaderboard\` — таблица лидеров`,
      `\`${PREFIX}xp\` — настройки (on/off/amount/cooldown/notify/reward)`,
      "",
      "**Аудит-лог:**",
      `\`${PREFIX}audit\` — настройки`,
      `\`${PREFIX}audit channel <id>\` / \`on\` / \`off\``,
      "",
      "**Календарь событий:**",
      `\`${PREFIX}event create "Название" ГГГГ-ММ-ДД ЧЧ:ММ [описание]\``,
      `\`${PREFIX}event list\` — предстоящие`,
      `\`${PREFIX}event cancel <N>\` — отменить`,
      "",
      "**Формы заявок:**",
      `\`${PREFIX}form create "Название" "Вопрос 1" "Вопрос 2"\` — создать`,
      `\`${PREFIX}apply <form_id> Ответ1 | Ответ2\` — подать заявку`,
      `\`${PREFIX}form submissions <form_id>\` — просмотр заявок`,
      `\`${PREFIX}form accept/reject <form_id> <N>\``,
      "",
      "**Турниры:**",
      `\`${PREFIX}tournament create "Название" [single|double]\``,
      `\`${PREFIX}tournament join/start/result/bracket/list\``,
      "",
      "**Аналитика:**",
      `\`${PREFIX}stats\` — статистика сервера`,
      "",
      "**Premium:**",
      `\`${PREFIX}premium check [@user]\` — статус подписки`,
      `\`${PREFIX}premium give @user [plus] [дней]\` — выдать`,
      `\`${PREFIX}premium remove @user\` — снять`,
      `\`${PREFIX}premium list\` — все Premium`,
      "",
      "**Бусты:**",
      `\`${PREFIX}boost\` — бустнуть сервер`,
      `\`${PREFIX}boosts\` — статус бустов`,
      "",
      "**Стикеры:**",
      `\`${PREFIX}sticker add "Название" <url> [пак]\` — добавить`,
      `\`${PREFIX}sticker list\` / \`send <имя>\` / \`remove <id>\``,
      "",
      "**Перевод:**",
      `\`${PREFIX}translate <текст>\` — перевести (авто-определение ru↔en)`,
      `\`${PREFIX}autotranslate on [channel_id] [язык]\` — авто-перевод канала`,
      `\`${PREFIX}autotranslate off [channel_id]\` / \`list\``,
      "",
      "**Транскрипция:**",
      `\`${PREFIX}transcribe <message_id>\` — распознать голосовое`,
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

  // --- Giveaways ---
  async giveaway(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const sub = (args[0] || "").toLowerCase();

    if (sub === "start") {
      // Parse: !giveaway start <duration> <winners> <prize...>
      const duration = args[1];
      if (!duration) return sendMessage(msg.channel, "Формат: `!giveaway start <время> [победителей] <приз>`\nВремя: 1m, 1h, 1d");

      // Parse duration
      const match = duration.match(/^(\d+)(m|h|d)$/);
      if (!match) return sendMessage(msg.channel, "Формат времени: `10m`, `1h`, `2d`");
      const amount = parseInt(match[1]);
      const unit = match[2];
      const ms = amount * (unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000);
      if (ms > 7 * 86400000) return sendMessage(msg.channel, "Максимум 7 дней.");

      let winners = 1;
      let prizeStart = 2;
      if (args[2] && /^\d+$/.test(args[2])) {
        winners = Math.max(1, Math.min(parseInt(args[2]), 20));
        prizeStart = 3;
      }
      const prize = args.slice(prizeStart).join(" ");
      if (!prize) return sendMessage(msg.channel, "Укажите приз.");

      const endsAt = Date.now() + ms;
      const endDate = new Date(endsAt);
      const timeStr = unit === "m" ? `${amount} мин` : unit === "h" ? `${amount} ч` : `${amount} д`;

      const text = [
        "🎉 **РОЗЫГРЫШ** 🎉",
        "",
        `Приз: **${sanitizeText(prize, 100)}**`,
        `Победителей: **${winners}**`,
        `Длительность: **${timeStr}**`,
        `Завершится: **${endDate.toLocaleString("ru-RU")}**`,
        "",
        `Нажми 🎉 чтобы участвовать!`,
      ].join("\n");

      try {
        const sent = await sendMessage(msg.channel, text);
        // React with 🎉
        await api("PUT", `/channels/${msg.channel}/messages/${sent._id}/reactions/${encodeURIComponent("🎉")}`);

        // Store giveaway
        if (!settings.giveaways) settings.giveaways = [];
        settings.giveaways.push({
          messageId: sent._id,
          channelId: msg.channel,
          prize,
          winners,
          endsAt,
          author: msg.author,
          ended: false,
        });
        saveSettings(settings);

        // Schedule end
        setTimeout(() => endGiveaway(sent._id), ms);
        console.log(`[GIVEAWAY] Started: "${prize}" for ${timeStr}, ${winners} winners`);
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }

    } else if (sub === "end") {
      const msgId = args[1];
      if (!msgId) return sendMessage(msg.channel, "Укажите ID сообщения: `!giveaway end <message_id>`");
      await endGiveaway(msgId);

    } else if (sub === "reroll") {
      const msgId = args[1];
      if (!msgId) return sendMessage(msg.channel, "Укажите ID сообщения: `!giveaway reroll <message_id>`");
      await endGiveaway(msgId, true);

    } else if (sub === "list") {
      const active = (settings.giveaways || []).filter((g) => !g.ended);
      if (!active.length) return sendMessage(msg.channel, "Нет активных розыгрышей.");
      const lines = active.map((g) => `- **${g.prize}** (${g.winners} побед.) — до ${new Date(g.endsAt).toLocaleString("ru-RU")}`);
      return sendMessage(msg.channel, "**Активные розыгрыши:**\n" + lines.join("\n"));

    } else {
      return sendMessage(msg.channel, "Подкоманды: `start <время> [N] <приз>`, `end <msg_id>`, `reroll <msg_id>`, `list`");
    }
  },

  // --- Polls ---
  async poll(msg, args) {
    // Parse: !poll "вопрос" "вариант1" "вариант2" ...
    const parts = [];
    const raw = args.join(" ");
    const regex = /"([^"]+)"/g;
    let m;
    while ((m = regex.exec(raw)) !== null) parts.push(m[1]);

    if (parts.length < 3) {
      return sendMessage(msg.channel, 'Формат: `!poll "Вопрос?" "Вариант 1" "Вариант 2" ...`\nМинимум 2 варианта.');
    }

    const question = parts[0];
    const options = parts.slice(1, 11); // max 10 options
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    const lines = [
      `📊 **${sanitizeText(question, 200)}**`,
      "",
      ...options.map((opt, i) => `${emojis[i]} ${sanitizeText(opt, 100)}`),
      "",
      `_Голосуйте реакциями ниже!_`,
    ];

    try {
      const sent = await sendMessage(msg.channel, lines.join("\n"));
      // Add reaction emojis
      for (let i = 0; i < options.length; i++) {
        await api("PUT", `/channels/${msg.channel}/messages/${sent._id}/reactions/${encodeURIComponent(emojis[i])}`);
      }
      console.log(`[POLL] Created: "${question}" with ${options.length} options`);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  // --- Automod ---
  async automod(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const sub = (args[0] || "").toLowerCase();

    if (!settings.automod) {
      settings.automod = {
        enabled: false,
        spamLimit: 5,        // messages
        spamWindow: 5,       // seconds
        spamAction: "mute",  // mute|kick|ban
        spamMuteDuration: 10, // minutes
        bannedWords: [],
        bannedWordsAction: "delete", // delete|mute|kick
        antiDuplicates: false,
        maxDuplicates: 3,
        logChannel: "",
      };
      saveSettings(settings);
    }
    const am = settings.automod;

    if (!sub) {
      const lines = [
        `**Настройки автомодерации:**`,
        `Статус: ${am.enabled ? "✅ включено" : "❌ выключено"}`,
        `Спам: ${am.spamLimit} сообщений за ${am.spamWindow} сек → ${am.spamAction}`,
        `Мьют за спам: ${am.spamMuteDuration} мин`,
        `Стоп-слова: ${am.bannedWords.length} шт.`,
        `Действие: ${am.bannedWordsAction}`,
        `Антидубликаты: ${am.antiDuplicates ? "✅" : "❌"} (${am.maxDuplicates} подряд)`,
        `Лог-канал: ${am.logChannel ? `<#${am.logChannel}>` : "не задан"}`,
      ];
      return sendMessage(msg.channel, lines.join("\n"));
    }

    if (sub === "on") { am.enabled = true; saveSettings(settings); return sendMessage(msg.channel, "✅ Автомодерация включена."); }
    if (sub === "off") { am.enabled = false; saveSettings(settings); return sendMessage(msg.channel, "❌ Автомодерация выключена."); }

    if (sub === "spam") {
      const limit = parseInt(args[1]);
      const window = parseInt(args[2]);
      if (!limit || !window) return sendMessage(msg.channel, "Формат: `!automod spam <сообщений> <секунд>` (пример: `!automod spam 5 5`)");
      am.spamLimit = Math.max(2, Math.min(limit, 30));
      am.spamWindow = Math.max(2, Math.min(window, 60));
      saveSettings(settings);
      return sendMessage(msg.channel, `Спам: ${am.spamLimit} сообщений за ${am.spamWindow} сек.`);
    }
    if (sub === "spamaction") {
      const action = (args[1] || "").toLowerCase();
      if (!["mute", "kick", "ban"].includes(action)) return sendMessage(msg.channel, "Действие: `mute`, `kick`, `ban`");
      am.spamAction = action;
      if (args[2]) am.spamMuteDuration = Math.max(1, Math.min(parseInt(args[2]) || 10, 10080));
      saveSettings(settings);
      return sendMessage(msg.channel, `Действие за спам: ${action}${action === "mute" ? ` (${am.spamMuteDuration} мин)` : ""}`);
    }
    if (sub === "addword") {
      const word = args.slice(1).join(" ").toLowerCase();
      if (!word) return sendMessage(msg.channel, "Укажите слово: `!automod addword <слово>`");
      if (!am.bannedWords.includes(word)) am.bannedWords.push(word);
      saveSettings(settings);
      return sendMessage(msg.channel, `Стоп-слово добавлено. Всего: ${am.bannedWords.length}`);
    }
    if (sub === "removeword") {
      const word = args.slice(1).join(" ").toLowerCase();
      am.bannedWords = am.bannedWords.filter((w) => w !== word);
      saveSettings(settings);
      return sendMessage(msg.channel, `Стоп-слово удалено. Всего: ${am.bannedWords.length}`);
    }
    if (sub === "words") {
      if (!am.bannedWords.length) return sendMessage(msg.channel, "Список стоп-слов пуст.");
      return sendMessage(msg.channel, `**Стоп-слова (${am.bannedWords.length}):**\n\`${am.bannedWords.join("`, `")}\``);
    }
    if (sub === "duplicates") {
      const val = (args[1] || "").toLowerCase();
      if (val === "on") { am.antiDuplicates = true; }
      else if (val === "off") { am.antiDuplicates = false; }
      else if (/^\d+$/.test(val)) { am.antiDuplicates = true; am.maxDuplicates = Math.max(2, Math.min(parseInt(val), 10)); }
      else return sendMessage(msg.channel, "Формат: `!automod duplicates on|off|<число>`");
      saveSettings(settings);
      return sendMessage(msg.channel, `Антидубликаты: ${am.antiDuplicates ? `✅ (${am.maxDuplicates} подряд)` : "❌"}`);
    }
    if (sub === "log") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала: `!automod log <channel_id>`");
      am.logChannel = id;
      saveSettings(settings);
      return sendMessage(msg.channel, `Лог-канал: <#${id}>`);
    }
    return sendMessage(msg.channel, "Подкоманды: `spam`, `spamaction`, `addword`, `removeword`, `words`, `duplicates`, `log`, `on`, `off`");
  },

  // --- Reaction Roles ---
  async rr(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const sub = (args[0] || "").toLowerCase();

    if (sub === "create") {
      // !rr create <emoji> <role_id> <текст сообщения>
      const emoji = args[1];
      const roleId = args[2];
      const text = args.slice(3).join(" ");
      if (!emoji || !roleId) {
        return sendMessage(msg.channel, 'Формат: `!rr create <эмодзи> <role_id> [текст]`');
      }
      const content = text || `Нажмите ${emoji} чтобы получить роль!`;
      try {
        const sent = await sendMessage(msg.channel, `**Роль по реакции**\n\n${content}`);
        await api("PUT", `/channels/${msg.channel}/messages/${sent._id}/reactions/${encodeURIComponent(emoji)}`);
        settings.reactionRoles.push({
          messageId: sent._id,
          channelId: msg.channel,
          emoji,
          roleId,
        });
        saveSettings(settings);
        await sendMessage(msg.channel, `✅ Reaction Role создан: ${emoji} → роль \`${roleId}\``);
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }

    } else if (sub === "add") {
      // !rr add <message_id> <emoji> <role_id>
      const msgId = args[1];
      const emoji = args[2];
      const roleId = args[3];
      if (!msgId || !emoji || !roleId) {
        return sendMessage(msg.channel, "Формат: `!rr add <message_id> <эмодзи> <role_id>`");
      }
      try {
        await api("PUT", `/channels/${msg.channel}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}`);
        settings.reactionRoles.push({
          messageId: msgId,
          channelId: msg.channel,
          emoji,
          roleId,
        });
        saveSettings(settings);
        await sendMessage(msg.channel, `✅ Добавлено: ${emoji} → роль \`${roleId}\` на сообщение \`${msgId}\``);
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }

    } else if (sub === "list") {
      const rrs = settings.reactionRoles;
      if (!rrs.length) return sendMessage(msg.channel, "Нет reaction roles.");
      const lines = rrs.map((r, i) => `${i + 1}. ${r.emoji} → \`${r.roleId}\` (msg: \`${r.messageId.slice(0, 8)}...\`)`);
      return sendMessage(msg.channel, `**Reaction Roles (${rrs.length}):**\n${lines.join("\n")}`);

    } else if (sub === "remove") {
      const idx = parseInt(args[1]) - 1;
      if (isNaN(idx) || idx < 0 || idx >= settings.reactionRoles.length) {
        return sendMessage(msg.channel, "Укажите номер из `!rr list`");
      }
      settings.reactionRoles.splice(idx, 1);
      saveSettings(settings);
      return sendMessage(msg.channel, "✅ Reaction Role удалён.");

    } else {
      return sendMessage(msg.channel, "Подкоманды: `create <эмодзи> <role_id> [текст]`, `add <msg_id> <эмодзи> <role_id>`, `list`, `remove <N>`");
    }
  },

  // --- XP / Levels ---
  async level(msg, args) {
    const lvl = settings.levels;
    if (!lvl.enabled) return sendMessage(msg.channel, "Система уровней не включена. Админ: `!xp on`");
    const targetId = extractUserId(args[0]) || msg.author;
    const userData = lvl.users[targetId] || { xp: 0, level: 0 };
    const nextLevelXp = Math.pow(userData.level + 1, 2) * 100;
    return sendMessage(msg.channel, [
      `📊 **Уровень <@${targetId}>**`,
      `Уровень: **${userData.level}**`,
      `XP: **${userData.xp}** / ${nextLevelXp}`,
      `Прогресс: ${"█".repeat(Math.min(10, Math.floor((userData.xp / nextLevelXp) * 10)))}${"░".repeat(Math.max(0, 10 - Math.floor((userData.xp / nextLevelXp) * 10)))}`,
    ].join("\n"));
  },

  async leaderboard(msg) {
    const lvl = settings.levels;
    if (!lvl.enabled) return sendMessage(msg.channel, "Система уровней не включена.");
    const sorted = Object.entries(lvl.users)
      .map(([id, data]) => ({ id, ...(data as any) }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 15);
    if (!sorted.length) return sendMessage(msg.channel, "Таблица лидеров пуста.");
    const medals = ["🥇", "🥈", "🥉"];
    const lines = sorted.map((u, i) =>
      `${medals[i] || `${i + 1}.`} <@${u.id}> — Ур. **${u.level}** (${u.xp} XP)`
    );
    return sendMessage(msg.channel, `**🏆 Таблица лидеров:**\n${lines.join("\n")}`);
  },

  async xp(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const lvl = settings.levels;
    const sub = (args[0] || "").toLowerCase();

    if (!sub) {
      const lines = [
        `**Настройки XP/Уровней:**`,
        `Статус: ${lvl.enabled ? "✅ включено" : "❌ выключено"}`,
        `XP за сообщение: ${lvl.xpPerMessage}`,
        `Кулдаун: ${lvl.cooldown} сек`,
        `Канал уведомлений: ${lvl.notifyChannel ? `<#${lvl.notifyChannel}>` : "не задан"}`,
        `Награды: ${lvl.roleRewards.length} ролей`,
        `Участников с XP: ${Object.keys(lvl.users).length}`,
      ];
      return sendMessage(msg.channel, lines.join("\n"));
    }

    if (sub === "on") { lvl.enabled = true; saveSettings(settings); return sendMessage(msg.channel, "✅ XP/Уровни включены."); }
    if (sub === "off") { lvl.enabled = false; saveSettings(settings); return sendMessage(msg.channel, "❌ XP/Уровни выключены."); }
    if (sub === "amount") {
      const n = parseInt(args[1]);
      if (!n || n < 1 || n > 100) return sendMessage(msg.channel, "XP за сообщение: 1–100");
      lvl.xpPerMessage = n;
      saveSettings(settings);
      return sendMessage(msg.channel, `XP за сообщение: ${n}`);
    }
    if (sub === "cooldown") {
      const n = parseInt(args[1]);
      if (!n || n < 5 || n > 600) return sendMessage(msg.channel, "Кулдаун: 5–600 секунд");
      lvl.cooldown = n;
      saveSettings(settings);
      return sendMessage(msg.channel, `Кулдаун: ${n} сек`);
    }
    if (sub === "notify") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала.");
      lvl.notifyChannel = id;
      saveSettings(settings);
      return sendMessage(msg.channel, `Канал уведомлений: <#${id}>`);
    }
    if (sub === "reward") {
      const level = parseInt(args[1]);
      const roleId = args[2];
      if (!level || !roleId) return sendMessage(msg.channel, "Формат: `!xp reward <уровень> <role_id>`");
      lvl.roleRewards = lvl.roleRewards.filter((r) => r.level !== level);
      lvl.roleRewards.push({ level, roleId });
      lvl.roleRewards.sort((a, b) => a.level - b.level);
      saveSettings(settings);
      return sendMessage(msg.channel, `Награда: уровень ${level} → роль \`${roleId}\``);
    }
    if (sub === "rewards") {
      if (!lvl.roleRewards.length) return sendMessage(msg.channel, "Нет наград за уровни.");
      const lines = lvl.roleRewards.map((r) => `Ур. ${r.level} → \`${r.roleId}\``);
      return sendMessage(msg.channel, `**Награды:**\n${lines.join("\n")}`);
    }
    return sendMessage(msg.channel, "Подкоманды: `on`, `off`, `amount`, `cooldown`, `notify`, `reward <ур> <role_id>`, `rewards`");
  },

  // --- Audit Log settings ---
  async audit(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const al = settings.auditLog;
    const sub = (args[0] || "").toLowerCase();

    if (!sub) {
      return sendMessage(msg.channel, [
        `**Аудит-лог:**`,
        `Статус: ${al.enabled ? "✅ включено" : "❌ выключено"}`,
        `Канал: ${al.channel ? `<#${al.channel}>` : "не задан"}`,
      ].join("\n"));
    }
    if (sub === "on") { al.enabled = true; saveSettings(settings); return sendMessage(msg.channel, "✅ Аудит-лог включён."); }
    if (sub === "off") { al.enabled = false; saveSettings(settings); return sendMessage(msg.channel, "❌ Аудит-лог выключен."); }
    if (sub === "channel") {
      const id = validateId(args[1]);
      if (!id) return sendMessage(msg.channel, "Укажите ID канала.");
      al.channel = id;
      saveSettings(settings);
      return sendMessage(msg.channel, `Канал аудит-лога: <#${id}>`);
    }
    return sendMessage(msg.channel, "Подкоманды: `on`, `off`, `channel <id>`");
  },

  // --- Events / Calendar ---
  async event(msg, args) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "create") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      // !event create "Название" 2026-04-05 18:00 [описание]
      const raw = args.slice(1).join(" ");
      const titleMatch = raw.match(/"([^"]+)"/);
      if (!titleMatch) return sendMessage(msg.channel, 'Формат: `!event create "Название" 2026-04-05 18:00 [описание]`');

      const title = titleMatch[1];
      const afterTitle = raw.slice(raw.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
      const dateParts = afterTitle.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (!dateParts) return sendMessage(msg.channel, 'Укажите дату и время: `2026-04-05 18:00`');

      const dateStr = `${dateParts[1]}T${dateParts[2]}:00`;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return sendMessage(msg.channel, "Неверный формат даты.");

      const description = afterTitle.slice(dateParts[0].length).trim() || "";
      const eventId = `evt-${Date.now()}`;

      const evt = {
        id: eventId,
        title,
        description,
        date: dateStr,
        channelId: msg.channel,
        author: msg.author,
        rsvp: { yes: [], maybe: [], no: [] },
        reminded: false,
      };
      settings.events.push(evt);
      saveSettings(settings);

      const text = [
        `📅 **Событие: ${sanitizeText(title, 100)}**`,
        description ? `> ${sanitizeText(description, 200)}` : "",
        "",
        `🕐 **${date.toLocaleString("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}**`,
        `Создал: <@${msg.author}>`,
        "",
        `✅ Приду — нажми ✅`,
        `🤔 Может быть — нажми 🤔`,
        `❌ Не приду — нажми ❌`,
      ].filter(Boolean).join("\n");

      try {
        const sent = await sendMessage(msg.channel, text);
        evt.messageId = sent._id;
        saveSettings(settings);
        // Add RSVP reactions
        for (const emoji of ["✅", "🤔", "❌"]) {
          await api("PUT", `/channels/${msg.channel}/messages/${sent._id}/reactions/${encodeURIComponent(emoji)}`);
        }
        auditLog("📅", `Событие **${title}** создано <@${msg.author}>`);
      } catch (e) {
        await sendMessage(msg.channel, safeErrorMessage(e));
      }

    } else if (sub === "list") {
      const now = Date.now();
      const upcoming = settings.events.filter((e) => new Date(e.date).getTime() > now);
      if (!upcoming.length) return sendMessage(msg.channel, "Нет предстоящих событий.");
      const lines = upcoming.map((e) => {
        const d = new Date(e.date);
        return `- **${e.title}** — ${d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} (✅ ${e.rsvp.yes.length} | 🤔 ${e.rsvp.maybe.length})`;
      });
      return sendMessage(msg.channel, `**📅 Предстоящие события:**\n${lines.join("\n")}`);

    } else if (sub === "cancel") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const idx = parseInt(args[1]) - 1;
      const now = Date.now();
      const upcoming = settings.events.filter((e) => new Date(e.date).getTime() > now);
      if (isNaN(idx) || idx < 0 || idx >= upcoming.length) {
        return sendMessage(msg.channel, "Укажите номер из `!event list`");
      }
      const cancelled = upcoming[idx];
      settings.events = settings.events.filter((e) => e.id !== cancelled.id);
      saveSettings(settings);
      await sendMessage(msg.channel, `❌ Событие **${cancelled.title}** отменено.`);
      auditLog("📅", `Событие **${cancelled.title}** отменено <@${msg.author}>`);

    } else {
      return sendMessage(msg.channel, "Подкоманды: `create \"Название\" ГГГГ-ММ-ДД ЧЧ:ММ [описание]`, `list`, `cancel <N>`");
    }
  },

  // --- Forms / Applications ---
  async form(msg, args) {
    if (!settings.forms) settings.forms = [];
    const sub = (args[0] || "").toLowerCase();

    if (sub === "create") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      // !form create "Заявка на модератора" "Имя" "Возраст" "Опыт" "Почему хотите стать модератором?"
      const raw = args.slice(1).join(" ");
      const parts = [];
      const regex = /"([^"]+)"/g;
      let m;
      while ((m = regex.exec(raw)) !== null) parts.push(m[1]);

      if (parts.length < 2) {
        return sendMessage(msg.channel, 'Формат: `!form create "Название формы" "Вопрос 1" "Вопрос 2" ...`');
      }

      const title = parts[0];
      const questions = parts.slice(1);
      const formId = `form-${Date.now()}`;

      const form = {
        id: formId,
        title,
        questions,
        channelId: msg.channel,
        author: msg.author,
        submissions: [],
      };
      settings.forms.push(form);
      saveSettings(settings);

      const text = [
        `📋 **${sanitizeText(title, 100)}**`,
        "",
        ...questions.map((q, i) => `${i + 1}. ${q}`),
        "",
        `Чтобы подать заявку, напишите: \`!apply ${formId}\``,
      ].join("\n");

      await sendMessage(msg.channel, text);
      auditLog("📋", `Форма **${title}** создана <@${msg.author}>`);

    } else if (sub === "list") {
      if (!settings.forms.length) return sendMessage(msg.channel, "Нет активных форм.");
      const lines = settings.forms.map((f, i) =>
        `${i + 1}. **${f.title}** — ${f.submissions.length} заявок (ID: \`${f.id}\`)`
      );
      return sendMessage(msg.channel, `**📋 Формы:**\n${lines.join("\n")}`);

    } else if (sub === "submissions") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const formId = args[1];
      const form = settings.forms.find((f) => f.id === formId);
      if (!form) return sendMessage(msg.channel, "Форма не найдена. Используйте `!form list`");

      const pending = form.submissions.filter((s) => s.status === "pending");
      if (!pending.length) return sendMessage(msg.channel, "Нет новых заявок.");

      for (const sub of pending.slice(0, 5)) {
        const answers = sub.answers.map((a, i) => `**${form.questions[i]}**\n> ${a}`);
        await sendMessage(msg.channel, [
          `📋 **Заявка #${sub.id}** от <@${sub.userId}>`,
          "",
          ...answers,
          "",
          `Принять: \`!form accept ${formId} ${sub.id}\``,
          `Отклонить: \`!form reject ${formId} ${sub.id}\``,
        ].join("\n"));
      }
      if (pending.length > 5) {
        await sendMessage(msg.channel, `... и ещё ${pending.length - 5} заявок.`);
      }

    } else if (sub === "accept" || sub === "reject") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const formId = args[1];
      const subId = parseInt(args[2]);
      const form = settings.forms.find((f) => f.id === formId);
      if (!form) return sendMessage(msg.channel, "Форма не найдена.");
      const submission = form.submissions.find((s) => s.id === subId);
      if (!submission) return sendMessage(msg.channel, "Заявка не найдена.");

      const status = sub === "accept" ? "accepted" : "rejected";
      const statusRu = sub === "accept" ? "✅ принята" : "❌ отклонена";
      submission.status = status;
      saveSettings(settings);

      await sendMessage(msg.channel, `Заявка #${subId} от <@${submission.userId}> — **${statusRu}**`);

      // DM the applicant
      try {
        const dm = await api("GET", `/users/${submission.userId}/dm`);
        await sendMessage(dm._id, `Ваша заявка **${form.title}** — ${statusRu}`);
      } catch {}

      auditLog("📋", `Заявка #${subId} (${form.title}) ${statusRu} — <@${msg.author}>`);

    } else if (sub === "delete") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const formId = args[1];
      settings.forms = settings.forms.filter((f) => f.id !== formId);
      saveSettings(settings);
      return sendMessage(msg.channel, "Форма удалена.");

    } else {
      return sendMessage(msg.channel, "Подкоманды: `create`, `list`, `submissions <form_id>`, `accept/reject <form_id> <N>`, `delete <form_id>`");
    }
  },

  // !apply <form_id> — submit application via DM questions
  async apply(msg, args) {
    const formId = args[0];
    if (!formId) return sendMessage(msg.channel, "Укажите ID формы. Список: `!form list`");

    const form = settings.forms?.find((f) => f.id === formId);
    if (!form) return sendMessage(msg.channel, "Форма не найдена.");

    // Check if already submitted
    if (form.submissions.some((s) => s.userId === msg.author && s.status === "pending")) {
      return sendMessage(msg.channel, "Вы уже подали заявку. Ожидайте рассмотрения.");
    }

    // Simple single-message application: user provides answers separated by |
    const raw = args.slice(1).join(" ");
    const answers = raw.split("|").map((a) => a.trim());

    if (answers.length < form.questions.length || !raw) {
      const qList = form.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      return sendMessage(msg.channel, [
        `📋 **${form.title}**`,
        "",
        qList,
        "",
        `Ответьте одним сообщением, разделяя ответы символом \`|\`:`,
        `\`!apply ${formId} Ответ 1 | Ответ 2 | Ответ 3\``,
      ].join("\n"));
    }

    const subId = (form.submissions.length || 0) + 1;
    form.submissions.push({
      id: subId,
      userId: msg.author,
      answers: answers.slice(0, form.questions.length),
      status: "pending",
      timestamp: Date.now(),
    });
    saveSettings(settings);

    await sendMessage(msg.channel, `✅ Заявка **${form.title}** отправлена! Номер: #${subId}`);
    auditLog("📋", `Новая заявка **${form.title}** #${subId} от <@${msg.author}>`);
  },

  // --- Server Stats / Analytics ---
  async stats(msg) {
    if (!SERVER_ID) return sendMessage(msg.channel, "SERVER_ID не настроен.");
    try {
      const server = await api("GET", `/servers/${SERVER_ID}`);
      const members = await api("GET", `/servers/${SERVER_ID}/members`);
      const rooms = await roomService.listRooms();
      const activeRooms = rooms.filter((r) => r.numParticipants > 0);
      const totalVoiceUsers = activeRooms.reduce((sum, r) => sum + r.numParticipants, 0);

      // XP stats
      const lvl = settings.levels || {};
      const xpUsers = Object.keys(lvl.users || {}).length;
      const totalXp = Object.values(lvl.users || {}).reduce((sum, u) => sum + ((u as any).xp || 0), 0);
      const topUser = Object.entries(lvl.users || {})
        .sort((a, b) => (b[1] as any).xp - (a[1] as any).xp)[0];

      // Event stats
      const upcomingEvents = (settings.events || []).filter((e) => new Date(e.date).getTime() > Date.now()).length;

      // Giveaway stats
      const activeGiveaways = (settings.giveaways || []).filter((g) => !g.ended).length;

      // Forms stats
      const pendingApps = (settings.forms || []).reduce((sum, f) =>
        sum + f.submissions.filter((s) => s.status === "pending").length, 0);

      const text = [
        `📊 **Статистика сервера: ${server.name}**`,
        "",
        `👥 **Участники:** ${members.members.length}`,
        `📢 **Каналы:** ${server.channels.length}`,
        `🎤 **В голосе:** ${totalVoiceUsers} (${activeRooms.length} комнат)`,
        "",
        `⭐ **XP система:**`,
        `   Участников с XP: ${xpUsers}`,
        `   Всего XP: ${totalXp}`,
        topUser ? `   Лидер: <@${topUser[0]}> (${(topUser[1] as any).xp} XP, ур. ${(topUser[1] as any).level})` : "",
        "",
        `📅 Предстоящих событий: ${upcomingEvents}`,
        `🎉 Активных розыгрышей: ${activeGiveaways}`,
        `📋 Заявок на рассмотрении: ${pendingApps}`,
        `⭐ Reaction Roles: ${(settings.reactionRoles || []).length}`,
      ].filter(Boolean).join("\n");

      await sendMessage(msg.channel, text);
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },

  // --- Tournament brackets ---
  async tournament(msg, args) {
    if (!settings.tournaments) settings.tournaments = [];
    const sub = (args[0] || "").toLowerCase();

    if (sub === "create") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      // !tournament create "Турнир по CS2" single
      const raw = args.slice(1).join(" ");
      const nameMatch = raw.match(/"([^"]+)"/);
      if (!nameMatch) return sendMessage(msg.channel, 'Формат: `!tournament create "Название" [single|double]`');

      const name = nameMatch[1];
      const format = raw.includes("double") ? "double" : "single";
      const tId = `t-${Date.now()}`;

      const tournament = {
        id: tId,
        name,
        format,
        channelId: msg.channel,
        author: msg.author,
        status: "registration", // registration → active → finished
        participants: [],
        matches: [],
        round: 0,
      };
      settings.tournaments.push(tournament);
      saveSettings(settings);

      const text = [
        `🏆 **Турнир: ${sanitizeText(name, 100)}**`,
        `Формат: **${format === "double" ? "Double Elimination" : "Single Elimination"}**`,
        `Статус: 📝 Регистрация открыта`,
        "",
        `Чтобы участвовать: \`!tournament join ${tId}\``,
        `Начать: \`!tournament start ${tId}\``,
      ].join("\n");

      await sendMessage(msg.channel, text);
      auditLog("🏆", `Турнир **${name}** создан <@${msg.author}>`);

    } else if (sub === "join") {
      const tId = args[1];
      const t = settings.tournaments.find((t) => t.id === tId);
      if (!t) return sendMessage(msg.channel, "Турнир не найден.");
      if (t.status !== "registration") return sendMessage(msg.channel, "Регистрация закрыта.");
      if (t.participants.includes(msg.author)) return sendMessage(msg.channel, "Вы уже зарегистрированы.");

      t.participants.push(msg.author);
      saveSettings(settings);
      await sendMessage(msg.channel, `✅ <@${msg.author}> зарегистрирован! Участников: **${t.participants.length}**`);

    } else if (sub === "start") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const tId = args[1];
      const t = settings.tournaments.find((t) => t.id === tId);
      if (!t) return sendMessage(msg.channel, "Турнир не найден.");
      if (t.participants.length < 2) return sendMessage(msg.channel, "Нужно минимум 2 участника.");
      if (t.status !== "registration") return sendMessage(msg.channel, "Турнир уже начат.");

      t.status = "active";
      t.round = 1;

      // Shuffle participants
      const shuffled = [...t.participants].sort(() => Math.random() - 0.5);

      // Generate round 1 matches
      const matches = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        const matchId = matches.length + 1;
        if (i + 1 < shuffled.length) {
          matches.push({
            id: matchId,
            round: 1,
            player1: shuffled[i],
            player2: shuffled[i + 1],
            winner: null,
            score: "",
          });
        } else {
          // Bye — auto-advance
          matches.push({
            id: matchId,
            round: 1,
            player1: shuffled[i],
            player2: null,
            winner: shuffled[i],
            score: "bye",
          });
        }
      }
      t.matches = matches;
      saveSettings(settings);

      const lines = matches.map((m) =>
        m.player2
          ? `⚔️ Матч #${m.id}: <@${m.player1}> vs <@${m.player2}>`
          : `✅ Матч #${m.id}: <@${m.player1}> — bye (авто-проход)`
      );

      await sendMessage(msg.channel, [
        `🏆 **${t.name} — Раунд ${t.round}**`,
        `Участников: ${t.participants.length}`,
        "",
        ...lines,
        "",
        `Записать результат: \`!tournament result ${tId} <матч> <победитель_@>\``,
      ].join("\n"));

    } else if (sub === "result") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const tId = args[1];
      const matchId = parseInt(args[2]);
      const winnerId = extractUserId(args[3]);
      const t = settings.tournaments.find((t) => t.id === tId);
      if (!t) return sendMessage(msg.channel, "Турнир не найден.");
      if (t.status !== "active") return sendMessage(msg.channel, "Турнир не активен.");

      const match = t.matches.find((m) => m.id === matchId);
      if (!match) return sendMessage(msg.channel, "Матч не найден.");
      if (!winnerId || (winnerId !== match.player1 && winnerId !== match.player2)) {
        return sendMessage(msg.channel, "Победитель должен быть одним из участников матча.");
      }

      match.winner = winnerId;
      match.score = args.slice(4).join(" ") || "1:0";
      saveSettings(settings);

      await sendMessage(msg.channel, `✅ Матч #${matchId}: победитель — <@${winnerId}> (${match.score})`);

      // Check if all matches in current round are done
      const currentRound = t.matches.filter((m) => m.round === t.round);
      const allDone = currentRound.every((m) => m.winner);

      if (allDone) {
        const winners = currentRound.map((m) => m.winner);
        if (winners.length <= 1) {
          // Tournament finished
          t.status = "finished";
          saveSettings(settings);
          await sendMessage(msg.channel, [
            `🏆🏆🏆 **${t.name} — ЗАВЕРШЁН!**`,
            `Победитель: <@${winners[0]}>! 🎉`,
          ].join("\n"));
          auditLog("🏆", `Турнир **${t.name}** завершён. Победитель: <@${winners[0]}>`);
        } else {
          // Generate next round
          t.round++;
          const nextMatches = [];
          for (let i = 0; i < winners.length; i += 2) {
            const mId = t.matches.length + nextMatches.length + 1;
            if (i + 1 < winners.length) {
              nextMatches.push({ id: mId, round: t.round, player1: winners[i], player2: winners[i + 1], winner: null, score: "" });
            } else {
              nextMatches.push({ id: mId, round: t.round, player1: winners[i], player2: null, winner: winners[i], score: "bye" });
            }
          }
          t.matches.push(...nextMatches);
          saveSettings(settings);

          const lines = nextMatches.map((m) =>
            m.player2
              ? `⚔️ Матч #${m.id}: <@${m.player1}> vs <@${m.player2}>`
              : `✅ Матч #${m.id}: <@${m.player1}> — bye`
          );
          await sendMessage(msg.channel, [
            `🏆 **${t.name} — Раунд ${t.round}**`,
            "",
            ...lines,
            "",
            `Записать результат: \`!tournament result ${tId} <матч> <победитель_@>\``,
          ].join("\n"));
        }
      }

    } else if (sub === "bracket") {
      const tId = args[1];
      const t = settings.tournaments.find((t) => t.id === tId);
      if (!t) return sendMessage(msg.channel, "Турнир не найден.");

      const maxRound = Math.max(...t.matches.map((m) => m.round), 0);
      const lines = [];
      for (let r = 1; r <= maxRound; r++) {
        lines.push(`**Раунд ${r}:**`);
        const roundMatches = t.matches.filter((m) => m.round === r);
        for (const m of roundMatches) {
          const p1 = `<@${m.player1}>`;
          const p2 = m.player2 ? `<@${m.player2}>` : "bye";
          const result = m.winner ? ` → 🏆 <@${m.winner}> ${m.score}` : " ⏳";
          lines.push(`  #${m.id}: ${p1} vs ${p2}${result}`);
        }
        lines.push("");
      }
      await sendMessage(msg.channel, `🏆 **${t.name}** (${t.status})\n\n${lines.join("\n")}`);

    } else if (sub === "list") {
      if (!settings.tournaments.length) return sendMessage(msg.channel, "Нет турниров.");
      const lines = settings.tournaments.map((t) =>
        `- **${t.name}** [${t.status}] ${t.participants.length} участников (ID: \`${t.id}\`)`
      );
      return sendMessage(msg.channel, `**🏆 Турниры:**\n${lines.join("\n")}`);

    } else {
      return sendMessage(msg.channel, "Подкоманды: `create`, `join`, `start`, `result`, `bracket`, `list`");
    }
  },

  // --- Premium ---
  async premium(msg, args) {
    const sub = (args[0] || "").toLowerCase();
    const pm = settings.premium;

    if (!sub || sub === "check") {
      const targetId = extractUserId(args[1]) || msg.author;
      const user = pm.users[targetId];
      if (!user) return sendMessage(msg.channel, `<@${targetId}> — без подписки.`);
      const expires = user.expires ? new Date(user.expires).toLocaleDateString("ru-RU") : "бессрочно";
      return sendMessage(msg.channel, [
        `💎 **Premium: <@${targetId}>**`,
        `Уровень: **${user.tier === "premium_plus" ? "Premium+" : "Premium"}**`,
        `С: ${new Date(user.since).toLocaleDateString("ru-RU")}`,
        `До: ${expires}`,
      ].join("\n"));
    }

    if (sub === "give") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const userId = extractUserId(args[1]);
      if (!userId) return sendMessage(msg.channel, "Укажите пользователя: `!premium give @user [plus] [дней]`");
      const tier = args[2] === "plus" ? "premium_plus" : "premium";
      const daysArg = parseInt(args[tier === "premium_plus" ? 3 : 2]) || 30;
      const expires = Date.now() + daysArg * 86400000;

      pm.users[userId] = { since: Date.now(), expires, tier };
      saveSettings(settings);

      await sendMessage(msg.channel, `💎 <@${userId}> получил **${tier === "premium_plus" ? "Premium+" : "Premium"}** на ${daysArg} дней!`);
      auditLog("💎", `Premium выдан <@${userId}> (${tier}, ${daysArg}д) — <@${msg.author}>`);
    }

    if (sub === "remove") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const userId = extractUserId(args[1]);
      if (!userId) return sendMessage(msg.channel, "Укажите пользователя.");
      delete pm.users[userId];
      saveSettings(settings);
      await sendMessage(msg.channel, `<@${userId}> — Premium снят.`);
    }

    if (sub === "list") {
      const entries = Object.entries(pm.users);
      if (!entries.length) return sendMessage(msg.channel, "Нет Premium-пользователей.");
      const lines = entries.map(([id, u]) => {
        const tier = (u as any).tier === "premium_plus" ? "💎+" : "💎";
        return `${tier} <@${id}> — до ${(u as any).expires ? new Date((u as any).expires).toLocaleDateString("ru-RU") : "∞"}`;
      });
      return sendMessage(msg.channel, `**Premium-пользователи:**\n${lines.join("\n")}`);
    }
  },

  // --- Boosts ---
  async boost(msg) {
    const bs = settings.boosts;
    const userId = msg.author;

    if (bs.users[userId]) {
      return sendMessage(msg.channel, "Вы уже бустите этот сервер! ✨");
    }

    bs.users[userId] = Date.now();
    // Calculate level
    const boostCount = Object.keys(bs.users).length;
    bs.level = boostCount >= 15 ? 3 : boostCount >= 7 ? 2 : boostCount >= 2 ? 1 : 0;
    saveSettings(settings);

    const levelNames = ["Без уровня", "Уровень 1", "Уровень 2", "Уровень 3"];
    await sendMessage(msg.channel, [
      `✨ <@${userId}> бустит сервер! Спасибо!`,
      `Бустов: **${boostCount}** | Уровень сервера: **${levelNames[bs.level]}**`,
    ].join("\n"));
    auditLog("✨", `<@${userId}> бустнул сервер (${boostCount} бустов, ур. ${bs.level})`);
  },

  async boosts(msg) {
    const bs = settings.boosts;
    const boostCount = Object.keys(bs.users).length;
    const levelNames = ["Без уровня", "Уровень 1 (2+)", "Уровень 2 (7+)", "Уровень 3 (15+)"];
    const perks = [
      [],
      ["+50 эмодзи", "HD голос"],
      ["+100 эмодзи", "Баннер сервера", "Кастомный инвайт"],
      ["+250 эмодзи", "Анимированный баннер", "VIP поддержка"],
    ];

    const lines = [
      `✨ **Бусты сервера**`,
      `Бустов: **${boostCount}** | Уровень: **${levelNames[bs.level]}**`,
    ];
    if (bs.level > 0) {
      lines.push(`Бонусы: ${perks[bs.level].join(", ")}`);
    }
    const nextLevel = bs.level < 3 ? [2, 7, 15][bs.level] : null;
    if (nextLevel) {
      lines.push(`До следующего уровня: ${nextLevel - boostCount} бустов`);
    }

    const boosters = Object.entries(bs.users).slice(0, 10);
    if (boosters.length) {
      lines.push("", "**Бустеры:**");
      for (const [id, ts] of boosters) {
        lines.push(`- <@${id}> (с ${new Date(ts as number).toLocaleDateString("ru-RU")})`);
      }
    }

    await sendMessage(msg.channel, lines.join("\n"));
  },

  // --- Stickers ---
  async sticker(msg, args) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "add") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      // !sticker add "название" <url> [пак]
      const raw = args.slice(1).join(" ");
      const nameMatch = raw.match(/"([^"]+)"/);
      if (!nameMatch) return sendMessage(msg.channel, 'Формат: `!sticker add "Название" <url> [пак]`');
      const name = nameMatch[1];
      const afterName = raw.slice(raw.indexOf(nameMatch[0]) + nameMatch[0].length).trim();
      const urlParts = afterName.split(/\s+/);
      const url = urlParts[0];
      if (!url || !url.startsWith("http")) return sendMessage(msg.channel, "Укажите URL изображения.");
      const pack = urlParts.slice(1).join(" ") || "Основной";

      const stickerId = `stk-${Date.now()}`;
      settings.stickers.push({ id: stickerId, name, url, author: msg.author, pack });
      saveSettings(settings);
      await sendMessage(msg.channel, `🖼️ Стикер **${name}** добавлен в пак "${pack}"!`);

    } else if (sub === "list") {
      if (!settings.stickers.length) return sendMessage(msg.channel, "Нет стикеров. Добавьте: `!sticker add`");
      const packs = {};
      for (const s of settings.stickers) {
        const p = s.pack || "Основной";
        if (!packs[p]) packs[p] = [];
        packs[p].push(s);
      }
      const lines = [];
      for (const [pack, stickers] of Object.entries(packs)) {
        lines.push(`**${pack}** (${(stickers as any[]).length}):`);
        for (const s of stickers as any[]) {
          lines.push(`  - ${s.name} (\`${s.id}\`)`);
        }
      }
      return sendMessage(msg.channel, `🖼️ **Стикеры:**\n${lines.join("\n")}`);

    } else if (sub === "send") {
      const stickerIdOrName = args.slice(1).join(" ");
      if (!stickerIdOrName) return sendMessage(msg.channel, "Укажите имя или ID стикера.");
      const sticker = settings.stickers.find(
        (s) => s.id === stickerIdOrName || s.name.toLowerCase() === stickerIdOrName.toLowerCase()
      );
      if (!sticker) return sendMessage(msg.channel, "Стикер не найден. Список: `!sticker list`");
      await sendMessage(msg.channel, `![${sticker.name}](${sticker.url})`);

    } else if (sub === "remove") {
      if (!(await isAdmin(SERVER_ID, msg.author))) {
        return sendMessage(msg.channel, "У вас нет прав для этой команды.");
      }
      const stickerId = args[1];
      settings.stickers = settings.stickers.filter((s) => s.id !== stickerId);
      saveSettings(settings);
      return sendMessage(msg.channel, "Стикер удалён.");

    } else {
      return sendMessage(msg.channel, "Подкоманды: `add \"Название\" <url> [пак]`, `list`, `send <имя>`, `remove <id>`");
    }
  },

  // --- Translation ---
  async translate(msg, args) {
    const text = args.join(" ");
    if (!text) return sendMessage(msg.channel, "Формат: `!translate <текст>`");

    try {
      const isRu = /[а-яА-ЯёЁ]/.test(text);
      const langpair = isRu ? "ru|en" : "en|ru";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langpair}`
      );
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated) {
        await sendMessage(msg.channel, `🌐 **Перевод** (${isRu ? "ru→en" : "en→ru"}):\n> ${translated}`);
      } else {
        await sendMessage(msg.channel, "Не удалось перевести.");
      }
    } catch (e) {
      await sendMessage(msg.channel, "Ошибка перевода.");
    }
  },

  async autotranslate(msg, args) {
    if (!(await isAdmin(SERVER_ID, msg.author))) {
      return sendMessage(msg.channel, "У вас нет прав для этой команды.");
    }
    const sub = (args[0] || "").toLowerCase();

    if (sub === "on") {
      const channelId = validateId(args[1]) || msg.channel;
      const lang = args[2] || "ru";
      settings.autoTranslate[channelId] = { targetLang: lang, enabled: true };
      saveSettings(settings);
      return sendMessage(msg.channel, `🌐 Авто-перевод включён в <#${channelId}> → **${lang}**`);
    }
    if (sub === "off") {
      const channelId = validateId(args[1]) || msg.channel;
      delete settings.autoTranslate[channelId];
      saveSettings(settings);
      return sendMessage(msg.channel, `Авто-перевод выключен в <#${channelId}>`);
    }
    if (sub === "list") {
      const entries = Object.entries(settings.autoTranslate);
      if (!entries.length) return sendMessage(msg.channel, "Нет каналов с авто-переводом.");
      const lines = entries.map(([ch, cfg]) => `- <#${ch}> → ${(cfg as any).targetLang}`);
      return sendMessage(msg.channel, `**🌐 Авто-перевод:**\n${lines.join("\n")}`);
    }
    return sendMessage(msg.channel, "Подкоманды: `on [channel_id] [язык]`, `off [channel_id]`, `list`");
  },

  // --- Transcription ---
  async transcribe(msg, args) {
    // Transcribe a voice message by replying to it
    // Since we can't easily access voice message audio from the bot API,
    // this provides a manual transcription request
    const msgId = args[0];
    if (!msgId) {
      return sendMessage(msg.channel, [
        "🎤 **Транскрипция голосовых сообщений**",
        "",
        "Формат: `!transcribe <message_id>`",
        "Укажите ID голосового сообщения для распознавания.",
        "",
        "_Примечание: автоматическая транскрипция голосовых будет добавлена в будущем обновлении._",
      ].join("\n"));
    }

    try {
      const message = await api("GET", `/channels/${msg.channel}/messages/${msgId}`);
      if (!message) return sendMessage(msg.channel, "Сообщение не найдено.");

      // Check if message has audio attachments
      const attachments = message.attachments || [];
      const audioFile = attachments.find((a) =>
        a.metadata?.type === "Audio" || a.filename?.match(/\.(ogg|mp3|wav|webm|m4a)$/i)
      );

      if (!audioFile) {
        return sendMessage(msg.channel, "В этом сообщении нет аудио-вложений.");
      }

      // For now, provide the audio URL and note about future Whisper integration
      const audioUrl = `${API_URL.replace("/api", "")}/autumn/attachments/${audioFile._id}/${audioFile.filename}`;
      await sendMessage(msg.channel, [
        `🎤 **Голосовое сообщение от <@${message.author}>**`,
        `Файл: \`${audioFile.filename}\` (${(audioFile.size / 1024).toFixed(0)} КБ)`,
        "",
        `_Полная транскрипция через Whisper API будет доступна в Premium._`,
        `_Сейчас: скачайте и используйте любой речь-в-текст сервис._`,
      ].join("\n"));
    } catch (e) {
      await sendMessage(msg.channel, safeErrorMessage(e));
    }
  },
};

// --- Auto-translate message handler ---
async function autoTranslateCheck(data) {
  const channelId = data.channel;
  const atConfig = settings.autoTranslate[channelId];
  if (!atConfig || !atConfig.enabled) return;
  if (data.author === botUserId) return;

  const content = data.content;
  if (!content || content.startsWith(PREFIX)) return;

  // Detect if translation needed
  const targetLang = atConfig.targetLang || "ru";
  const isRu = /[а-яА-ЯёЁ]/.test(content);
  const needsTranslation = (targetLang === "ru" && !isRu) || (targetLang === "en" && isRu);

  if (!needsTranslation) return;

  try {
    const langpair = isRu ? "ru|en" : "en|ru";
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(content.slice(0, 500))}&langpair=${langpair}`
    );
    const data2 = await res.json();
    const translated = data2?.responseData?.translatedText;
    if (translated && translated.toLowerCase() !== content.toLowerCase()) {
      await sendMessage(channelId, `🌐 > ${translated}`);
    }
  } catch {
    // Silently fail auto-translation
  }
}

// --- XP processing on messages ---
async function processXp(data) {
  const lvl = settings.levels;
  if (!lvl.enabled) return;
  if (data.author === botUserId) return;

  const userId = data.author;
  const now = Date.now();

  if (!lvl.users[userId]) {
    lvl.users[userId] = { xp: 0, level: 0, lastXpTime: 0 };
  }
  const user = lvl.users[userId];

  // Cooldown check
  if (now - user.lastXpTime < lvl.cooldown * 1000) return;

  user.xp += lvl.xpPerMessage;
  user.lastXpTime = now;

  // Check level up
  const newLevel = Math.floor(Math.sqrt(user.xp / 100));
  if (newLevel > user.level) {
    const oldLevel = user.level;
    user.level = newLevel;

    // Notify
    if (lvl.notifyChannel) {
      sendMessage(lvl.notifyChannel, `🎉 <@${userId}> достиг уровня **${newLevel}**!`)
        .catch(() => {});
    }

    // Role rewards
    for (const reward of lvl.roleRewards) {
      if (reward.level <= newLevel && reward.level > oldLevel && SERVER_ID) {
        try {
          const member = await api("GET", `/servers/${SERVER_ID}/members/${userId}`);
          const roles = member.roles || [];
          if (!roles.includes(reward.roleId)) {
            await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, {
              roles: [...roles, reward.roleId],
            });
            console.log(`[XP] Role ${reward.roleId} awarded to ${userId} at level ${newLevel}`);
          }
        } catch (e) {
          console.error("[XP] Role reward error:", e.message);
        }
      }
    }
  }

  // Save every 10 messages (reduce disk I/O)
  if (Math.random() < 0.1) saveSettings(settings);
}

// --- Audit log ---
function auditLog(icon, text) {
  const al = settings.auditLog;
  if (!al.enabled || !al.channel) return;
  const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  sendMessage(al.channel, `${icon} \`${time}\` ${text}`).catch(() => {});
}

// --- Event reminders check ---
function checkEventReminders() {
  const now = Date.now();
  for (const evt of settings.events) {
    if (evt.reminded) continue;
    const evtTime = new Date(evt.date).getTime();
    const diff = evtTime - now;
    // Remind 15 minutes before
    if (diff > 0 && diff <= 15 * 60000) {
      evt.reminded = true;
      const rsvpYes = evt.rsvp.yes.map((id) => `<@${id}>`).join(", ") || "никто";
      sendMessage(evt.channelId, [
        `⏰ **Напоминание: ${evt.title}**`,
        `Начало через **15 минут**!`,
        `Участники: ${rsvpYes}`,
      ].join("\n")).catch(() => {});
      saveSettings(settings);
    }
    // Event passed — clean up
    if (diff < -3600000) {
      evt.reminded = true;
    }
  }
}
setInterval(checkEventReminders, 60000);

// --- Giveaway end logic ---
async function endGiveaway(messageId, reroll = false) {
  const giveaways = settings.giveaways || [];
  const giveaway = giveaways.find((g) => g.messageId === messageId);
  if (!giveaway) return;

  try {
    // Fetch message to get reactions
    const msg = await api("GET", `/channels/${giveaway.channelId}/messages/${messageId}`);
    if (!msg) return;

    // Get users who reacted with 🎉
    let participants = [];
    if (msg.reactions) {
      for (const [emoji, users] of Object.entries(msg.reactions)) {
        if (emoji === "🎉") {
          participants = (Array.isArray(users) ? users : []).filter((id) => id !== botUserId);
          break;
        }
      }
    }

    if (!participants.length) {
      await sendMessage(giveaway.channelId, `🎉 Розыгрыш **${giveaway.prize}** завершён — никто не участвовал!`);
    } else {
      // Pick random winners
      const shuffled = participants.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, giveaway.winners);
      const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");

      const label = reroll ? "Перевыбор" : "Розыгрыш завершён";
      await sendMessage(giveaway.channelId, [
        `🎉 **${label}!**`,
        `Приз: **${giveaway.prize}**`,
        `Победитель${winners.length > 1 ? "и" : ""}: ${winnerMentions}`,
        `Участников: ${participants.length}`,
      ].join("\n"));
    }

    giveaway.ended = true;
    saveSettings(settings);
  } catch (e) {
    console.error("[GIVEAWAY] End error:", e.message);
  }
}

// --- Automod message handler ---
const spamTracker = new Map(); // userId -> { messages: timestamp[], lastContent: string, duplicateCount: number }

async function automodCheck(data) {
  const am = settings.automod;
  if (!am || !am.enabled) return;
  if (data.author === botUserId) return;

  const userId = data.author;
  const content = (data.content || "").toLowerCase();
  const channelId = data.channel;

  // --- Banned words check ---
  if (am.bannedWords.length) {
    for (const word of am.bannedWords) {
      if (content.includes(word)) {
        try {
          await api("DELETE", `/channels/${channelId}/messages/${data._id}`);
          if (am.logChannel) {
            await sendMessage(am.logChannel, `🚫 Стоп-слово от <@${userId}>: \`${sanitizeText(word, 30)}\` в <#${channelId}>`);
          }
          if (am.bannedWordsAction === "mute" && SERVER_ID) {
            const timeout = new Date(Date.now() + am.spamMuteDuration * 60000).toISOString();
            await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, { timeout });
          }
        } catch (e) {
          console.error("[AUTOMOD] Banned word action error:", e.message);
        }
        return;
      }
    }
  }

  // --- Spam check ---
  const now = Date.now();
  if (!spamTracker.has(userId)) {
    spamTracker.set(userId, { messages: [], lastContent: "", duplicateCount: 0 });
  }
  const tracker = spamTracker.get(userId);

  // Clean old timestamps
  tracker.messages = tracker.messages.filter((ts) => now - ts < am.spamWindow * 1000);
  tracker.messages.push(now);

  if (tracker.messages.length >= am.spamLimit) {
    try {
      if (am.logChannel) {
        await sendMessage(am.logChannel, `⚠️ Спам от <@${userId}> в <#${channelId}> (${tracker.messages.length} сообщений за ${am.spamWindow} сек) → ${am.spamAction}`);
      }
      if (am.spamAction === "mute" && SERVER_ID) {
        const timeout = new Date(Date.now() + am.spamMuteDuration * 60000).toISOString();
        await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, { timeout });
      } else if (am.spamAction === "kick" && SERVER_ID) {
        await api("DELETE", `/servers/${SERVER_ID}/members/${userId}`);
      } else if (am.spamAction === "ban" && SERVER_ID) {
        await api("PUT", `/servers/${SERVER_ID}/bans/${userId}`, { reason: "Автомодерация: спам" });
      }
      tracker.messages = [];
    } catch (e) {
      console.error("[AUTOMOD] Spam action error:", e.message);
    }
    return;
  }

  // --- Duplicate check ---
  if (am.antiDuplicates && content) {
    if (content === tracker.lastContent) {
      tracker.duplicateCount++;
      if (tracker.duplicateCount >= am.maxDuplicates) {
        try {
          await api("DELETE", `/channels/${channelId}/messages/${data._id}`);
          if (am.logChannel) {
            await sendMessage(am.logChannel, `🔁 Дубликат от <@${userId}> в <#${channelId}> (${tracker.duplicateCount}x) — удалено`);
          }
        } catch (e) {
          console.error("[AUTOMOD] Duplicate action error:", e.message);
        }
        return;
      }
    } else {
      tracker.lastContent = content;
      tracker.duplicateCount = 1;
    }
  }
}

// Cleanup spam tracker periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, tracker] of spamTracker) {
    if (!tracker.messages.length || now - tracker.messages[tracker.messages.length - 1] > 60000) {
      spamTracker.delete(userId);
    }
  }
}, 30000);

// Restore active giveaway timers on startup
function restoreGiveawayTimers() {
  const giveaways = settings.giveaways || [];
  for (const g of giveaways) {
    if (g.ended) continue;
    const remaining = g.endsAt - Date.now();
    if (remaining <= 0) {
      endGiveaway(g.messageId);
    } else {
      setTimeout(() => endGiveaway(g.messageId), remaining);
      console.log(`[GIVEAWAY] Restored timer for "${g.prize}" (${Math.round(remaining / 60000)} min left)`);
    }
  }
}

function extractUserId(mention) {
  if (!mention) return null;
  const match = mention.match(/^<@([A-Z0-9]+)>$/);
  return match ? match[1] : mention.match(/^[A-Z0-9]{26}$/) ? mention : null;
}

// --- Event handlers ---

function handleMessage(data) {
  if (data.author === botUserId) return;

  // Automod check (before command processing)
  automodCheck(data).catch((e) => console.error("[AUTOMOD ERROR]", e.message));

  // XP processing
  processXp(data).catch((e) => console.error("[XP ERROR]", e.message));

  // Auto-translate
  autoTranslateCheck(data).catch(() => {});

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
  const msgId = data.id;
  const channelId = data.channel_id;
  const emoji = data.emoji_id || data.emoji;
  const userId = data.user_id;

  // --- Reaction Roles ---
  if (userId && userId !== botUserId) {
    const rr = settings.reactionRoles.find(
      (r) => r.messageId === msgId && r.emoji === emoji,
    );
    if (rr && SERVER_ID) {
      try {
        // Get current member roles
        const member = await api("GET", `/servers/${SERVER_ID}/members/${userId}`);
        const currentRoles = member.roles || [];
        const hasRole = currentRoles.includes(rr.roleId);

        if (hasRole) {
          // Remove role (toggle off)
          await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, {
            roles: currentRoles.filter((r) => r !== rr.roleId),
          });
          console.log(`[RR] Removed role ${rr.roleId} from ${userId}`);
        } else {
          // Add role
          const newRoles = [...currentRoles, rr.roleId];
          await api("PATCH", `/servers/${SERVER_ID}/members/${userId}`, {
            roles: newRoles,
          });
          console.log(`[RR] Added role ${rr.roleId} to ${userId}`);
        }
      } catch (e) {
        console.error("[RR] Error:", e.message);
      }
    }
  }

  // --- Event RSVP ---
  if (userId && userId !== botUserId) {
    const evtMsg = settings.events.find((e) => e.messageId === msgId);
    if (evtMsg) {
      evtMsg.rsvp.yes = evtMsg.rsvp.yes.filter((id) => id !== userId);
      evtMsg.rsvp.maybe = evtMsg.rsvp.maybe.filter((id) => id !== userId);
      evtMsg.rsvp.no = evtMsg.rsvp.no.filter((id) => id !== userId);
      if (emoji === "✅") evtMsg.rsvp.yes.push(userId);
      else if (emoji === "🤔") evtMsg.rsvp.maybe.push(userId);
      else if (emoji === "❌") evtMsg.rsvp.no.push(userId);
      saveSettings(settings);
    }
  }

  // --- Starboard ---
  const sb = settings.starboard;
  if (!sb.enabled || !sb.channel) return;

  try {

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
        if (SERVER_ID && event.id === SERVER_ID) {
          handleMemberJoin(event);
          auditLog("📥", `<@${event.member?.id?.user || event.user}> присоединился к серверу`);
        }
        break;
      case "ServerMemberLeave":
        if (SERVER_ID && event.id === SERVER_ID) {
          handleMemberLeave(event);
          auditLog("📤", `<@${event.user}> покинул сервер (${event.reason || "вышел"})`);
        }
        break;
      case "MessageUpdate":
        if (event.data?.content !== undefined) {
          auditLog("✏️", `Сообщение отредактировано <@${event.data?.author || "?"}> в <#${event.channel}>`);
        }
        break;
      case "MessageDelete":
        auditLog("🗑️", `Сообщение удалено в <#${event.channel}> (ID: \`${event.id}\`)`);
        break;
      case "BulkMessageDelete":
        auditLog("🗑️", `**${event.ids?.length || "?"}** сообщений удалено в <#${event.channel}>`);
        break;
      case "ChannelCreate":
        auditLog("➕", `Канал создан: **${event.name || "?"}** (<#${event._id || event.id}>)`);
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
      case "ChannelUpdate":
        auditLog("📝", `Канал обновлён: <#${event.id}>`);
        break;
      case "ChannelDelete":
        auditLog("➖", `Канал удалён: \`${event.id}\``);
        triggerChannelIds.delete(event.id);
        tempChannels.delete(event.id);
        break;
      case "ServerRoleUpdate":
        auditLog("🏷️", `Роль обновлена: \`${event.role_id || event.id}\``);
        break;
      case "VoiceChannelJoin":
        auditLog("🎤", `<@${event.user || event.id}> зашёл в голосовой`);
        break;
      case "VoiceChannelLeave": {
        auditLog("🔇", `<@${event.user || event.id}> вышел из голосового`);
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
restoreGiveawayTimers();
connect();

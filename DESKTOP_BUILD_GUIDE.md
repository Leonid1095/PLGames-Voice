# PLG Voice — Инструкция по сборке десктопного приложения (.exe)

## Для AI-агента: полное руководство по доработке и сборке Electron-клиента

---

## 1. ОБЗОР АРХИТЕКТУРЫ

PLG Voice — это мессенджер (аналог Discord) на базе форка Revolt (Stoat). Проект состоит из:

```
PLGames-Voice/
├── client/              ← Веб-клиент (Solid.js + Vite) — УЖЕ ГОТОВ
│   └── packages/
│       ├── client/      ← Основное SPA-приложение
│       ├── stoat.js/    ← SDK для API (REST + WebSocket)
│       ├── solid-livekit-components/  ← Голосовые компоненты
│       └── js-lingui-solid/           ← i18n
├── desktop/             ← Electron-обёртка — НУЖНО ДОРАБОТАТЬ
│   ├── src/
│   │   ├── main.ts      ← Main process (точка входа)
│   │   ├── preload.ts   ← Preload (импортирует world/*)
│   │   ├── native/      ← Нативные модули (трей, автозапуск, Discord RPC)
│   │   └── world/       ← Bridge (конфиг + окно) для renderer
│   ├── assets/desktop/  ← Иконки (ПУСТАЯ — нужно создать!)
│   ├── forge.config.ts  ← Конфигурация Electron Forge
│   ├── vite.main.config.ts
│   ├── vite.preload.config.ts
│   ├── vite.renderer.config.ts
│   └── package.json
├── compose.yml          ← Docker Compose (серверная инфраструктура)
├── Revolt.toml          ← Конфиг сервера
├── Caddyfile            ← Reverse proxy
└── plgvoice.conf        ← nginx конфиг
```

### Ключевой принцип
Electron-приложение **НЕ содержит рендерер внутри себя**. Оно загружает веб-клиент по URL:
```typescript
// desktop/src/native/window.ts:22-24
export const BUILD_URL = new URL(
  app.commandLine.hasSwitch("force-server")
    ? app.commandLine.getSwitchValue("force-server")
    : "https://plgames-voice.ru",  // ← Веб-клиент на сервере
);
```
Это значит: Electron = BrowserWindow, который открывает сайт `https://plgames-voice.ru`.

---

## 2. СЕРВЕРНАЯ ИНФРАСТРУКТУРА (уже работает)

Сервер доступен по адресу: `https://plgames-voice.ru`

### Маршрутизация (nginx → Caddy → сервисы):

| Путь          | Сервис           | Порт  | Назначение                    |
|---------------|------------------|-------|-------------------------------|
| `/api/*`      | api (Stoat)      | 14702 | REST API                      |
| `/ws`         | events           | 14703 | WebSocket (реалтайм-события)  |
| `/autumn/*`   | autumn           | 14704 | Файловый сервер (загрузки)    |
| `/january/*`  | january          | 14705 | Прокси изображений/метаданных |
| `/livekit/*`  | livekit          | 7880  | WebRTC голосовой сервер       |
| `/ingress/*`  | voice-ingress    | 8500  | Голосовой ingress             |
| `/`           | web              | 5000  | Веб-клиент (SPA)             |

### Сервисы (Docker Compose):
- **MongoDB** — база данных (с авторизацией)
- **Redis (KeyDB)** — брокер событий, кэш
- **RabbitMQ** — внутренний брокер сообщений
- **MinIO** — S3-совместимое хранилище файлов
- **LiveKit** — WebRTC (голос/видео), порты 7881 + 50000-50100/udp

---

## 3. ЧТО НУЖНО СДЕЛАТЬ ДЛЯ РАБОЧЕГО .EXE

### 3.1. Создать иконки приложения

Папка `desktop/assets/desktop/` **ПУСТАЯ**. Нужно создать:

```
desktop/assets/desktop/
├── icon.png              ← Основная иконка (256x256 или 512x512)
├── icon.ico              ← Windows иконка (multi-size: 16,32,48,256)
├── icon.svg              ← Векторная иконка (для Linux)
├── iconTemplate.png      ← macOS tray иконка (монохромная, 20x20)
├── hicolor/              ← Linux иконки для разных размеров
│   ├── 16x16.png
│   ├── 32x32.png
│   ├── 64x64.png
│   ├── 128x128.png
│   ├── 256x256.png
│   └── 512x512.png
└── badges/               ← Overlay-иконки для уведомлений (Windows)
    ├── 1.ico
    ├── 2.ico
    ├── ...
    └── 10.ico
```

**Минимум для Windows .exe:** `icon.png` + `icon.ico`

Генерация .ico из .png:
```bash
# Если есть imagemagick:
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Или онлайн: https://convertico.com/
```

### 3.2. Установить зависимости

```bash
cd /home/plg/PLGames-Voice/desktop
pnpm install
```

### 3.3. Сборка для Windows (.exe)

```bash
# Режим разработки (dev-сервер):
pnpm start

# Упаковка в .exe (Squirrel installer):
pnpm make --platform win32 --arch x64

# Результат будет в:
# desktop/out/make/squirrel.windows/x64/
#   ├── plg-voice-desktop-setup.exe    ← Инсталлятор
#   ├── plg-voice-desktop-1.0.0-full.nupkg
#   └── RELEASES
```

**Важно:** Для сборки Windows .exe с Linux нужен Wine или кросс-компиляция:
```bash
# Установить Wine для кросс-компиляции:
sudo apt install wine64

# Или собирать на Windows-машине / в CI
```

### 3.4. Публикация через GitHub Releases

```bash
# Публикует в GitHub Releases (Leonid1095/PLGames-Voice):
GITHUB_TOKEN=<your_token> pnpm publish
```

Конфигурация publisher уже есть в `forge.config.ts`:
```typescript
new PublisherGithub({
  repository: {
    owner: "Leonid1095",
    name: "PLGames-Voice",
  },
}),
```

---

## 4. ДЕТАЛИ ELECTRON-ПРИЛОЖЕНИЯ

### 4.1. Main Process (`desktop/src/main.ts`)

Точка входа. Что делает:
1. Обрабатывает Squirrel-события (установка/удаление ярлыков Windows)
2. Отключает HW-акселерацию если в настройках
3. Блокирует запуск второго экземпляра (single instance lock)
4. При старте:
   - Создаёт главное окно (`createMainWindow()`)
   - Включает автозапуск при первом запуске (Win/Mac)
   - Инициализирует системный трей
   - Запускает Discord RPC
   - Настраивает авто-обновления через GitHub Releases
5. При повторном запуске — фокусирует существующее окно

### 4.2. Окно (`desktop/src/native/window.ts`)

- Загружает URL: `https://plgames-voice.ru` (или `--force-server <url>`)
- Минимальный размер: 300x300, стартовый: 1280x720
- Фон: `#191919`
- Сохраняет/восстанавливает позицию и размер окна
- Перехватывает внешние ссылки → открывает в системном браузере
- Zoom: Ctrl+/-, Ctrl+0 (сброс)
- F5 / Ctrl+R — перезагрузка страницы
- Меню скрыто (`setMenu(null)`)
- Спеллчекер включён

### 4.3. Preload Scripts (`desktop/src/preload.ts` → `world/*`)

Два bridge-объекта для renderer (веб-страницы):

**`window.native`** (из `world/window.ts`):
```typescript
{
  versions: {
    node: () => string,
    chrome: () => string,
    electron: () => string,
    desktop: () => string,  // версия из package.json
  },
  minimise: () => void,
  maximise: () => void,
  close: () => void,
  setBadgeCount: (count: number) => void,
}
```

**`window.desktopConfig`** (из `world/config.ts`):
```typescript
{
  get: () => DesktopConfig,
  set: (config: DesktopConfig) => void,
  getAutostart: () => Promise<boolean>,
  setAutostart: (value: boolean) => Promise<boolean>,
}
```

### 4.4. Конфигурация (`desktop/src/native/config.ts`)

Хранится через `electron-store` (JSON-файл на диске пользователя):

```typescript
interface DesktopConfig {
  firstLaunch: boolean;           // true — первый запуск
  customFrame: boolean;           // true — кастомная рамка окна
  minimiseToTray: boolean;        // true — сворачивать в трей
  startMinimisedToTray: boolean;  // false — стартовать свёрнутым
  spellchecker: boolean;          // true — проверка орфографии
  hardwareAcceleration: boolean;  // true — аппаратное ускорение
  discordRpc: boolean;            // true — Discord Rich Presence
  windowState: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximised: boolean;
  };
}
```

### 4.5. Системный трей (`desktop/src/native/tray.ts`)

- Иконка в трее с контекстным меню
- Клик по иконке — показать/скрыть окно
- Меню: Show/Hide App, Version, Quit App

### 4.6. Discord RPC (`desktop/src/native/discordRpc.ts`)

- Client ID: `872068124005007420`
- Показывает: "Chatting with others" + ссылка "Join PLG Voice"
- Автореконнект каждые 10 секунд при потере связи

### 4.7. Автозапуск (`desktop/src/native/autoLaunch.ts`)

- Использует `auto-launch` пакет
- IPC handlers: `getAutostart` / `setAutostart`
- Автоматически включается при первом запуске на Win/Mac

### 4.8. Бейджи уведомлений (`desktop/src/native/badges.ts`)

- **Windows**: Overlay icon на панели задач (файлы `badges/1-10.ico`)
- **macOS**: Dock badge (число или точка)
- **Linux**: D-Bus (Unity Launcher API) — пока закомментировано

---

## 5. ELECTRON FORGE КОНФИГУРАЦИЯ

### Упаковка:
```typescript
packagerConfig: {
  asar: true,                        // Упаковка в ASAR-архив
  name: "PLG Voice",
  executableName: "plg-voice-desktop",
  icon: "assets/desktop/icon",       // Без расширения (авто-выбор)
}
```

### Makers (сборщики инсталляторов):

| Maker        | Платформа | Выход                              |
|--------------|-----------|-------------------------------------|
| Squirrel     | Windows   | `plg-voice-desktop-setup.exe`      |
| ZIP          | Все       | Портативная версия                  |
| AppX         | Windows   | Microsoft Store (ручная сборка)     |
| Flatpak      | Linux     | `com.plgvoice.desktop` (sandbox)   |
| Deb          | Linux     | `.deb` пакет                        |

### Безопасность (Fuses):
- `RunAsNode: false` — нельзя использовать как Node.js
- `EnableCookieEncryption: true` — шифрование cookies
- `OnlyLoadAppFromAsar: true` — только из ASAR
- `EnableEmbeddedAsarIntegrityValidation: true` — проверка целостности

### Авто-обновления:
- Через `update-electron-app` + GitHub Releases
- Репозиторий: `Leonid1095/PLGames-Voice`
- Показывает нотификацию "Update Available" при наличии обновления

---

## 6. ТЕХНИЧЕСКИЙ СТЕК КЛИЕНТА (для понимания что грузит Electron)

| Компонент        | Технология          | Версия  |
|-----------------|---------------------|---------|
| UI Framework    | Solid.js            | 1.9.6   |
| Build Tool      | Vite                | 5.4+    |
| CSS             | PandaCSS            | 0.46.1  |
| State           | TanStack Solid Query| 5.76    |
| Routing         | @solidjs/router     | 0.15.3  |
| API SDK         | Stoat.js            | 7.3.7   |
| Voice           | LiveKit Client      | 2.13.0  |
| i18n            | LinguJS             | 5.3.1   |
| Rich Editor     | ProseMirror         | -       |
| Code Highlight  | Shiki + Rehype      | -       |

### Протоколы связи:
- **REST API**: `https://plgames-voice.ru/api` — CRUD операции
- **WebSocket**: `wss://plgames-voice.ru/ws` — реалтайм-события (чат, статусы, набор текста)
- **WebRTC** (через LiveKit): голос/видео — через `/livekit`

### Аутентификация:
- Логин/регистрация через REST API
- Сессия: `{ _id, token, userId }` хранится в localStorage
- Token отправляется в `Authorization` header

---

## 7. ПОШАГОВЫЙ ПЛАН СБОРКИ

### Шаг 1: Подготовка иконок
```bash
cd /home/plg/PLGames-Voice/desktop/assets/desktop

# Создать/скопировать icon.png (минимум 256x256, желательно 512x512)
# Сгенерировать icon.ico для Windows
# Для минимальной сборки достаточно icon.png + icon.ico
```

### Шаг 2: Установка зависимостей
```bash
cd /home/plg/PLGames-Voice/desktop
pnpm install
```

### Шаг 3: Проверка в dev-режиме
```bash
pnpm start
# Откроется окно Electron с загрузкой https://plgames-voice.ru
```

### Шаг 4: Сборка .exe
```bash
# На Windows:
pnpm make --platform win32 --arch x64

# На Linux (нужен Wine):
sudo apt install wine64 mono-complete
pnpm make --platform win32 --arch x64
```

### Шаг 5: Тестирование
- Запустить `plg-voice-desktop-setup.exe`
- Проверить: логин, чат, голосовой вызов, трей, автозапуск
- Проверить обновления

### Шаг 6: Публикация
```bash
# Установить переменную GITHUB_TOKEN
export GITHUB_TOKEN=ghp_xxxxx

# Опубликовать релиз
pnpm publish
```

---

## 8. ВОЗМОЖНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема: Иконки отсутствуют
**Симптом**: Ошибка при `pnpm make` — `Cannot find assets/desktop/icon.png`
**Решение**: Создать все необходимые иконки (см. раздел 3.1)

### Проблема: CORS при загрузке сайта в Electron
**Симптом**: Белый экран или ошибки в консоли
**Решение**: Сервер уже настроен для CORS. Если проблемы — проверить настройки Caddy/nginx.

### Проблема: Кросс-компиляция Windows на Linux
**Симптом**: Ошибка `Cannot make for win32 on linux`
**Решение**:
```bash
sudo apt install wine64 mono-complete
# Или использовать CI/CD (GitHub Actions)
```

### Проблема: Автообновление не работает
**Симптом**: Нет уведомления об обновлении
**Решение**: `update-electron-app` требует опубликованных GitHub Releases с правильными asset-именами.

### Проблема: Discord RPC не подключается
**Симптом**: Ошибка RPC в логах
**Решение**: Discord должен быть запущен. Client ID `872068124005007420` — проверить что приложение зарегистрировано на Discord Developer Portal.

---

## 9. CI/CD — GitHub Actions (рекомендация)

Для автоматической сборки под все платформы создать `.github/workflows/desktop-build.yml`:

```yaml
name: Desktop Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: desktop/pnpm-lock.yaml
      - run: pnpm install
        working-directory: desktop
      - run: pnpm make
        working-directory: desktop
      - uses: actions/upload-artifact@v4
        with:
          name: desktop-${{ matrix.os }}
          path: desktop/out/make/**/*
```

---

## 10. АЛЬТЕРНАТИВНЫЙ ПОДХОД: ВСТРОЕННЫЙ РЕНДЕРЕР

Сейчас Electron загружает сайт по URL. Альтернатива — встроить веб-клиент прямо в Electron:

### Преимущества:
- Работает офлайн (хотя бы UI загружается)
- Быстрее первая загрузка
- Не зависит от CDN/веб-сервера

### Как сделать:
1. Собрать веб-клиент:
```bash
cd /home/plg/PLGames-Voice/client
pnpm install
pnpm --filter client exec vite build
# Результат: client/packages/client/dist/
```

2. Скопировать dist в Electron:
```bash
cp -r client/packages/client/dist/ desktop/renderer/
```

3. Изменить `window.ts` — загружать из локального файла:
```typescript
// Вместо:
mainWindow.loadURL(BUILD_URL.toString());

// Использовать:
mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
```

4. Настроить Vite renderer config для правильных путей.

**Внимание:** При встроенном рендерере нужно будет прописать API URL через env-переменные (как в Docker-контейнере с `inject.js`).

---

## 11. СТРУКТУРА ФАЙЛОВ ELECTRON (полная карта)

```
desktop/
├── package.json              ← Зависимости + scripts
├── tsconfig.json             ← TypeScript: ESNext, commonjs, strict
├── forge.config.ts           ← Electron Forge: makers, publishers, fuses
├── vite.main.config.ts       ← Vite для main process (пустой)
├── vite.preload.config.ts    ← Vite для preload (пустой)
├── vite.renderer.config.ts   ← Vite для renderer (пустой)
├── assets/
│   └── desktop/              ← ИКОНКИ (нужно создать!)
└── src/
    ├── main.ts               ← Точка входа main process
    ├── preload.ts            ← Preload (импортирует world/*)
    ├── native/
    │   ├── window.ts         ← Создание BrowserWindow
    │   ├── config.ts         ← Electron-store (настройки)
    │   ├── tray.ts           ← Системный трей
    │   ├── discordRpc.ts     ← Discord Rich Presence
    │   ├── autoLaunch.ts     ← Автозапуск (Win/Mac)
    │   └── badges.ts         ← Бейджи уведомлений
    └── world/
        ├── config.ts         ← Bridge: desktopConfig → renderer
        └── window.ts         ← Bridge: native API → renderer
```

---

## 12. КЛЮЧЕВЫЕ ПЕРЕМЕННЫЕ / КОНСТАНТЫ

| Переменная                | Значение                          | Где используется        |
|--------------------------|-----------------------------------|------------------------|
| `BUILD_URL`              | `https://plgames-voice.ru`    | window.ts              |
| App Name                 | `PLG Voice`                       | forge.config.ts        |
| Executable Name          | `plg-voice-desktop`              | forge.config.ts        |
| Flatpak ID               | `com.plgvoice.desktop`           | forge.config.ts        |
| Discord RPC Client ID    | `872068124005007420`             | discordRpc.ts          |
| GitHub Repo              | `Leonid1095/PLGames-Voice`       | forge.config.ts        |
| Window background        | `#191919`                         | window.ts              |
| Default window size      | `1280x720`                        | window.ts              |
| Min window size          | `300x300`                         | window.ts              |
| Electron version         | `38.1.2`                          | package.json           |
| Electron Forge version   | `7.9.0`                          | package.json           |
| Package Manager          | `pnpm 10.18.1`                   | package.json           |

---

## 13. БЫСТРЫЙ ЧЕКЛИСТ ДЛЯ АГЕНТА

- [x] Создать иконки в `desktop/assets/desktop/` (placeholder сгенерированы)
- [x] `cd desktop && pnpm install`
- [x] `pnpm make` — собрать инсталлятор + portable
- [ ] Протестировать инсталлятор на чистой системе
- [ ] Обновить версию в `package.json` если нужно
- [ ] Настроить CI/CD для автосборки (опционально)
- [ ] `pnpm publish` — опубликовать на GitHub Releases
- [ ] Заменить placeholder-иконки на настоящий логотип PLG Voice

---

## 14. ЧТО БЫЛО СДЕЛАНО (28 февраля 2026)

### Концепция: веб — для привлечения, приложение — для использования

**Веб-клиент** (`plgames-voice.ru`) — точка входа для новых пользователей:
- Лендинг `/welcome` с описанием, фичами и CTA-кнопками
- Регистрация и вход через `/login`
- Полноценное использование через браузер

**Desktop-приложение** (.exe) — для постоянных пользователей:
- Пропуск лендинга, сразу экран авторизации `/login`
- Нативная рамка Windows с кнопками закрыть/свернуть/развернуть
- Диалог при закрытии: «Свернуть в трей» / «Закрыть полностью» + «Больше не спрашивать»
- Скрытие кастомного веб-Titlebar (Wordmark "PLG Voice") при нативной рамке

### Изменения в Electron (desktop/)

#### `desktop/src/native/config.ts`
- `customFrame: false` (по умолчанию) — включает нативную рамку Windows (`frame: true`)
- `askBeforeClose: true` — показывать диалог при закрытии окна

#### `desktop/src/native/window.ts`
- Стартовый URL: `/login` вместо `/` — пропуск лендинга в desktop
- Диалог закрытия: `dialog.showMessageBox()` с тремя кнопками + чекбокс
- JS-инжект: MutationObserver скрывает кастомный Titlebar при нативной рамке
- Добавлен импорт `dialog` из Electron

#### `desktop/forge.config.ts`
- `MakerSquirrel.name`: `"PLGVoice"` (без пробела — требование NuGet)

### Изменения в веб-клиенте (client/) — для деплоя на сервер

**Для AI-агента на сервере:** эти изменения нужно задеплоить чтобы desktop-приложение корректно определяло платформу.

#### `client/packages/client/src/Interface.tsx` (строка 138)
```typescript
// Было:
<Navigate href="/welcome" />

// Стало:
<Navigate href={window.native ? "/login" : "/welcome"} />
```
Desktop → сразу на авторизацию. Веб → на лендинг.

#### `client/packages/client/src/Landing.tsx`
- Добавлен `import { Titlebar }` и `<Titlebar />` в рендер
- Нужен чтобы при disconnected-состоянии на лендинге отображалась статус-полоса

### Как пересобрать после деплоя веб-клиента на сервер

После того как веб-клиент обновлён на сервере, desktop-приложение автоматически подхватит изменения (оно загружает сайт по URL). Пересборка .exe не требуется для изменений в веб-клиенте.

Пересборка .exe нужна только при изменениях в `desktop/` папке:
```bash
cd desktop
taskkill /IM "plg-voice-desktop.exe" /F  # если запущено
rm -rf out
PLATFORM=win32 pnpm make --platform win32 --arch x64
```

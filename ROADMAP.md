# PLG Voice — Дорожная карта проекта

> **Дата:** 2026-02-28
> **Репозиторий:** [Leonid1095/PLGames-Voice](https://github.com/Leonid1095/PLGames-Voice)
> **База:** Revolt/Stoat (stoatchat) — Solid.js клиент, Rust бэкенд, LiveKit голос

---

## ВЫПОЛНЕНО (22 февраля 2026)

### 1. Миграция с Spacebar на Revolt/Stoat

**Причина миграции:** Spacebar Client заброшен, голос отсутствует (0%), только 23/73 функций работали (31%). Revolt/Stoat имеет работающий голос (LiveKit), активную разработку, Solid.js (быстрее React), Rust бэкенд.

| Компонент | Исходный проект | Ветка в репозитории |
|-----------|----------------|---------------------|
| Веб-клиент | [stoatchat/for-web](https://github.com/stoatchat/for-web) | `revolt-client` |
| Десктоп-приложение | [stoatchat/for-desktop](https://github.com/stoatchat/for-desktop) | `revolt-desktop` |
| Серверная часть | [stoatchat/self-hosted](https://github.com/stoatchat/self-hosted) | `revolt-server` |

### 2. Полный ребрендинг Stoat → PLG Voice

#### Веб-клиент (351 файл изменён)
- **HTML/PWA:** title, manifest → "PLG Voice"
- **Все API URL:** перенаправлены на `plgames-voice.ru` (API, WebSocket, Media, Proxy)
- **Компоненты авторизации:** FlowHome, FlowLogin, SignedOut — все тексты PLG Voice
- **Контроллер сессий:** friendly_name → "PLG Voice for Web"
- **Темы:** переименована функция createPlgVoiceWebVariables
- **Настройки, модалки, контекстные меню:** все строки обновлены
- **Переводы (i18n):** Stoat → PLG Voice в русском каталоге (3187 строк)
- **Ссылки:** stoat.chat, admin.stoat.chat → plgames-voice.ru

#### Десктоп-приложение (10 файлов)
- **package.json:** name, productName → plg-voice-desktop
- **Electron Forge:** author, execName, flatpak IDs, publisher
- **Окно:** BUILD_URL → `https://plgames-voice.ru`
- **Трей:** tooltip, метки → "PLG Voice for Desktop"
- **Discord RPC:** state, кнопки → PLG Voice
- **Автозапуск:** name → "PLG Voice"
- **D-Bus:** пути → com.plgvoice.desktop
- **Метаданные:** .desktop и .metainfo.xml переименованы

#### Серверная часть
- Конфигурация параметризована через `generate_config.sh` — изменения не требуются
- Домен задаётся при генерации: `./generate_config.sh plgames-voice.ru`

### 3. Русский язык по умолчанию
- `initI18n()` активирует "ru" при загрузке
- `browserPreferredLanguage()` использует `Language.RUSSIAN` как fallback
- Locale store по умолчанию: `Language.RUSSIAN`
- Русские переводы уже встроены (3187 строк .po файла)

### 4. Коммиты
- `revolt-client` ветка: `bb8c580a` — "feat: PLG Voice full rebranding from Stoat/Revolt"
- `revolt-desktop` ветка: `009827c` — "feat: PLG Voice desktop rebranding from Stoat"
- `revolt-server` ветка: без изменений (конфигурация штатная)

### 5. Сборка десктоп-приложения (.exe) — 28 февраля 2026

#### Что сделано
- Сгенерированы иконки приложения: `icon.png` (512x512), `icon.ico` (multi-size 16-256), `iconTemplate.png` (macOS tray), `badges/1-10.ico` (уведомления)
- Исправлен баг Squirrel: NuGet не принимал пробел в имени `PLG Voice` → заменено на `PLGVoice` в `forge.config.ts`
- Собран инсталлятор (`plg-voice-desktop-setup.exe`) и portable-версия (ZIP)

#### Desktop UX — отличия от веб-версии

Принцип: **веб — для привлечения, приложение — для использования**.

| Поведение | Веб (браузер) | Desktop (Electron) |
|-----------|---------------|---------------------|
| Первый экран | Лендинг `/welcome` (маркетинг) | Сразу `/login` (авторизация) |
| Рамка окна | Браузерная | Нативная Windows (frame: true) |
| Кнопки закрыть/свернуть | Браузерные | Нативные Windows |
| Кастомный Titlebar | Показывается при disconnected | Скрыт через JS-инжект |
| Закрытие окна (X) | Закрывает вкладку | Диалог: «Свернуть в трей» / «Закрыть полностью» / «Отмена» + галочка «Больше не спрашивать» |

#### Технические детали изменений

**Electron (desktop/):**
- `config.ts`: `customFrame: false` (по умолчанию) → `frame: true` → нативные кнопки Windows
- `config.ts`: добавлено поле `askBeforeClose: true` — диалог при закрытии
- `window.ts`: стартовый URL изменён с `/` на `/login` — пропуск лендинга
- `window.ts`: при закрытии — `dialog.showMessageBox()` с выбором (трей/закрыть/отмена) и чекбоксом «Больше не спрашивать»
- `window.ts`: JS-инжект через `executeJavaScript()` + MutationObserver — скрывает кастомный веб-Titlebar (Wordmark "PLG Voice") при нативной рамке

**Веб-клиент (client/) — подготовка для деплоя на сервер:**
- `Interface.tsx`: `Navigate href` определяется через `window.native` — desktop → `/login`, web → `/welcome`
- `Landing.tsx`: добавлен `<Titlebar />` для корректного отображения кнопок окна на лендинге

#### Артефакты сборки
```
desktop/out/make/squirrel.windows/x64/
  ├── plg-voice-desktop-setup.exe    ← Инсталлятор (117 МБ)
  ├── PLGVoice-1.0.0-full.nupkg
  └── RELEASES

desktop/out/make/zip/win32/x64/
  └── PLG Voice-win32-x64-1.0.0.zip ← Portable (121 МБ)

desktop/out/PLG Voice-win32-x64/
  └── plg-voice-desktop.exe          ← Portable (папка, без архива)
```

### 6. CI/CD: Автосборка и автообновление десктоп-приложения — 1 марта 2026

#### Проблема
GitHub Actions workflows лежали в `desktop/.github/workflows/` — GitHub их не видит (ищет только `.github/workflows/` в корне репо). Релизы никогда не собирались автоматически.

#### Что сделано
- **Перенесены workflows в корень репо:**
  - `desktop/.github/workflows/build.yml` → `.github/workflows/desktop-build.yml`
  - `desktop/.github/workflows/release-please.yml` → `.github/workflows/desktop-release.yml`
- **Добавлен `defaults.run.working-directory: desktop`** ко всем jobs
- **Добавлен `paths: ["desktop/**"]`** — workflows триггерятся только при изменениях в desktop/
- **Упрощён release workflow (только Windows):**
  - Убрана матрица `[ubuntu-latest, windows-latest, macos-latest]` → только `windows-latest`
  - Убраны шаги macOS x64 и Linux arm64
  - Заменён GitHub App token на `GITHUB_TOKEN`
- **Обновлены пути release-please:** `config-file: desktop/release-please-config.json`, `manifest-file: desktop/.release-please-manifest.json`, пакет `"desktop"` вместо `"."`
- **Удалены старые файлы** `desktop/.github/workflows/build.yml` и `release-please.yml`

#### Как это работает
1. Push в main с изменениями в `desktop/` → GitHub Actions запускает `desktop-release.yml`
2. Release Please создаёт Release PR с бампом версии
3. Merge Release PR → `publish-release` job собирает `.exe` на `windows-latest` и загружает в GitHub Releases
4. `update-electron-app` (уже настроен в десктопе) проверяет GitHub Releases → автообновление

#### Файлы
| Файл | Действие |
|------|----------|
| `.github/workflows/desktop-build.yml` | Создан |
| `.github/workflows/desktop-release.yml` | Создан |
| `desktop/release-please-config.json` | Обновлён (пакет `"."` → `"desktop"`) |
| `desktop/.release-please-manifest.json` | Обновлён (ключ `"."` → `"desktop"`) |
| `desktop/.github/workflows/build.yml` | Удалён |
| `desktop/.github/workflows/release-please.yml` | Удалён |

### 7. Страница скачивания `/app` — 2 марта 2026

#### Что сделано
- **Новый маршрут `/app`** — выделенная страница скачивания десктоп-приложения
- Компонент `AppDownload.tsx`: логотип, заголовок «Скачать PLG Voice», кнопка скачивания → GitHub Releases `.exe`, навигационные ссылки (главная, вход, регистрация), подпись «Windows 10+ • 64-bit • ~117 МБ»
- Маршрут добавлен в `index.tsx` между `/welcome` и `/`
- Дизайн в стиле Obsidian Amethyst (согласован с лендингом)

#### Исправление сборки Docker
- `stoat.js/tsconfig.json`: добавлен `exclude: ["tests", "vitest.config.ts"]` — тесты вне `rootDir` ломали `tsc` при Docker-сборке
- Пересобран образ `plg-voice-web:latest`, задеплоен на сервер

#### Файлы
| Файл | Действие |
|------|----------|
| `client/packages/client/src/AppDownload.tsx` | Создан |
| `client/packages/client/src/index.tsx` | Добавлен маршрут `/app` |
| `client/packages/stoat.js/tsconfig.json` | Исправлен exclude для Docker-сборки |

#### Коммит
- `f51d7803` — "feat: add /app download page for Windows desktop client"

---

## ЧТО НУЖНО СДЕЛАТЬ

### ✅ Этап 1: Развёртывание сервера (MVP — выполнено 2 марта 2026)

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 1 | Остановить старый Spacebar | Остановить Docker-контейнеры Spacebar на plgames-voice.ru | ✅ |
| 2 | Развернуть Revolt/Stoat сервер | `./generate_config.sh plgames-voice.ru` + `docker compose up -d` | ✅ |
| 3 | Настроить DNS | Убедиться что plgames-voice.ru указывает на сервер | ✅ |
| 4 | Открыть порты | 80, 443 (HTTP/S), 7881/tcp (LiveKit signaling), 50000-50100/udp (media) | ✅ |
| 5 | Проверить все сервисы | 14+ Docker-сервисов healthy: API, Events, MongoDB, Redis, RabbitMQ, MinIO, LiveKit и др. | ✅ |
| 6 | Создать первого пользователя | Регистрация через веб-интерфейс, назначить администратором | ✅ |

### 🟠 Этап 2: Создание ассетов

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 7 | Логотип PLG Voice | SVG/PNG для шапки приложения и favicon | ⬜ (placeholder сгенерирован) |
| 8 | Иконка приложения | .ico/.png для десктопа, трея, PWA | ✅ placeholder готов |
| 9 | Wordmark SVG | Логотип с текстом для страницы входа | ⬜ |
| 10 | OG-метатеги | Превью при отправке ссылки в мессенджерах | ⬜ |

### 🟡 Этап 3: Сборка десктоп-приложения

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 11 | Установить зависимости | `pnpm install` в plg-voice-desktop | ✅ |
| 12 | Собрать .exe | `pnpm make` (Electron Forge → Windows installer + ZIP portable) | ✅ |
| 13 | Протестировать | Запустить, проверить подключение к серверу, голос | ⬜ (сервер развёрнут — можно тестировать) |
| 14 | CI/CD автосборка | GitHub Actions workflows перенесены в корень, release-please + publish Windows | ✅ |
| 15 | Автообновление | `update-electron-app` привязан к GitHub Releases — заработает после первого релиза | ✅ (настроено) |
| 16 | Кнопка скачивания на лендинге | Кнопка «Скачать для Windows» в навбаре и hero-секции Landing.tsx → latest release .exe | ✅ |
| 17 | Страница скачивания /app | Выделенная страница `AppDownload.tsx` по маршруту `/app` с кнопкой скачивания .exe | ✅ |

### ✅ Этап 4: UX, перевод и голос (9 марта 2026)

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 14 | Убрать лендинг для авторизованных | `/welcome` → `/login` для авторизованных пользователей | ✅ |
| 15 | Кнопка создания каналов | `+` в хедере сервера вместо только контекстного меню | ✅ |
| 16 | Перевод UI | 16 английских строк по 12 файлам → i18n (тултипы, модалки, пикеры) | ✅ |
| 17 | Страница «Друзья» | Новый дизайн с карточками, статусами, кнопками действий | ✅ |
| 18 | Страница «Премиум» | Каркас с превью фич вместо заглушки `[premium]` | ✅ |
| 19 | Changelog | Переведён на русский, обновлён до v0.2.0 | ✅ |
| 20 | Версия | Обновлена с 1.0.0 → 0.2.0 (реальное состояние) | ✅ |
| 21 | Голос: AGC | Автоматическая регулировка громкости микрофона | ✅ |
| 22 | Голос: баг | Исправлен getter preferredAudioOutputDevice (возвращал input) | ✅ |
| 23 | Голос: UI | Описания к настройкам обработки звука | ✅ |

### ✅ Этап 5: Тестирование и отладка (10 марта 2026)

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 24 | Текстовые каналы | Аудит кода: исправлен баг удаления инвайтов, i18n 16+ строк | ✅ |
| 25 | Голосовые каналы | Исправлены string throws, опечатка setSinkId, добавлен Krisp шумоподавление | ✅ |
| 26 | Авторизация | Аудит: i18n FlowDelete, FlowReset, Form.tsx | ✅ |
| 27 | Управление сервером | Аудит: i18n ChannelPermissionsEditor, ServerRoleEditor, ListServerInvites | ✅ |
| 28 | Русская локализация | 23+ строк обёрнуты в Trans/t, переводы добавлены в messages.po | ✅ |

### ✅ Этап 6: Голос и OG (10 марта 2026)

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 29 | Krisp шумоподавление | @livekit/krisp-noise-filter, lazy-load, UI-тогл | ✅ |
| 30 | OG-метатеги | Open Graph, Twitter Card, preview-картинка 1200x630 | ✅ |

---

## ЧТО УЖЕ ЕСТЬ «ИЗ КОРОБКИ» (Revolt/Stoat)

В отличие от Spacebar, Revolt/Stoat предоставляет:

| Функция | Статус |
|---------|--------|
| Голосовые каналы (LiveKit) | ✅ Работает |
| Текстовые каналы, категории | ✅ Работает |
| Вход / Регистрация / 2FA | ✅ Работает |
| Отправка / редактирование / удаление сообщений | ✅ Работает |
| Ответы (Reply) | ✅ Работает |
| Реакции на сообщения | ✅ Работает |
| Эмодзи-пикер | ✅ Работает |
| Загрузка файлов | ✅ Работает |
| Markdown, блоки кода | ✅ Работает |
| Эмбеды (превью ссылок) | ✅ Работает |
| Упоминания @user @role #channel | ✅ Работает |
| Индикатор "печатает..." | ✅ Работает |
| Бесконечная прокрутка истории | ✅ Работает |
| Создание/управление серверами | ✅ Работает |
| Роли (создание, редактирование, назначение) | ✅ Работает |
| Настройки сервера | ✅ Работает |
| Инвайты | ✅ Работает |
| Кик / Бан | ✅ Работает |
| Список участников | ✅ Работает |
| Профили пользователей | ✅ Работает |
| Статусы (online/idle/dnd/offline) | ✅ Работает |
| Кастомный статус | ✅ Работает |
| Индикаторы непрочитанного | ✅ Работает |
| Аватар, баннер профиля | ✅ Работает |
| Темы (светлая/тёмная + кастомные) | ✅ Работает |
| Смена пароля / email | ✅ Работает |
| Десктоп-уведомления | ✅ Работает |
| Поиск сообщений | ✅ Работает |
| Закреплённые сообщения | ✅ Работает |
| Друзья / ЛС | ✅ Работает |
| Блокировка пользователей | ✅ Работает |
| Русский язык (полный перевод) | ✅ Работает |

---

## БУДУЩИЕ УЛУЧШЕНИЯ (после MVP)

### Голос и медиа
| Приоритет | Функция | Описание |
|-----------|---------|----------|
| ~~Высокий~~ | ~~Krisp шумоподавление~~ | ✅ Реализовано (10 марта 2026) |
| Высокий | Мобильное приложение | PWA доработка или Capacitor/React Native обёртка |
| Средний | Stage-каналы | Для презентаций и AMA |
| Средний | Soundboard | Воспроизведение звуков в голосовом канале |

### Монетизация и Premium (подробнее: roadmap-v3.md в memory)
| Приоритет | Функция | Описание |
|-----------|---------|----------|
| Высокий | Premium-подписка | Анимированные аватары, HD-стриминг, большие файлы |
| Высокий | Бусты серверов | Telegram-стиль: подписчики бустят серверы, уровни 1-3 |
| Средний | Стикеры | Пользовательские стикер-паки, каталог, монетизация популярных |
| Средний | GIF-система | Замена Tenor (отключён 2026), собственный каталог |
| Низкий | Маркетплейс стикеров | Авторы продают паки, получают % |

### Функционал
| Приоритет | Функция | Описание |
|-----------|---------|----------|
| Средний | Треды | Ответвления обсуждений внутри каналов |
| Средний | Форумные каналы | Для структурированных обсуждений |
| Средний | Автомодерация | Фильтры спама, стоп-слов, рейд-защита |
| Низкий | Запланированные события | Создание и управление событиями |
| Низкий | OAuth2/SSO | Вход через Google, GitHub и др. |

---

## АРХИТЕКТУРА

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Веб-клиент    │     │  Десктоп (Electron)│     │  Мобильное (TODO)│
│   Solid.js      │     │  Solid.js + Node  │     │  Android/iOS     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┼─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Caddy (Reverse Proxy) │
                    │   plgames-voice.ru   │
                    └────────────┬────────────┘
                                 │
         ┌───────────┬───────────┼───────────┬───────────┐
         │           │           │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
    │  API    │ │ Events  │ │ Autumn │ │January │ │LiveKit │
    │  (Rust) │ │  (WS)   │ │ (Files)│ │(Proxy) │ │(Voice) │
    └────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
         │           │          │           │          │
    ┌────▼───────────▼──────────▼───────────▼──────────▼────┐
    │              Инфраструктура                            │
    │  MongoDB │ Redis │ RabbitMQ │ MinIO │ S3              │
    └───────────────────────────────────────────────────────┘
```

---

## КОМАНДЫ ДЛЯ РАЗВЁРТЫВАНИЯ

```bash
# 1. Клонировать серверную конфигурацию
git clone -b revolt-server https://github.com/Leonid1095/PLGames-Voice.git plg-voice-server
cd plg-voice-server

# 2. Сгенерировать конфиг для домена
./generate_config.sh plgames-voice.ru

# 3. Запустить все сервисы
docker compose up -d

# 4. Проверить статус
docker compose ps

# 5. Открыть порты (если firewall)
# TCP: 80, 443, 7881
# UDP: 50000-50100
```

---

*Последнее обновление: 2026-03-10 (Этап 5-6: аудит, баги, i18n, Krisp, OG-метатеги)*

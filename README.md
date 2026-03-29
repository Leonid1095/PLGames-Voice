# PLG Voice

Кастомизированный голосовой/текстовый мессенджер на базе Stoat (форк Revolt). Включает серверную часть (API, events, file server, voice) и кастомный веб-клиент с брендингом PLG Voice.

## Архитектура

```
nginx (443/80)  -->  Caddy (:8091)  -->  web (:5000)     — веб-клиент
                                    -->  api (:14702)     — REST API
                                    -->  events (:14703)  — WebSocket
                                    -->  autumn (:14704)  — файловый сервер
                                    -->  january (:14705) — прокси метаданных/картинок
                                    -->  gifbox (:14706)  — Tenor прокси
                                    -->  livekit (:7880)  — голосовой сервер
```

Все сервисы работают в Docker через `docker compose`. Nginx терминирует TLS (Let's Encrypt) и проксирует на Caddy, который маршрутизирует запросы к внутренним сервисам.

## Требования

- Ubuntu 22.04+ (или другой Linux)
- Docker + Docker Compose v2
- 2+ vCPU, 4+ GB RAM (сборка клиента требует ~4 GB)
- Домен с DNS-записью, указывающей на сервер
- nginx + certbot (для TLS) или другой reverse proxy

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Leonid1095/PLGames-Voice.git
cd PLGames-Voice
```

### 2. Сгенерировать конфигурацию сервера

```bash
chmod +x ./generate_config.sh
./generate_config.sh your.domain
```

Скрипт создаст:
- `Revolt.toml` — конфигурация всех серверных сервисов
- `.env.web` — переменные окружения для веб-клиента и Caddy
- `livekit.yml` — конфигурация голосового сервера

### 3. Настроить .env.web

Caddy работает как внутренний reverse proxy на порту 8091. Если вы ставите внешний nginx/Caddy/Traefik перед ним — используйте:

```env
HOSTNAME=:80
REVOLT_PUBLIC_URL=https://your.domain/api
VITE_API_URL=https://your.domain/api
VITE_WS_URL=wss://your.domain/ws
VITE_MEDIA_URL=https://your.domain/autumn
VITE_PROXY_URL=https://your.domain/january
```

`VITE_*` переменные подставляются в клиент при старте контейнера (runtime injection через `inject.js`). Это то, что **связывает клиент с сервером** — клиент использует эти URL для всех запросов к API.

### 4. Собрать веб-клиент

```bash
cd client
docker build -t plg-voice-web:latest .
cd ..
```

В `compose.yml` сервис `web` уже настроен на `image: plg-voice-web:latest`.

### 5. Запустить

```bash
docker compose up -d
```

Проверить:
```bash
docker compose ps          # все сервисы running
curl http://127.0.0.1:8091 # ответ от клиента
```

### 6. Настроить nginx (reverse proxy + TLS)

Установить nginx и certbot:
```bash
apt install nginx certbot python3-certbot-nginx
```

Создать конфигурацию `/etc/nginx/sites-enabled/plgvoice.conf`:

```nginx
server {
    listen 80;
    server_name your.domain;

    client_max_body_size 100M;

    # WebSocket — events
    location /ws {
        proxy_pass http://127.0.0.1:8091/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # WebSocket — LiveKit voice
    location /livekit {
        proxy_pass http://127.0.0.1:8091/livekit;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Всё остальное — через Caddy
    location / {
        proxy_pass http://127.0.0.1:8091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Получить TLS-сертификат:
```bash
certbot --nginx -d your.domain
```

### 7. Открыть порты (firewall)

```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 7881/tcp           # LiveKit signaling
ufw allow 50000:50100/udp    # LiveKit media (WebRTC)
ufw enable
```

## Как клиент привязывается к серверу

Связь клиента и сервера реализована через переменные окружения:

```
.env.web (на хосте)
    │
    ▼
docker compose up -d web          # контейнер web получает переменные
    │
    ▼
inject.js (внутри контейнера)     # при старте заменяет плейсхолдеры
    │                               # __VITE_API_URL__ -> реальный URL
    ▼
dist/index.html + dist/assets/*   # клиент в браузере знает куда ходить
```

**Что куда ходит:**

| Переменная | Сервис | Назначение |
|---|---|---|
| `VITE_API_URL` | api (REST) | Регистрация, логин, сообщения, серверы |
| `VITE_WS_URL` | events (WebSocket) | Реалтайм-события (новые сообщения, статусы) |
| `VITE_MEDIA_URL` | autumn (файлы) | Загрузка/скачивание файлов, аватарок |
| `VITE_PROXY_URL` | january (прокси) | Превью ссылок, проксирование картинок |

Голосовые звонки (LiveKit) настраиваются в `Revolt.toml` серверной частью — клиент получает URL через API автоматически.

## Пересборка клиента после изменений

```bash
cd client
docker build -t plg-voice-web:latest .
cd ..
docker compose up -d web
```

## Обновление серверных сервисов

Образы серверных сервисов берутся из `ghcr.io/stoatchat/*`. Для обновления:

```bash
docker compose pull    # скачать новые образы
docker compose up -d   # перезапустить
```

## Структура репозитория

```
PLGames-Voice/
├── client/                 # Исходники веб-клиента (Solid.js + PandaCSS)
│   ├── Dockerfile          # Multi-stage сборка клиента
│   ├── packages/client/    # Основной код клиента
│   └── docker/             # Runtime сервер (inject.js + express)
├── desktop/                # Desktop-клиент (Tauri)
├── compose.yml             # Docker Compose — все сервисы
├── Caddyfile               # Внутренний reverse proxy
├── plgvoice.conf           # nginx конфигурация (пример)
├── .env.web                # Переменные окружения (не в git)
├── Revolt.toml             # Конфигурация сервера (не в git)
├── livekit.yml             # Конфигурация LiveKit (не в git)
└── ROADMAP.md              # Дорожная карта проекта
```

Файлы `.env.web`, `Revolt.toml`, `livekit.yml` содержат секреты и исключены из git через `.gitignore`.

## Решение проблем

**Клиент показывает ошибку подключения:**
- Проверьте что все сервисы запущены: `docker compose ps`
- Проверьте `.env.web` — URL должны совпадать с вашим доменом
- Перезапустите web: `docker compose restart web`

**OOM при сборке клиента:**
- Dockerfile уже содержит `NODE_OPTIONS="--max-old-space-size=4096"`
- Убедитесь что на сервере есть минимум 4 GB RAM (или swap)

**WebSocket не подключается:**
- nginx должен проксировать `/ws` и `/livekit` с заголовками `Upgrade` и `Connection`
- Проверьте `proxy_read_timeout 86400` в nginx конфигурации

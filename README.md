# PLG Voice

Голосовой и текстовый мессенджер для игровых сообществ. Включает серверную часть (API, events, file server, voice) и веб-клиент с брендингом PLG Voice.

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

## Технологии

- **Клиент**: Solid.js + Vite + Panda CSS + ProseMirror
- **Бэкенд**: Rust (Rocket, Tokio) — API, Events, сервисы
- **Голос**: LiveKit + Krisp шумоподавление
- **Десктоп**: Electron Forge (Windows/macOS/Linux)
- **БД**: MongoDB + Redis + RabbitMQ
- **Хранилище**: MinIO S3 + Autumn file server
- **i18n**: Lingui (70+ локалей, активные: en, ru)

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Leonid1095/PLGames-Voice.git
cd PLGames-Voice
```

### 2. Автоматическая установка

```bash
chmod +x ./setup.sh
./setup.sh
```

Скрипт выполнит всё автоматически: сгенерирует секреты, создаст конфиги, соберёт клиент, запустит сервисы.

### 3. Ручная установка

```bash
# Сгенерировать конфигурацию
./generate_config.sh your.domain

# Собрать веб-клиент
cd client && docker build -t plg-voice-web:latest . && cd ..

# Запустить
docker compose up -d
```

### 4. Проверить

```bash
docker compose ps          # все сервисы running
curl http://127.0.0.1:8091 # ответ от клиента
```

## Требования

- Ubuntu 22.04+ (или другой Linux)
- Docker + Docker Compose v2
- 2+ vCPU, 4+ GB RAM
- Домен с DNS-записью + nginx/certbot для TLS

## Структура репозитория

```
PLGames-Voice/
├── client/                 # Исходники веб-клиента (Solid.js + PandaCSS)
├── desktop/                # Desktop-клиент (Electron Forge)
├── server/                 # Серверная часть (Rust)
├── bot/                    # Админ-бот (Node.js)
├── compose.yml             # Docker Compose — все сервисы
├── Caddyfile               # Внутренний reverse proxy
├── plgvoice.conf           # nginx конфигурация (пример)
├── setup.sh                # Автоматическая установка
└── ROADMAP.md              # Дорожная карта проекта
```

## Лицензия

AGPL-3.0 — см. [LICENSE](LICENSE).

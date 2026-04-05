# PLG Voice — Gaming Messenger

## Architecture
- **Frontend**: Solid.js 1.9 + Vite 5 + Panda CSS + ProseMirror (client/)
- **Backend**: Rust (Rocket, Tokio) — API (delta), Events (bonfire), services (server/)
- **Voice**: LiveKit 1.9.6 + Krisp noise cancellation + Egress/Ingress
- **Bot**: Node.js admin bot — XP, moderation, tournaments, streams (bot/)
- **Desktop**: Electron Forge — Windows/macOS/Linux (desktop/)
- **Database**: MongoDB (auth enabled)
- **Cache/PubSub**: Redis 7 (auth enabled)
- **Queue**: RabbitMQ 4
- **Storage**: MinIO S3 + Autumn file server
- **Proxy**: nginx (TLS) -> Caddy (:8091) -> services
- **i18n**: Lingui (70+ locales, active: en, ru)
- **Domain**: plgames-voice.ru | IP: 95.78.126.214

## Key Commands
- `docker compose up -d` — запуск всех 17 сервисов
- `docker compose up -d --build web` — пересборка веб-клиента
- `docker compose up -d --build api` — пересборка API
- `docker compose up -d --build bot` — пересборка бота
- `docker compose logs -f <service>` — логи сервиса
- `docker compose restart <service>` — рестарт сервиса
- `cd client && pnpm install` — установка зависимостей клиента
- `cd client && pnpm lingui:extract` — извлечение i18n строк
- `cd bot && npm install` — установка зависимостей бота
- `sudo systemctl reload nginx` — перезагрузка nginx
- `./scripts/backup.sh` — бэкап БД и хранилища

## Key Files
- `compose.yml` — Docker Compose конфигурация (17 сервисов)
- `.env` — секреты (НИКОГДА не коммитить)
- `Revolt.toml` — конфигурация сервера (НИКОГДА не коммитить)
- `livekit.yml` — конфигурация LiveKit (НИКОГДА не коммитить)
- `plgvoice.conf` — nginx конфиг (синхронизировать с /etc/nginx/sites-enabled/)
- `Caddyfile` — внутренний реверс-прокси
- `client/packages/client/components/common/lib/env.ts` — API/WS/Media URLs
- `client/packages/client/components/i18n/catalogs/ru/messages.po` — русская локализация
- `client/packages/stoat.js/` — API SDK клиента
- `bot/index.js` — точка входа бота

## CRITICAL RULES

### NEVER
- NEVER удалять или очищать FILES_ENCRYPTION_KEY в .env / Revolt.toml — все загруженные файлы станут НЕВОССТАНОВИМЫ
- NEVER коммитить .env, Revolt.toml, livekit.yml, egress.yml, ingress.yml — содержат секреты
- NEVER удалять Forum channels из UI — это ключевая фича, фиксить совместимость с API
- NEVER удалять или переписывать рабочий код без явного запроса
- NEVER удалять файлы без подтверждения пользователя
- NEVER делать несколько крупных изменений одновременно
- NEVER менять домен/URL без проверки всех 25+ файлов (миграция cvaboda -> plgames-voice.ru затронула 75 мест)

### ALWAYS
- ALWAYS добавлять русские переводы при добавлении новых t()/Trans строк в ru/messages.po
- ALWAYS запускать `pnpm lingui:extract` после добавления i18n строк (сначала собрать lingui плагины)
- ALWAYS проверять Docker логи после изменений конфигов: `docker compose logs -f <service>`
- ALWAYS делать git checkpoint перед крупными рефакторингами
- ALWAYS сохранять .template версии конфигов при изменении структуры (Revolt.toml.template, etc.)
- ALWAYS использовать ${ENV_VARS} из .env в compose.yml, не хардкодить секреты
- ALWAYS проверять что nginx конфиг валиден: `sudo nginx -t`

### Если не уверен — СПРОСИ, не угадывай

## Working Style
- Сначала ПЛАН, потом код
- Маленькие дифы: один файл -> тесты/проверка -> следующий файл
- Используй субагентов для исследования кодовой базы
- Один PR = одна логическая задача
- Для i18n: добавь строку -> extract -> перевод в ru/messages.po

## Agents
- Use `planner` agent для планирования сложных задач
- Use `tester` agent после изменений кода
- Use `code-reviewer` agent перед коммитами

## Service Ports (internal)
| Service | Port |
|---------|------|
| API (delta) | 14702 |
| Events (bonfire) | 14703 |
| Autumn (files) | 14704 |
| January (proxy) | 14705 |
| LiveKit | 7880-7881 |
| Voice-Ingress | 8500 |
| LiveKit Ingress RTMP | 1935 |
| LiveKit Ingress WHIP | 8088 |
| Caddy | 8091 |
| MinIO | 9000 |

## Known Gotchas
- Webhook PATCH/DELETE возвращают 404 — API v0.11.1 не поддерживает (только create/list)
- Redis требует аутентификацию — все сервисы должны передавать REDIS_PASSWORD
- LiveKit требует use_external_ip: true для работы за NAT
- lingui extract: сначала собрать оба lingui плагина, потом extract, потом переводы
- nginx конфиг в репо (plgvoice.conf) — нужно вручную копировать в /etc/nginx/sites-enabled/

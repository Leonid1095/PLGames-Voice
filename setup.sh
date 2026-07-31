#!/usr/bin/env bash
# ============================================================
# PLG Voice — Setup script for fresh server deployment
# Usage: ./setup.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---- Pre-checks ----
# Every tool the script uses is checked here, before anything is written.
# Failing halfway through leaves a half-written .env and a confused operator.
command -v docker >/dev/null 2>&1 || error "Docker not installed. Install: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 not found. (\`command -v docker compose\` never tests this — it only checks docker.)"
command -v openssl >/dev/null 2>&1 || error "openssl not installed. Install: sudo apt install openssl"
command -v envsubst >/dev/null 2>&1 || error "envsubst not installed. Install: sudo apt install gettext-base"
command -v curl >/dev/null 2>&1 || error "curl not installed. Install: sudo apt install curl"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      PLG Voice — Server Setup        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ---- Gather info ----
# Answers can come from the environment so a redeploy needs no operator at the
# keyboard:  PLG_DOMAIN=example.com PLG_EXTERNAL_IP=1.2.3.4 ./setup.sh
# On a re-run, whatever is already in .env is offered as the default.
PREV_DOMAIN=$(sed -n 's/^PLG_VOICE_HOST=//p' .env 2>/dev/null | head -n1)

DOMAIN="${PLG_DOMAIN:-}"
if [ -z "$DOMAIN" ]; then
  if [ -t 0 ]; then
    read -rp "Domain name${PREV_DOMAIN:+ [$PREV_DOMAIN]} (e.g. plgames-voice.ru): " DOMAIN
    DOMAIN="${DOMAIN:-$PREV_DOMAIN}"
  else
    DOMAIN="$PREV_DOMAIN"
  fi
fi
[ -z "$DOMAIN" ] && error "Domain is required. Pass it as PLG_DOMAIN=example.com ./setup.sh"

DETECTED_IP=$(curl -4 -s --max-time 5 ifconfig.me || curl -4 -s --max-time 5 icanhazip.com || echo "")
EXTERNAL_IP="${PLG_EXTERNAL_IP:-}"
if [ -z "$EXTERNAL_IP" ]; then
  if [ -t 0 ]; then
    read -rp "External IP [$DETECTED_IP]: " INPUT_IP
    EXTERNAL_IP="${INPUT_IP:-$DETECTED_IP}"
  else
    EXTERNAL_IP="$DETECTED_IP"
  fi
fi
[ -z "$EXTERNAL_IP" ] && error "Could not detect external IP. Pass it as PLG_EXTERNAL_IP=1.2.3.4 ./setup.sh"

info "Domain: $DOMAIN"
info "External IP: $EXTERNAL_IP"
echo ""

# ---- Secrets ----
#
# Re-running this script must never invalidate a live deployment. Every secret
# already present in .env is reused; only missing ones are generated.
#
# This matters most for FILES_ENCRYPTION_KEY: uploads are encrypted with it and
# a fresh key makes every existing file permanently unreadable. The previous
# version regenerated all secrets unconditionally, so a second run of "the easy
# installer" silently destroyed the media library of a working instance.
#
# Pass --rotate to deliberately generate fresh credentials. FILES_ENCRYPTION_KEY
# is still preserved even then — rotating it is a data migration, not a setting.
ROTATE=0
[ "${1:-}" = "--rotate" ] && ROTATE=1

# Read a value out of the existing .env without executing it: a stray backtick
# or $(...) in a generated password must not run as a command.
existing() {
  [ -f .env ] || return 0
  sed -n "s/^$1=//p" .env | head -n1
}

# Reuse what is there, generate what is not.
keep_or_make() {
  local name="$1" gen="$2" current
  current="$(existing "$name")"
  if [ -n "$current" ] && { [ "$ROTATE" -eq 0 ] || [ "$name" = "FILES_ENCRYPTION_KEY" ]; }; then
    printf '%s' "$current"
  else
    eval "$gen"
  fi
}

info "Preparing secrets..."
if [ -f .env ]; then
  cp .env ".env.bak.$(date +%Y%m%d-%H%M%S)"
  ok "Existing .env backed up; secrets already in it will be reused"
fi

MONGO_PASS=$(keep_or_make MONGO_PASS      "openssl rand -base64 24 | tr -d '/+='")
RABBIT_PASS=$(keep_or_make RABBIT_PASS    "openssl rand -base64 24 | tr -d '/+='")
MINIO_PASS=$(keep_or_make MINIO_PASS      "openssl rand -base64 24 | tr -d '/+='")
LIVEKIT_KEY=$(keep_or_make LIVEKIT_API_KEY    "openssl rand -hex 6")
LIVEKIT_SECRET=$(keep_or_make LIVEKIT_API_SECRET "openssl rand -hex 24")
FILES_KEY=$(keep_or_make FILES_ENCRYPTION_KEY "openssl rand -base64 32")
REDIS_PASS=$(keep_or_make REDIS_PASSWORD "openssl rand -base64 24 | tr -d '/+='")
MESSAGES_KEY=$(keep_or_make MESSAGES_ENCRYPTION_KEY "openssl rand -base64 32")

VAPID_PRIVATE=$(existing VAPID_PRIVATE_KEY)
VAPID_PUBLIC=$(existing VAPID_PUBLIC_KEY)
if [ -z "$VAPID_PRIVATE" ] || [ -z "$VAPID_PUBLIC" ]; then
  # base64 -w0 is GNU-only; -w is rejected on BSD/macOS, so fold the lines away
  # by hand instead and keep the script portable.
  b64() { base64 | tr -d '\n'; }
  VAPID_PEM=$(openssl ecparam -genkey -name prime256v1 -noout 2>/dev/null)
  VAPID_PRIVATE=$(printf '%s' "$VAPID_PEM" | b64)
  VAPID_PUBLIC=$(printf '%s' "$VAPID_PEM" | openssl ec -pubout 2>/dev/null | b64)
  [ -z "$VAPID_PRIVATE" ] && error "Failed to generate VAPID keys — is openssl built with EC support?"
fi

ok "Secrets ready"

cat > .env <<EOF
# PLG Voice — Generated $(date +%Y-%m-%d)
PLG_VOICE_HOST=$DOMAIN

# MongoDB
MONGO_USER=plgadmin
MONGO_PASS=$MONGO_PASS

# Redis
REDIS_PASSWORD=$REDIS_PASS

# RabbitMQ
RABBIT_USER=rabbituser
RABBIT_PASS=$RABBIT_PASS

# MinIO
MINIO_USER=minioautumn
MINIO_PASS=$MINIO_PASS

# LiveKit
LIVEKIT_API_KEY=$LIVEKIT_KEY
LIVEKIT_API_SECRET=$LIVEKIT_SECRET
LIVEKIT_KEY=$LIVEKIT_KEY
LIVEKIT_SECRET=$LIVEKIT_SECRET

# VAPID (push notifications)
VAPID_PRIVATE_KEY=$VAPID_PRIVATE
VAPID_PUBLIC_KEY=$VAPID_PUBLIC

# Files encryption
# Losing or changing this key makes every uploaded file permanently unreadable.
# Back it up somewhere outside this server before you need it.
FILES_ENCRYPTION_KEY=$FILES_KEY

# Message content encryption (AES-256-GCM)
# Losing or changing this key makes existing messages permanently unreadable.
MESSAGES_ENCRYPTION_KEY=$MESSAGES_KEY
EOF

# Secrets file — owner only. It was previously left at the default umask, which
# on most distributions means world-readable.
chmod 600 .env
ok "Wrote .env (mode 600)"

# ---- Generate configs from templates ----
envsubst_file() {
  local src="$1" dst="$2"
  # Source .env for variable expansion
  set -a; source .env; set +a
  export EXTERNAL_IP="$EXTERNAL_IP"
  envsubst < "$src" > "$dst"
  ok "Generated $dst"
}

envsubst_file Revolt.toml.template Revolt.toml
envsubst_file livekit.yml.template livekit.yml
envsubst_file ingress.yml.template ingress.yml
envsubst_file egress.yml.template egress.yml
envsubst_file .env.web.template .env.web

# ---- Create data directories ----
mkdir -p data/db data/minio data/rabbit data/caddy-data data/caddy-config data/recordings data/livekit-certs
ok "Created data directories"

# ---- TLS certificates ----
echo ""
info "TLS certificates setup"
if [ -f "data/livekit-certs/fullchain.pem" ]; then
  ok "LiveKit certs already exist"
else
  if command -v certbot >/dev/null 2>&1; then
    info "Getting Let's Encrypt certificate..."
    sudo certbot certonly --standalone -d "$DOMAIN" --agree-tos --register-unsafely-without-email --non-interactive || {
      warn "certbot failed — you can set up certs manually later"
      warn "Copy fullchain.pem and privkey.pem to data/livekit-certs/"
    }
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
      sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" data/livekit-certs/
      sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" data/livekit-certs/
      sudo chmod 644 data/livekit-certs/fullchain.pem
      sudo chmod 600 data/livekit-certs/privkey.pem
      ok "Certificates copied"
    fi
  else
    warn "certbot not installed. Install: sudo apt install certbot"
    warn "Then run: sudo certbot certonly --standalone -d $DOMAIN"
    warn "Copy certs to data/livekit-certs/fullchain.pem and privkey.pem"
  fi
fi

# ---- nginx config ----
echo ""
if command -v nginx >/dev/null 2>&1; then
  info "Setting up nginx reverse proxy..."
  sed "s/plgames-voice.ru/$DOMAIN/g" plgvoice.conf > "/tmp/plgvoice-$DOMAIN.conf"
  if [ -d /etc/nginx/sites-enabled ]; then
    sudo cp "/tmp/plgvoice-$DOMAIN.conf" "/etc/nginx/sites-enabled/plgvoice.conf"
    sudo nginx -t && sudo systemctl reload nginx
    ok "nginx configured and reloaded"
  else
    warn "nginx sites-enabled not found — copy plgvoice.conf manually"
  fi
else
  warn "nginx not installed. Install: sudo apt install nginx"
  warn "Then copy plgvoice.conf to /etc/nginx/sites-enabled/"
fi

# ---- Build web client ----
echo ""
[ -d "client" ] || error "client/ directory not found. Clone the full repo first."

# The client build needs its submodules — packages/stoat.js (the API SDK) and
# packages/solid-livekit-components are separate repositories. Without this the
# Docker build fails deep inside `pnpm --filter stoat.js build` with an error
# that does not mention submodules at all. Previously the operator had to know
# to run this by hand; the Dockerfile only mentioned it in a comment.
if [ -f .gitmodules ]; then
  if command -v git >/dev/null 2>&1 && [ -d .git ]; then
    info "Fetching submodules (API SDK, LiveKit components)..."
    git submodule update --init --recursive || error "Submodule checkout failed. Check network access to github.com."
    ok "Submodules ready"
  else
    warn "Not a git checkout, or git missing — cannot fetch submodules."
    warn "If the build fails on stoat.js, that is why."
  fi
fi

# Guard against the empty-directory case that a plain archive download produces.
if [ -d client/packages/stoat.js ] && [ -z "$(ls -A client/packages/stoat.js 2>/dev/null)" ]; then
  error "client/packages/stoat.js is empty. Get the repo with:
  git clone --recurse-submodules <repo-url>"
fi

info "Building web client Docker image..."
docker build -t plg-voice-web:latest ./client/
ok "Web client built"

# ---- Pull backend images ----
echo ""
info "Pulling backend Docker images..."
# Four services (web, api, events, bot) are built locally and exist in no
# registry. A plain `docker compose pull` tries to fetch them anyway and dies
# with "pull access denied", taking the whole install down with it.
# --ignore-buildable skips anything with a build context (compose >= 2.22);
# older versions get the blunter fallback.
if docker compose pull --ignore-buildable 2>/dev/null; then
  ok "Registry images pulled"
elif docker compose pull --ignore-pull-failures; then
  warn "Old docker compose — pulled with failures ignored"
  ok "Registry images pulled"
else
  error "Could not pull images. Check network access and \`docker login\` if using a private registry."
fi

# ---- Build the remaining local images ----
info "Building local service images (api, events, bot)..."
docker compose build api events bot
ok "Local images built"

# ---- Start ----
echo ""
info "Starting all services..."
docker compose up -d
ok "All services started"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           PLG Voice is running!                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  URL:        ${CYAN}https://$DOMAIN${NC}"
echo -e "  API:        ${CYAN}https://$DOMAIN/api${NC}"
echo ""
echo -e "  Check:      docker compose ps"
echo -e "  Logs:       docker compose logs -f"
echo ""
echo -e "${YELLOW}  IMPORTANT: Open these ports in your firewall:${NC}"
echo -e "    TCP: 80, 443, 7881"
echo -e "    UDP: 3478, 50000-50100"
echo ""
echo -e "  Secrets saved in: ${CYAN}.env${NC} (keep this file safe!)"
echo ""

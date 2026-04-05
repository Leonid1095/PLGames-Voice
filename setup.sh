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
command -v docker >/dev/null 2>&1 || error "Docker not installed. Install: https://docs.docker.com/engine/install/"
command -v docker compose >/dev/null 2>&1 || error "Docker Compose v2 not found."
command -v openssl >/dev/null 2>&1 || error "openssl not installed."

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      PLG Voice — Server Setup        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ---- Gather info ----
read -rp "Domain name (e.g. plgames-voice.ru): " DOMAIN
[ -z "$DOMAIN" ] && error "Domain is required"

EXTERNAL_IP=$(curl -4 -s --max-time 5 ifconfig.me || curl -4 -s --max-time 5 icanhazip.com || echo "")
read -rp "External IP [$EXTERNAL_IP]: " INPUT_IP
EXTERNAL_IP="${INPUT_IP:-$EXTERNAL_IP}"
[ -z "$EXTERNAL_IP" ] && error "Could not detect external IP. Provide manually."

info "Domain: $DOMAIN"
info "External IP: $EXTERNAL_IP"
echo ""

# ---- Generate secrets ----
info "Generating secrets..."
MONGO_PASS=$(openssl rand -base64 24 | tr -d '/+=')
RABBIT_PASS=$(openssl rand -base64 24 | tr -d '/+=')
MINIO_PASS=$(openssl rand -base64 24 | tr -d '/+=')
LIVEKIT_KEY=$(openssl rand -hex 6)
LIVEKIT_SECRET=$(openssl rand -hex 24)
VAPID_PRIVATE=$(openssl ecparam -genkey -name prime256v1 -noout 2>/dev/null | openssl ec 2>/dev/null | base64 -w0)
VAPID_PUBLIC=$(echo "$VAPID_PRIVATE" | base64 -d | openssl ec -pubout 2>/dev/null | base64 -w0)
FILES_KEY=$(openssl rand -base64 32)

ok "Secrets generated"

# ---- Write .env ----
if [ -f .env ]; then
  warn ".env already exists — backing up to .env.bak"
  cp .env .env.bak
fi

cat > .env <<EOF
# PLG Voice — Generated $(date +%Y-%m-%d)
PLG_VOICE_HOST=$DOMAIN

# MongoDB
MONGO_USER=plgadmin
MONGO_PASS=$MONGO_PASS

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
FILES_ENCRYPTION_KEY=$FILES_KEY
EOF
ok "Created .env"

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
      sudo chmod 644 data/livekit-certs/*.pem
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
info "Building web client Docker image..."
if [ -d "client" ]; then
  docker build -t plg-voice-web:latest ./client/
  ok "Web client built"
else
  error "client/ directory not found. Clone the full repo first."
fi

# ---- Pull backend images ----
echo ""
info "Pulling backend Docker images..."
docker compose pull
ok "All images pulled"

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

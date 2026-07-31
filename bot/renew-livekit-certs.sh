#!/bin/bash
# Копирует обновлённые Let's Encrypt сертификаты для LiveKit TURN
# Запускается через cron после certbot renew
set -euo pipefail

CERT_SRC="/etc/letsencrypt/live/plgames-voice.ru"
CERT_DST="/home/plg/PLGames-Voice/data/livekit-certs"

# Copy only what actually changed, then restart LiveKit solely when a cert was
# updated. The previous version restarted on every run and made privkey.pem
# world-readable (chmod 644 on the whole glob).
changed=0
for f in fullchain.pem privkey.pem; do
  if [ ! -f "$CERT_DST/$f" ] || ! cmp -s "$CERT_SRC/$f" "$CERT_DST/$f"; then
    cp "$CERT_SRC/$f" "$CERT_DST/$f"
    changed=1
  fi
done

if [ "$changed" -eq 1 ]; then
  chmod 644 "$CERT_DST/fullchain.pem"
  chmod 600 "$CERT_DST/privkey.pem"
  chown plg:plg "$CERT_DST"/*
  cd /home/plg/PLGames-Voice && docker compose restart livekit
fi

#!/bin/bash
# Копирует обновлённые Let's Encrypt сертификаты для LiveKit TURN
# Запускается через cron после certbot renew

CERT_SRC="/etc/letsencrypt/live/cvaboda.duckdns.org"
CERT_DST="/home/plg/PLGames-Voice/data/livekit-certs"

cp "$CERT_SRC/fullchain.pem" "$CERT_DST/fullchain.pem"
cp "$CERT_SRC/privkey.pem" "$CERT_DST/privkey.pem"
chmod 644 "$CERT_DST"/*
chown plg:plg "$CERT_DST"/*

cd /home/plg/PLGames-Voice && docker compose restart livekit

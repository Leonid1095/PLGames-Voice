#!/usr/bin/env bash
# PLG Voice — Automated Backup Script
# Usage: ./scripts/backup.sh
# Cron:  0 3 * * * /home/plg/PLGames-Voice/scripts/backup.sh >> /var/log/plg-backup.log 2>&1
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Load env vars
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

MONGO_USER="${MONGO_USER:-stoatadmin}"
MONGO_PASS="${MONGO_PASS:?MONGO_PASS not set}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# --- MongoDB backup ---
echo "[$(date)] Backing up MongoDB..."
docker compose -f "$PROJECT_DIR/compose.yml" exec -T database \
  mongodump \
    -u "$MONGO_USER" \
    -p "$MONGO_PASS" \
    --authenticationDatabase admin \
    --db revolt \
    --archive \
    --gzip \
  > "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"

MONGO_SIZE=$(du -sh "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz" | cut -f1)
echo "[$(date)] MongoDB backup complete: $MONGO_SIZE"

# --- MinIO data backup (rsync local copy) ---
echo "[$(date)] Backing up MinIO data..."
MINIO_BACKUP="$BACKUP_DIR/minio_${TIMESTAMP}"
mkdir -p "$MINIO_BACKUP"
rsync -a --quiet "$PROJECT_DIR/data/minio/" "$MINIO_BACKUP/"
MINIO_SIZE=$(du -sh "$MINIO_BACKUP" | cut -f1)
echo "[$(date)] MinIO backup complete: $MINIO_SIZE"

# --- Redis RDB snapshot ---
echo "[$(date)] Backing up Redis RDB..."
docker compose -f "$PROJECT_DIR/compose.yml" exec -T redis \
  redis-cli -a "${REDIS_PASSWORD:-}" --no-auth-warning BGSAVE > /dev/null 2>&1 || true
sleep 2
if docker compose -f "$PROJECT_DIR/compose.yml" cp redis:/data/dump.rdb "$BACKUP_DIR/redis_${TIMESTAMP}.rdb" 2>/dev/null; then
  echo "[$(date)] Redis backup complete"
else
  echo "[$(date)] Redis backup skipped (no RDB file)"
fi

# --- Cleanup old backups ---
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "mongo_*.archive.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "redis_*.rdb" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type d -name "minio_*" -mtime "+$RETENTION_DAYS" -exec rm -rf {} +

echo "[$(date)] Backup complete!"
echo "  MongoDB: $BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz ($MONGO_SIZE)"
echo "  MinIO:   $MINIO_BACKUP ($MINIO_SIZE)"
echo "  Redis:   $BACKUP_DIR/redis_${TIMESTAMP}.rdb"

#!/usr/bin/env bash
# PLG Voice — Automated Backup Script
# Usage: ./scripts/backup.sh
# Cron:  0 3 * * * /home/plg/PLGames-Voice/scripts/backup.sh >> /var/log/plg-backup.log 2>&1
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
# 60 days, not 14: the retention sweep below was a silent no-op from 2026-06-03
# (when `backups` became a symlink) until 2026-07-24, so ~2 months of history
# accumulated. It is worth keeping — 278MB against 417GB free — and 60 days
# still bounds the growth.
RETENTION_DAYS="${RETENTION_DAYS:-60}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Load env vars
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

MONGO_USER="${MONGO_USER:-plgadmin}"
MONGO_PASS="${MONGO_PASS:?MONGO_PASS not set}"

# --- Preflight: refuse to run unless the backup disk is actually there ---
# `backups` is a symlink onto the external disk (/mnt/hdd/...). When that disk
# is not mounted the symlink dangles: `mkdir -p` dies with a cryptic
# "File exists" and the whole run aborts having written nothing — which is how
# 2026-07-24 silently produced no backup. Fail early and say why.
if [ -L "$BACKUP_DIR" ] && [ ! -e "$BACKUP_DIR" ]; then
  echo "[$(date)] FATAL: $BACKUP_DIR is a dangling symlink -> $(readlink "$BACKUP_DIR")" >&2
  echo "[$(date)] The backup disk is probably not mounted. Try: sudo mount /mnt/hdd" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# Resolve through the symlink. Two reasons: `find` refuses to descend into a
# symlink given without a trailing slash (which silently no-op'd the retention
# sweep below for months), and `df` needs the real path to identify the disk.
BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd -P)"

# Set BACKUP_REQUIRE_MOUNT=0 to allow backing up onto the root disk.
if [ "${BACKUP_REQUIRE_MOUNT:-1}" = "1" ]; then
  BACKUP_FS="$(df -P "$BACKUP_DIR" | awk 'NR==2 {print $6}')"
  if [ "$BACKUP_FS" = "/" ]; then
    echo "[$(date)] FATAL: $BACKUP_DIR is on the root filesystem, not the backup disk." >&2
    echo "[$(date)] Mount it (sudo mount /mnt/hdd) or set BACKUP_REQUIRE_MOUNT=0 to override." >&2
    exit 1
  fi
fi

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
# `rsync -a` stamps the destination with the SOURCE directory's mtime, so a
# backup made today can look months old to the `-mtime` sweep below and get
# deleted on its first night. Re-stamp it with the actual backup time.
touch "$MINIO_BACKUP"
MINIO_SIZE=$(du -sh "$MINIO_BACKUP" | cut -f1)
echo "[$(date)] MinIO backup complete: $MINIO_SIZE"

# --- App data dirs (rsync local copy) ---
# bot        — persistent bot settings (XP, moderation, tournaments, triggers)
# recordings — egress stream recordings
# ./data/rabbit is intentionally NOT backed up: it is RabbitMQ mnesia broker
# state (transient queue data); a live copy is inconsistent and restoring a
# broker's on-disk state is rarely useful.
for dir in bot recordings; do
  SRC="$PROJECT_DIR/data/$dir"
  [ -d "$SRC" ] || continue
  echo "[$(date)] Backing up $dir data..."
  DEST="$BACKUP_DIR/${dir}_${TIMESTAMP}"
  mkdir -p "$DEST"
  rsync -a --quiet "$SRC/" "$DEST/"
  touch "$DEST"  # see the note on MINIO_BACKUP above
  echo "[$(date)] $dir backup complete: $(du -sh "$DEST" | cut -f1)"
done

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
find "$BACKUP_DIR" -maxdepth 1 -type d -name "bot_*" -mtime "+$RETENTION_DAYS" -exec rm -rf {} +
find "$BACKUP_DIR" -maxdepth 1 -type d -name "recordings_*" -mtime "+$RETENTION_DAYS" -exec rm -rf {} +

echo "[$(date)] Backup complete!"
echo "  MongoDB: $BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz ($MONGO_SIZE)"
echo "  MinIO:   $MINIO_BACKUP ($MINIO_SIZE)"
echo "  Redis:   $BACKUP_DIR/redis_${TIMESTAMP}.rdb"

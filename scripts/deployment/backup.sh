#!/usr/bin/env bash
#
# Learning Platform — production backup (M6).
#
# Produces:
#   - A gzipped pg_dump of the production database.
#   - A MinIO mc mirror of the object-storage bucket.
#   - A manifest file listing both artifacts + a sha256.
#
# Retention: 30 days (per SYSTEM_ARCHITECTURE.md §9). Older backups are pruned.
# Runs unattended; designed for a daily cron entry (see DEPLOYMENT_GUIDE.md).
#
# Env (read from /etc/learning-platform/env or the environment):
#   POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD
#   MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, S3_BUCKET
#
# Usage:
#   scripts/deployment/backup.sh [--dest /var/backups/learning-platform]
#
set -euo pipefail

DEST="${BACKUP_DEST:-/var/backups/learning-platform}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-/etc/learning-platform/env}"

# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a

: "${POSTGRES_USER:?POSTGRES_USER must be set}"
: "${POSTGRES_DB:?POSTGRES_DB must be set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"
: "${S3_BUCKET:?S3_BUCKET must be set}"

mkdir -p "$DEST"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
DIR="$DEST/$TS"
mkdir -p "$DIR"

echo "[backup] $TS -> $DIR"

# --- 1. Postgres dump (from the host via the published 127.0.0.1:5432 port) ---
echo "[backup] pg_dump ..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "$DIR/postgres.sql.gz"

# --- 2. MinIO bucket mirror ---
echo "[backup] minio mirror ..."
mc alias set lp-backup "http://127.0.0.1:9000" \
  "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1 || true
mc mirror --overwrite "lp-backup/$S3_BUCKET" "$DIR/minio/"

# --- 3. Manifest + sha256 ---
{
  echo "backup_ts=$TS"
  echo "postgres_sql_gz_sha256=$(sha256sum "$DIR/postgres.sql.gz" | awk '{print $1}')"
  echo "minio_dir=$(du -sh "$DIR/minio" 2>/dev/null | awk '{print $1}')"
  echo "host=$(hostname)"
  echo "tool=scripts/deployment/backup.sh"
} > "$DIR/MANIFEST"

echo "[backup] manifest:"
cat "$DIR/MANIFEST"

# --- 4. Retention: prune backups older than 30 days ---
echo "[backup] pruning backups older than 30 days ..."
find "$DEST" -maxdepth 1 -type d -mtime +32 -exec rm -rf {} \; || true

echo "[backup] DONE: $DIR"

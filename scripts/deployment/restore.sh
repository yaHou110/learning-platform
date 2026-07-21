#!/usr/bin/env bash
#
# Learning Platform — production restore (M6).
#
# Restores from a backup directory produced by scripts/deployment/backup.sh.
# Idempotent: running against an already-restored state is safe.
#
# Usage:
#   scripts/deployment/restore.sh /var/backups/learning-platform/20260720T120000Z
#   scripts/deployment/restore.sh --latest
#
# Env (read from /etc/learning-platform/env or the environment):
#   POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD
#   MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, S3_BUCKET
#
set -euo pipefail

BACKUP_DIR="${1:-}"
ENV_FILE="${ENV_FILE:-/etc/learning-platform/env}"

# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a

: "${POSTGRES_USER:?POSTGRES_USER must be set}"
: "${POSTGRES_DB:?POSTGRES_DB must be set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"
: "${S3_BUCKET:?S3_BUCKET must be set}"

if [ "$BACKUP_DIR" = "--latest" ]; then
  BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/learning-platform}"
  BACKUP_DIR=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "2*" | sort | tail -1)
  [ -z "$BACKUP_DIR" ] && { echo "[restore] no backup found"; exit 1; }
fi

[ -d "$BACKUP_DIR" ] || { echo "[restore] backup dir not found: $BACKUP_DIR"; exit 1; }
[ -f "$BACKUP_DIR/MANIFEST" ] || { echo "[restore] manifest missing"; exit 1; }

echo "[restore] restoring from $BACKUP_DIR"

# --- Verify manifest integrity ---
echo "[restore] verifying manifest ..."
MANIFEST_SHA=$(grep '^postgres_sql_gz_sha256=' "$BACKUP_DIR/MANIFEST" | cut -d= -f2)
ACTUAL_SHA=$(sha256sum "$BACKUP_DIR/postgres.sql.gz" | awk '{print $1}')
[ "$MANIFEST_SHA" = "$ACTUAL_SHA" ] || { echo "[restore] sha256 mismatch"; exit 1; }

# --- 1. Restore Postgres (drop + recreate DB, then pg_restore) ---
echo "[restore] restoring Postgres ..."
# Terminate existing connections
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();
" >/dev/null 2>&1 || true

PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d postgres -c "
  DROP DATABASE IF EXISTS \"$POSTGRES_DB\";
  CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";
" >/dev/null

gunzip -c "$BACKUP_DIR/postgres.sql.gz" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null

# --- 2. Restore MinIO bucket (overwrite) ---
echo "[restore] restoring MinIO bucket ..."
mc alias set lp-backup "http://127.0.0.1:9000" \
  "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1 || true
mc mirror --overwrite "$BACKUP_DIR/minio/" "lp-backup/$S3_BUCKET"

echo "[restore] DONE: restored from $BACKUP_DIR"
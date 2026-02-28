#!/usr/bin/env bash
# BI Platform — Daily PostgreSQL backup with 30-day rotation
# Schedule: add to crontab → 0 3 * * * /path/to/backup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Load environment variables if .env is present
ENV_FILE="${SCRIPT_DIR}/../.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

# Required variables
POSTGRES_DB="${POSTGRES_DB:?POSTGRES_DB is not set}"
POSTGRES_USER="${POSTGRES_USER:?POSTGRES_USER is not set}"
POSTGRES_HOST="${POSTGRES_HOST:-postgresql}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set}"

BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of database: ${POSTGRES_DB}"

# Run pg_dump via Docker (adjust container name if needed)
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  --format=plain \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

if [[ $? -eq 0 ]]; then
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup successful: ${BACKUP_FILE} (${SIZE})"
else
  echo "[$(date)] ERROR: Backup failed!" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Rotate: delete backups older than RETENTION_DAYS
echo "[$(date)] Rotating backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
echo "[$(date)] Rotation complete. Backups retained: ${REMAINING}"

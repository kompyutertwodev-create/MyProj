#!/bin/bash

# Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-identity_platform}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup at $(date)"

# Create backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
  echo "ERROR: Backup file was not created"
  exit 1
fi

# Upload to S3 if AWS credentials are available
if [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ] && [ -n "${AWS_S3_BUCKET}" ]; then
  echo "Uploading backup to S3..."
  aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/database-backups/db_backup_${TIMESTAMP}.sql.gz"
  echo "Backup uploaded to S3 successfully"
fi

# Clean up old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Clean up old S3 backups
if [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ] && [ -n "${AWS_S3_BUCKET}" ]; then
  aws s3 ls "s3://${AWS_S3_BUCKET}/database-backups/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    FILE_TIMESTAMP=$(date -d "$FILE_DATE" +%s 2>/dev/null || echo "0")
    CURRENT_TIMESTAMP=$(date +%s)
    AGE_DAYS=$(( (CURRENT_TIMESTAMP - FILE_TIMESTAMP) / 86400 ))
    
    if [ $AGE_DAYS -gt $RETENTION_DAYS ]; then
      aws s3 rm "s3://${AWS_S3_BUCKET}/database-backups/${FILE_NAME}"
      echo "Deleted old S3 backup: ${FILE_NAME}"
    fi
  done
fi

echo "Database backup completed at $(date)"

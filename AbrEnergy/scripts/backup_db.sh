#!/bin/sh
set -e

BACKUP_DIR="/app/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

echo "Starting database backup: $DATE"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
echo "Backup completed: backup_$DATE.sql.gz"

find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "Old backups cleaned"

#!/bin/sh
set -e

BACKUP_DIR="/app/backups/media"
DATE=$(date +%Y%m%d_%H%M%S)
MEDIA_DIR="/app/media"
KEEP_DAYS=30

echo "Starting media backup: $DATE"
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" -C /app media/
echo "Media backup completed: media_$DATE.tar.gz"

find $BACKUP_DIR -name "media_*.tar.gz" -mtime +$KEEP_DAYS -delete
echo "Old media backups cleaned"

#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser if needed..."
python manage.py shell -c "
from apps.users.models import User
from apps.users.choices import UserRole
if not User.objects.filter(role=UserRole.SUPER_ADMIN).exists():
    User.objects.create_superuser(
        email='admin@abrenv.com',
        password='admin123456',
        full_name='Admin',
        role=UserRole.SUPER_ADMIN,
    )
    print('Superuser created')
else:
    print('Superuser already exists')
" 2>/dev/null || echo "Could not create superuser"

echo "Starting development server..."
exec "$@"

# AbrEnergy — Backend API

Professional solar energy company backend. Django REST API, production-ready.

## Tech Stack

- Python 3.12 / Django 5.x / DRF
- PostgreSQL 16 / Redis / Celery
- Docker / Nginx / Gunicorn
- JWT Auth / Swagger / drf-spectacular

## Quick Start (Docker)

```bash
# Copy env
cp .env.example .env

# Build & run
docker compose up --build

# Create superuser
docker compose exec django python manage.py createsuperuser

# Open
# API:  http://localhost:8000/api/v1/
# Admin: http://localhost:8000/admin/
# Docs:  http://localhost:8000/api/docs/
```

## Manual Setup

```bash
# Virtual env
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install
pip install -r requirements/dev.txt

# Database (PostgreSQL must be running)
createdb abrenv_db

# Migrate
python manage.py migrate

# Run
python manage.py runserver
```

## Project Structure

```
AbrEnergy/
├── apps/
│   ├── users/          # Auth, roles, profiles
│   ├── core/           # SiteSettings, ActivityLog, Dashboard
│   ├── media_manager/  # Reusable media files
│   ├── articles/       # CMS — Category, Tag, Article
│   ├── services/       # Service categories & services
│   ├── projects/       # Project portfolio
│   ├── calculator/     # Solar off-grid calculator
│   ├── contacts/       # Contact forms, project inquiries
│   ├── gallery/        # Image gallery
│   └── notifications/  # In-app notifications
├── config/             # Django settings (base/dev/prod/test)
├── docker/             # Dockerfile, nginx config
└── scripts/            # Entrypoint, backup scripts
```

## API Endpoints

| Group | Endpoints |
|---|---|
| Auth | `/api/v1/auth/register/`, `/auth/login/`, `/auth/logout/`, `/auth/refresh/` |
| Users | `/api/v1/users/me/` |
| Articles | `/api/v1/articles/`, `/articles/{slug}/` |
| Services | `/api/v1/services/`, `/services/{slug}/` |
| Projects | `/api/v1/projects/`, `/projects/{slug}/` |
| Calculator | `/api/v1/calculator/off-grid/` |
| Contact | `/api/v1/contact/`, `/api/v1/project-inquiry/` |
| Gallery | `/api/v1/gallery/` |
| Media | `/api/v1/media/upload/` |
| Notifications | `/api/v1/notifications/` |
| Site Config | `/api/v1/site-config/` |
| Dashboard | `/api/v1/admin/dashboard/stats/` |
| Activity Log | `/api/v1/admin/activity-log/` |

## API Docs

- Swagger: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Schema: `http://localhost:8000/api/schema/`

## Roles & Permissions

| Role | Level |
|---|---|
| Super Admin | Full access, user management, logs |
| Website Admin | All content management, contacts |
| Content Manager | Articles, gallery |
| Engineer | Projects, inquiries, calculator |
| Customer | Own profile, read-only public |

## Environment Variables

See `.env.example` for all config options.

## Production Deployment

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Requires: `DJANGO_SETTINGS_MODULE=config.settings.production`, valid SECRET_KEY, Sentry DSN.

## Running Tests

```bash
# With pytest
pytest

# With coverage
pytest --cov=apps --cov-report=term-missing

# Specific app
pytest apps/calculator/tests/
```

## Backup

```bash
# Database
./scripts/backup_db.sh

# Media
./scripts/backup_media.sh
```

## Celery Tasks

```bash
# Worker
celery -A config worker -l info

# Beat scheduler
celery -A config beat -l info
```

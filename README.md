# AbrEnergy — Full-Stack Solar Energy Platform

A production-ready renewable energy company platform built with **Django REST API** and **Next.js 15**.

## Screenshots

<!-- Add screenshots here -->

## Architecture

```
abar/
├── AbrEnergy/              # Django Backend (Python)
│   ├── apps/
│   │   ├── users/          # Auth, JWT, roles, profiles
│   │   ├── core/           # SiteSettings, ActivityLog, Dashboard
│   │   ├── media_manager/  # Reusable media files (images/docs/videos)
│   │   ├── articles/       # CMS articles with translations
│   │   ├── services/       # Solar service management
│   │   ├── projects/       # Project portfolio
│   │   ├── calculator/     # Off-grid solar sizing engine
│   │   ├── contacts/       # Contact forms, project inquiries
│   │   ├── gallery/        # Image gallery with categories
│   │   └── notifications/  # In-app notification system
│   ├── config/
│   │   ├── settings/       # base, dev, production, test, local
│   │   ├── urls.py         # API v1 routing
│   │   ├── wsgi.py         # WSGI entry point
│   │   ├── asgi.py         # ASGI entry point
│   │   └── celery.py       # Celery task queue
│   ├── docker/             # Dockerfile, nginx config
│   ├── scripts/            # entrypoint, backup scripts
│   └── requirements/       # Python dependencies
│
├── abr-energy-frontend/    # Next.js Frontend (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/   # Locale-based routing (fa/ar/en)
│   │   │       ├── (public)/   # Home, About, Services, Projects, etc.
│   │   │       ├── (auth)/     # Login, Register, Forgot Password
│   │   │       ├── dashboard/  # User dashboard, profile, notifications
│   │   │       └── admin/      # Admin panel (users, articles, services, etc.)
│   │   ├── components/
│   │   │   ├── layout/     # Header, Footer
│   │   │   ├── shared/     # LoadingSkeleton, EmptyState, ErrorState, DataTable, PageHeader
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── api/            # Axios client with JWT interceptors
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── stores/         # Zustand auth store
│   │   ├── i18n/           # Internationalization (locale context, translations)
│   │   └── types/          # TypeScript definitions
│   └── locales/            # Translation JSON files (fa, ar, en)
│
├── locales/                # UI translation files
├── README.md               # English
├── README.fa.md            # Persian
├── README.ar.md            # Arabic
└── .gitignore
```

## Features

### Frontend
- **Next.js 15** — App Router, server/dynamic components
- **TypeScript** — strict mode throughout
- **TailwindCSS v4** — utility-first with custom design tokens
- **shadcn/ui** — accessible, reusable component library
- **Multilingual** — Persian (fa-RTL), Arabic (ar-RTL), English (en-LTR)
- **i18n routing** — `/{locale}/...` URL structure
- **JWT Auth** — access/refresh token flow with auto-rotation
- **TanStack Query** — server state, caching, invalidation
- **Zustand** — lightweight client state
- **React Hook Form + Zod** — type-safe form validation
- **Dark Mode** — system-aware theme switching
- **Responsive** — mobile, tablet, desktop

### Backend
- **Django 5.x** — production Python web framework
- **Django REST Framework** — robust API
- **JWT** — simplejwt with token blacklisting
- **RBAC** — 5 roles: super_admin, website_admin, content_manager, engineer, customer
- **Multilingual CMS** — ArticleTranslation, ServiceTranslation, ProjectTranslation models
- **Media Manager** — reusable file system with image optimization
- **Activity Log** — comprehensive audit trail
- **Solar Calculator** — off-grid system sizing engine
- **Celery** — async task queue
- **PostgreSQL** — production database
- **Docker** — multi-service containerization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| State | TanStack Query, Zustand |
| Forms | React Hook Form, Zod |
| Backend | Django 5.x, DRF |
| Database | PostgreSQL 16 (SQLite for dev) |
| Cache | Redis |
| Task Queue | Celery |
| Auth | JWT access/refresh |
| Containerization | Docker, docker-compose |
| Web Server | Nginx, Gunicorn |

## Installation

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 16+ (optional, SQLite works for dev) |

### Backend Setup (Windows)

```powershell
cd AbrEnergy

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Configure environment
copy .env.example .env
# Edit .env if needed (defaults work for local SQLite)

# Run migrations
python manage.py migrate

# Seed demo data
python manage.py seed_data --force

# Start server
python manage.py runserver

# Backend runs at: http://localhost:8000
# Admin panel: http://localhost:8000/admin/
```

### Frontend Setup (Windows)

```powershell
cd abr-energy-frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env

# Start dev server
npm run dev

# Frontend runs at: http://localhost:3000
```

## Environment Variables

### Backend `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `insecure-dev-key-change-in-production` |
| `DEBUG` | Debug mode | `True` |
| `DJANGO_SETTINGS_MODULE` | Settings module | `config.settings.local` |
| `DB_NAME` | Database name | `abrenv_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery broker | `redis://localhost:6379/1` |
| `CELERY_RESULT_BACKEND` | Celery results | `redis://localhost:6379/2` |
| `SITE_URL` | Site URL | `http://localhost:8000` |

### Frontend `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |

## Database

Development uses SQLite automatically with `config.settings.local`.

For PostgreSQL: set `DJANGO_SETTINGS_MODULE=config.settings.dev` and configure `.env` database variables.

```powershell
# Create database
createdb abrenv_db

# Run migrations
python manage.py migrate

# Seed demo data
python manage.py seed_data --force
```

## Default Users

After running `seed_data`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@abrenv.com` | `admin123456` |
| Content Manager | `content@abrenv.com` | `content123456` |
| Customer | `customer@abrenv.com` | `customer123456` |

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register/` | POST | Register new user |
| `/api/v1/auth/login/` | POST | Login (returns JWT) |
| `/api/v1/auth/logout/` | POST | Logout (blacklist token) |
| `/api/v1/auth/refresh/` | POST | Refresh access token |
| `/api/v1/auth/password-change/` | POST | Change password |
| `/api/v1/auth/password-reset/` | POST | Request password reset |
| `/api/v1/users/me/` | GET/PATCH | Get/update current user |

### Content (Public)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/articles/` | GET | List articles |
| `/api/v1/articles/{slug}/` | GET | Article detail |
| `/api/v1/services/` | GET | List services |
| `/api/v1/services/{slug}/` | GET | Service detail |
| `/api/v1/projects/` | GET | List projects |
| `/api/v1/projects/{slug}/` | GET | Project detail |
| `/api/v1/projects/featured/` | GET | Featured projects |
| `/api/v1/gallery/` | GET | Gallery images |
| `/api/v1/calculator/off-grid/` | POST | Solar calculation |
| `/api/v1/contact/` | POST | Contact form |
| `/api/v1/project-inquiry/` | POST | Project inquiry |
| `/api/v1/site-config/` | GET | Site settings |

### Admin (Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/dashboard/stats/` | GET | Dashboard stats |
| `/api/v1/admin/users/` | GET | List users |
| `/api/v1/admin/contact-requests/` | GET | Contact requests |
| `/api/v1/admin/project-inquiries/` | GET | Project inquiries |
| `/api/v1/admin/activity-log/` | GET | Activity log |
| `/api/v1/admin/articles/` | GET/POST | Articles CRUD |
| `/api/v1/admin/services/` | GET/POST | Services CRUD |
| `/api/v1/admin/projects/` | GET/POST | Projects CRUD |

### Language Support

All public content endpoints accept language via:
- `Accept-Language` header: `fa`, `ar`, `en`
- Query parameter: `?lang=fa`

## Authentication System

- **JWT tokens**: Access token (15min) + Refresh token (7 days)
- **Token rotation**: Refresh tokens are rotated automatically
- **Blacklisting**: Logout invalidates tokens server-side
- **Axios interceptor**: Automatically refreshes expired tokens
- **Auth store**: Zustand store persists tokens in localStorage

## Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access, user management, system settings, logs |
| **Website Admin** | All content management, contacts, settings |
| **Content Manager** | Articles, services, projects, gallery |
| **Engineer** | Projects, inquiries, calculator |
| **Customer** | Own profile, read public content |

## Multilingual CMS

The platform supports **3 languages**:

| Language | Code | Direction |
|----------|------|-----------|
| فارسی (Persian) | `fa` | RTL |
| العربية (Arabic) | `ar` | RTL |
| English | `en` | LTR |

### Content Translation Architecture

Backend uses **separate translation models**:

```
Article → ArticleTranslation (language: fa/ar/en, title, slug, content, SEO)
Service → ServiceTranslation (language, title, description)
Project → ProjectTranslation (language, title, description)
```

### Frontend i18n

- URL-based routing: `/{locale}/articles/...`
- UI texts stored in `/locales/{lang}.json`
- Language switcher in header and footer
- RTL/LTR CSS handled automatically

## Admin Panel Usage

Access: `http://localhost:8000/{locale}/admin`

### Managing Articles

1. Navigate to **Articles**
2. Click **Create Article**
3. Fill in language tabs: فارسی → العربية → English
4. Set status, category, tags
5. Save

### Managing Projects

1. Navigate to **Projects**
2. Click **Create Project**
3. Fill multilingual descriptions
4. Set technical details (capacity, type, location)
5. Save

### Managing Services

1. Navigate to **Services**
2. Click **Create Service**
3. Fill multilingual content
4. Set features, icon, category
5. Save

## Deployment

### Docker (Production)

```bash
# Backend
cd AbrEnergy
docker compose -f docker-compose.prod.yml up --build -d

# Frontend
cd abr-energy-frontend
npm run build
npm start
```

### Manual Production Backend

```bash
cd AbrEnergy
set DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Manual Production Frontend

```bash
cd abr-energy-frontend
npm run build
npm start
```

## Testing

```bash
# Backend
cd AbrEnergy
python manage.py test

# Frontend
cd abr-energy-frontend
npm run lint
npm run build
```

## License

Private — All rights reserved.

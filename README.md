# AbrEnergy — Full-Stack Solar Energy Platform

A production-ready renewable energy company platform built with Django REST API and Next.js.

## Features

### Frontend
- **Next.js 15** — App Router, server components, dynamic rendering
- **TypeScript** — strict mode throughout
- **TailwindCSS v4** — utility-first styling with custom design tokens
- **shadcn/ui** — accessible, reusable component library
- **Multilingual** — Persian (fa-RTL), Arabic (ar-RTL), English (en-LTR)
- **i18n** — URL-based locale routing, JSON translation files
- **JWT Auth** — access/refresh token flow with automatic rotation
- **TanStack Query** — server state management, caching, invalidation
- **Zustand** — lightweight client state (auth)
- **React Hook Form + Zod** — type-safe form validation
- **Responsive** — mobile, tablet, desktop breakpoints
- **Dark Mode** — system-aware theme switching

### Backend
- **Django 5.x** — production-ready Python web framework
- **Django REST Framework** — robust API layer
- **JWT Authentication** — simplejwt with token blacklisting
- **RBAC** — 5 user roles: super_admin, website_admin, content_manager, engineer, customer
- **CMS** — Articles, Services, Projects, Gallery, Contacts
- **Media Manager** — reusable file system with image optimization
- **Activity Log** — comprehensive audit trail
- **Calculator** — off-grid solar system sizing engine
- **Notifications** — in-app notification system
- **Celery** — async task queue
- **PostgreSQL** — production database
- **Redis** — caching and message broker
- **Docker** — multi-service containerization

## Architecture

```
abar/
├── AbrEnergy/              # Django Backend
│   ├── apps/
│   │   ├── users/          # Auth, roles, profiles
│   │   ├── core/           # SiteSettings, ActivityLog, Dashboard
│   │   ├── media_manager/  # Reusable media files
│   │   ├── articles/       # CMS articles, categories, tags
│   │   ├── services/       # Service management
│   │   ├── projects/       # Project portfolio
│   │   ├── calculator/     # Solar off-grid calculator
│   │   ├── contacts/       # Contact forms, project inquiries
│   │   ├── gallery/        # Image gallery
│   │   └── notifications/  # In-app notifications
│   ├── config/             # Django settings (base/dev/prod/test/local)
│   └── docker/             # Dockerfile, nginx config
│
├── abr-energy-frontend/    # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   └── [locale]/   # Locale-based routing (fa/ar/en)
│   │   ├── components/     # Reusable components
│   │   │   ├── layout/     # Header, Footer
│   │   │   ├── shared/     # Loading, States, DataTable, PageHeader
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── api/            # Axios client with interceptors
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── i18n/           # Internationalization
│   │   └── types/          # TypeScript definitions
│   ├── locales/            # Translation JSON files
│   └── public/             # Static assets
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| State | TanStack Query, Zustand |
| Forms | React Hook Form, Zod |
| Styling | TailwindCSS, CSS variables, design tokens |
| Backend | Django 5.x, DRF |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Task Queue | Celery |
| Auth | JWT (access/refresh tokens) |
| Containerization | Docker, docker-compose |
| Web Server | Nginx, Gunicorn |

## Installation

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16 (or SQLite for local dev)
- Redis (optional, for Celery)

### Backend Setup

```bash
cd AbrEnergy
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt

# Database
python manage.py migrate
python manage.py seed_data --force
python manage.py runserver
```

### Frontend Setup

```bash
cd abr-energy-frontend
cp .env.example .env
npm install
npm run dev
```

### Docker Setup

```bash
docker compose up --build
```

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | (required) |
| `DEBUG` | Debug mode | `True` |
| `DB_NAME` | Database name | `abrenv_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |

## Languages

The platform supports three languages with full RTL/LTR support:

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| فارسی (Persian) | `fa` | RTL | Default |
| العربية (Arabic) | `ar` | RTL | Supported |
| English | `en` | LTR | Supported |

URL structure: `/{locale}/articles/solar-energy`

## API Endpoints

| Group | Base Path | Auth |
|-------|-----------|------|
| Auth | `/api/v1/auth/` | Public |
| Users | `/api/v1/users/` | Mixed |
| Articles | `/api/v1/articles/` | Public read, Admin write |
| Services | `/api/v1/services/` | Public |
| Projects | `/api/v1/projects/` | Public |
| Calculator | `/api/v1/calculator/` | Public |
| Contact | `/api/v1/contact/` | Public |
| Gallery | `/api/v1/gallery/` | Public |
| Notifications | `/api/v1/notifications/` | Authenticated |
| Admin | `/api/v1/admin/` | Admin only |
| Site Config | `/api/v1/site-config/` | Public |

## CMS Usage

### Creating Articles (Admin)
1. Navigate to `/admin/articles`
2. Click "Create Article"
3. Enter general info: status, category, tags, publish date
4. Fill content in each language tab (Persian, Arabic, English)
5. Upload cover image
6. Set per-language SEO metadata
7. Save

### Managing Projects
1. Navigate to `/admin/projects`
2. Click "Create Project"
3. Enter technical details: type, capacity, location, status
4. Fill multilingual descriptions
5. Upload project images

### Gallery Management
1. Navigate to `/admin/gallery`
2. Upload images with per-language titles and descriptions
3. Organize by category

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

## Deployment

### Production Backend
```bash
cd AbrEnergy
docker compose -f docker-compose.prod.yml up --build -d
```

### Production Frontend
```bash
cd abr-energy-frontend
npm run build
npm start
```

## Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@abrenv.com` | `admin123456` |
| Content Manager | `content@abrenv.com` | `content123456` |
| Customer | `customer@abrenv.com` | `customer123456` |

## License

Private — All rights reserved.

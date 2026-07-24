<div align="center">
  <br />
  <h1>⚡ AbrEnergy</h1>
  <p><strong>Production-Grade Solar Energy Platform</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15.5-000000?style=flat-square&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Django-5.0-092E20?style=flat-square&logo=django" alt="Django 5" />
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL 16" />
    <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
    <img src="https://img.shields.io/badge/version-0.2.0-blue?style=flat-square" alt="Version 0.2.0" />
  </p>
  <br />
</div>

A full‑stack, production‑ready renewable energy company platform built with **Django REST API** and **Next.js 15**.  
It features a multilingual CMS (Persian / Arabic / English), JWT authentication, role‑based access control, a 3D cinematic homepage, and a premium glassmorphism design system.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Default Users](#-default-users)
- [Environment Variables](#-environment-variables)
- [Localization](#-localization)
- [CMS – Multilingual Content](#-cms--multilingual-content)
- [Authentication & Roles](#-authentication--roles)
- [API Overview](#-api-overview)
- [Performance](#-performance)
- [Motion Design System](#-motion-design-system)
- [Deployment](#-deployment)
- [Development](#-development)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits](#-credits)

---

## 📖 Overview

**AbrEnergy** is a complete web platform for a solar energy company. It serves both **public visitors** (homepage, services, projects, articles, calculator, gallery) and **internal staff** (admin panel with full CRUD for all content types).

### Target Audience

| Role | Access |
|------|--------|
| **Public visitors** | Browse services, projects, articles; use the solar calculator; submit contact requests |
| **Customers** | Dashboard with profile, notifications, calculation history |
| **Content managers** | Create & edit articles, services, projects via the admin panel |
| **Admins** | Full control over users, content, site settings, activity logs |

### Main Capabilities

- **3D Cinematic Hero** – Three.js / React Three Fiber solar scene with mouse parallax
- **Multilingual** – Persian (RTL), Arabic (RTL), English (LTR) with URL‑based routing
- **CMS** – Full CRUD for articles, projects, services with per‑language translations
- **Solar Calculator** – Off‑grid system sizing engine (panel count, battery, inverter, ROI)
- **JWT Authentication** – Access / refresh token flow with auto‑rotation
- **Premium UI** – Glassmorphism, spring animations, cursor glow, particle system, gradient mesh
- **Admin Dashboard** – Stats, users, activity log, inline content management

---

## ✨ Features

### Frontend

| Feature | Details |
|---------|---------|
| **Next.js 15** | App Router, server components, dynamic rendering |
| **TypeScript** | Strict mode, full type safety |
| **Responsive UI** | Mobile / tablet / desktop breakpoints |
| **Three.js Hero** | 3D solar scene with `@react-three/fiber` |
| **Premium animations** | Framer Motion spring physics, cursor glow, particles, ripple effects |
| **Glassmorphism** | `backdrop‑blur` cards, specular reflections, gradient borders |
| **Multi‑language UI** | Persian, Arabic, English with JSON translation files |
| **RTL / LTR** | Automatic direction switching, logical CSS properties |
| **Admin dashboard** | Content management, user management, activity logs |
| **Dark mode** | System‑aware theme switching |

### Backend

| Feature | Details |
|---------|---------|
| **Django 5.x** | Production Python web framework |
| **Django REST Framework** | Robust API layer |
| **JWT Authentication** | `djangorestframework‑simplejwt` with token blacklisting |
| **Custom User Model** | UUID primary keys, email‑based login |
| **Role‑Based Access** | 5 roles: super_admin, website_admin, content_manager, engineer, customer |
| **REST API** | Full versioned API at `/api/v1/` |
| **Activity Log** | Comprehensive audit trail (user, action, model, changes, IP) |
| **Celery** | Async task queue for background jobs |
| **PostgreSQL** | Primary database (SQLite for local development) |

### CMS (Content Management System)

| Content | Multilingual | Features |
|---------|-------------|----------|
| **Articles** | ✅ fa / ar / en | Rich text, cover image, categories, tags, SEO, scheduling |
| **Projects** | ✅ fa / ar / en | Gallery images, capacity, location, type, status |
| **Services** | ✅ fa / ar / en | Features list, category, ordering, icon |
| **Gallery** | ✅ category titles | Image categories, per‑language descriptions |
| **Media** | – | Reusable file system, image compression, thumbnails |

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.6 |
| **Styling** | TailwindCSS v4 |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **State Management** | TanStack Query (server), Zustand (client) |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | Axios with JWT interceptors |
| **Animation** | Framer Motion 11 |
| **3D Graphics** | Three.js, @react-three/fiber, @react-three/drei |
| **Icons** | Lucide React |
| **Backend Framework** | Django 5.0 |
| **API** | Django REST Framework 3.17 |
| **Auth** | djangorestframework-simplejwt |
| **Database** | PostgreSQL 16 (SQLite for dev) |
| **Cache / Queue** | Redis, Celery |
| **Task Queue** | Celery 5.4 |
| **Containers** | Docker, docker‑compose |
| **Web Server** | Nginx, Gunicorn |
| **Rich Text** | TipTap Editor |

---

## 📁 Project Structure

```
abar/
├── AbrEnergy/                          # Django Backend
│   ├── apps/
│   │   ├── users/                      # Custom User, JWT, roles
│   │   ├── core/                       # SiteSettings, ActivityLog, Dashboard stats
│   │   ├── media_manager/              # MediaFile upload, thumbnails, validation
│   │   ├── articles/                   # Article + ArticleTranslation models
│   │   ├── services/                   # Service + ServiceTranslation models
│   │   ├── projects/                   # Project + ProjectTranslation models
│   │   ├── calculator/                 # Off‑grid solar calculation engine
│   │   ├── contacts/                   # ContactRequest, ProjectInquiry
│   │   ├── gallery/                    # GalleryCategory + GalleryCategoryTranslation
│   │   └── notifications/              # In‑app notification system
│   ├── config/
│   │   └── settings/                   # base, dev, production, test, local
│   ├── docker/                         # Dockerfile, nginx.conf
│   └── scripts/                        # entrypoint, backup scripts
│
├── abr-energy-frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/               # URL‑based locale routing
│   │   │       ├── (public)/           # Home, About, Services, Projects, etc.
│   │   │       ├── (auth)/             # Login, Register, Forgot Password
│   │   │       ├── dashboard/          # User dashboard, profile, notifications
│   │   │       └── admin/              # Admin panel (14+ management pages)
│   │   ├── components/
│   │   │   ├── home/                   # Hero3D, StatsSection, AboutSection, CursorGlow, etc.
│   │   │   ├── layout/                 # Header, Footer
│   │   │   ├── shared/                 # LoadingSkeleton, EmptyState, DataTable, PageHeader
│   │   │   └── ui/                     # shadcn/ui components (button, card, form, etc.)
│   │   ├── api/                        # Axios client with JWT interceptors
│   │   ├── hooks/                      # TanStack Query hooks
│   │   ├── stores/                     # Zustand auth store
│   │   ├── i18n/                       # Locale context, translation loader
│   │   └── types/                      # TypeScript type definitions
│   ├── locales/                        # Translation JSON files (fa, ar, en)
│   └── public/                         # Static assets
│
├── locales/                            # UI translation files
├── README.md                           # This file
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
└── .gitignore
```

---

## 📸 Screenshots

> *Screenshots will be added in a future update.*

| Page | Preview |
|------|---------|
| **Hero (3D)** | *Coming soon* |
| **Services** | *Coming soon* |
| **Projects** | *Coming soon* |
| **Calculator** | *Coming soon* |
| **Admin Dashboard** | *Coming soon* |
| **CMS Editor** | *Coming soon* |
| **Contact** | *Coming soon* |

---

## ⚡ Installation

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 16+ (optional — SQLite works for local dev) |

### Quick Start (Docker)

```bash
docker compose up --build
```

### Manual Setup

#### 1. Clone the Repository

```bash
git clone git@github.com:mobinnet3000/AbrEnergy.git
cd AbrEnergy
```

---

## 🐍 Backend Setup

### Virtual Environment

```bash
cd AbrEnergy
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements/dev.txt
```

### Configure Environment

```bash
copy .env.example .env
# Edit .env if needed (defaults work for local SQLite)
```

### Database

```bash
python manage.py migrate
python manage.py seed_data --force     # Creates demo data
```

### Create Superuser

```bash
python manage.py seed_data --force     # Creates admin@abrenv.com automatically
# Or manually:
python manage.py createsuperuser
```

### Start Server

```bash
python manage.py runserver
# → http://localhost:8000
```

---

## ⚛️ Frontend Setup

```bash
cd abr-energy-frontend
npm install
```

### Configure Environment

```bash
copy .env.example .env
```

### Development Server

```bash
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

---

## 👤 Default Users

After running `seed_data`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@abrenv.com` | `admin123456` |
| Content Manager | `content@abrenv.com` | `content123456` |
| Customer | `customer@abrenv.com` | `customer123456` |

---

## 🔐 Environment Variables

### Backend (`AbrEnergy/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `insecure‑dev‑key‑change‑in‑production` |
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
| `SITE_URL` | Public site URL | `http://localhost:8000` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Frontend (`abr-energy-frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |

---

## 🌐 Localization

| Language | Code | Direction | URL Prefix | Status |
|----------|------|-----------|------------|--------|
| **Persian** (فارسی) | `fa` | RTL | `/fa/…` | Default |
| **Arabic** (العربية) | `ar` | RTL | `/ar/…` | Full support |
| **English** | `en` | LTR | `/en/…` | Full support |

### How It Works

1. **Middleware** (`src/middleware.ts`) intercepts requests and redirects `/` → `/fa/`.
2. **Layout** (`src/app/[locale]/layout.tsx`) reads the locale from the URL and passes it to `LocaleProvider`.
3. **`LocaleProvider`** sets `document.documentElement.lang` and `dir`, saves the preference to `localStorage`.
4. **Translation files** (`locales/{fa,ar,en}.json`) contain all UI strings. The `t(key)` function retrieves the correct string.
5. **Content translations** are stored in the backend via dedicated translation models (`ArticleTranslation`, `ServiceTranslation`, etc.).

---

## 📝 CMS – Multilingual Content

AbrEnergy uses a **relational translation model** pattern. Every translatable entity has a dedicated translation table:

```
Article → ArticleTranslation  (language: fa/ar/en, title, slug, content, SEO)
Service → ServiceTranslation  (language, title, short_description, description)
Project → ProjectTranslation  (language, title, description, SEO)
```

### Creating Content

The admin panel (`/{locale}/admin/articles/new`) provides language tabs:

```
┌─ فارسی ────────────────┐
│ Title: …                │
│ Slug: …                 │
│ Short Description: …    │
│ Content (TipTap): …     │
└─────────────────────────┘
┌─ العربية ──────────────┐
│ …                       │
└─────────────────────────┘
┌─ English ──────────────┐
│ …                       │
└─────────────────────────┘
```

Completion badges (✅ / ⚠️) show which languages are complete.

---

## 🔑 Authentication & Roles

### JWT Flow

1. **Login** → `POST /api/v1/auth/login/` returns `{access, refresh, user}`
2. **Access token** (15 min) sent via `Authorization: Bearer <token>` header
3. **Refresh token** (7 days) used by Axios interceptor to rotate tokens automatically
4. **Logout** blacklists the refresh token server‑side

### Role Matrix

| Role | Users | Articles | Projects | Services | Contacts | Gallery | Settings | Logs |
|------|-------|----------|----------|----------|----------|---------|----------|------|
| Super Admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | RW | Read |
| Website Admin | Read | CRUD | CRUD | CRUD | CRUD | CRUD | Read | Read |
| Content Manager | – | CRUD | Read | Read | – | CRUD | – | – |
| Engineer | – | Read | CRUD | Read | Read | – | – | – |
| Customer | Own | Read | Read | Read | Create | Read | – | – |

---

## 📡 API Overview

### Base URL

```
http://localhost:8000/api/v1/
```

### Request Flow

```
Client → Middleware (locale redirect) → Next.js → API → Django → DRF → Database
         ↑                                            ↓
         └────── JWT refresh interceptor ←────────────┘
```

### Language Support

Every public content endpoint accepts language via:

- **Header:** `Accept-Language: fa | ar | en`
- **Query:** `?lang=fa`

### Key Endpoints

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /auth/login/`, `/auth/register/`, `/auth/logout/`, `/auth/refresh/` |
| **Users** | `GET /users/me/`, `PATCH /users/me/` |
| **Articles** | `GET /articles/`, `GET /articles/{slug}/` |
| **Projects** | `GET /projects/`, `GET /projects/{slug}/`, `GET /projects/featured/` |
| **Services** | `GET /services/`, `GET /services/{slug}/` |
| **Calculator** | `POST /calculator/off-grid/` |
| **Contact** | `POST /contact/`, `POST /project-inquiry/` |
| **Gallery** | `GET /gallery/` |
| **Admin** | `GET /admin/dashboard/stats/`, `/admin/users/`, `/admin/articles/` … |
| **Site Config** | `GET /site-config/` |

Full documentation is available via Swagger at `/api/docs/` when the backend is running.

---

## ⚡ Performance

| Technique | Implementation |
|-----------|---------------|
| **Lazy loading** | Images use `loading="lazy"`, 3D scene wrapped in `<Suspense>` |
| **GPU transforms** | All animations use `transform` + `opacity` — never `top`/`left` |
| **RAF loops** | Cursor glow, particles, gradient mesh use `requestAnimationFrame` |
| **Three.js** | `dpr={[1, 1.5]}` limits pixel ratio on mobile |
| **Reduced motion** | All effects disabled when `prefers-reduced-motion: reduce` |
| **Mobile** | Cursor glow, particles, ripple effects disabled on touch devices |
| **Bundle** | Three.js scene lazy‑loaded, framer‑motion tree‑shaken |

---

## 🎨 Motion Design System

| Component | Technology | Behaviour |
|-----------|------------|-----------|
| **CursorGlow** | Framer Motion spring | 600px radial glow follows cursor, colour changes per section |
| **FloatingParticles** | Canvas 2D + RAF | 100 particles with mouse repulsion (<150px) |
| **MouseRipple** | CSS animation | Expanding rings when cursor is still for 500ms |
| **GradientMesh** | CSS gradients + RAF | 4 blurred blobs, slow drift, mouse attraction |
| **Hero3D** | Three.js + R3F | Solar sphere, energy rings, floating panels, mouse parallax |
| **ScrollReveal** | Framer Motion | 7 variant types: fade, slide, scale, blur, clip‑path |
| **TextReveal** | Framer Motion | Word‑by‑word with rotateX stagger |
| **GlassCard** | CSS `backdrop‑blur` | Specular reflection pseudo‑element, `glass-premium` class |
| **NoiseTexture** | CSS SVG filter | Fractal noise at 2% opacity, `mix-blend-mode: overlay` |

---

## 🚀 Deployment

### Backend (Production)

```bash
cd AbrEnergy
docker compose -f docker-compose.prod.yml up --build -d
```

Or manually:

```bash
set DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend (Production)

```bash
cd abr-energy-frontend
npm run build
npm start
```

### Environment Checklist

| Item | Check |
|------|-------|
| `SECRET_KEY` set to a secure value | ✅ |
| `DEBUG=False` | ✅ |
| `DJANGO_SETTINGS_MODULE=config.settings.production` | ✅ |
| Database migrated | ✅ |
| Static files collected | ✅ |
| CORS origins configured | ✅ |

---

## 🛠 Development

### Coding Standards

- **TypeScript:** Strict mode (`strict: true` in `tsconfig.json`)
- **Linting:** ESLint with `@typescript-eslint` rules
- **Formatting:** Prettier (recommended)
- **Backend:** PEP 8 via Flake8 (recommended)

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add solar calculator with animated results
fix: resolve article cover image upload
docs: update deployment guide
refactor: extract glass card into shared component
style: improve cursor glow spring physics
chore: update dependencies
```

### Branch Strategy

```
main        Production‑ready code
├── dev     Integration branch
├── feat/*  Feature branches
└── fix/*   Bug‑fix branches
```

### Testing

```bash
# Backend
cd AbrEnergy
python manage.py test

# Frontend
cd abr-energy-frontend
npm run lint
npm run build
```

---

## 🗺 Roadmap

### ✅ Completed

- [x] Django REST API with JWT authentication
- [x] Custom User model with 5 roles
- [x] Article / Project / Service CRUD
- [x] Multilingual translation models
- [x] 3D homepage with Three.js
- [x] Responsive glassmorphism design system
- [x] Persian, Arabic, English i18n
- [x] Admin panel with CMS
- [x] Solar calculator engine
- [x] Contact & inquiry forms
- [x] Activity log & audit trail
- [x] Docker compose configuration

### 🔄 In Progress

- [ ] Rich text editor (TipTap) integration
- [ ] Gallery image upload & management
- [ ] Email notification system
- [ ] Performance optimization (image lazy loading)

### 🔮 Future

- [ ] Mobile app (React Native)
- [ ] Real‑time energy monitoring dashboard
- [ ] Multi‑tenant support
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] E2E tests with Playwright
- [ ] PWA support

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Credits

| Technology | Role |
|-----------|------|
| [Next.js](https://nextjs.org) | Frontend framework |
| [Django](https://djangoproject.com) | Backend framework |
| [TailwindCSS](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | UI primitives |
| [Framer Motion](https://motion.dev) | Animation library |
| [Three.js](https://threejs.org) | 3D rendering |
| [TipTap](https://tiptap.dev) | Rich text editor |
| [TanStack Query](https://tanstack.com/query) | Server state |
| [Zustand](https://github.com/pmndrs/zustand) | Client state |
| [Lucide](https://lucide.dev) | Icons |

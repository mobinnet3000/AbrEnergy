# Changelog

All notable changes to AbrEnergy are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-07-24

### Added

#### Backend
- Django REST API with JWT authentication (access + refresh token flow)
- Custom User model with UUID primary keys and 5 roles (super_admin, website_admin, content_manager, engineer, customer)
- Multilingual translation models: ArticleTranslation, ServiceTranslation, ProjectTranslation, GalleryCategoryTranslation
- Full CRUD for articles, projects, services via REST API
- Solar off‑grid calculation engine (panel capacity, count, battery, inverter, cost, ROI)
- ContactRequest and ProjectInquiry workflows with admin assignment
- ActivityLog middleware auditing all admin actions
- Notification system with read/unread tracking
- MediaFile model with image validation and reusable file system
- SiteSettings singleton model with social links, SEO defaults, hero content
- Celery task queue configuration
- Docker compose for development and production

#### Frontend
- Next.js 15 App Router with TypeScript strict mode
- URL‑based i18n routing for Persian (fa-RTL), Arabic (ar-RTL), English (en-LTR)
- Cinematic 3D homepage with @react-three/fiber (solar sphere, energy rings, floating panels, particles)
- Premium glassmorphism design system with specular reflections
- Advanced cursor interactions: magnetic glow (section‑aware), floating particles, mouse ripples, gradient mesh
- Scroll‑based animations with 7 variant types (fade, slide, scale, blur, clip‑path)
- Word‑by‑word text reveal for hero headings
- Admin panel with 14+ management pages (articles, projects, services, gallery, users, contacts, settings, activity log)
- Full CRUD forms for articles, projects, services with multilingual language tabs
- TipTap rich text editor integration
- ScrollProgress indicator with spring physics
- Framer Motion spring‑based animation system
- Skeleton loading, empty state, error state components
- Dark mode with system‑aware switching

### Changed
- Migrated from CKEditor 4 to TipTap for rich text editing
- Rewrote homepage with 8 premium animated sections
- Refactored serializers to support translation models with `get_translation(language)` pattern

### Fixed
- Login response shape mismatch (backend returns flat `{access, refresh, user}`)
- User profile not fetched on page reload (auth‑store now calls `/users/me/`)
- Refresh token URL missing slash
- Seed data script creating fields that no longer exist on main models
- ESLint errors: `setState` in effects, impure `Math.random`/`Date.now` in render
- Build compatibility with Next.js 15 + TypeScript 5.9

### Security
- JWT token blacklisting on logout
- Role‑based access control on all admin endpoints
- CORS configuration with whitelist
- CSRF protection enabled
- Secure headers (X‑Frame‑Options, X‑Content‑Type‑Options)

---

## [0.1.0] — 2026-07-20

### Added
- Initial project scaffolding
- Django project configuration
- Next.js project with TailwindCSS
- Basic authentication flow

# Changelog

All notable changes to AbrEnergy are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] — 2026-07-25

### Added

- **Page transitions:** AnimatePresence fade+scale+slide on route change
- **Article Table of Contents:** Auto-generated from `<h2>` headings
- **Related articles:** Same-category recommendations on article detail
- **Gallery category filters:** Client-side pill buttons with animated filtering
- **Gallery lightbox:** Fullscreen image viewer with keyboard navigation
- **Contact FAQ section:** 4 expandable questions with `<details>`/`<summary>` pattern
- **Reading time indicator:** Estimated reading time on all article cards
- **Cursor interaction system:** Section-aware glow, floating particles, mouse ripple, gradient mesh
- **Interactive 3D hero scene:** Three.js solar sphere, energy rings, floating panels, 400 particles

### Changed

- **Homepage:** Reduced from 479 to 24 lines by extracting 8 section components
- **About page:** Completely redesigned with SVG energy visualization, timeline, impact cards
- **Services page:** Cinematic hero, glass cards with hover glow, product-style detail pages
- **Articles page:** Featured article block, stagger animations, glass card grid
- **Projects page:** Showcase cards with capacity badges, case-study detail layout
- **Gallery page:** Masonry layout with lightbox, category filtering
- **Calculator page:** Premium form design with glass panels, animated results, conversion CTA
- **Contact page:** Hero, 4 contact info cards, premium form, trust section, FAQ
- **Header:** Top-edge highlight on scroll, `active:scale-[0.97]` buttons, refined glass
- **Footer:** PV grid SVG pattern, minimalist 5-column layout, pill language buttons
- **Stats section:** DOM-based counter animation (zero rerenders), SVG corner geometry
- **Design system:** Unified glassmorphism, emerald colors, cinematic black backgrounds

### Fixed

- React hooks called after early return in article detail page
- Gallery fragment JSX syntax error
- Contact page duplicate FAQ section
- Calculator `<a>` → `<Link>` navigation component
- All ESLint errors (0 remaining)

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

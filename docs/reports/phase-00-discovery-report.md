# Phase 0 — Technical Discovery Report — AbrEnergy

> Audit date: 2026-09-17 — Branch: main — Commit inspected: HEAD — Auditor: automated deep inspection — Scope: full repository, read-only, no schema or behavior changes

---

## 1. Executive Summary

AbrEnergy is a Django 5 + DRF + Next.js 15 (App Router) production-oriented solar energy website. Backend exposes a versioned JWT API at `/api/v1/` with 10 Django apps, translation-table i18n (fa/ar/en), role-based access (5 roles), and a content layer for Articles/Services/Projects/Gallery/Media/Contacts/Calculator. Frontend delivers a premium glassmorphism, 3D cinematic homepage (Three.js/R3F + Framer Motion 12), URL-based locale routing (`/[locale]/`), and a React admin dashboard (14+ pages) plus Django Admin.

**Current CMS readiness: PARTIAL.** Articles/Services/Projects/Gallery already have per-language translation tables, draft/published/scheduled states, featured flags, galleries, tags/categories, and an admin CRUD flow with Tiptap — a solid base to evolve into a full CMS. Gaps blocking a product system: no Product/Category/Subcategory/Price/Discount/Stock/Attribute/Spec models, no product serializers/views/urls/migrations, no product carousel, no pricing logic, no file-attachment model beyond MediaFile, and no publishing approval/scheduling engine beyond a status field.

**Current product-system readiness: ABSENT.** Grep for `Product|Price|Discount` hits only `is_featured` and `calculator.estimated_cost`. Target product tree (4 top categories, 13 subcategories, 3 structure types, modular MEP sub-items) requires a new app — reuse the proven `Translation` pattern and `ServiceCategory` ordering approach.

**Homepage readiness: STRUCTURED BUT STATIC.** Home assembles 8 sections (Hero3D, Stats, Services, Projects, About, Calculator CTA, Articles, Contact) with CursorGlow/particles/ripple/gradient-mesh, ScrollReveal/TextReveal, and parallax. No CMS-driven ordering, no featured-product carousel, no special-offer panel, no floating category cards — all future CMS work. Existing animation components are reusable and must be preserved, not deleted.

**Most important risks (must fix before CMS):**

| # | Risk | Severity |
|---|------|----------|
| 1 | `POST /api/v1/auth/refresh/` wired to login view — refresh flow 400s, users logged out after ~15 min | CRITICAL |
| 2 | `ArticleListView.search_fields=[title,…]` references non-existent `Article.title` (lives in translation) — `?search=` raises FieldError | CRITICAL |
| 3 | N+1 translations — serializers call `get_translation(lang)` per field without `prefetch_related('translations')` — ~200 queries per 20-item list | CRITICAL |
| 4 | Upload open to any authenticated user incl. customers, allows `svg/zip/exe-ish` by extension only, no size/MIME/virus check, SVG XSS via `/media/` in DEBUG | HIGH |
| 5 | `dangerouslySetInnerHTML` renders TipTap HTML raw on 3 public detail pages with no sanitizer (no bleach/DOMPurify) | HIGH |
| 6 | `CORS_ALLOWED_ORIGINS` env var ignored (hardcoded localhost), `DATABASES` hard-switched to SQLite (commented Postgres block) — docker PG ignored, prod settings divergence | HIGH |
| 7 | `is_temp` orphan-media flag never set, no cleanup cron — disk grows, no `next/image` optimization anywhere | MEDIUM |

**Recommended next phase — Phase 1: Stabilization & Backend Foundation.** Fix the 7 critical/high defects above, wire `MediaFile` thumbnail generation, add `prefetch_related`, add bleach sanitization, lock upload permissions, fix CORS/DB env, repair refresh, and scaffold the `products` app skeleton (models+admin, no frontend) so Phase 2 (CMS) can build on a stable base. Implementing product UI or redesigning the homepage before this stabilization would compound the above defects.

---

## 2. Repository Structure

```
AbrEnergy/  (git root — "E:/Ilia Jamali/prog/abar/AbrEnergy")
├── .git/ , .gitignore
├── abar logo.png
├── CHANGELOG.md (0.1.0 / 0.2.0 / 1.0.0 — version skew)
├── CODE_OF_CONDUCT.md , CONTRIBUTING.md , SECURITY.md (dev@abrenv.com)
├── LICENSE (MIT)
├── README.md (650 lines — source of project claims)
├── README.fa.md , README.ar.md
├── docs/reports/phase-00-discovery-report.md  ← this file (Phase 0 deliverable)
├── AbrEnergy/                     ← Django backend root
│   ├── manage.py (DJANGO_SETTINGS_MODULE=config.settings.dev)
│   ├── db.sqlite3  ← committed — should be gitignored
│   ├── .env.example
│   ├── pytest.ini
│   ├── test_api.py / test_customer.py / test_full.py (stdlib urllib live scripts)
│   ├── add_translations.py (root helper)
│   ├── requirements/{base,dev,production}.txt
│   ├── config/
│   │   ├── settings/{base,dev,local,production,test}.py + __init__.py
│   │   ├── urls.py , api_v1.py , wsgi.py , asgi.py , celery.py
│   │   └── __init__.py
│   ├── apps/
│   │   ├── __init__.py , conftest.py (empty)
│   │   ├── users/ (User, choices, managers, signals, admin, api/v1/{serializers,views,urls,permissions}, tests, migrations)
│   │   ├── core/ (SiteSettings, ActivityLog, middleware, pagination, exceptions, admin_site, api, management/commands/{seed_data,translation_data})
│   │   ├── media_manager/ (MediaFile)
│   │   ├── articles/ (Category, Tag, Article, ArticleImage, ArticleTranslation)
│   │   ├── services/ (ServiceCategory, Service, ServiceTranslation)
│   │   ├── projects/ (Project, ProjectImage, ProjectTranslation)
│   │   ├── calculator/ (CalculationHistory, calculator engine)
│   │   ├── contacts/ (ContactRequest, ProjectInquiry)
│   │   ├── gallery/ (GalleryCategory, GalleryImage, GalleryCategoryTranslation)
│   │   └── notifications/ (Notification)
│   ├── docker/{Dockerfile,Dockerfile.dev,nginx/}
│   ├── docker-compose.yml (dev: pg16+redis7+django+celery worker)
│   ├── docker-compose.prod.yml (nginx+django gunicorn+celery+beat)
│   ├── scripts/
│   └── templates/
└── abr-energy-frontend/          ← Next.js frontend root
    ├── package.json (0.1.0 — mismatch with README badge 0.2.0)
    ├── package-lock.json , node_modules/
    ├── tsconfig.json (strict) , next.config.ts , postcss.config.mjs , components.json (shadcn base-nova)
    ├── eslint.config.mjs
    ├── next-env.d.ts , .next/
    ├── .env.example
    ├── public/ (static assets)
    ├── locales/{fa.json (438 lines), ar.json (438), en.json (469)}  ← legacy root locales
    ├── english_check.txt / english_remaining.txt (audit scratch)
    └── src/
        ├── middleware.ts (locale redirect, default fa)
        ├── app/
        │   ├── layout.tsx (root html lang=fa dir=rtl + locale restore script, static metadata)
        │   ├── globals.css (Tailwind v4 tokens + glass + RTL overrides)
        │   ├── sitemap.ts , robots.ts
        │   └── [locale]/
        │       ├── layout.tsx (Providers→LocaleProvider→ScrollProgress→Header→PageTransition→Footer)
        │       ├── (public)/ (page.tsx home + about/articles/[slug]/calculator/contact/gallery/projects/[slug]/services/[slug])
        │       ├── (auth)/ (login/register/forgot-password)
        │       ├── dashboard/ (page, profile, calculations, notifications)
        │       └── admin/ (14+ pages — see §6)
        ├── components/
        │   ├── home/ (20 files — see §15-16)
        │   ├── layout/ (header.tsx, footer.tsx)
        │   ├── shared/ (data-table, loading, states, rich-text-editor, media-upload, page-transition, page-header, NavLink)
        │   └── ui/ (18 shadcn: accordion/avatar/badge/button/card/checkbox/dialog/dropdown/form/input/label/select/separator/switch/table/tabs/textarea/tooltip)
        ├── api/ (axios.ts, index.ts)
        ├── hooks/ (use-api.ts — 22 react-query hooks)
        ├── stores/ (auth-store.ts — zustand)
        ├── i18n/ (config.ts, translations.ts, locale-context.tsx, locale-provider.tsx)
        ├── lib/utils.ts
        ├── types/index.ts (307 lines)
        ├── providers.tsx
        └── hooks/ (re-export)
```

**Roots:** backend `AbrEnergy/`, frontend `abr-energy-frontend/`. No monorepo tooling. No `pyproject.toml`. No GitHub workflows.

---

## 3. Backend Architecture

### 3.1 Runtime & Dependencies

| Item | Value | Source |
|------|-------|--------|
| Python | 3.14.6 in local env (repo claims 3.12+, not pinned) | `python --version` |
| Django | `>=5.0,<5.1` (README claims 5.0) | `requirements/base.txt` |
| DRF | `>=3.15,<3.16` | base.txt |
| SimpleJWT | `>=5.3,<5.4` + `token_blacklist` enabled | base.txt |
| drf-spectacular | `>=0.27,<0.28` | base.txt |
| django-filter | `>=24.1,<24.2` | base.txt |
| corsheaders | `>=4.3,<4.4` | base.txt |
| versatileimagefield | `>=3.1,<3.2` + Pillow `>=10.3,<10.4` | base.txt |
| ckeditor | `>=6.7,<6.8` (installed, unused in live models) | base.txt |
| celery | `>=5.4,<5.5` + redis `>=5.0,<5.1` | base.txt |
| psycopg2-binary | `>=2.9,<2.10` | base.txt |
| decouple | `>=3.8,<3.9` | base.txt |
| gunicorn | `>=22.0,<22.1` | base.txt |
| pytest/django/cov, factory-boy, faker, debug-toolbar | dev only | dev.txt |
| sentry-sdk | `>=2.5,<2.6` | production.txt |

### 3.2 Settings

`config/settings/base.py` is canonical; `dev.py`/`local.py` override `DEBUG=True`, `production.py` sets `DEBUG=False` + `SECURE_SSL_REDIRECT`, `HSTS`, `SESSION/CSRF SECURE`, `SECURE_PROXY_SSL_HEADER`, `sentry_sdk.init(..., traces 0.1)`. `test.py` uses Postgres `abrenv_test`, `MD5PasswordHasher`, `locmem` email, eager Celery, clears throttles.

Key globals: `LANGUAGE_CODE=fa-ir`, `TIME_ZONE=Asia/Tehran`, `STANDARD_PAGE_SIZE=20`, `LARGE_PAGE_SIZE=50`, `STATIC_URL/MEDIA_URL`, `SITE_URL/SITE_NAME`, `VERSATILEIMAGEFIELD_SETTINGS {create_images_on_demand:True, jpeg_resize_quality:85}`.

### 3.3 Database

`base.py:79-99` comments out Postgres and hardcodes `DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'db.sqlite3'}}`. `local.py` repeats SQLite. `test.py` switches to Postgres. `docker-compose.yml` runs `postgres:16-alpine` + `redis:7-alpine` but Django ignores it while SQLite is hardcoded — **pg is unused in dev**. `ATOMIC_REQUESTS`/`CONN_MAX_AGE`/`connect_timeout` are in the commented block only. No routers/replicas.

### 3.4 DRF

- `DEFAULT_AUTHENTICATION_CLASSES=(JWTAuthentication,)` with `CustomTokenObtainPairSerializer` injecting `email/full_name/role`.
- `DEFAULT_PERMISSION_CLASSES=(IsAuthenticated,)` — deny-by-default; public endpoints set `AllowAny`.
- `DEFAULT_SCHEMA_CLASS=drf_spectacular.openapi.AutoSchema`, `DEFAULT_PAGINATION_CLASS=apps.core.pagination.StandardPagination` (`page_size=20, max 100`), `LargePagination` (`50/200`) defined but never used.
- `DEFAULT_FILTER_BACKENDS=[DjangoFilterBackend, SearchFilter, OrderingFilter]` globally; per-view `filterset_fields/search_fields/ordering_fields` are broken on translated fields (see §24).
- `EXCEPTION_HANDLER=apps.core.exceptions.custom_exception_handler` wraps only errors as `{status, errors}`; no success envelope.
- `DEFAULT_THROTTLE_CLASSES=[AnonRateThrottle, UserRateThrottle]` `anon 100/hour, user 1000/hour` (disabled in tests).

### 3.5 JWT

`ACCESS 15 min`, `REFRESH 7 days` (env-tunable), `ROTATE True`, `BLACKLIST_AFTER_ROTATION True`, `UPDATE_LAST_LOGIN True`, `AUTH_HEADER_TYPES=(Bearer,)`. Custom login response embeds user. **Bug:** refresh URL reuse login view (see §8).

### 3.6 CORS/CSRF/Security Headers

`CorsMiddleware` first; `SecurityMiddleware`, `SessionMiddleware`, `CommonMiddleware`, `CsrfViewMiddleware`, `AuthMiddleware`, `MessageMiddleware`, `XFrameOptionsMiddleware`, `ActivityLogMiddleware`. `CORS_ALLOWED_ORIGINS=[http://localhost:3000, http://localhost:3001]` hardcoded (env var ignored), `CORS_ALLOW_CREDENTIALS True`, `CORS_EXPOSE_HEADERS=[Content-Type, Authorization]`. `CSRF_COOKIE_SECURE=not DEBUG, HTTPONLY True, SAMESITE Lax, TRUSTED localhost:3000/3001`. `SESSION_COOKIE_SECURE=not DEBUG, HTTPONLY, Lax`. `X_FRAME_OPTIONS DENY`, `SECURE_BROWSER_XSS_FILTER`, `SECURE_CONTENT_TYPE_NOSNIFF`.

### 3.7 Middleware / Pagination / Caching / Celery

- `ActivityLogMiddleware` post-response only; logs when view sets `request._activity_log` (see §7).
- Pagination/filtering as above; no `FilterSet` classes; no router.
- No `CACHES` anywhere; `REDIS_URL` used only as Celery broker/result.
- `config/celery.py` creates `Celery("abrenv")` with `namespace=CELERY`, autodiscovers tasks; only `debug_task` exists; no `shared_task`, no beat schedule; `TIME_LIMIT 1800`; worker runs `celery -A config worker -l info` in compose.

### 3.8 URL & API Versioning

`config/urls.py` mounts `admin/`, `api/v1/→config.api_v1`, `api/schema/`, `api/docs/`, `api/redoc/`. `config/api_v1.py` prefixes 22 groups (auth, users, articles, categories, tags, services, service-categories, projects, calculator, contact, project-inquiry, gallery, media, notifications, site-config, admin/dashboard, admin/activity-log, admin/contact-requests, admin/project-inquiries, admin/gallery, admin/articles, admin/services, admin/projects, admin/calculator/history, admin/site-config, admin→users.admin_urls). No `DefaultRouter`; all manual `path()`. Versioning is path-prefix `api/v1/` only.

### 3.9 Serializers / Views / Permissions Pattern

Triple serializer pattern (`List/Detail/Write`) with `language = ?lang || Accept-Language || fa`, fallback `en`. No `ModelViewSet`. Permissions defaults as above; per-view overrides listed in §8.

### 3.10 Architecture Map

```
Client (Next.js) → middleware locale redirect → [locale]/layout → Header/Footer
        ↕ axios (Bearer + Accept-Language, 401 refresh queue)
Django (config/settings) → urls → api_v1 → apps/*/api/v1/{views,serializers,urls}
        → models (translation tables) → SQLite (dev) / PG (test/prod intent)
        → admin (django.contrib.admin) → core/admin_site (unused custom site)
        → media_manager (FileField + VersatileImageField on-demand)
        → celery (redis broker, no tasks) + activity log middleware
```

---

## 4. Frontend Architecture

### 4.1 Stack

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js App Router | 15.5.21 |
| Language | TypeScript strict | 5.6 |
| Styling | Tailwind v4 (`@tailwindcss/postcss`) + `tw-animate-css` + `shadcn/tailwind.css` | 4 |
| UI | shadcn/base-nova + Radix slot/label/icons | 1.x |
| State (server) | TanStack Query | 5.101.4 |
| State (client) | Zustand | 5.0.14 |
| HTTP | Axios + JWT interceptors | 1.18.1 |
| Forms | React Hook Form + @hookform/resolvers + Zod | 7.82 / 5.4 / 4.4 |
| Animation | Framer Motion | 12.42.2 |
| 3D | three + @react-three/fiber + drei | 0.185 / 9.6 / 10.7 |
| Icons | lucide-react | 1.25 |
| Rich text | TipTap (react, starter-kit, image/link/table/code/placeholder/underline/text-align) | 3.28 |
| Theme | next-themes | 0.4.6 |
| Toast | sonner | 2.0.7 |
| Charts | recharts | 3.10 |
| Utils | CVA, clsx, tailwind-merge, date-fns, @base-ui/react | — |

Dev: eslint 9 + eslint-config-next 16.2, types for node/react.

### 4.2 Config

- `tsconfig.json`: `target ES2017`, `strict`, `bundler`, `JSX preserve`, alias `@/*→./src/*`.
- `next.config.ts`: minimal — `eslint.ignoreDuringBuilds:false` only; no `images.remotePatterns`, no `compress`, no `headers`.
- `postcss.config.mjs`: `@tailwindcss/postcss` only.
- `components.json`: `style base-nova, rsc true, tailwind v4 css vars, iconLibrary lucide, rtl false`.
- `eslint.config.mjs`: `next/core-web-vitals` + `next/typescript`, ignores `.next/out/build/next-env.d.ts`.
- `src/middleware.ts:1-40`: reads locale from pathname or cookie, redirects `/→/fa/`, sets cookie, matcher excludes `_next/api/static`.
- `src/app/layout.tsx`: root `<html lang="fa" dir="rtl">` + inline locale/dir restore script + static en metadata.
- `src/app/[locale]/layout.tsx`: `Providers → LocaleProvider → ScrollProgress → Header → PageTransition → main → Footer`.

### 4.3 Providers / API / State / i18n

- `src/providers.tsx`: `QueryClient (stale 30s, retry 1, no refetchOnWindowFocus) + ThemeProvider + AuthInitializer + Toaster`.
- `src/api/axios.ts:1-83`: `baseURL NEXT_PUBLIC_API_URL||http://localhost:8000/api/v1`, request adds `Bearer` + `Accept-Language`, response 401 queues and posts `{refresh}` then retries or clears + redirects `/login` (no locale).
- `src/api/index.ts:1-172`: grouped `authApi, articlesApi, servicesApi, projectsApi, calculatorApi, contactApi, siteApi, galleryApi, notificationsApi, adminApi` — no product/price/discount/carousel.
- `src/hooks/use-api.ts`: 22 hooks; admin mutations invalidate queries; no infinite scroll/optimistic.
- `src/stores/auth-store.ts`: `user/tokens/isAuthenticated`, `setAuth/setUser/setTokens/logout/initialize` (localStorage, lazy init, prevents duplicate `/users/me/`).
- `src/i18n/*`: `config.ts locales [fa,ar,en] default fa`, `translations.ts` static import of `locales/*.json` + `t(key)` dot + EN fallback, `locale-context/provider` sets `document.lang/dir`, localStorage, `router.push` on switch.
- `src/types/index.ts:307`: `User, AuthTokens, SiteSettings, Article, Category, Tag, Service, Project, ProjectImage, Calculator*, Contact*, Notification, Gallery*, DashboardStats, ActivityLog, PaginatedResponse` — no Product.

### 4.4 Styling / RTL / Dark Mode / Responsive

- Tailwind v4 via `@import` in `globals.css:1-333` with `@custom-variant dark` + `@theme inline`.
- Tokens: `--font-sans Source Sans 3, --font-heading Lexend` (Google `@import` — render-blocking), light `bg #F8FAFC fg #0F172A primary #059669 secondary #2563EB accent #D97706 border #E2E8F0 radius .5rem`, dark `bg #0F172A primary #10B981`.
- Utilities: `.container-page`, `.section-padding`, `h1-4 font-heading`, logical `ms/me/ps/pe`, `[dir=rtl]` overrides for `mr/ml/border/text/left/space-x`.
- Glass: `.glass-premium (blur20 saturate1.4 + specular ::before)`, `.glass-card-premium::after`, `backdrop-blur-*` inline.
- RTL: `middleware` cookie + `LocaleProvider` dir effect; components check `useLocale().isRTL` (ScrollReveal, Header drawer side, About timeline, Footer arrow). `components.json rtl:false` handled manually.
- Dark: `next-themes attribute class default light enableSystem false`, toggle in Header/Footer; public pages hardcode `bg-black text-white` vs tokens.
- Breakpoints: Tailwind defaults; grids `grid-cols-1 sm:2 lg:3/4`; Header drawer `<md`, admin sidebar `<lg`.

### 4.5 Performance / Loading / a11y

- Code splitting: App Router per-route automatic; no `dynamic(() => import())` for Heavy (Hero3D, TipTap, Recharts) — see §24.
- Images: raw `<img loading=lazy>` (detail `eager`), no `next/image`, no `srcset/sizes/remotePatterns`.
- Loading: `CardLoading/TableLoading/PageLoading` skeletons + `lucide Loader2`; Error: `ErrorState/NotFoundState`; Toast: `sonner` top-right richColors; a11y: focus-visible, aria-labels, semantic HTML, `sr-only`, `prefers-reduced-motion` disables canvas/animations.

---

## 5. Database / Models

### 5.1 Inventory

| App | Model | File | PK | Key Fields | Relationships | Indexes | Constraints | Status/Publish | Reusable for CMS | Action |
|-----|-------|------|----|------------|---------------|---------|-------------|----------------|------------------|--------|
| users | User | `apps/users/models.py:11` | UUID | email unique, phone `^09\d{9}$`, full_name, role `super/website/content/engineer/customer` (default customer), avatar VersatileImage, bio, is_active/staff/superuser, created/updated | — | `[email,role], [role,is_active]` | — | — | ✅ base for RBAC | Extend with granular perms; verify `UserSerializer.role` read-only |
| core | SiteSettings | `apps/core/models.py:7` | UUID pk=1 singleton | company_name/_en, logo/favicon/hero_background VersatileImage, phone×2, email, address, instagram/telegram/linkedin/youtube/whatsapp, hero_title/subtitle, about_us/_en, default_meta_*, site_url, footer_text, maintenance_mode, updated_at | — | — | save enforces pk=1 | maintenance_mode only | ✅ singleton settings | Extend with homepage/CMS sections; keep singleton |
| core | ActivityLog | `apps/core/models.py:59` | UUID | user SET_NULL, action `create/update/delete/login/logout/publish/archive/status_change/role_change/password_reset_request`, model_name, object_id, object_repr, changes JSON, ip, ua 500, timestamp | user→User | `[user,action], [model_name,object_id], action, model_name, timestamp` | — | — | ✅ audit | Keep; add per-object diff + pagination |
| media_manager | MediaFile | `apps/media_manager/models.py:14` | UUID | file FileField `media_upload_path`, thumbnail VersatileImage, original_name 500, file_type `image/document/video/other`, mime 100, size int, width/height, alt 500, subfolder `general`, uploaded_by SET_NULL, is_temp, upload_completed, uploaded_at | uploaded_by→User | `[file_type,subfolder], [is_temp,uploaded_at], file_type, is_temp` | — | — | ✅ | Harden validation, add thumbnails on upload, orphan cleanup |
| articles | Category | `apps/articles/models.py:10` | UUID | title 255, slug `allow_unicode` unique, parent self CASCADE, description, image VersatileImage, meta_title/descr, schema_json, canonical_url, is_active, created_at | parent→self, children, articles | — | slug unique | is_active | ✅ | Reuse for article taxonomy; not product taxonomy |
| articles | Tag | — | UUID | title 100, slug 100 unique | articles | — | slug unique | — | ✅ | Keep |
| articles | Article | `apps/articles/models.py:44` | UUID | cover FK MediaFile SET_NULL, author SET_NULL, category SET_NULL, tags M2M, status `draft/published/scheduled` default draft, publish_date, view_count 0, is_featured, schema_json, created/updated | cover→MediaFile, author→User, category→Category, tags→Tag, images, translations | `[status,publish_date], [category,status], status` | — | status+publish_date+is_featured | ✅ | Add `prefetch translations`, fix search |
| articles | ArticleImage | — | UUID | article CASCADE, media_file CASCADE, alt 500, order 0 | article→Article | — | — | — | ✅ gallery pattern | Keep |
| articles | ArticleTranslation | `apps/articles/translation_models.py:8` | UUID | article CASCADE, language `fa/ar/en`, title 500, slug 500 `allow_unicode` not unique, short 1000, content Text, meta_* | article→Article | `language`, `unique article+language` | article+language | — | ✅ pattern to copy | Keep; add slug unique per language scoped |
| services | ServiceCategory | `apps/services/models.py:8` | UUID | title 255, slug unique, description, icon 100, order 0, is_active, meta_*, schema_json, canonical_url | services, projects | — | slug unique | is_active | ✅ | Reuse for service taxonomy |
| services | Service | `apps/services/models.py:30` | UUID | image MediaFile SET_NULL, icon 100, category SET_NULL, features JSON list, order 0, is_featured, status `active/inactive` default active, schema_json | image→MediaFile, category→ServiceCategory | `[category,status], status` | — | status+is_featured | ✅ | Extend with richer fields if needed |
| services | ServiceTranslation | `apps/services/translation_models.py:8` | UUID | service CASCADE, language `fa/ar/en`, title 500, slug 500, short 500, description Text, meta_* | service→Service | `language`, `unique service+language` | service+language | — | ✅ pattern | Keep |
| projects | Project | `apps/projects/models.py:10` | UUID | location 500, capacity Decimal 10,2 kW, project_type `on/off/hybrid/large_scale`, service_category SET_NULL, start/end Date, status `planning/in_progress/completed/on_hold/cancelled` default planning, is_featured, completion %, schema_json | service_category→ServiceCategory | `[project_type,status], project_type, status` | — | status+is_featured | ✅ | Keep |
| projects | ProjectImage | — | UUID | project CASCADE, media_file CASCADE, is_cover, alt 500, order 0 | project→Project | — | — | — | ✅ | Keep |
| projects | ProjectTranslation | `apps/projects/translation_models.py:8` | UUID | project CASCADE, language `fa/ar/en`, title 500, slug 500, description, meta_* | project→Project | language, unique project+language | project+language | — | ✅ pattern | Keep |
| calculator | CalculationHistory | `apps/calculator/models.py:8` | UUID | user SET_NULL, session_id 255, daily_consumption 10,2 kWh/d, city 100, irradiation 5,2, battery_type `lead_acid/lithium/tubular`, system_type `on/off/hybrid`, panel_capacity kW, panel_count, battery_capacity Ah, inverter kW, estimated_cost IRR 15,0, roi 5,1, created_at | user→User | `session_id` | — | — | ✅ engine | Keep; add `on_grid/hybrid` calc beyond off-grid |
| contacts | ContactRequest | `apps/contacts/models.py:8` | UUID | full_name 255, email, phone 20, subject 500, message, request_type `contact/consultation/design_request` default contact, status `pending/in_review/completed/rejected` default pending, assigned_to SET_NULL, admin_note | assigned_to→User | `request_type, status` | — | status | ✅ | Fix admin Completed status |
| contacts | ProjectInquiry | — | UUID | name 255, phone 20, email blank, city 100, project_type `on/off/hybrid/large_scale`, estimated_capacity kW, message, status `new/contacted/in_design/quoted/accepted/rejected` default new, assigned_admin SET_NULL, admin_note | assigned_admin→User | `project_type, status` | — | status | ✅ | Fix `mark_completed→completed` (invalid) |
| gallery | GalleryCategory | `apps/gallery/models.py:8` | UUID | order 0, is_active, created_at (title/slug in translation) | images, translations | — | — | is_active | ✅ | Keep |
| gallery | GalleryImage | — | UUID | category CASCADE required, media_file CASCADE, title 500, alt 500, caption, order 0, is_active, uploaded_by SET_NULL, uploaded_at | category→GalleryCategory | — | — | is_active | ✅ | Keep |
| gallery | GalleryCategoryTranslation | `apps/gallery/translation_models.py:8` | UUID | category CASCADE, language `fa/ar/en`, title 255, slug 255, description | category→GalleryCategory | language, unique category+language | category+language | — | ✅ pattern | Keep |
| notifications | Notification | `apps/notifications/models.py:8` | UUID | recipient CASCADE, sender SET_NULL, title 500, message, type `new_contact/contact_status_change/new_project_inquiry/project_inquiry_status_change/system/general` default general, link 500, is_read, read_at, created_at | recipient/sender→User | `[recipient,is_read], [recipient,notification_type], notification_type, is_read` | — | is_read | ✅ | Keep |

**Products/Price/Discount/Stock/Attribute/Spec/Category-Product hierarchy: ABSENT — no app, model, serializer, view, url, admin, migration.** Only `is_featured` booleans exist.

### 5.2 Migration Status

All apps have 1-5 migrations; DB is SQLite `db.sqlite3`. History shows `ckeditor RichTextField` moved to plain `Text` in translations (0001→0003/0004). No product migrations. No pending migrations reported by `manage.py migrate` (SQLite). Postgres path never migrated in dev.

---

## 6. Current Routes

### 6.1 Frontend Routes (`src/app/[locale]/`)

| Route | Page Component | Purpose | API Deps | Status | Reusable | Missing |
|-------|----------------|---------|----------|--------|----------|---------|
| `/[locale]/` | `(public)/page.tsx` (Home) | Assembles 8 home sections | `siteApi.getSettings`, `useServices`, `useFeaturedProjects` | Live | All home animation comps | CMS ordering, product carousel, special offer |
| `/[locale]/about` | `about/page.tsx` | About | — | Live | ScrollReveal | CMS content |
| `/[locale]/articles` | `articles/page.tsx` | List articles | `articlesApi.list` | Live | DataTable | Filters, pagination UX |
| `/[locale]/articles/[slug]` | `articles/[slug]/page.tsx` | Article detail | `articlesApi.getBySlug` + related fetch | Live (client) | RichText | SSR metadata, related via `?category` |
| `/[locale]/services` | `services/page.tsx` | List services | `servicesApi.list` | Live | Grid | — |
| `/[locale]/services/[slug]` | `services/[slug]/page.tsx` | Service detail | `servicesApi.getBySlug` | Live (client) | — | — |
| `/[locale]/projects` | `projects/page.tsx` | List projects | `projectsApi.list` | Live | Grid | Filters |
| `/[locale]/projects/[slug]` | `projects/[slug]/page.tsx` | Project detail | `projectsApi.getBySlug` | Live (client) | Gallery | — |
| `/[locale]/calculator` | `calculator/page.tsx` | Off-grid calc | `calculatorApi.calculate/history` | Live | Recharts | on-grid/hybrid calc |
| `/[locale]/contact` | `contact/page.tsx` | Contact form | `contactApi.submit/submitInquiry` | Live | RHF+Zod | — |
| `/[locale]/gallery` | `gallery/page.tsx` | Gallery masonry | `galleryApi.list` | Live | Lightbox | Upload mgmt |
| `/[locale]/login` | `(auth)/login/page.tsx` | Login | `authApi.login` | Live | — | — |
| `/[locale]/register` | `(auth)/register/page.tsx` | Register | `authApi.register` | Live | — | — |
| `/[locale]/forgot-password` | `(auth)/forgot-password/page.tsx` | Reset stub | `authApi` stub | Stub | — | Real flow |
| `/[locale]/dashboard` | `dashboard/page.tsx` | User home | `useAuthStore` | Guarded | — | — |
| `/[locale]/dashboard/profile` | `dashboard/profile/page.tsx` | Profile | `authApi.getMe/updateProfile/changePassword` | Guarded | — | — |
| `/[locale]/dashboard/calculations` | `dashboard/calculations/page.tsx` | History | `calculatorApi.getHistory` | Guarded | Table | — |
| `/[locale]/dashboard/notifications` | `dashboard/notifications/page.tsx` | Notifications | `notificationsApi.*` | Guarded | — | — |
| `/[locale]/admin` | `admin/page.tsx` | Dashboard stats | `adminApi.dashboard` | Guarded super/website | Stats | — |
| `/[locale]/admin/users` | `admin/users/page.tsx` | User mgmt | `adminApi.users` | Guarded | DataTable | — |
| `/[locale]/admin/articles` (+new/[id]/[id]/edit) | 4 pages | Article CMS | `adminApi` articles | Guarded | TipTap+MediaUpload | — |
| `/[locale]/admin/services` (+new/[id]/[id]/edit) | 4 pages | Service CMS | admin services | Guarded | — | — |
| `/[locale]/admin/projects` (+new/[id]/[id]/edit) | 4 pages | Project CMS | admin projects | Guarded | — | — |
| `/[locale]/admin/categories` | `admin/categories/page.tsx` | Categories | categories | Guarded | — | Unify article/service cats |
| `/[locale]/admin/tags` | `admin/tags/page.tsx` | Tags | tags | Guarded | — | — |
| `/[locale]/admin/contacts` | `admin/contacts/page.tsx` | Contact inbox | admin contacts | Guarded | — | — |
| `/[locale]/admin/inquiries` | `admin/inquiries/page.tsx` | Project inquiries | admin inquiries | Guarded | — | Fix assign perms |
| `/[locale]/admin/gallery` | `admin/gallery/page.tsx` | Gallery mgmt | gallery | Guarded | — | — |
| `/[locale]/admin/media` | `admin/media/page.tsx` | Media library | media | Guarded | MediaUpload | Thumbnail mgmt |
| `/[locale]/admin/notifications` | `admin/notifications/page.tsx` | Notification inbox | notifications | Guarded | — | — |
| `/[locale]/admin/activity-log` | `admin/activity-log/page.tsx` | Audit log | admin activity-log | Guarded | — | Filters |
| `/[locale]/admin/settings` | `admin/settings/page.tsx` | Site settings | site-config | Guarded super only | — | Homepage sections |

### 6.2 Mapping to Target Site Structure

| Target | Exists? | Notes |
|--------|---------|-------|
| HOME | ✅ | Needs CMS-driven hero/floating/special-offer/carousel |
| PRODUCTS (Solar Packages/Emergency/Structures/MEP Support) + 13 subcategories | ❌ no routes, no models, no API | Greenfield `products` app + `/products/*` routes |
| SERVICES (7 items) | ✅ `/services` lists all; granular 1:1 missing | Extend ServiceCategory ordering/FAs |
| PROJECTS (4 types) | ✅ 4 `project_type` map 1:1 to target | Filter UI covers it |
| DOWNLOADS (2 catalogs) | ❌ no route/model | Likely `ProductDocument` + `/downloads` page |
| OFF-GRID CALCULATOR | ✅ `/calculator` | Needs on-grid/hybrid mode |
| CONTACT US | ✅ `/contact` | — |
| Admin products/categories/subcategories/attributes/specs/images/galleries/price/discounts/featured/SEO/media/related/search | ❌ | Build alongside products app |

### 6.3 Backend API Routes (`/api/v1/`)

Public GETs `AllowAny`; writes gated. Full prefix map in §3.8; all manual `path()`, no router, `AllowAny` on content lists/details, calculator/contact creation, site-config read.

---

## 7. Existing Admin / CMS

**Two admin surfaces:**

1. **Django Admin** at `/admin/` (`django.contrib.admin`) — `config/urls.py:13`. Custom `apps/core/admin_site.py:AbrEnergyAdminSite` defined but never wired (dead code).

**Registrations:**

| Admin | File | list_display | list_filter | search | inlines/actions/editable | Notes |
|-------|------|--------------|-------------|--------|--------------------------|-------|
| UserAdmin | `apps/users/admin.py` | avatar_preview 40px, full_name, email, phone, role, is_active, is_staff, created | role, is_active, is_staff, superuser | email, full_name, phone | fieldsets (email/password, profile, perms, dates), readonly dates+preview, ordering -created | No bulk, no custom perms |
| SiteSettingsAdmin | `apps/core/admin.py` | company_name, email, phone, updated | — | — | 6 fieldsets, readonly updated, `has_add/delete False` singleton | Hero/about/footer text here |
| MediaFileAdmin | `apps/media_manager/admin.py` | preview 60px, original_name, file_type, subfolder, size B/KB/MB, uploaded_by, uploaded_at | file_type, subfolder, is_temp | original_name, alt_text | — | No bulk/validation |
| ArticleAdmin | `apps/articles/admin.py` | id, author_name, category, status, publish_date, view_count, is_featured, created | status, category, is_featured | *(none)* | `ArticleImageInline Tabular extra1`, `filter_horizontal tags`, `list_editable is_featured`, readonly view_count/created/updated, actions `make_published/make_draft/archive(=draft)` | search missing; archive not a state |
| CategoryAdmin | — | title, parent, is_active, created | is_active, parent | title, slug | `prepopulated slug` | — |
| TagAdmin | — | — | — | title | — | — |
| ServiceCategoryAdmin | `apps/services/admin.py` | title, order, is_active | is_active | title | — | — |
| ServiceAdmin | — | id, category, status, is_featured, order, created | status, category, is_featured | *(none)* | `list_editable is_featured,order` | no search/inlines/actions |
| ProjectAdmin | `apps/projects/admin.py` | id, project_type, status, capacity, location, is_featured, created | project_type, status, is_featured | location only | `ProjectImageInline preview 80px readonly`, `list_editable is_featured` | search lacks title |
| ProjectImageAdmin | — | separate | — | — | — | — |
| CalculationHistoryAdmin | `apps/calculator/admin.py` | user, city, system_type, battery_type, consumption, panel_count, cost, roi, created | system_type, battery_type | city, user email | all readonly | no actions |
| ContactRequestAdmin | `apps/contacts/admin.py` | full_name, request_type, status, assigned | request_type, status | name, email, phone, message | `list_editable status`, readonly submitter, actions `mark_completed/mark_rejected` | — |
| ProjectInquiryAdmin | — | name, project_type, city, status, assigned | project_type, status | name, city, phone | `list_editable status`, actions `mark_contacted/mark_completed→completed` **bug: completed not in choices** | — |
| GalleryCategoryAdmin | `apps/gallery/admin.py` | id, order, is_active | — | — | — | no title (in translation) |
| GalleryImageAdmin | — | title, category, order, is_active, uploaded_at | category, is_active | title, alt | `list_editable order` | — |
| NotificationAdmin | `apps/notifications/admin.py` | recipient, type, title, is_read, created | type, is_read | recipient email, title, message | — | — |

Rich text: `CKEDITOR_CONFIGS full toolbar + codesnippet/image2/uploadimage` present but no live `RichTextField`. Drag/drop: none. Bulk: only status actions. Image previews: 40-80px thumbs. Singleton: `SiteSettings` only. Publishing: `status` field with `make_published/archive` actions, no schedule/revision. Permissions: Django `is_staff`/`is_superuser` only; no CMS role integration.

**2. React Admin Dashboard** at `/[locale]/admin/*` — 14+ pages with `PageHeader`, `DataTable` (searchable, paginated, `filter_horizontal`-like UX), `CardLoading/TableLoading`, `EmptyState/ErrorState`, `RichTextEditor` (TipTap), `MediaUpload` (dropzone + preview), `sonner` toasts. Language tabs per entity with completion badges. More usable for content editors than Django Admin; lacks bulk, drag-drop, image preview in lists.

**CMS evolution verdict:** Evolve, don't replace. Keep translation-table pattern, article/project/service as reference implementations. React dashboard becomes editor surface; Django Admin stays for technical/ops (users, raw FKs, logs). Add products as new app following same translation+image pattern.

---

## 8. Authentication

### 8.1 Backend

- Custom `User` (`AbstractBaseUser+PermissionsMixin`), `USERNAME_FIELD=email`, `objects=UserManager`.
- JWT: `JWTAuthentication` only; `ACCESS 15m`, `REFRESH 7d`, `ROTATE True`, `BLACKLIST_AFTER_ROTATION True`, `UPDATE_LAST_LOGIN True`. Claims `email/full_name/role` via `CustomTokenObtainPairSerializer`.
- Endpoints: `POST auth/register/ (AllowAny, forces customer)`, `POST auth/login/ (CustomTokenObtainPairView → {access,refresh,user})`, `POST auth/refresh/ → **BUG: CustomTokenObtainPairView again, not TokenRefreshView**`, `POST auth/logout/ (blacklist refresh)`, `POST auth/password-change/ (IsAuthenticated)`, `POST auth/password-reset/ (AllowAny stub — log only, no email/token; serializers exist unused)`. `GET users/me/ (RetrieveUpdate)`, `GET admin/users* (IsSuperAdmin)`.
- Key risk: `CustomTokenObtainPairView.post` does `User.objects.get(email=request.data["email"])` unguarded — `KeyError` on missing key; enumeration via timing around `Unauthorized`.
- Password validators: `MinimumLength/Common/Numeric` only. No lockout/2FA/captcha.

### 8.2 Frontend

- `auth-store.ts` Zustand with `localStorage` tokens; `AuthInitializer` calls `initialize` once.
- `api/axios.ts` request adds `Bearer` + `Accept-Language`; response 401 queues + `POST /auth/refresh/ {refresh: refreshToken}` (mismatched key name vs SimpleJWT expects `refresh`; backend login view rejects) → logout loop after ~15 min is **CRITICAL**.
- Route guards client-only in `dashboard/layout.tsx` (`isAuthenticated→/login`) and `admin/layout.tsx` (`super/website else →/dashboard`); `middleware.ts` has no auth. Tokens in `localStorage` (XSS theft) vs `httpOnly` alternative.
- Contact/calculator `AllowAny` is intentional; rate-throttled.

---

## 9. Roles & Permissions

### 9.1 Current

5 roles `UserRole(TextChoices): super_admin, website_admin, content_manager, engineer, customer`. `User.is_admin = role in [super,website]`. `User.is_staff/is_superuser` shadow `PermissionsMixin`.

Permission classes `apps/users/api/v1/permissions.py`: `IsSuperAdmin`, `IsAdminUser (super,website)`, `IsContentManager (super,website,content)`, `IsEngineer (super,website,engineer)`, `IsOwner (object==user or admin — unused)`. `DEFAULT_PERMISSION_CLASSES=IsAuthenticated` (deny-by-default).

Applied:

| Surface | Class | Notes |
|---------|-------|-------|
| articles write + publish/archive | IsContentManager | Correct |
| categories/tags/service-categories/services/projects write | IsAdminUser | **Engineer locked out of projects; Content locked out of taxonomy** — contradicts README |
| inquiries list/detail | IsEngineer | OK; assign endpoints IsAdminUser (inconsistent) |
| media upload | IsAuthenticated | Any customer can upload |
| media list/delete/cleanup | IsAdminUser | — |
| users/site-config/role-change/dashboard/stats/logs | IsSuperAdmin | — |
| calculator history | IsAuthenticated (user) / IsAdminUser (admin) | — |
| contacts admin | IsAdminUser | — |
| notifications | IsAuthenticated scoped to recipient | OK |
| frontend admin pages | role check super/website only | Content/engineer see `/dashboard` fallback |
| IsOwner | nowhere | dead |

### 9.2 Gap to Target

Target 10 roles: `Super Admin, Site Admin, Content Manager, Product Manager, SEO Manager, Media Manager, Project Manager, Service Manager, Editor, Viewer`. Present system is coarse, no per-object or field-level perms, no publish-approval, no read-only staff. Extending requires either `Group+Permission` or a granular RBAC table; simplest reuse is to extend `UserRole` + new `IsProductManager`/`IsSeoManager` etc., plus object-level checks for publishing.

### 9.3 Recommendation

Keep 5 roles; add `product_manager, seo_manager, media_manager` to `UserRole`; map `Product Manager→IsProductManager`, `Media Manager→IsAdminUser` subset, `SEO Manager→can edit meta/schema/slug`. Add `Viewer` as `is_active` staff with read-only admin. Implement approval as `status=draft→pending_review→published` without deleting current `scheduled`.

---

## 10. Internationalization

### 10.1 Frontend

- `src/i18n/config.ts`: `locales=['fa','ar','en'], default='fa', dir {fa:rtl, ar:rtl, en:ltr}, isRTL()`.
- `src/middleware.ts`: if `/{locale}/` set cookie, else cookie||fa redirect `/{locale}{path}`; matcher excludes `_next/api/favicon/images/locales/*.*`.
- `src/i18n/translations.ts`: static import `locales/*.json` + `t(key)` dot + EN fallback.
- `src/i18n/locale-context/provider`: `document.lang/dir`, `localStorage`, `router.push` segment rewrite; `Header` globe dropdown, `Footer` pill buttons, mobile drawer locales.
- `src/app/[locale]/layout.tsx:16` casts `params.locale as Locale` no validation, no `generateStaticParams`, no `notFound()`.
- `src/app/layout.tsx:11-24`: `<html lang="fa" dir="rtl">` + inline restore script, `suppressHydrationWarning`.
- `src/app/globals.css:180-215`: logical `ms/me/ps/pe` + `[dir=rtl]` overrides; many physical classes remain.
- Translation files: `abr-energy-frontend/locales/{fa.json 438, ar.json 438, en.json 469}` (~400 keys, 8 namespaces) + legacy `locales/` at repo root. `next.config.ts` no `i18n` block — routing is custom via `[locale]/`.

### 10.2 Backend

`?lang=` else `HTTP_ACCEPT_LANGUAGE` else `fa`; no `q`-parsing. Translation tables `Article/Project/Service/GalleryCategory` with `{parent, language[fa/ar/en] db_index, title/slug/short/content/meta, unique parent+language}`. Serializers `get_translation(lang)||en||""` per field, causing N+1 without prefetch.

### 10.3 Persian-only Without Destroying Future

Must NOT delete schema/JSON/middleware tabs. Cleanest path:
1. `src/i18n/config.ts`: export `activeLocales=['fa']` but keep `locales` full; middleware redirect stays.
2. `src/app/sitemap.ts` / header/footer: render switcher only if `activeLocales.length>1`.
3. Keep `locales/*.json` and translation tabs; admin keeps 3 tabs.
4. Backend keeps 3-language rows; API defaults `fa`.
5. Future activation: flip `activeLocales` + re-render switcher + add `generateStaticParams` for new locales — no migration.

---

## 11. RTL

HTML `dir` via middleware cookie + `LocaleProvider` effect; initial inline script prevents FOUC. Logical CSS `margin-inline-start/end, padding-inline-start/end` in `globals.css`; component-level `isRTL` flips `ScrollReveal` slide, `Header` drawer side, `AboutSection` timeline `x`, `Footer` arrow rotate. `components.json rtl:false` so future shadcn overrides are manual — set `rtl:true` when product cards land. No `next/font` RTL subset; fonts are `Lexend` headings + `Source Sans 3` body via blocking `@import`.

---

## 12. Media Management

### 12.1 Models & Flow

`MediaFile` (`FileField upload_to={subfolder|documents}/{id}.{ext}` + `VersatileImageField thumbnails/ never populated`). Validators: `FileExtensionValidator` (18 exts inc `svg/bmp/zip/rar/txt/mp4`). Fields `original_name/mime/size/width/height/alt/subfolder=general/uploaded_by/is_temp/upload_completed/uploaded_at`. `save()` infers `file_type` from ext. Thumbnails not generated; `VERSATILEIMAGEFIELD_SETTINGS` on-demand but never called. Upload: `IsAuthenticated + MultiPart/FormParser`, sets `original_name/mime/size`, tries `uploaded_file.image.size` width/height best-effort. List/delete `IsAdminUser` filtered by `file_type/subfolder`. `cleanup_temp_media` deletes `is_temp=True` with no age guard; `is_temp` never set True → no orphans cleaned. Deletion: `Article.cover SET_NULL` leaves file on disk; `ArticleImage CASCADE` leaves file; no signals/celery cleanup.

### 12.2 Galleries

`GalleryCategory→GalleryImage→MediaFile`; `Project→ProjectImage→MediaFile`; `Article→ArticleImage + cover FK`. All FKs correct.

### 12.3 Frontend

`MediaUpload` dropzone + preview posts to `/media/`; lists use raw `<img src=file.url>` `loading=lazy` (detail `eager`); `thumbnail_url` falls back to `file.url`; `next/image` unused, no `srcset/sizes/remotePatterns`, no blur placeholder. Gallery masonry loads full files + lightbox full-size.

### 12.4 Hardening Needed

Size/MIME sniff, block `svg` (or sanitize), Pillow compress + thumbnail on upload, orphan cleanup signal, `next/image` with `remotePatterns` for `/media/`.

---

## 13. SEO

- Root `src/app/layout.tsx:4-7`: static en `title/description` only — no `openGraph/twitter/canonical/robots/alternates/hreflang`.
- Detail pages `articles/[slug], services/[slug], projects/[slug]` are `'use client'` — no `generateMetadata`, crawlers receive shell; `dangerouslySetInnerHTML` raw.
- Model fields (`Category/ServiceCategory meta_title/descr/schema_json/canonical_url`, `Translation meta_*`, `Article.schema_json`, `SiteSettings.default_meta_*`) exist but are never rendered.
- `src/app/sitemap.ts:6-26`: static 9 paths ×3 locales inc `login/register/forgot/dashboard/*` (should not index), no dynamic slugs, `lastModified: new Date()` every hit, `priority 1.0/0.8`.
- `src/app/robots.ts:6-14`: `allow / disallow /admin/ /dashboard/` contradicts sitemap; no `noindex`.
- Slug: `allow_unicode True`; `Translation.slug` not globally unique (`unique parent+language` only).
- No `JsonLd`/`breadcrumbs`/`canonical` rendering (grep 0); no `not-found.tsx`; no redirect map; client `return div` not 404 status.

---

## 14. UI/UX System

`globals.css` Tailwind v4 `@import tailwindcss/tw-animate-css/shadcn` + `@custom-variant dark` + `@theme inline`. Tokens: light `bg #F8FAFC fg #0F172A primary #059669 secondary #2563EB accent #D97706 border #E2E8F0 radius .5rem`, dark `bg #0F172A primary #10B981`, charts/sidebar vars, `@layer base` `h1-4 font-heading`. Helpers `.container-page max-w-7xl px, .section-padding py12/16/20`. Components `shadcn/base-nova`: `button rounded-lg active:translate-y`, cards `rounded-2xl border-white/[0.06] bg-white/[0.02]`, inputs `h-8 rounded-lg border-input`, header `backdrop-blur-2xl bg-white/50 dark:bg-gray-950/50`. Glass `glass-premium blur20 saturate1.4 + ::before specular, glass-card-premium::after hover, backdrop-blur-* inline`. Dark via `next-themes class`; public pages hardcode `bg-black`. Animations via Framer spring, `fadeIn .3s, mouseRipple 1.2s, noise-overlay 2% overlay, prefers-reduced-motion` kills durations/ripple/noise.

Preserve visual identity; do not redesign in Phase 0.

---

## 15. Existing Animations

> **PRESERVATION RULE:** Do NOT delete any of the below. Report only.

| Component | File | Purpose | Technique | Used In | Dependencies |
|-----------|------|---------|-----------|---------|--------------|
| Hero3D | `components/home/Hero3D.tsx` | Cinematic solar sphere + particles + energy rings + solar cells, mouse parallax | R3F + drei MeshDistortMaterial/Float/Stars `dpr [1,1.5]` | HeroSection | three/fiber/drei |
| CursorGlow | `components/home/CursorGlow.tsx` | Section-aware radial glow following cursor | Framer springs `radial-gradient 600px` | HomePage | framer-motion |
| FloatingParticles | `components/home/FloatingParticles.tsx` | 100 particles repelled <150px | Canvas 2D RAF | HomePage | — |
| MouseRipple | `components/home/MouseRipple.tsx` | Idle 500ms expanding rings | DOM + CSS `mouseRipple` | HomePage | globals.css |
| GradientMesh | `components/home/GradientMesh.tsx` | 4 blurred blobs following mouse | RAF lerp | HomePage | — |
| EnergyBackground | `components/home/EnergyBackground.tsx` | 40 primary-color particles bounce | Canvas 2D RAF | *(unused)* | — |
| ParallaxSection (wrapper) | `components/home/ParallaxSection.tsx` | Background parallax | `useScroll/useTransform` | *(unused)* | framer-motion |
| ScrollReveal (+ TextReveal) | `components/home/ScrollReveal.tsx` | 8 variants fade/slide/scale/blur/clip/cinematic + stagger + RTL flip + word-by-word rotateX | `useInView` + variants | Footer + many | framer-motion |
| AnimatedCounter | `components/home/AnimatedCounter.tsx` | Count-up | Framer motion | *(unused)* — StatsSection has custom RAF | framer-motion |
| GlassCard | `components/home/GlassCard.tsx` | Lift on hover + specular | Framer hover | *(unused)* | framer-motion |
| ScrollProgress | `components/home/ScrollProgress.tsx` | Top bar spring `scaleX` on `scrollYProgress` | `useSpring` | LocaleLayout | framer-motion |
| PageTransition | `components/shared/page-transition.tsx` | Route animate | `AnimatePresence` on pathname | LocaleLayout | framer-motion |
| ServicesSection 3D tilt | `components/home/ServicesSection.tsx` | Cards tilt on mouseMove `rotateX/Y` | state + inline transform | HomePage | framer-motion |

Duplicates: `FloatingParticles` vs `EnergyBackground`; `AnimatedCounter` vs `StatsSection` custom RAF — consolidate in Phase 1 by keeping `FloatingParticles` and merging counters, deleting nothing until replacement is measured.

---

## 16. Existing Reusable Components

| Component | File | Purpose | Where Used | Deps | Reusable for Homepage | Extend/Refactor | Problems |
|-----------|------|---------|------------|------|----------------------|-----------------|----------|
| HeroSection | `components/home/HeroSection.tsx` | Hero with 3D + text reveal + CTAs from site settings | Home | Hero3D, TextReveal, framer, useSiteSettings | ✅ | Props for slogan/CTA from CMS | — |
| StatsSection | `components/home/StatsSection.tsx` | 4 counters capacity/projects/years/satisfaction | Home | framer, useInView, lucide | ✅ | Data from CMS singleton | Duplicate counter logic |
| ServicesSection | `components/home/ServicesSection.tsx` | 3-col cards with tilt hover | Home | framer, useServices, CardLoading | ✅ | Accept services prop | Fallback data hardcoded |
| ProjectsSection | `components/home/ProjectsSection.tsx` | Featured 3-card grid | Home | framer, useFeaturedProjects | ✅ | Count/grid props | Static grid, no carousel |
| AboutSection | `components/home/AboutSection.tsx` | Split SVG + timeline RTL-aware | Home | framer useScroll/useInView, useSiteSettings | ✅ | Timeline from CMS | — |
| CalculatorSection | `components/home/CalculatorSection.tsx` | CTA to calculator | Home | framer | ✅ | — | CTA hardcoded |
| ArticlesSection | `components/home/ArticlesSection.tsx` | Featured 3-card grid | Home | framer, useArticles | ✅ | — | Related overfetch |
| ContactSection | `components/home/ContactSection.tsx` | Dual-button CTA card | Home | framer | ✅ | — | — |
| Header | `components/layout/header.tsx:274` | Sticky, scroll-hide, locale, theme, auth, mobile drawer RTL-aware | [locale] layout | — | ✅ | Split MobileNav/LocaleSwitcher/ThemeToggle | 274 lines |
| Footer | `components/layout/footer.tsx:144` | 4-col brand/links/services/contact + animated border | layout | ScrollReveal | ✅ | — | — |
| DataTable | `components/shared/data-table.tsx` | Searchable paginated table sortable-ready | Admin lists | — | ✅ admin products | Add density prop | — |
| LoadingSkeleton set | `components/shared/loading.tsx` | Card/Table/Page skeletons | All lists | lucide | ✅ | — | — |
| States set | `components/shared/states.tsx` | Empty/Error/Success/NotFound consistent UI | Articles/Projects/admin | — | ✅ | — | — |
| RichTextEditor | `components/shared/rich-text-editor.tsx` | TipTap headings/bold/italic/underline/lists/quote/code/align/link/image/table/undo | Admin forms | TipTap extensions | ✅ product description | Sanitize on save | No XSS check |
| MediaUpload | `components/shared/media-upload.tsx` | Dropzone + preview → `/media/` | Admin forms | — | ✅ product galleries | Size/validation UX | No progress |
| PageHeader | `components/shared/page-header.tsx` | Title+desc+actions slot | Admin pages | — | ✅ | — | — |
| NavLink | `components/shared/NavLink.tsx` | Active-state desktop/mobile links | Header/sidebars | — | ✅ | — | — |
| shadcn 18 | `components/ui/*` | accordion/avatar/badge/button/card/checkbox/dialog/dropdown/form/input/label/select/separator/switch/table/tabs/textarea/tooltip | everywhere | CVA/tw-merge | ✅ product cards/carousel | Set `rtl:true` | — |

Carousel/slider lib: **none** (`embla/swiper/keen/slick` absent). Product carousel: **absent** (no product type, no carousel component; closest are static grids). Floating grids/scroll/hover preserved as above.

---

## 17. Homepage Current State

Home `src/app/[locale]/(public)/page.tsx` is a client assembly of 8 sections: `HeroSection (→Hero3D+TextReveal)`, `StatsSection`, `ServicesSection`, `ProjectsSection`, `AboutSection`, `CalculatorSection`, `ArticlesSection`, `ContactSection`, plus page-level `CursorGlow`, `FloatingParticles`, `MouseRipple`, `GradientMesh` and `ScrollProgress` from parent layout. Slogan `طلوع آفتاب، از خانه شماست` is not yet in code — current hero title/subtitle come from `SiteSettings.hero_title/hero_subtitle` (`ابـر انرژی`, tagline). No search in header beyond nav; login/register in header; brand/logo from `SiteSettings.logo`; floating category cards/special-offer panel/discount price/original crossed-out/left-right controls/category nav/carousel are **absent** (future). `ScrollReveal` staggers per section; `AboutSection` parallax uses `useScroll`. All sections fetch via `useSiteSettings/useServices/useFeaturedProjects/useArticles` with `CardLoading/ErrorState`. Homepage is visually rich but content-static; CMS ordering/featured/special-offer require new `HomepageSection` or `SiteSettings` extensions.

---

## 18. Product Current State

**Entirely missing.** No `apps/products/`, no `Product/Category/Subcategory/Image/Document/Attribute/Specification/Price/Discount/Relation` models, no serializers/views/urls/admin/migrations, no `productsApi` hooks, no `Product` TS type, no routes `/products/*`, no carousel, no pricing UI. Only `is_featured` on articles/services/projects and `calculator.estimated_cost` hint at featured/pricing patterns. Target tree (see §6.2) requires fresh domain: 4 parents (Solar Packages→6 leaves incl. solar+battery/inverter logic, Emergency Power→4 leaves, Structures→3, MEP Support→4 inc Profile/PipeClamp/CableTray/Fittings) — cannot map to `ServiceCategory`.

---

## 19. Services Current State

Model `Service` + `ServiceCategory` + `ServiceTranslation` (500-char title/slug, short/description, meta) with `status active/inactive`, `is_featured`, `order`, `icon`, `features JSON`, `image MediaFile`. API `GET /services/?lang=&category=&search=&ordering=` public, write `IsAdminUser`. Serializers search `title/short_description` but `Service` has no title (translation) — broken search same as articles. Pages `services/ + services/[slug]/` (client) and admin CRUD `admin/services/* + admin/service-categories`. `ServicesSection` on homepage shows 3 featured services with 3D tilt; full list page is ready but CMS lacks rich scheduling and SEO rendering. Reusable as inspiration for product category ordering.

---

## 20. Projects Current State

`Project` + `ProjectImage` + `ProjectTranslation` keyed by `project_type on/off/hybrid/large_scale` (maps to target 4 types incl. MEP) and `status planning/in_progress/completed/on_hold/cancelled`. Fields `location 500, capacity kW, service_category FK, start/end, is_featured, completion%`. Images `ProjectImage` with `is_cover` ordering `[-is_cover,order]`. API `GET /projects/ + /featured/ + by-type`, search `title/location` broken on title. Pages `projects/ + projects/[slug]/` (client) + admin CRUD. Featured projects drive `ProjectsSection` 3-card grid. Ready; product-system can copy its gallery+translation pattern.

---

## 21. Downloads Current State

**Absent.** No downloads app/model/route/API. Target: two catalog PDFs (Solar Plant, Modular Support). `MediaFile` supports `pdf/zip` etc., but no `DownloadCategory/Document` with versioning, no `/downloads` page, no gated access. Closest is `Gallery` + `SiteSettings` files. Future likely `ProductDocument` with `product FK, file FK MediaFile, doc_type catalog/manual/datasheet, version, locale` + `/downloads` grouped page.

---

## 22. Calculator Current State

`apps/calculator/models.py:CalculationHistory` stores `session_id/city/daily_consumption/irradiation/battery_type/system_type/panel_capacity/panel_count/battery Ah/inverter kW/estimated_cost IRR/roi`. Logic `calculator.py: PANEL_STANDARDC_POWER 550W (typo), PANEL_EFFICIENCY 0.85, DOD {lead .50 lithium .90 tubular .70}, COST_PER_KW_PANEL 15M, COST_PER_KWH_BATTERY 5M, COST_PER_KW_INVERTER 8M, ELECTRICITY_RATE 800`. Only `calculate_off_grid()` implemented despite `system_type on/hybrid` field. API `POST calculator/off-grid/ AllowAny` creates history (user or session `X-Session-ID`/random uuid) + `GET calculator/history/` (auth or session) + `admin/calculator/history/`. Frontend `calculator/page.tsx` with Recharts results; homepage `CalculatorSection` is CTA only. Missing: on-grid/hybrid formulas, input validation hardening, results caching.

---

## 23. Contact Current State

Two models: `ContactRequest (full_name/email/phone/subject/message/request_type contact/consultation/design_request, status pending/in_review/completed/rejected, assigned_to, admin_note)` and `ProjectInquiry (name/phone/email/city/project_type on/off/hybrid/large_scale, estimated_capacity kW, message, status new/contacted/in_design/quoted/accepted/rejected, assigned_admin)`. API `POST contact/ + POST project-inquiry/ AllowAny` creates notification to admins + `log_activity`; admin lists `IsAdminUser`/`IsEngineer` with inconsistent assign guards and **invalid `completed` status bug on inquiry**. Pages `contact/page.tsx` (RHF+Zod) + admin `contacts/inquiries`. System is production-ready after fixing the status bug and missing `captcha/rate per IP` for open endpoints.

---

## 24. Performance Audit

| # | Finding | Severity | Location | Fix |
|---|---------|----------|----------|-----|
| 1 | N+1 translations — `get_translation(lang)` per field, no `prefetch_related('translations')` — 20 rows ≈200 queries | CRITICAL | `apps/articles/api/v1/serializers/article.py:58-135`, `services:35-105`, `projects:19-80` | `queryset.prefetch_related('translations')` + `select_related` already present |
| 2 | Refresh wiring broken — `POST /auth/refresh/` returns 400 (login view), 401 loop after 15 min | CRITICAL | `apps/users/api/v1/urls/auth_urls.py:10` vs `abr-energy-frontend/src/api/axios.ts:59` | Point to `TokenRefreshView` |
| 3 | Search broken — `search_fields=[title,…]` on parent without `title` | HIGH | `apps/articles/api/v1/views/article.py:42` + services/projects | Search `translations__title` or custom `SearchFilter` |
| 4 | Related articles overfetch — fetch all `/articles/` then `slice 0,3` | HIGH | `abr-energy-frontend/src/app/[locale]/(public)/articles/[slug]/page.tsx:30-35` | `GET /articles/?category=<slug>` |
| 5 | Images unoptimized — raw `<img>` everywhere, no `next/image`, no `srcset/sizes/remotePatterns` | HIGH | `components/home/*`, `gallery/page.tsx:93`, `projects/[slug].tsx:66` | `next/image` + `images.remotePatterns=[{hostname: localhost}]` |
| 6 | Heavy bundle — `three/fiber/drei/framer-motion/recharts/tiptap` on home, no `next/dynamic` | HIGH | `package.json:17-50`, `HeroSection` + `RichTextEditor` | `dynamic(() => import('@/components/home/Hero3D'),{ssr:false})` etc. |
| 7 | `view_count F()+1` per anon retrieve no throttle/cache — inflation | MEDIUM | `apps/articles/api/v1/views/article.py:70` | IP throttle or cache key |
| 8 | Sitemap `lastModified: new Date()` + indexes private routes, no cache | MEDIUM | `src/app/sitemap.ts:6-26` | Dynamic slugs, exclude auth/dashboard, cache 1h |
| 9 | Fonts blocking `@import` Google CSS full weights | MEDIUM | `src/app/globals.css` | `next/font/google` `Source_Sans_3/Lexend` display swap subset latin |
| 10 | `LargePagination` defined unused; global `PAGE_SIZE 20` fine | LOW | `apps/core/pagination.py` | Wire or delete |
| 11 | `backdrop-blur` + noise + canvas overuse on low-end | LOW | `globals.css`, `FloatingParticles/EnergyBackground` | Respect `prefers-reduced-motion` (already present — verify) |
| 12 | No `CACHES`, no `cache_page`, no query cache headers | LOW | `config/settings/base.py` | Add `CACHES {default: RedisCache from REDIS_URL}` in Phase 2 |

DB indexes are healthy (`users[email,role]`, `articles[status,publish_date]`, `media[file_type,subfolder]`). Query `select_related/prefetch` is correct except translations.

---

## 25. Security Audit

| # | Area | Finding | Severity | Location |
|---|------|---------|----------|----------|
| 1 | XSS stored | `dangerouslySetInnerHTML` on 3 client detail pages renders TipTap HTML raw, no `bleach/DOMPurify` | HIGH | `articles/[slug]/page.tsx:1`, `services/[slug]:78`, `projects/[slug]:77` |
| 2 | Upload | `svg/zip/rar/txt/doc/xls/ppt/video` allowed by ext only; SVG can carry `<script>`; no size/MIME/virus, `MEDIA_URL` served in DEBUG | HIGH | `apps/media_manager/models.py:14`, `views/media.py:13`, `config/urls.py:31`, `base.py:226` |
| 3 | JWT refresh | Wrong view → broken rotation → forced logout | HIGH | `auth_urls.py:10`, `api/axios.ts:59` |
| 4 | CORS | `CORS_ALLOWED_ORIGINS` env ignored, hardcoded localhost | MEDIUM | `config/settings/base.py:175` vs `.env.example` |
| 5 | JWT storage | `localStorage access+refresh` XSS theft; no `httpOnly` | MEDIUM | `stores/auth-store.ts`, `api/axios.ts` |
| 6 | Enum | `User.objects.get(email=...)` before auth — timing oracle | MEDIUM | `apps/users/api/v1/views/auth.py:19` |
| 7 | Upload perms | `MediaFile upload IsAuthenticated` — any customer can upload | MEDIUM | `apps/media_manager/api/v1/views/media.py:15` |
| 8 | CSRF | `CsrfViewMiddleware` on but JWT is header-based — safe; `TRUSTED_ORIGINS` localhost only | LOW | `base.py:188` |
| 9 | Admin exposure | `/admin/` + `/api/docs/` public without IP clamp | LOW | `config/urls.py:13, schema` |
| 10 | Rate | `anon 100/h user 1000/h` no per-view login throttle/captcha/lockout on `register/contact/inquiry` | MEDIUM | `base.py:143`, `contacts/views` |
| 11 | Secrets | `SECRET_KEY insecure-dev-key...` fallback, `db.sqlite3` committed, `.env.example DEBUG True` | LOW (dev) | `.env.example`, `base.py:16` |
| 12 | Role escalation | Verify `UserSerializer.role` is `read_only` else `PATCH /users/me/` self-promote | MEDIUM | `apps/users/api/v1/serializers/user.py` |

No `django-bleach`, `nh3`, or `dompurify` installed. No WAF. Prod `production.py` `SSL/HSTS/SESSION/CSRF SECURE` is correct when env is set.

---

## 26. Testing Audit

| Layer | Tool | Config | Tests Found | Verdict |
|-------|------|--------|-------------|---------|
| Backend | pytest + pytest-django + cov | `pytest.ini: testpaths apps/ --reuse-db --nomigrations -v`, `conftest.py` empty, `config/settings/test.py` PG+MD5+locmem+eager | `apps/users/tests/test_models.py` 4 tests (create_user/superuser/str/is_admin), `apps/articles/tests/test_models.py` stale (calls `Article(title=…)` on missing field), `apps/calculator/tests/test_calculator.py` 5 pure-function tests | **Zero API/permission/i18n/media integration tests**; no coverage gate; 3 root `urllib` live scripts not collected |
| Frontend | ESLint | `eslint.config.mjs` `next/core-web-vitals+typescript`, `ignoreDuringBuilds false` | No `*.test.tsx/*.spec.*`, no vitest/jest/playwright/cypress | **No tests at all** |
| Scripts | — | `package.json {dev,build,start,lint}` only | No `typecheck/test/coverage` | Add `tsc --noEmit` + vitest + playwright in Phase 2 |
| CI | — | No `.github/workflows` | — | **No CI**; roadmap lists GitHub Actions future |

Current health: **lint passes, build minimal, coverage effectively 0.** Project is not safe for unattended refactors.

---

## 27. Technical Debt

### 27.1 Must Fix Before CMS (blocks products/homepage)

| # | Debt | File |
|---|------|------|
| 1 | Wire `POST auth/refresh/` → `TokenRefreshView`; fix axios `refresh` key | `auth_urls.py:10`, `axios.ts:59` |
| 2 | `prefetch_related('translations')` on all article/service/project lists + details | `apps/*/api/v1/views/*.py` |
| 3 | Fix `search_fields` to `translations__title` or disable search until custom filter | `apps/*/views/*.py` |
| 4 | Lock `media upload` to `IsAdminUser`/`IsContentManager`, add size/MIME, block/sanitize `svg`, set `is_temp` + orphan cleanup signal | `media_manager/views+models.py` |
| 5 | Sanitize TipTap HTML with `bleach` or `nh3` before save + before `dangerouslySetInnerHTML` with `DOMPurify` | `apps/*/translation_models.py`, `*[slug]/page.tsx` |
| 6 | Fix `ProjectInquiry mark_completed→completed` invalid status (→`accepted` or new `completed`) | `apps/contacts/admin.py`, `models.py` |
| 7 | Respect `CORS_ALLOWED_ORIGINS` env, fix `DATABASES` to read `DB_*` env (keep SQLite fallback only if `DB_NAME` blank) | `config/settings/base.py:79-181` |
| 8 | Fix `docker-compose.yml env_file` path (compose in `AbrEnergy/` vs docs `AbrEnergy/.env`) | `docker-compose*.yml` |
| 9 | Register `django_celery_beat` or remove `DatabaseScheduler` ref; wire or remove beat service | `config/settings/base.py`, `docker-compose.prod.yml` |
| 10 | Remove `db.sqlite3` from repo + `.gitignore` it | `.gitignore`, `db.sqlite3` |
| 11 | Verify `UserSerializer.role read_only` | `apps/users/api/v1/serializers/user.py` |

### 27.2 Should Fix During CMS

Content/engineer write perms for taxonomy/services/projects; real `password-reset` email/token flow; admin server guards (`generateMetadata notFound`, 401 redirect with locale); `next/image` + `dynamic import` for `Hero3D/TipTap/recharts`; related via `?category`; fonts via `next/font`; dynamic sitemap + `not-found.tsx` + `canonical/hreflang/JsonLd`; `LargePagination` wired or deleted.

### 27.3 Can Defer

Granular `Product/SEO/Media/Project/Service/Editor/Viewer` roles, approval `pending_review` workflow, S3/CDN, Redis `CACHES`, notification emails, `is_temp` age-based cleanup cron, PWA/offline, multi-tenant.

### 27.4 Cosmetic

Version skew `package 0.1.0` vs badge `0.2.0` vs `CHANGELOG 1.0.0`; inline `bg-black` vs theme tokens; remaining physical `mr/ml` vs logical `ms/me`; `lastModified now`; `english_check.txt` scratch files.

---

## 28. Missing Capabilities

Against the future target (§6.2) — **verified absent, not assumed:**

| Capability | Missing What |
|------------|--------------|
| Products | App, Category/Subcategory tree, Product + Translation, Image gallery, Document attachments, Attribute/Spec, Price, Discount, Relations, Featured, Publishing/scheduling, Revisions, Search/filter/sort |
| Homepage CMS | Hero slogan/CTA/images CMS, floating category cards CMS, special/instant-offer panel CMS, product carousel CMS with nav/price/original-crossed/discount, configurable ordering, reusable blocks |
| Navigation/menus | No `Menu/MenuItem` model for `PRODUCTS/SERVICES/PROJECTS/DOWNLOADS/CALCULATOR/CONTACT` |
| Downloads | No `Download/Catalog` model, no `/downloads` page |
| Calculator | No `on_grid/hybrid` mode, no city irradiation table |
| SEO | No `SeoMeta` per URL, no `sitemap dynamic`, no `JsonLd/breadcrumbs/canonical/hreflang/redirects` |
| Media | No `next/image` optimization, no thumbnails generation, no orphan GC, no gallery ordering drag-drop |
| Rich blocks | No `ContentBlock`/`ReusableBlock` (CTAs, FAQs, tables) |
| Draft/publish/schedule | No `pending_review`, no `published_at scheduling`, no `history`/`revisions` |
| Audit | No `django-simple-history` field diffs; only `ActivityLog` high-level |
| Search | No full-text (PG `tsvector`) or Algolia; only broken `SearchFilter` |
| Roles | No per-object, no Viewer/Editor, no approval queue |
| i18n future | Active switcher but needs Persian-only mode via `activeLocales` |

---

## 29. Recommended CMS Architecture

For **this** codebase (Django translation-table CMS already proven for 3 content types + React admin dashboard with TipTap/MediaUpload):

### Option A — Django Admin-centered

*Keep CMS entirely inside `django.contrib.admin`.*

**Pros:** Zero new frontend; leverages existing `ModelAdmin` registrations. Fast for tabular content.  
**Cons:** Poor rich-text/galleries/drag-drop/image previews; translations are clunky as inlines; product UX (attributes/specs/price/discount/stock) is tabular hell; designer/RTL preview impossible; non-technical editors hate it.

### Option B — Custom React Admin Dashboard

*Move all CMS to Next.js `admin/*` (already 14 pages), Django exposes only API.*

**Pros:** Reuses existing React dashboard (14 pages, DataTable, TipTap, MediaUpload), gallery ordering, image previews, language tabs — best editor UX; translations as tabs are proven; product carousel preview can be live.  
**Cons:** Requires building server guards + validation parity; Django Admin stays needed for users/logs/raw FKs; two surfaces to secure.

### Option C — Hybrid (RECOMMENDED)

*React dashboard for editors (products, articles, services, projects, gallery, homepage blocks, menus, SEO); Django Admin for technical/admin ops (users, groups, raw MediaFile, ActivityLog, site secrets).*

**Advantages for this codebase:**

* Reuses the stronger surface (React admin already has richer UX than Django Admin) — least code to reach product CMS.
* Translation-table pattern maps 1:1 — just add `ProductTranslation`.
* Gallery/attribute/spec tables are already modeled as `*Image` + `*Translation` — proven.
* Django Admin stays for super-admin tasks without rebuilding user/role/security UI.
* Homepage preview: React can render `Hero3D`/`ScrollReveal`/carousel live against draft content.
* Permissions: backend `IsProductManager` etc. gate both surfaces consistently.

**Disadvantages:** Two permission surfaces to keep in sync; API must enforce what UI disables; search/filter duplication.

**Recommendation: C — Hybrid.** Introduce no new framework; extend existing `adminApi` namespace with `admin/products/*`, keep Django Admin for `users, ActivityLog, SiteSettings` secrets, and drive product catalog entirely through the React dashboard.

---

## 30. Recommended Product Architecture

Conceptual model WITHOUT migrations (Phase 0 proposal):

```
ProductCategory (tree)
  id UUID, title* (via translation), slug unique, parent self FK children,
  level smallint (root/category/subcategory), order int, is_active,
  image FK MediaFile, meta_title/descr/schema_json/canonical,
  created_at, translation table ProductCategoryTranslation(language fa/ar/en, title 500, slug 500, description Text, meta_*)
  indexes [parent,order], [is_active,order]
  maps to PRODUCTS target tree (4 parents, 13+ leaves)

Product
  id UUID, category FK ProductCategory CASCADE (subcat), brand Char 100 blank,
  sku Char 64 unique blank, status draft/published/scheduled/archived default draft,
  is_featured bool, is_special_offer bool (drives instant-offer panel),
  view_count int, order int, featured_order int nullable,
  primary_image FK MediaFile SET_NULL, gallery via ProductImage,
  search_vector PG tsvector (future), schema_json, created/updated/publish_date

ProductTranslation
  product FK CASCADE, language fa/ar/en db_index, title 500, slug 500 unique per language,
  short_description 1000, description Text (TipTap → sanitized), excerpt Text blank,
  meta_title/descr, unique product+language

ProductImage
  id UUID, product FK CASCADE related=images, media_file FK MediaFile CASCADE,
  is_primary bool, alt 500, order 0, uploaded_at, ordering [order]

ProductDocument
  id UUID, product FK CASCADE related=documents null (catalogs can be global),
  media_file FK MediaFile CASCADE, doc_type choices [catalog,datasheet,manual,warranty] db_index,
  title 255, version Char 20, is_active, order, uploaded_at

ProductAttribute  (filterable traits e.g., power: 5kW, warranty: 25y)
  id UUID, title 255 unique, slug 255 unique, filterable bool default True,
  values via ProductAttributeValue

ProductAttributeValue
  id UUID, attribute FK CASCADE, product FK CASCADE related=attribute_values,
  value Char 500, language fa/ar/en

ProductSpecification  (tabular specs)
  id UUID, product FK CASCADE related=specifications, key Char 255, value Text,
  order 0, language fa/ar/en (or key translated via attribute)

ProductPrice  (separate from Product — recommended)
  id UUID, product FK CASCADE related=prices (history), currency Char 3 default IRR,
  amount Decimal 15,0, is_active bool, effective_from DateTime, created_at
  current price = latest active row; allows history without rewriting Product

ProductDiscount  (separate — time-boxed)
  id UUID, product FK CASCADE related=discounts, discount_type percent/fixed,
  value Decimal, starts_at DateTime, ends_at DateTime, is_active,
  computed fields: original_price, discounted_price, has_discount bool

ProductRelation
  id UUID, source FK CASCADE, target FK CASCADE, relation_type [related/accessory/up_sell/cross_sell],
  order 0, unique source+target

SEO (generic one-to-one per product translation or path)
  seoable GenericFK or product FK, meta_title/descr, canonical_url, og_image FK MediaFile,
  schema_json, robots_tag, hreflang handled by frontend metadata

Publishing / Draft
  status on Product + publish_date + scheduled job (Celery beat) flips scheduled→published;
  revision via django-simple-history (future) or ActivityLog snapshot; no delete — archive.
```

**Price/discount placement:** Separate models (`ProductPrice`, `ProductDiscount`) — not fields on `Product` — because the codebase already isolates i18n into `*Translation` and images into `*Image`; pricing history/discount windows need versioning and time constraints without mutating the product row. `discounted_price = price - (percent? price*value/100 : value)` computed in serializer.

---

## 31. Recommended Homepage Architecture

Drive homepage from CMS without hardcoding business content:

| Section | Target UI | Data Source | Variant |
|---------|-----------|-------------|---------|
| Slogan | `طلوع آفتاب، از خانه شماست` + sub-slogan | `SiteSettings.slogan_fa` (or new `HomepageSettings.slogan`) | B config + A ordering |
| Hero | 3D sphere/particles + headline/CTA + bg | `SiteSettings.hero_title/subtitle/background_image` extended with `HomepageHero {title, subtitle, cta_label, cta_href, bg FK MediaFile, order}` | B CMS content, A structural wrapper |
| Floating category visuals | 4+ cards (Solar Packages etc.) | `ProductCategory where level=root, is_active` with `card_image FK MediaFile, icon` | B configurable (add `card_image` to category) |
| Instant/special offer | Left featured product + price/original-crossed/discounted + nav | `Product where is_special_offer=True, is_featured order featured_order limit 1` | C ordering, B content (flag) |
| Featured carousel | Horizontal `ProductCard {image, title, price, original_price crossed when discount}` × visible 4 responsive | `Product where is_featured=True order featured_order` + `ProductDiscount` window | C ordering, B content |
| Category nav | Pills linking to `/products/<slug>` | `ProductCategory roots` | A structure, B labels from translations |
| Services | 3-col with tilt hover | `Service where is_featured` (existing) | B selection + C ordering |
| Solar calculator CTA | Button → `/calculator` | `HomepageSection{type=calculator_cta, title, subtitle, cta}` | B |
| Projects (optional) | Featured grid | `Project where is_featured` | B |
| Contact + Footer | Info + links + socials | `SiteSettings {phone/email/address/socials/footer_text}` | B |

**Config split:**
- A hardcoded structural UI: layout grid, animation wiring (`ScrollReveal`, `CursorGlow`, responsive breakpoints, nav chrome).
- B CMS-configurable content: all text/images/prices/CTAs/floating card choices/special-offer assignment.
- C configurable ordering: `order`/`featured_order` on categories/products/sections; admin drag-drop (future) reorders `order`; homepage serializes `HomepageSection[] order asc`.
- D reusable blocks: `ContentBlock {key, title, body TipTap, media FK}` for CTAs/FAQs/testimonials shared across pages.

Scaffold as `apps/homepage/` with `HomepageSection`, `HomepageHero`, `FeaturedProductOrder` or extend `SiteSettings` with `homepage_sections JSON` if migrations must be minimal — prefer dedicated tables for queryability.

---

## 32. Migration / Refactoring Risks

| Risk | Trigger | Impact | Mitigation |
|------|---------|--------|------------|
| N+1 query storm on product lists | Product image + price + discount + translations joins | API 10× slower | `prefetch_related('translations','images__media_file','discounts','prices')` + `select_related` |
| SVG XSS via legacy `MediaFile` | New product galleries serve old SVGs | Site compromise | Migration to sanitize/delete SVGs + block ext; serve with `Content-Disposition: attachment` |
| Slug collision across languages | `Translation.slug` not globally unique | 404/301 wrong | Add `UniqueConstraint(language, slug)` per translation app; migration with slug dedup |
| Schedule flip race | `publish_date` without beat | Draft stays scheduled | Wire `django_celery_beat` + periodic `publish_scheduled()` |
| Price history break | Moving price to `ProductPrice` table | Frontend `product.price` undefined | Keep `Product.current_price @property` fallback; serializer `price/discounted_price/has_discount` stable key |
| Discount window timezone | `Asia/Tehran` vs UTC | Wrong discounted_price | Store `starts/ends At` tz-aware; compute in serializer with `timezone.now()` |
| Media disk orphan spike | `products` adds many images | Disk full | Pre-add cleanup signal + `is_temp` retention; move to S3 in Phase 3 |
| `search_fields title` migration | Fix search to `translations__title` | Old `?search=foo` URLs break | Backwards-compat filter param `q` → custom `FilterSet` |
| Frontend `localStorage` token theft after product traffic rise | Higher XSS surface | Auth hijack | Phase 1 add `httpOnly refresh` cookie path (requires backend change) |
| Hardcoded SQLite → Postgres switch | Enabling real PG | Migration drift | `makemigrations --check` in CI; single `DATABASE_URL` switch |

---

## 33. Proposed Future Phase Plan

Phase 0 is this report. Do NOT implement yet.

### Phase 1 — Stabilization & Backend Foundation (1-2 weeks)
**Objective:** Eliminate critical/high risks; make API/frontend stable for CMS build.
**Backend:** Fix `auth/refresh` → `TokenRefreshView`; fix `search_fields`; add `prefetch_related('translations')`; lock media upload perms + size/MIME/svg; `bleach` sanitization; fix `ProjectInquiry completed`; respect `CORS_ALLOWED_ORIGINS`/`DATABASES` env; fix compose `env_file` + celery_beat; add `CACHES Redis`; verify `UserSerializer.role read_only`.
**Frontend:** Add `next/image remotePatterns` + `dynamic()` for `Hero3D/TipTap/recharts`; `DOMPurify` before `dangerouslySetInnerHTML`; fix `related` fetch to `?category`; `next/font` fonts; fix `CORS` drift.
**DB/Admin:** Remove `db.sqlite3` from repo; no new models yet (scaffold `apps/products/__init__.py` only).
**UI/UX:** Preserve all animations; no redesign.
**Testing:** Add pytest API smoke (auth, article list, media upload deny), add `tsc --noEmit`; no coverage gate yet.
**Dependencies:** None.
**Risks:** PG switch requires `migrate`.
**Deliverables:** CI-passing `main` with zero CRITICAL findings; refreshed JWT works 24h test.

### Phase 2 — CMS Core (Products, Categories, Homepage Blocks) (3-4 weeks)
**Objective:** Greenfield `products` domain + CMS CRUD via hybrid admin.
**Backend:** New `apps/products` with models in §30 + `apps/homepage` (`HomepageSection/Hero/FeaturedOrder`); serializers `get_translation` + `price/discounted` computation; views `AllowAny` read / `IsProductManager` write; pagination/filter `category/subcategory/search/q/price_min/max/is_featured/is_special_offer` + `ordering`; admin `ProductAdmin` in Django for raw FKs; `drf-spectacular` docs.
**Frontend:** `admin/products/*` (list/new/[id]/[id]/edit) + `admin/product-categories` + `admin/homepage` (drag-drop order, TipTap for product description, MediaUpload galleries); `adminApi.products`; `useProducts` hooks; locale tabs per product; validation Zod.
**DB:** Single migration `products.0001 + homepage.0001`; add `UniqueConstraint(language,slug)` across translations.
**Admin/CMS:** Hybrid polished — React dashboard is editor surface, Django Admin for users/logs.
**UI/UX:** Introduce `ProductCard` (image/title/price/original-crossed/discounted), `CategoryCard` (floating visual) — reuse `GlassCard` + `ScrollReveal`.
**Testing:** pytest product/category CRUD + permission matrix + published vs draft visibility; frontend vitest for hooks.
**Dependencies:** Phase 1 stable.
**Risks:** Translation N+1 must stay fixed; seed data for 4×13 tree.
**Deliverables:** CMS creates products/categories/discounts/featured ordering end-to-end.

### Phase 3 — Product Catalog & Special-Offer UI (2-3 weeks)
**Objective:** Public `/products/*` routes + special-offer panel.
**Backend:** Seed target tree from §6.2; `ProductDocument` catalogs; full-text `search_vector` (optional); sitemap dynamic includes product slugs; `sitemap.xml` cache 1h; `JsonLd` for Product.
**Frontend:** `/products` (filters/sort/pagination), `/products/[category]/[subcategory]?` (breadcrumb), `/products/[slug]` (gallery, specs, docs, price/discount, related `ProductRelation`); homepage `SpecialOfferPanel` (left featured product + price/original-crossed/discounted) + `ProductCarousel` (embla-carousel-react — add only dependency; no Swiper) responsive 1/2/4 with nav; header mega-nav from `ProductCategory` roots; search input.
**DB:** Seed fixtures `fixtures/product_categories.json`.
**UI/UX:** Preserve `Hero3D/CursorGlow/particles`; carousel uses `ScrollReveal` + `transform/opacity` only; no new animation libs.
**Testing:** Playwright `homepage carousel nav + product detail 404 + search` e2e.
**Dependencies:** Phase 2 models.
**Risks:** Bundle growth from embla (~10k gz) — OK reason to add dep.
**Deliverables:** Target homepage composition (first reference image) CMS-driven, except slogan hardcoded fallback.

### Phase 4 — Product Carousel Behavior & Secondary Domains (2 weeks)
**Objective:** Nail second reference image behavior + services/projects/downloads polish.
**Backend:** `ServiceCategory` ordering exposed for homepage; `Download` model if not `ProductDocument`; `on_grid/hybrid` calculator formula + irradiation table.
**Frontend:** Carousel spec: image, title, price, original crossed when `has_discount`, discounted price, horizontal nav, multiple visible, responsive; `ServicesSection` data-bound; `Downloads` page grouped by category; `Calculator` tabs off/on/hybrid; `Projects` filters by 4 types.
**DB:** Small migrations for `calculator_city_irradiation` table.
**Testing:** Calculator unit + snapshot for carousel a11y (keyboard nav).
**Dependencies:** Phase 3.
**Risks:** Touch carousel performance — RAF-safe.
**Deliverables:** Second reference image behavior at pixel fidelity, calculator modes complete.

### Phase 5 — SEO, Media, Publishing Workflow (2 weeks)
**Objective:** Production SEO + media hardening + publishing controls.
**Backend:** `SeoMeta` + `generateMetadata` parity; `sitemap` dynamic slugs (articles/services/projects/products) no private; `robots` + `hreflang`; `canonical/OG/twitter`; `schema.org Product/BreadcrumbList`; `History`/`django-simple-history` optional; `draft→pending_review→published→archived` + beat scheduler.
**Frontend:** All detail pages convert to `generateMetadata` (RSC) with client islands only for interactivity; `next/image` everywhere; `next/headers` cookie locale for SEO; 404/breadcrumbs structured data.
**Media:** Pillow compress + thumbnails on upload, orphan GC, S3 config stub (keep local default).
**Testing:** Lighthouse CI (perf/SEO/a11y), `next build` bundle check.
**Dependencies:** Phase 3-4.
**Risks:** `'use client'` → RSC migration may expose hydration bugs.
**Deliverables:** Crawler clean, thumbnails served, publishing schedule live.

### Phase 6 — Persian-Only Lock & i18n Future-Proof (1 week)
**Objective:** Expose Persian only without destroying future ar/en.
**Backend:** No change (keeps 3 translations).
**Frontend:** `activeLocales=['fa']`, hide globe/pill switcher conditionally, keep `locales/*.json` + tabs, add `generateStaticParams` guard, `Accept-Language` forced `fa`.
**Testing:** `middleware` redirect `/en/→/fa/` when `activeLocales` locked; locale persistence.
**Dependencies:** Phase 5.
**Risks:** None if pattern kept.
**Deliverables:** UI is `fa` only, future `ar/en` is a one-line flip.

### Phase 7 — Hardening & Observability (1 week)
**Objective:** Ship-ready.
**Backend:** Per-view login throttle + honeypot/captcha on `contact/inquiry/register`; `httpOnly refresh` cookie option; `Sentry` traces; `gunicorn` + `Nginx` prod smoke; `pytest-cov 80%` on API.
**Frontend:** `headers` CSP/HSTS, `next/font` subset, `next/image` CDN, bundle budget, `vitest` + `playwright` CI.
**Dependencies:** All prior.
**Deliverables:** `docker-compose.prod.yml` + CI GitHub Actions + runbook.

---

## 34. Dependencies Between Phases

```
Phase 1 (stabilization) ────────────────────────────────────────────┐
     │ fixes refresh, prefetch, upload, sanitize, CORS, DB         │
     ▼                                                             │
Phase 2 (CMS core: products/categories/homepage blocks)            │ Phase 1 required; no product UI before models
     │ models+migrations+admin                                    │
     ▼                                                             │
Phase 3 (catalog + special-offer UI) ◄─────────────────────────────┘ reuses homepage animation comps; seeds tree
     │ public routes + embla carousel                              │
     ▼                                                             │
Phase 4 (carousel behavior + downloads/calculator polish) ──────────┘ needs Phase 3 carousel + seeds
     │
     ▼
Phase 5 (SEO/media/publishing) ── needs products+dynamic slugs; can overlap 4 tail
     │
     ▼
Phase 6 (fa-only lock) ── trivial, needs SEO urls finalized
     │
     ▼
Phase 7 (hardening/CI) ── needs all surfaces
```

Critical path: 1→2→3→4→5→6→7. No phase can be skipped; 4+5 may run overlapping tails after 3 delivers carousel scaffold.

---

## 35. Open Questions / Decisions Needed

| # | Question | Why It Matters | Default If Unanswered |
|---|----------|----------------|-----------------------|
| 1 | Product pricing currency — IRR only or IRR+USD? | Determines `ProductPrice.currency` + serializer | IRR only |
| 2 | Stock/inventory — track quantities or showcase only? | Adds `Stock` model + admin | Showcase only (no stock) — ponytail comment |
| 3 | Discount source — CMS manual or synced price sheet? | Discount model + bulk import | CMS manual percent/fixed |
| 4 | Product SEO slugs — `/products/<category>/<slug>` or flat `/products/<slug>`? | URL + canonical + sitemap | Flat `/products/<slug>` + breadcrumb, category pages as filters |
| 5 | Catalog downloads — public or auth-gated? | `Download` perms | Public (no auth) |
| 6 | Calculator irradiation — static table or admin-editable per city? | `CityIrradiation` model | Static fixtures, admin-editable later |
| 7 | Image storage — local `MEDIA_ROOT` or S3/minio from Phase 5? | Deploy + `next/image` loader | Local Phase 2-5, S3 switch without migration via `DEFAULT_FILE_STORAGE` |
| 8 | Publishing approval — single editor publish or review queue? | `pending_review` state | Single editor (add queue when requested) |
| 9 | Rich text sanitizer — backend `bleach` allowlist? | XSS vs feature | `bleach` with `p,br,strong,em,a[href],ul/ol/li,h2/h3,img[src,alt],table` |
| 10 | Carousel count on homepage — 4 visible desktop, 2 tablet, 1 mobile? | Carousel breakpoints + embla options | 4/2/1 as reference image |
| 11 | Floating category visuals — category `card_image` or dedicated `HomepageCard`? | §31 architecture | `card_image` on `ProductCategory` |
| 12 | Legacy article gallery — migrate `ArticleImage` to `MediaFile` pattern for products or keep both? | Reuse vs duplicate | Keep `ArticleImage` pattern for `ProductImage` |
| 13 | Auth refresh fix — fix URL only or move to `httpOnly` cookie now? | Phase 1 scope | Fix URL only in Phase 1, `httpOnly` in Phase 7 |
| 14 | `downloads` taxonomy — reuse `ProductCategory` roots or separate `DownloadCategory`? | IA | Reuse `ProductCategory` + `ProductDocument.doc_type=catalog` |
| 15 | Decision: Confirm hybrid CMS (React dashboard + Django Admin) | Architecture lock | C — Hybrid (this report's recommendation) |

---

*End of report — `docs/reports/phase-00-discovery-report.md`. No files modified, no migrations created, no UI redesigned, floating grids/scroll/hover/carousel components preserved as documented.*

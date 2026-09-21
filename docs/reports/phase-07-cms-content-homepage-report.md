# Phase 7 — CMS Content & Homepage Management Report

Date: 2026-09-21. Baseline: Phase 06.1 COMPLETE (backend 115 passed,
frontend 145/145, tsc 0 errors, ESLint 0 errors / 55 warnings, prod `/fa`
200). All nine prerequisite reports (00, 01, 02, 03, 04, 05.1, 05.2, 06,
06.1) were read before any change, followed by a live-code audit whose
findings are recorded in `docs/reports/phase-07-preflight.md`. No
implementation step was taken on guesswork and no fake site content was
created at any point.

## 1. Executive Summary

Phase 7 turns the hardcoded homepage into a CMS-driven homepage without
changing its design, animation system, or visual output. Delivered:

- **New `apps.homepage` backend app** (8 models, 1 migration): a
  `HomepageConfig` singleton (hero CTAs, calculator/contact CTAs,
  articles count, 7 SEO fields), an 8-row `HomepageSection` table
  (visibility + numeric order + title/subtitle/content per section),
  five relation tables (featured products, categories, services,
  projects, pinned articles — relation/order/visibility ONLY, all
  display data read from the existing sources of truth), and
  `HomepageVisual` floating visuals (MediaFile FK + alt + order +
  enabled + optional link).
- **Two new endpoints, zero breaking changes:** public
  `GET /api/v1/homepage/` (composed, prefetched, strictly
  public-filtered payload) and admin
  `GET/PUT/PATCH /api/v1/admin/homepage/` (`IsContentManager`,
  replace-on-update relation semantics borrowed from Phase 4).
- **Homepage Studio** at `/admin/content/homepage`: Hero, Sections,
  Visuals, Featured Products, Categories, Services, Calculator,
  Projects, Articles, Contact, and SEO cards reusing Product-Studio
  language (Cards, Inputs, MediaUpload `subfolder="homepage"`, sticky
  save bar, `beforeunload` dirty guard, sonner toasts, best-effort DRF
  error mapping, RTL patterns). Save + Save & continue.
- **Homepage integration with zero visual change:** every home section
  accepts optional CMS props and falls back to its pre-CMS data source;
  sections render in CMS `order`; CMS-disabled sections return `null`;
  `generateMetadata` prefers CMS SEO with the static Persian copy as
  fallback; the brand slogan `طلوع آفتاب، از خانه شماست` is the seeded
  hero default and was not altered.
- **Verification:** backend **139 passed** (115 prior intact + 24 new),
  frontend **173/173** (145 prior intact + 28 new), `tsc` 0 errors,
  ESLint 0 errors / 55 warnings (baseline count, zero in Phase 7
  files), `next build` success, production `next start` `/fa` 200 with
  all regression checks green, live admin write → public read round-trip
  verified and reverted. Live PostgreSQL verified (dev `abrenv_db`);
  Redis still absent locally (same as Phases 1–6.1, untouched).

## 2. Preflight Findings

Recorded in full in `docs/reports/phase-07-preflight.md` (15 sections).
Key outcomes:

1. No homepage/CMS app existed (backend grep `homepage`: 0 hits);
   the closest editable inputs were the read-only settings view and
   product `is_featured` flags.
2. All display models were reusable as-is (`Product` +
   `public_product_qs()`, `ProductCategory`, `ProductPrice.get_effective()`,
   `Service`, `Project`, `Article`, `MediaFile`, `SiteSettings` for
   contact info). No model needed extension; relation tables were the
   only genuine requirement.
3. `Service`/`Project` public list endpoints return `.all()` with no
   status filter, so the homepage composer applies its own filters
   (`Service: status=active`; `Project: exclude cancelled`) without
   touching the existing endpoints.
4. `SiteSettings` (super-admin-only writes) was rejected as the
   homepage store: wrong permission gate and wrong cohesion. A generic
   block-builder was rejected as out of scope (§36).
5. Translation tables were deferred for homepage copy (fa-direct fields,
   SiteSettings pattern); ar/en tables, middleware, and locale JSONs are
   intact.

## 3. Architecture Decision

`apps.homepage`: `HomepageConfig` singleton (pk=1 code-enforced,
`load()`, mirroring `SiteSettings`) + `HomepageSection` rows (copy /
visibility / ordering) + relation tables without a homepage FK
(singleton scope — documented) + `HomepageVisual`. Public composer
`build_homepage_payload(language)` serializes nested entities through
their EXISTING list serializers (`ProductListSerializer`,
`CategoryTreeSerializer`, `ServiceListSerializer`,
`ProjectListSerializer`, `ArticleListSerializer`), so no price, slug, or
visibility rule is duplicated. Frontend consumes one `useHomepage`
query; each section keeps its old hook as fallback. Rejected
alternatives and rationale are logged in the preflight report §9/§15.

## 4. Models Added/Changed

Added (`AbrEnergy/apps/homepage/models.py`, all new — no existing model
touched):

- `HomepageConfig`: hero eyebrow + primary/secondary CTA
  (label/url/enabled, defaults `/products`, `/calculator`), calculator
  CTA (label/url), contact CTA (label/url) + secondary CTA (label/url),
  `articles_count` (default 3), SEO
  (`seo_title/seo_description/canonical_url/robots/og_title/
  og_description/og_image FK`), `updated_at`. `save()` forces the
  singleton row and runs `full_clean`; `load()` is `get_or_create`.
- `HomepageSection`: `key` (8 choices, unique), `enabled`, `order`,
  `title` (500), `subtitle` (500), `content` (text). Ordering
  `order, key`. Seeded defaults mirror the live `home.*` strings so the
  first render is identical to the pre-CMS page.
- `HomepageFeaturedProduct` / `HomepageCategory` / `HomepageService` /
  `HomepageProject` / `HomepageArticle`: `OneToOneField` to the source
  model (`CASCADE`, duplicate-proof at the DB level) + `order` +
  `enabled`. Ordering `order, id`.
- `HomepageVisual`: `image` FK `MediaFile` (`CASCADE`) + `alt` + `order`
  + `enabled` + `link_url` (blank; relative `/…` or http(s), same rule
  as CTAs).
- `validate_cta_url`: blank, site-relative `/…` (no `//`), or http(s).

Changed: none (no existing model, manager, or queryset was modified).

## 5. Migrations

- `apps/homepage/migrations/0001_initial.py`: 8× `CreateModel` only.
  Genuinely required (new domain). `makemigrations --check`: **No
  changes detected**. `migrate`: applied cleanly on the dev PostgreSQL
  database (`abrenv_db`).
- No data migration: bootstrap is code-level (`load()` +
  `ensure_default_sections()`, idempotent, never updates/deletes).
- No destructive operation was run (no flush, no delete-all, no drop).

## 6. API Endpoints

| Method | URL | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/homepage/` | AllowAny | Composed public payload (`hero, sections, featured_products, categories, services, calculator, projects, articles, contact, visuals, seo`) |
| GET | `/api/v1/admin/homepage/` | IsContentManager | Studio read (config + sections + relations with resolved fa titles + visuals with URLs) |
| PUT/PATCH | `/api/v1/admin/homepage/` | IsContentManager | Studio write (scalar fields + `sections_data` partial row updates + full-replace `*_data` relations + `visuals_data`) |

Conventions kept: manual `path()` mounts in `config/api_v1.py`,
`?lang=` → `Accept-Language` → `fa` language context, no success
envelope (bare `Response`, like `dashboard_stats`), `AllowAny` public
reads, role-gated writes. Existing `site-config/` responses are
byte-identical (untouched files).

## 7. Admin Routes

| Route | File | Guard |
|---|---|---|
| `/admin/content/homepage` | `admin/content/homepage/page.tsx` | existing admin shell (`MANAGER_ROLES`); write buttons additionally gated by `canManageHomepage` (same set; backend authoritative) |

Sidebar: new `admin.homepage` entry first under `admin.nav_content`
with a `Home` icon mapping in `admin/layout.tsx`. No existing nav item
moved, renamed, or removed.

## 8. Permissions

- Public payload: `AllowAny` (same as catalog/service/project/article
  public reads).
- Studio read+write: `IsContentManager` (super_admin, website_admin,
  content_manager) — the same gate as the product/category admin APIs.
  Anonymous → 401/403 (verified live: 401); customer → 403 (tested);
  engineer → 403 (tested, backend + UI helper).
- No new roles, no per-field split (deferred per Phases 2–4
  convention; SEO fields share the content gate exactly like Product
  Studio).
- `IsOwner` untouched (still dead). No permission regression: full
  prior auth/user suites pass unmodified.

## 9. Homepage CMS Sections

`HomepageSection` rows (`hero 10`, `featured_products 20`,
`categories 30`, `services 40`, `calculator 50`, `projects 60`,
`articles 70`, `contact 80`): Studio edits `enabled` (switch),
`order` (numeric + up/down, renumbered in tens on move), `title`,
`subtitle`, and `content` only where rendered (calculator/contact
descriptions). The public homepage renders sections in CMS `order`
(`HomepageClient`); disabled sections return `null`. AboutSection is
settings-driven and keeps its slot after categories (it is not a CMS
section — no fake CMS control was invented for it).

## 10. Hero CMS

Studio controls: eyebrow, primary CTA (label/url/enabled), secondary
CTA (label/url/enabled); title/subtitle live on the `hero` section row
(title default = `طلوع آفتاب، از خانه شماست`, verified live). Hero
keeps `Hero3D`, solar-grid overlay, gradient veils, scroll parallax,
`TextReveal`, chips, and both CTA styles; external (`http…`) CTA URLs
render as `target=_blank rel=noopener` anchors, internal URLs as Next
`Link`. Empty CMS strings fall back (slogan → `home.hero_slogan`,
lead → `settings.hero_subtitle || home.hero_lead`); a disabled hero
renders nothing.

## 11. Floating Visuals

`HomepageVisual` rows managed in the Studio (MediaUpload
`subfolder="homepage"`, alt, optional link, up/down order, enable
switch). Public `visuals[]` carries resolved `image_url`s. The new
`FloatingVisuals` component renders NOTHING when empty (pre-CMS hero
output byte-identical); with visuals it shows up to 4 decorative
`next/image` floats at two preset slots (`hidden md:block`,
`pointer-events-none`, `aria-hidden`, gentle framer float, static under
`prefers-reduced-motion`). `link_url` is stored/API-exposed but
deliberately NOT rendered (a focusable link inside `aria-hidden`
decorative content would be an a11y violation) — documented in code for
a future accessible treatment. No pixel editor, per scope.

## 12. Featured Products

`HomepageFeaturedProduct` (OneToOne → duplicate-proof) holds CMS order;
the public composer filters the selection through `public_product_qs()`
(published + public + active) and serializes with `ProductListSerializer`,
so `ProductCard` + `ProductPrice` (backend `get_effective()`, zero
client math) render unchanged. Draft/archived/hidden/inactive selections
silently vanish from public output (tested ×4). Empty selection →
section hides (no fake products).

## 13. Categories

`HomepageCategory` holds CMS order; composer filters `is_active=True`
and serializes with `CategoryTreeSerializer` (active children included,
mirroring the rail). No title/slug/cover duplication — all copy comes
from the category rows. Empty → section hides. Inactive selections
excluded (tested).

## 14. Services

`HomepageService` holds CMS order; composer filters `status=active`
(the existing public endpoint has no such filter, so it is applied here
without modifying that endpoint). Serialized with
`ServiceListSerializer`; cards link `/services/<slug>` with backend
title/short. Inactive selections excluded (tested). No Service model
created or changed.

## 15. Projects

`HomepageProject` holds CMS order; composer excludes `cancelled` (the
model has no draft/hidden/inactive state; the existing public endpoints
expose the same set, so nothing is hidden that was previously public).
Serialized with `ProjectListSerializer` (cover/capacity/type/location
from the row). Empty → section hides. No capacities or results invented.

## 16. Articles

Pinned `HomepageArticle` rows render first (published-only); remaining
slots up to `articles_count` (0–12, validated both ends) fill with the
latest published articles (`-publish_date, -created_at`). Drafts never
leak (tested). Zero pins + empty blog → section hides. Serialized with
`ArticleListSerializer`; cards unchanged.

## 17. Calculator

Studio manages the teaser title/subtitle/description (section row) +
CTA label/URL (config). No calculation logic entered the CMS; the
teaser links `/calculator` (default) and the calculator page is
untouched. Disabled → section hidden.

## 18. Contact

Studio manages title/subtitle/description + primary/secondary CTA
labels/URLs. Phone/email/address/socials stay in `SiteSettings` and the
contact page/Footer — verified: no contact detail field exists on any
homepage model. Disabled → section hidden.

## 19. SEO

Homepage carries the Product/Category 7-field SEO shape
(`seo_title/seo_description/canonical_url/robots×4/og_title/
og_description/og_image` + resolved `og_image_url`). Studio SEO card
reuses the category-editor pattern (60/160-char discipline stays
editorial; robots 4-way select; `MediaUpload` OG image). Public
`generateMetadata` uses `fetchHomepage()` + `buildHomepageMetadata`
(translated-meta→object-SEO→fallback priority adapted: CMS SEO →
static Persian fallback; `fa_IR`; absolutized OG via `resolveMediaUrl`;
editor-set canonical otherwise `${site}/fa`; 4-way robots). Server fetch
is `revalidate: 300` with try/catch fallback (never-500s, sitemap
pattern). Sitemap/robots files untouched and still 200.

## 20. Media Management

All Phase 1/2 enforcement preserved verbatim (MIME + Pillow + 10 MB
images, `%PDF-` + 25 MB PDFs, SVG blocked, `IsContentManager` upload).
Homepage passes `subfolder="homepage"` through the existing generalized
`MediaUpload` prop — no upload code changed. Visuals/OG store FKs only.
`resolveMediaUrl` + `next/image` pipeline reused for floating visuals
(absolute backend URLs required by the optimizer).

## 21. Frontend Integration

- `useHomepage` (`['homepage']`, `staleTime` 5 min) +
  `useAdminHomepage` / `useUpdateAdminHomepage` (invalidate
  `admin-homepage` + `homepage` on save) in `src/hooks/use-api.ts`;
  `homepageApi`/`adminHomepageApi` in `src/api/index.ts`; types in
  `src/types/index.ts`.
- `HomepageClient` (`(public)/homepage-client.tsx`) renders CMS-ordered
  sections; `(public)/page.tsx` is now metadata + `<HomepageClient/>`.
- Each section (`Hero`, `FeaturedProducts`, `ProductRail`, `Services`,
  `Projects`, `Articles`, `Calculator`, `Contact`) accepts optional CMS
  props with full fallback to its pre-CMS source. No animation, theme,
  RTL, or layout code was altered; `CursorGlow` needed no change (its
  color map already covers the section keys).
- After integration, no dynamic copy (hero title/subtitle, CTA labels,
  featured/category/service/project/article selections, contact CTA,
  SEO) is hardcoded — presentation constants (animation timings,
  gradients, chips icons) intentionally stay in code.

## 22. Empty States

Disabled section → `null`. CMS payload absent/failed → pre-CMS sources
render (page never depends on the CMS to paint). Empty relations →
section hides. Empty DB (live dev state) → hero + copy render, rails
hide, no crash (verified live: all `counts: 0`, `/fa` 200). No
`setTimeout` fake loading; existing `CardLoading`/`ErrorState` paths
kept for the fallback hooks.

## 23. Bootstrap/Seed

`HomepageConfig.load()` (`get_or_create`) +
`ensure_default_sections()` (creates only missing keys, never updates
or deletes) run inside both public and admin views — verified live:
first `GET /api/v1/homepage/` on the empty dev DB returned the 8
default sections with the exact slogan. No management command, no
fixture, no flush, no delete-all, no production reset. Product/service/
project seeding was NOT performed (no approved seed data exists — no
fake content).

## 24. Security

- Anonymous admin access → 401 (live); customer/engineer writes → 403
  (tested); viewer has no write path.
- Public payload exposes ONLY public rows (products via
  `public_product_qs`; categories active; services active; projects
  non-cancelled; articles published). Admin-only price internals never
  enter the composer (list serializers only — the detail/admin price
  fields are not in the shape; covered by the no-leak test).
- CTA/`link_url` validation rejects `javascript:`, `ftp:`, `//host`,
  and bare strings (tested ×4); external URLs render with
  `noopener noreferrer`.
- No `dangerouslySetInnerHTML` added (section `content` renders as plain
  text); no SVG/media change; CSRF/CORS/auth stacks untouched.

## 25. Performance / Query Analysis

Composer reuses `public_product_qs()` prefetch and mirrors the
services/projects/articles view querysets (`select_related` FKs +
`prefetch_related` translations/images/tags). Admin title resolution
uses `select_related` + `*_translations` prefetch. Regression guard:
`test_query_count_stays_flat` builds 5 products + 3 categories + 3
services + 3 projects + 3 articles and asserts the public payload at
**< 60 queries** (Phase 0 territory was ~200 for a 20-item list).
Public query is cached client-side 5 min (`staleTime`) and server-side
300 s (`revalidate`). No new caching architecture (deferred per scope).

## 26. Responsive Verification

Code-verified (no new layout vectors introduced): Studio uses
`grid-cols-1 lg:grid-cols-[1fr_300px]`, `grid sm:grid-cols-2` for
CTA pairs, `flex-wrap` sticky bar, `max-h-48 overflow-auto` pickers;
homepage sections keep their existing breakpoints (rails
`overflow-x-auto snap-x`, grids `1→sm:2→lg:3/4`, `flex-wrap` CTAs,
`overflow-hidden` sections). Floating visuals are `hidden md:block`.
Target widths 360/390/768/1024/1280+ inherit the Phase 6 responsive
behavior (no shared-CSS change). Physical device-lab pass remains
operator-side, consistent with Phases 5.1–6.

## 27. Animation Regression

Verified via production markup + build: exactly one `h1`, RTL,
Hero3D `<canvas>` present, all 8 `data-section` blocks present, slogan
in `<title>`, no English fallback, no invented stats, `fa_IR` +
canonical meta present. Untouched and still mounted: Hero3D, CursorGlow,
FloatingParticles, MouseRipple, GradientMesh, ScrollReveal, TextReveal,
hero/about parallax, services tilt, ScrollProgress, PageTransition.
New motion is limited to existing primitives (section entrances already
in the components; decorative visual float via framer, static under
reduced motion). No hydration errors (build prerender OK), no console
errors introduced (no new client-only APIs), no canvas failure (Hero3D
untouched), no layout shift (aspect-boxed `next/image` only where a
visual exists; empty → no DOM).

## 28. Backend Tests

`AbrEnergy/apps/homepage/tests/test_phase7.py` — 24 tests:

- Singleton/bootstrap (4): pk-singleton, 8-section idempotent seed,
  slogan default, section ordering.
- Hero/CTA validation (3): round-trip, https accepted, 4 bad URLs 400.
- Featured products (3): CMS ordering + disabled exclusion, OneToOne
  duplicate `IntegrityError`, draft/archived/hidden/inactive exclusion.
- Categories/services/projects/articles (4): category order + inactive
  exclusion, service active-only, project cancelled-excluded,
  article pinned-first + draft-excluded + latest-fill fallback.
- SEO (2): persistence round-trip to public payload, bad robots 400.
- Permissions (3): manager read+write, customer 403/403, anon 401/401
  + public 200.
- Public shape (4): 11-key shape + 8 sections + CTA object shape,
  disabled flag surfaced, no draft leakage, < 60-query guard.

## 29. Frontend Tests

4 new files, 28 new tests (all passing, no prior test weakened):

- `lib/homepage.test.ts` (8): section lookup/enabled tri-state,
  `homepageCopy` fallback, metadata fallback/CMS-priority/robots×4/OG
  gating.
- `lib/homepage-form.test.ts` (9): hydration, payload shape + order
  renumber, empty-row dropping, count normalization, `reorderItems`
  incl. out-of-range, DRF error flattening.
- `components/homepage/homepage-studio.test.tsx` (8): section card
  toggle/order-input/content gating, visuals add/remove, picker
  empty→search→add→duplicate-guard→reorder→remove.
- `lib/homepage-locale.test.ts` (3): 66 fa keys present, ar/en parity,
  Studio nav entry + `canManageHomepage` role matrix.
- `config/navigation-cms.test.ts` (+1): Studio route live.

## 30. Runtime Verification

Production `next start -p 3100` + Django `:8000` (dev PostgreSQL):

| Check | Result |
|---|---|
| `GET /fa` | 200, one `h1`, RTL, slogan in title, canvas, no fallback, no stats, all 8 sections |
| `GET /api/v1/homepage/` | 200, 11 keys, 8 default sections, slogan exact match, empty relations on fresh DB |
| Admin write (temp content-manager, JWT) | PATCH eyebrow/SEO/count → 200; public reflects; **reverted**; temp user deleted |
| Anonymous `GET/PATCH /api/v1/admin/homepage/` | 401/401 |
| `GET /fa/admin/content/homepage` | 200 shell |
| `/sitemap.xml`, `/robots.txt` | 200/200 |
| Homepage `<title>`/OG/canonical | brand title, `fa_IR`, canonical present |

## 31. Known Limitations

1. Live PostgreSQL verified for dev only (`abrenv_db`); PG-specific
   DDL beyond the standard `0001` relies on prior-phase coverage.
2. Redis absent locally (connection refused) — same as Phases 1–6.1;
   no homepage path uses Celery/Redis.
3. `resolve` slug-namespace, bulk-update slug history, and
   category-translation slugs: unchanged Phase 5.2 behavior.
4. `link_url` on visuals is stored/exposed but not rendered (a11y —
   §11); pixel-position editing deferred per scope.
5. Physical device/RTL-visual QA is operator-side (§26).
6. SEO char-counters are editorial (no hard limit — same as
   Product/Category studios).
7. Picker search has no debounce (fires per keystroke, cached —
   acceptable at CMS scale, same as Product Studio).

## 32. Deferred Items

Draft/preview tokens, scheduled publishing, campaigns/banners,
multilingual homepage copy (ar/en activation), A/B content,
Elementor-like builder, approval workflow, cart/checkout/orders/
payment, per-field permissions, drag-drop ordering, advanced DAM,
Redis/auth rewrites, Product Studio rewrite, visual redesign,
animation rewrite, CKEditor 4→5 migration (see §34). All explicitly out
of scope (§36) — architecture notes for preview/draft readiness: the
`enabled` flags + `sections` ordering + singleton `load()` give a
future draft table a clean join point without reshaping.

## 33. Files Changed

Backend new — `AbrEnergy/apps/homepage/`: `apps.py`, `models.py`,
`services.py`, `admin.py`, `api/v1/serializers/homepage.py`,
`api/v1/views/homepage.py`, `api/v1/urls/public_urls.py`,
`api/v1/urls/admin_urls.py`, `migrations/0001_initial.py`,
`tests/test_phase7.py` (+ `__init__.py` chain).

Backend modified — `config/api_v1.py` (2 mounts), 
...[truncated 3881 chars]

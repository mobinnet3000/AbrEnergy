# Phase 5.2 — Catalog SEO & Technical Polish Report

Date: 2026-09-20. Baseline: Phase 5.1 COMPLETE (backend 97 passed, frontend 99/99,
tsc 0 errors, ESLint 0 errors / 67 warnings, `next build` success). All six
prerequisite reports (00, 01, 02, 03, 04, 05.1) were read before any change.

## 1. Executive Summary

Phase 5.2 hardens the public Persian-only product catalog technically and for SEO
without changing the visual direction, CMS architecture, homepage architecture,
Product API contract shape, authentication, or design system. Delivered:

- **Task A (Product OG image):** public `ProductDetailSerializer` now exposes
  `og_image` + `og_image_url`, mirroring `CategorySerializer`. Serializer-only;
  no migration (the `Product.og_image` FK already existed).
- **Task B (Dynamic sitemap):** `src/app/sitemap.ts` rewritten — fa-only static
  public routes (admin/dashboard/auth removed) + dynamic `/fa/products/<slug>`
  and `/fa/products/category/<slug>` entries from live backend data, with
  visibility predicates, `fa`-only URLs, and dedupe.
- **Task C (Slug history/redirects):** new reusable `SlugHistory` model
  (one migration, justified) with automatic recording on slug change and two
  public canonical-first resolve endpoints; frontend server pages issue a
  permanent (308) redirect for old slugs only.
- **Task D (Narrow `next/image`):** migrated exactly 3 spots — ProductCard
  cover, ProductGallery hero + thumbnails, category-client cover — with
  env-driven `remotePatterns`; everything else stays `<img>`.
- **Tasks E/F/G (Metadata/robots/canonical):** OG priority fixed
  (`og_image_url` → cover → first image), absolute OG URLs, `metadataBase`
  (env-driven), OG `fa_IR` locale, self-referencing index canonical,
  locale-aware `robots.ts` (previously ineffective for `/fa/admin/...`).
- **Task H:** operator device-lab checklist (§11), with verified-by-tests vs
  operator-side explicitly separated.

Verification: backend **115 passed** (97 prior intact + 18 new), frontend
**121/121** (99 prior intact + 22 new), `tsc` 0 errors, ESLint 0 errors /
63 warnings (67 → 63; the 4 removed are exactly the migrated catalog images),
`next build` success, `manage.py check` 0 errors (2 pre-existing warnings),
`makemigrations --check` clean. Live PostgreSQL/Redis NOT verified (no
creds/infra) — same limitation as Phases 1–5.1; backend suite runs on SQLite
via a throwaway settings module (deleted after the run, as in Phase 5.1).
Production `next start` smoke-tested via curl: `/sitemap.xml`,
`/robots.txt`, `/fa/products`, and an old-slug detail URL all 200 without
crashes. No homepage file was touched; no featured-products rail was built
(explicitly deferred to the dedicated Homepage phase).

## 2. Scope

In scope (this phase only): A — product OG image API; B — dynamic sitemap;
C — slug-history/redirect foundation; D — narrow `next/image`; E — SEO
metadata hardening; F — robots.txt review; G — URL/canonical audit;
H — device-lab-ready checklist. Every meaningful change has tests (§12).

## 3. Explicitly Deferred Work

- **Homepage redesign** — untouched (no edits under `src/components/home/`,
  `(public)/page.tsx`, Hero3D/CursorGlow/particles/ripple/gradient/
  ScrollReveal/TextReveal/parallax/tilt).
- **Homepage featured product rail** — NOT implemented in this phase per the
  phase brief; `useFeaturedPublicProducts` remains wired but unrendered (as in
  Phase 5.1) for the dedicated Homepage phase.
- **Cart/checkout/orders/payment** — not started; no models, routes, or UI.
- **Arabic/English catalog UI** — `activeLocales=['fa']` kept; ar/en
  translation tables, locale infra, and locale files intact; sitemap and
  metadata emit fa-only URLs by design.
- **Unrelated CMS work** — Product Studio, Category Studio, roles,
  permissions, and existing public services/projects/articles behavior
  unchanged (articles/projects/services dynamic sitemap entries deferred;
  only their existing index URLs are listed statically).

## 4. Product OG Image

- **Problem (Phase 5.1 §24/§26):** `CategorySerializer` exposed `og_image` +
  `og_image_url`, but public `ProductDetailSerializer` exposed neither, so
  product metadata fell back to `cover_image_url || images[0]`.
- **Implementation:** `Product.og_image` FK (`products_as_og`) already existed,
  so this is a serializer-only additive change — no migration, no removed or
  renamed fields, no reshaped response data:
  - `ProductDetailSerializer` gains `og_image` (FK id, `ModelSerializer`
    default) + `og_image_url` (`SerializerMethodField`, same
    try/except-`""` pattern as categories).
  - `public_product_qs()` adds `select_related("og_image")` (single join,
    avoids per-object query); `CategoryDetailView` queryset adds
    `select_related("cover", "og_image")` for the same single-object reason.
- **API fields (public detail, additive):** `og_image: <uuid-string> | null`,
  `og_image_url: <string, "" when unset>`. The frontend `ProductDetail` type
  already declared both — the type is now accurate, no type change needed.
- **Security/public visibility:** endpoint stays `AllowAny`; no admin-only
  price inputs leak (test asserts all 8 `price_*` keys plus `relations_admin`
  absent); no unpublished/private media exposure (OG URL derives from the
  existing `MediaFile` FK); translation behavior untouched.
- **Tests:** `test_phase5_2.py::PublicProductOgImageTest` (4 tests): OG
  exposed when configured (id + `/media/…png` URL shape); `null`/`""` when
  absent; admin fields absent + full contract field list present;
  unauthenticated 200.

## 5. Sitemap

- **Architecture:** native Next.js App Router `src/app/sitemap.ts` (async).
  No duplicate system — the previous static-only file was rewritten, not
  supplemented. Server fetch uses native `fetch` with `revalidate: 3600`
  (same pattern as `product-metadata.ts`; no new HTTP client). Pagination
  walks `page_size=100` (== `StandardPagination.max_page_size`) up to 50
  pages; handles both paginated `{results}` and plain-array shapes; any
  backend failure yields static-only entries (sitemap never 500s).
- **Included routes:** `/fa` (1.0/weekly), `/fa/{about,services,projects,
  articles,gallery,calculator,contact}` (0.8/monthly), `/fa/products`
  (0.9/daily), plus dynamic `/fa/products/<slug>` (0.8/weekly,
  `lastModified` = product `updated_at`) and
  `/fa/products/category/<slug>` (0.7/weekly). Static `products` entry is
  kept so the index URL survives backend outages (deduped otherwise).
- **Excluded routes:** everything admin/dashboard/auth (`/admin/`,
  `/dashboard/`, `/login`, `/register`, `/forgot-password` and locale
  variants) — the old sitemap wrongly emitted all of these in 3 locales.
  Articles/projects/services dynamic detail URLs are NOT included (no
  pre-existing per-item sitemap architecture; inventing their backend fetch
  here would exceed catalog scope — deferred, existing index URLs kept).
- **Public visibility rules:** predicates in `src/lib/catalog-sitemap.ts`
  mirror the backend (`status=published && visibility=public && is_active`
  + non-empty slug for products; `is_active` + slug for categories) as
  defense in depth over the already-filtered public endpoints.
- **Locale behavior:** `CATALOG_LOCALE='fa'`; no ar/en URLs generated
  (verified by test + live curl: zero `/ar/`, `/en/` entries).
- **Canonical behavior:** sitemap URLs are built from live canonical slugs
  (`productUrl`/`productCategoryUrl`); they match the route URLs the
  redirect logic targets (§6) and the self-referencing index canonical (§8).
- **Tests:** `catalog-sitemap.test.ts` (9): URL builders + namespace
  distinctness; all six eligibility combinations (draft/archived/hidden/
  inactive/empty-slug excluded); index+category+product inclusion; fa-only
  assertion; cross-namespace dedupe; tree flattening. Live curl: 200,
  no `/admin`/login/ar/en entries, `/fa/products` present.

## 6. Slug History

- **Model/design (new, minimal, reusable):** `apps.products.SlugHistory`
  — `target_type` (`product`|`product_category`), `object_id` (UUID),
  `language` (translation language for products; `""` for categories, whose
  public URL resolves the non-translated `ProductCategory.slug`),
  `old_slug`, `created_at`. `UniqueConstraint(target_type, language,
  old_slug)` + index `(target_type, object_id)`, ordering by
  `created_at, id`. No existing slug-history abstraction was found
  (verified by grep: only `TranslatedSlugDetailMixin` exists) — this is the
  smallest mechanism covering both models, exactly per the suggested
  locale/slug/ownership/id/created_at/index shape.
- **Ownership:** one row per previous slug string per namespace; canonical
  slug always stays on the model/translation; history rows are never
  canonical.
- **Recording:** `ProductTranslation.save()` and `ProductCategory.save()`
  compare the pre-save DB slug and call idempotent `record_slug_history()`
  (lazy import — `models.py` imports `translation_models` at its bottom, so
  a top-level import would be circular). `ProductCategoryTranslation.save()`
  is intentionally NOT hooked: public category lookup uses the model slug.
  Bulk queryset updates bypass `save()` and record nothing (documented;
  slug changes must go through the model/CMS API).
- **Redirect behavior:** public resolve endpoints
  `GET /api/v1/products/resolve/?slug=<old>` and
  `GET /api/v1/product-categories/resolve/?slug=<old>` (static routes placed
  BEFORE `<str:slug>` so `resolve` is never captured as a slug). Order:
  current canonical hit → return it (idempotent); else history hit (exact
  language, fa fallback for products) → owner's CURRENT canonical slug; else
  404. Visibility enforced via `public_product_qs()` / `is_active` — drafts,
  archived, hidden, inactive, and deleted owners 404. Frontend server pages
  (`products/[slug]/page.tsx`, `category/[slug]/page.tsx`) fetch canonical
  first and `permanentRedirect()` (308) ONLY when canonical misses AND
  resolve returns a DIFFERENT slug — current slugs render normally, unknown
  slugs keep the existing `NotFoundState`.
- **Collision handling:** first owner wins; `record_slug_history()` refuses
  to steal (returns `None`, never raises — no 500 path); canonical-first
  ordering means history can never shadow a live URL (incl. the
  A→B→A rename-back case and the shared product/category slug namespace,
  both tested).
- **Visibility rules:** resolve endpoints are `AllowAny` but only ever
  return slugs of publicly visible records.
- **Tests:** backend 14 (history create/no-op-on-create/no-op-on-resave,
  old→canonical, idempotent current, unknown 404, missing-param 400,
  draft+hidden+inactive non-leak, en-locale + fa-fallback scoping,
  first-owner-wins, category record/resolve/deactivate, unknown category,
  cross-namespace coexistence) + frontend 4 (`resolvePublicProductSlug` hit
  path incl. endpoint URL shape, 404→null for both kinds).
- **Migration status:** `0002_slughistory.py` (CreateModel only) — genuinely
  required (new model); `makemigrations --check` clean afterwards.

## 7. Next/Image

- **Files migrated (3, narrow scope):** `ProductCard.tsx` (cover),
  `ProductGallery.tsx` (hero + thumbnails), `category-client.tsx`
  (category cover). `ProductCategoryCard` has no image (folder icon) —
  nothing to migrate; `product-detail-client` has no direct `<img>`.
  All other repo `<img>` usages intentionally untouched.
- **Files intentionally not migrated:** every admin/dashboard/CMS page,
  articles/projects/services/gallery public pages, homepage sections,
  `media-upload`, `rich-text-editor`, `product-media-manager` (CMS previews)
  — out of catalog scope; 15 `no-img-element` warnings remain there by
  design (goal was never "zero warnings").
- **Config changes:** `next.config.ts` keeps localhost/127.0.0.1:8000
  `/media/**` entries and additionally derives a NON-local API host from
  `NEXT_PUBLIC_API_URL` (protocol/host/port, `/media/**` only — no
  wildcards, no hardcoded CDN). New `src/lib/media-url.ts`:
  `resolveMediaUrl()` (relative `/media/…` → absolute API origin; absolute,
  data:, blob: passthrough; `""` for empty — REQUIRED for `next/image`,
  which cannot optimize relative backend paths) and env-driven
  `siteUrl()`/`apiBaseUrl()` reused by sitemap/robots/metadata (extends
  utilities instead of duplicating).
- **Preserved:** 4:3 aspect (fill inside `relative aspect-[4/3]` wrappers —
  `relative` added where missing), object-cover, hover zoom, eager hero
  (`priority`, former `loading="eager"`) vs lazy cards/thumbs, backend alt
  text (decorative `""` kept for thumbs), RTL gallery interaction
  (untouched logic), responsive `sizes`, no layout shift (aspect boxes).
- **Loading behavior:** card cover lazy (default), gallery hero `priority`,
  thumbnails lazy (default), category cover `priority` (above-fold).
- **Lint warning delta:** 67 → **63** warnings, 0 errors. `no-img-element`:
  19 → 15; the 4 removed are exactly ProductCard(1) + Gallery(2) +
  category-client(1); migrated files now have zero warnings; NO new
  warnings introduced anywhere.
- **Tests:** `product-card.test.tsx` / `product-gallery.test.tsx`
  src assertions updated to loader-URL containment (implementation change,
  allowed); `media-url.test.ts` (5 new).

## 8. Metadata

- **Product:** priority unchanged (translated `meta_*` → object `seo_*` →
  safe fallback); OG image priority FIXED to `og_image_url` (new Task A
  field) → `cover_image_url` → `images[0]` → none; OG URLs absolutized via
  `resolveMediaUrl` (backend returns relative `/media/…`).
- **Category:** unchanged priority; `og_image_url || cover_image_url`
  (already correct); URLs absolutized the same way.
- **Products index:** title/description unchanged + new self-referencing
  canonical (`<site>/fa/products` — static known route, safe).
- **Canonical:** detail pages keep backend-driven canonicals only (emitted
  when editors set `canonical_url`; never invented). Sitemap URLs (§5) match
  these route URLs.
- **Robots (tags):** 4-way `robots` mapping unchanged and tested.
- **OG:** `og:title`/`og:description` dedicated-wins-fallback preserved;
  `locale: 'fa_IR'` added (accurate: fa is the only active public locale;
  no alternate locales emitted since ar/en have no public URLs).
- **Locale:** metadata fetched with `Accept-Language: fa`; `metadataBase`
  added to root layout from `NEXT_PUBLIC_SITE_URL` (localhost fallback, no
  hardcoded prod domain) so relative OG URLs resolve absolutely.
- **Fallback priority:** verified by existing + 3 new tests (dedicated OG
  wins; cover fallback intact; relative→absolute; index canonical).

## 9. Robots.txt

Native `src/app/robots.ts` (no duplicate system). **Bug found and fixed:**
the old config disallowed only `/admin/` and `/dashboard/`, but admin/
dashboard live under the locale prefix (`/fa/admin/…`) — crawlers were NOT
actually blocked. Now disallows `/admin/`, `/dashboard/`, `/*/admin/`,
`/*/dashboard/`, `/*/login`, `/*/register`, `/*/forgot-password`; `Allow:
/`; `Sitemap: <site>/sitemap.xml` (env-driven). Live curl verified the
exact rendering. Tests: `robots.test.ts` (2).

## 10. URL / Canonical Audit

- `/fa/products`, `/fa/products/<slug>`, `/fa/products/category/<slug>`:
  no collision (`category` static segment wins; verified in route table +
  URL-builder test).
- Trailing slashes: no `trailingSlash` config on either side; frontend
  routes slashless, backend API trailing-slash — consistent within each
  layer, no redirect interplay (unchanged from 5.1).
- Old-slug redirects cannot loop: redirect fires only on canonical-miss +
  different-slug history hit; targets always resolve canonically (tested:
  idempotent current-slug case returns equal slug → no redirect).
- `resolve` is a reserved static subpath under both catalog namespaces
  (same pre-existing pattern as `featured/`); a product/category literally
  slugged `resolve` would hit the resolver (400/404) instead of detail —
  documented, negligible, consistent with `featured/`.
- Metadata canonical == actual route for index; detail canonical ==
  editor-set URL when present; sitemap URLs == route URLs == redirect
  targets. No duplicate-canonical hazards introduced.
- SKU fallback preserved: serializer-level (`get_slug`/related) untouched;
  URL resolution remains translation-slug-first (unchanged mixin behavior).

## 11. Device-Lab Checklist

Status legend: **[T]** verified by code/tests in this environment,
**[O]** requires operator/device verification (no physical lab here).

Desktop [T]: index renders (build + 200 curl); filters/pagination logic
covered by Phase 5.1 tests (untouched); category page 200; detail 200;
gallery prev/next/thumbnail/keyboard (7 tests incl. RTL arrows);
documents/active-only + download links (Phase 5.1 tests); related slug
links (backend + frontend tests). [O]: visual pixel-check of filters,
pagination, PDFs opening, related cards on Chrome/Firefox/Safari.

Mobile [O]: horizontal category rail swipe, filter controls wrapping,
gallery touch buttons, spec/attribute stacking, CTA wrapping, zero
horizontal overflow (code uses `overflow-x-auto`, wrapping flex, no fixed
widths — [T] by inspection; needs a real viewport pass).

RTL [T]: gallery ArrowLeft/ArrowRight flip + Home/End (test), breadcrumb
`nav` + `aria-current`, `dir="ltr"` SKU/counter, `dir="auto"` user content,
Persian digits in counts/prices (tests), focus-visible rings on all new
interactive elements, price alignment classes untouched. [O]: screen-reader
pass (NVDA/VoiceOver), keyboard-only walkthrough, Persian-digit rendering
in with real fonts.

SEO [T]: title/meta/OG/canonical/robots unit tests; sitemap predicates +
live `/sitemap.xml` (fa-only, no admin/auth) + `/robots.txt` curl;
`metadataBase` set. [O]: view-source on staging with real backend data,
rich-results validation, crawler fetch of an old-slug URL expecting 308 →
canonical.

404 [T]: unknown product/category/historical slug → 404 backend + resolve
null → `NotFoundState` (tests); unknown-slug detail page SSR 200-shell curl
(no crash). [O]: visual 404 states on device.

## 12. Tests

- **Backend:** `python -m pytest apps/ -o
  DJANGO_SETTINGS_MODULE=config.settings.tmp_sqlite_52` → **115 passed**
  (97 Phases 1–5.1 intact + 18 new in `test_phase5_2.py`: 4 OG + 14 slug
  history/resolve). Temp settings module deleted after the run (as in 5.1).
- **Frontend:** `vitest run` → **20 files, 121/121 passed** (17 files /
  99 prior intact + 3 new files / 22 new tests: `media-url` 5,
  `catalog-sitemap` 9, `robots` 2, `product-metadata` +6; 2 existing
  catalog tests updated for `next/image` loader URLs).
- **TypeScript:** `tsc --noEmit` → **0 errors** (2 mid-phase errors fixed:
  category `updated_at` now uses build time; robots-test undefined guard).
- **ESLint:** `npm run lint` → **0 errors, 63 warnings** (baseline 67;
  −4 exactly the migrated catalog `no-img-element`s; zero new warnings;
  migrated files warning-free).
- **Build:** `npm run build` → **success**; all routes render incl.
  `/[locale]/products`, `/[locale]/products/[slug]`,
  `/fa` note: `/[locale]/products/category/[slug]`, plus `/robots.txt`
  and `/sitemap.xml`.

## 13. Full Verification Results

- Backend: 115 passed. `manage.py check`: 0 errors / 2 warnings (both
  pre-existing: ckeditor 4 EOL `ckeditor.W001`, missing `static/` dir
  `staticfiles.W004` — identical to Phases 1–5.1).
  `makemigrations --check`: **No changes detected** (exit 0, post-`0002`).
- Frontend: 121/121 Vitest; tsc 0 errors; ESLint 0 errors / 63 warnings;
  build success.
- Live smoke (production `next start -p 3210`, backend down — documents
  the offline fallback): `/sitemap.xml` 200 (9 static fa URLs, zero
  admin/login/ar/en, `/fa/products` present, no dynamic entries without
  backend — by design); `/robots.txt` 200 (locale-aware disallows +
  sitemap ref); `/fa/products` 200; `/fa/products/some-old-slug` 200
  shell (resolve-miss falls through to client `NotFoundState`, no crash).
- Live PostgreSQL/Redis NOT verified (no creds/infra) — same as Phases
  1–5.1. No fake verification: everything above ran in this environment
  with exact outputs.

## 14. Regression Verification

- Phase 2 Product API: prior suites pass (41 tests incl. in the 115);
  public contract extended additively only (detail +2 fields, 2 new
  `resolve/` GETs); list/tree/featured/admin serializers untouched.
- Phase 3 Category Studio / Phase 4 Product Studio: suites pass; no CMS
  file touched (only `save()` hooks added, behavior-compatible —
  `full_clean`/validation paths unchanged).
- Phase 5.1 public catalog: all 50 frontend + 4 backend tests pass
  unmodified in behavior (2 catalog tests updated ONLY for `next/image`
  loader-URL shape; same assertions otherwise).
- Auth/admin permissions: suites pass (6 auth + user model tests);
  resolve endpoints verified `AllowAny` without weakening any gate.
- Persian-only UI + ar/en architecture: `activeLocales=['fa']` untouched
  (`public-catalog-locale.test.ts` passes); locales JSON untouched;
  translation-table architecture extended, not altered.
- Homepage/Hero3D/CursorGlow/particles/ripple/gradients/ScrollReveal/
  TextReveal/parallax/tilt/theme: zero edits (file list §15; build output
  unchanged for `/fa`).
- Existing public pages (services/projects/articles/…) and CMS pages:
  untouched; build renders all pre-existing routes.

## 15. Files Changed

Backend (modified 6, new 2):

- `AbrEnergy/apps/products/models.py` — `SlugHistory` model,
  `record_slug_history()`, `ProductCategory.save()` history hook,
  `IntegrityError` import.
- `AbrEnergy/apps/products/translation_models.py` —
  `ProductTranslation.save()` history hook (lazy import, circular-safe).
- `AbrEnergy/apps/products/api/v1/serializers/products.py` —
  `og_image` + `og_image_url` on public `ProductDetailSerializer`.
- `AbrEnergy/apps/products/api/v1/views/products.py` —
  `ProductSlugResolveView` + `CategorySlugResolveView`,
  `select_related("og_image")` / `select_related("cover", "og_image")`.
- `AbrEnergy/apps/products/api/v1/urls/products.py` — `resolve/` route
  (before `<str:slug>`).
- `AbrEnergy/apps/products/api/v1/urls/categories.py` — `resolve/` route.
- `AbrEnergy/apps/products/migrations/0002_slughistory.py` — NEW.
- `AbrEnergy/apps/products/tests/test_phase5_2.py` — NEW (18 tests).

Frontend (modified 9, new 6):

- `abr-energy-frontend/next.config.ts` — env-driven `remotePatterns`.
- `src/app/layout.tsx` — env-driven `metadataBase`.
- `src/app/sitemap.ts` — async static+dynamic fa-only sitemap.
- `src/app/robots.ts` — locale-aware disallows.
- `src/lib/product-metadata.ts` — OG priority, absolute URLs, resolve
  helpers, index canonical, `fa_IR`, `apiBaseUrl` reuse.
- `src/lib/product-metadata.test.ts` — +6 tests.
- `src/components/products/public/ProductCard.tsx` — `next/image` cover.
- `src/components/products/public/ProductGallery.tsx` — `next/image`
  hero + thumbnails.
- `src/app/[locale]/(public)/products/[slug]/page.tsx` — 308 old-slug
  redirect.
- `src/app/[locale]/(public)/products/category/[slug]/page.tsx` — same.
- `src/app/[locale]/(public)/products/category/[slug]/category-client.tsx`
  — `next/image` category cover.
- `src/lib/media-url.ts` + `media-url.test.ts` — NEW.
- `src/lib/catalog-sitemap.ts` + `catalog-sitemap.test.ts` — NEW.
- `src/app/robots.test.ts` — NEW.
- `product-card.test.tsx`, `product-gallery.test.tsx` — loader-URL
  assertion updates.

No homepage, animation, theme, CMS, auth, admin, locale, or settings files
touched. (Note: the repo working tree contains uncommitted changes from
Phases 1–5.1; the list above is Phase 5.2 only.)

## 16. Migrations

- `0002_slughistory.py` — creates `SlugHistory` (fields, triple unique
  constraint, `(target_type, object_id)` index, ordering). Justification:
  Task C genuinely requires persistent history; no existing table could
  hold it (verified: no slug-history model/field/mixin anywhere).
- Task A required NO migration (`og_image` FK predates this phase).
- Post-migration `makemigrations --check`: clean (exit 0).

## 17. Known Limitations

- Live PostgreSQL/Redis unverified (no creds/infra); SQLite suite only —
  same as Phases 1–5.1. PG-specific DDL relies on prior-phase coverage;
  `0002` uses standard field types (safe).
- Dynamic sitemap entries require backend reachability at request time;
  otherwise static-only fallback (verified live).
- `resolve` slug namespace reservation (§10); bulk-update slug changes
  record no history (§6); category translation-slug changes are untracked
  (public category URLs use the model slug — documented assumption).
- Cross-language history resolution is per-language with fa fallback only
  (en old slug does not resolve under `lang=fa` — tested/documented).
- `next/image` remotePatterns bake at build time: production builds MUST
  have correct `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SITE_URL`, else catalog
  images fall back to broken optimization URLs (dev localhost verified).
- Physical device/RTL-visual QA is operator-side (§11).

## 18. Technical Debt Discovered

- Pre-existing, fixed here: `robots.ts` locale-prefix ineffectiveness (§9);
  static sitemap indexing admin/auth/ar-en URLs (§5); missing
  `metadataBase` (relative OG URLs); OG asymmetry (Task A).
- Pre-existing, left untouched: ckeditor4 EOL + `static/` warnings;
  `UserCreateSerializer` dead code; `LargePagination` unused;
  single-`category` filter (no multi-category); no `not-found.tsx`
  architecture (in-page `NotFoundState` pattern retained); category tree
  serializer lacks `updated_at` (sitemap uses build time — no invented
  dates); `db.sqlite3`-style local artifacts gitignored.

## 19. Deferred Work

Homepage redesign; homepage featured-products rail (dedicated Homepage
phase — hook ready, unrendered); cart/checkout/payment; ar/en catalog UI
(flip `activeLocales` + emit locale URLs later); articles/projects/
services dynamic sitemap entries; product counts on tree rows; drag-drop
ordering; caching/S3/CI; visual device-lab sign-off (§11 [O] items).

## 20. Exact Recommendation for Next Phase

**Homepage phase (dedicated):** build the featured-products rail reusing
`useFeaturedPublicProducts` + `ProductCard` (§3: explicitly NOT this
phase), reusing the established section/motion language — no new animation
system, no homepage redesign beyond the rail. Preconditions from THIS
phase are ready: OG/SEO tags, sitemap/robots, slug redirects,
`next/image` media pipeline (`resolveMediaUrl` + remotePatterns), and the
device-lab checklist (§11) to sign off the rail on mobile/RTL. Then:
Arabic/English catalog UI (locale URL emission in sitemap/metadata +
`activeLocales`), then cart/checkout only when explicitly scoped. Do NOT
bundle CMS redesign, permissions changes, or API reshaping into the
Homepage phase.

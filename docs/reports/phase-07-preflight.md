# Phase 7 — Preflight Architecture Report (Homepage CMS)

Date: 2026-09-21. Scope: audit ONLY — no code changed. All 9 prerequisite
reports (00, 01, 02, 03, 04, 05.1, 05.2, 06, 06.1) were read, and the live
backend + frontend code was inspected (file:line references below).

## 1. Current CMS architecture

- **Two surfaces, unchanged since Phase 0:** Django Admin (`/admin/`,
  technical/ops) + React Admin Dashboard (`/[locale]/admin/*`, editor
  surface with `PageHeader`, `DataTable`-style tables, `RichTextEditor`
  (TipTap), `MediaUpload`, `ConfirmDialog`, `sonner` toasts, TanStack Query
  hooks in `src/hooks/use-api.ts`, axios JWT + `Accept-Language`).
- **Proven content pattern:** per-entity tables + `*Translation` tables
  (fa/ar/en, `unique parent+language`, bleach on save, prefetch-aware
  `get_translation()`), triple-serializer shape, manual `path()` versioning
  under `/api/v1/`, `StandardPagination`, `TranslatedSlugDetailMixin`
  (`AbrEnergy/apps/core/mixins.py:4-17`) for translation-slug public detail.
- **Product Studio (Phase 4)** is the reference editor: shared
  `ProductEditor` shell (`src/components/products/product-editor.tsx`),
  section cards, `initial + edits` memo hydration, sticky bottom save bar
  (`save/continue/publish/cancel`), `beforeunload` dirty guard,
  `mapProductErrors` section-keyed error mapping, `subfolder`-aware
  `MediaUpload`, SEO card with slug-change warning.
- **Category Studio (Phase 3):** tree list (`buildCategoryTree`,
  `flattenParentOptions` in `src/lib/category-tree.ts`), numeric
  `sort_order` (no drag-drop), optimistic single-field PATCH toggles.
- **No homepage CMS exists.** Grep `homepage|Homepage|HOME_PAGE` in backend
  = 0 hits. Frontend only: `lib/homepage-visuals.ts`
  (`HERO_FLOATING_SLOTS = []`, `hasHeroFloatingVisuals() === false`),
  `home.*` locale keys, hardcoded `generateMetadata` in
  `(public)/page.tsx:14-31`. Closest editable homepage inputs today:
  `admin/settings` read-only view of `SiteSettings` (`hero_subtitle`,
  `about_us`) + product `is_featured` flags driving
  `FeaturedProductsSection`.

## 2. Existing reusable models (DO NOT duplicate)

| Model | File | Public/visibility rule | Reuse for homepage |
|---|---|---|---|
| `Product` | `apps/products/models.py:183-251` | `is_publicly_visible` = `status==published && visibility==public && is_active` (`:245-251`); central `public_product_qs()` (`views/products.py:39-50`) with full prefetch | relation-only (`HomepageFeaturedProduct`) |
| `ProductCategory` | `apps/products/models.py:10-91` | `is_active=True` (`CategoryListView :57-58`); tree via `CategoryTreeSerializer` | relation-only (`HomepageCategory`) |
| `ProductPrice` | `apps/products/models.py:395-493` | `get_effective()` 6 states (`:436-465`); frontend never computes | reuse via `ProductListSerializer.price` |
| `Service` | `apps/services/models.py:33-55` | `status active/inactive` (`:34-37`); public list currently UNFILTERED (`views/service.py:30-31` returns `.all()`) | relation-only; homepage MUST filter `status=active` itself |
| `Project` | `apps/projects/models.py:5-35` | `status planning/in_progress/completed/on_hold/cancelled`; NO visibility field; public list UNFILTERED (`views/project.py:29-39`) | relation-only; no status filter exists to reuse (see §11) |
| `Article` | `apps/articles/models.py:54-102` | `status draft/published/scheduled`; anon public hard-filters `status=published` (`views/article.py:35-41`) | relation-only + latest-published fallback |
| `MediaFile` | `apps/media_manager/models.py:14-70` | images jpg/jpeg/png/webp 10 MB Pillow-verified; docs PDF-only 25 MB + `%PDF-` magic | FK-only (`HomepageVisual.image`); never store binaries |
| `SiteSettings` | `apps/core/models.py:7-56` | singleton pk=1 (`save :49-51`, `load :53-56`); contact/social/footer fields | contact INFO source (phone/email/address/socials) — do not copy into homepage tables |
| `SlugHistory` | `apps/products/models.py:93-180` | idempotent history + `resolve/` endpoints | untouched; homepage adds no slugs |

## 3. Existing reusable frontend components

- **Homepage (all prop-less, all preserved):** `HeroSection` (slogan from
  `t('home.hero_slogan')`, lead `settings?.hero_subtitle || t('home.hero_lead')`,
  hardcoded CTAs `/products` + `/calculator`, `Hero3D` + parallax intact),
  `FeaturedProductsSection` (real `useFeaturedPublicProducts` + shared
  `ProductCard`, RTL-aware rail, hides on empty), `ProductRailSection`
  (`ProductCategoryNavigation`, hides on empty), `ServicesSection`
  (`useServices`, no fallback — hides on empty), `ProjectsSection`
  (`useFeaturedProjects`, slice 3, hides on empty), `ArticlesSection`
  (`useArticles({is_featured:'true'})`, slice 3), `CalculatorSection`
  + `ContactSection` (static teasers → `/calculator`, `/contact`).
- **Animation system (untouched):** `Hero3D` (R3F `dpr [1,1.5]`), `CursorGlow`
  (section-color map incl. `featured`/`categories`), `FloatingParticles`
  (100, canvas), `MouseRipple`, `GradientMesh` (4 blobs), `ScrollReveal` +
  `TextReveal` (RTL flip), hero/about parallax, services tilt.
- **Catalog:** `ProductCard` (`{product, categoryTitle?, className?}`) +
  `ProductPrice` (6 states, zero client math) — reuse verbatim.
- **CMS primitives:** `MediaUpload` (`subfolder` prop, default `articles`),
  `RichTextEditor` (TipTap, `dir` prop), `ConfirmDialog`, `PageHeader`,
  `TableLoading/PageLoading`, `EmptyState/ErrorState/NotFoundState`,
  `sanitizeHtml` (DOMPurify), `resolveMediaUrl/siteUrl/apiBaseUrl`
  (`lib/media-url.ts`), `CategorySelector`, `product-seo-fields`,
  `product-publish-panel`, `admin-permissions.ts`
  (`MANAGER_ROLES = super/website/content`), `category-tree.ts` helpers.
- **SEO infra:** `product-metadata.ts` (`buildCatalogMetadata`,
  translated-meta → object-SEO → fallback, `fa_IR`, absolutized OG),
  dynamic `sitemap.ts` (fa-only, never-500s), locale-aware `robots.ts`,
  `resolve/` 308 redirect pattern, `metadataBase` in root layout.

## 4. Existing permissions

`apps/users/api/v1/permissions.py`: `IsSuperAdmin` (super only),
`IsAdminUser` (super/website), `IsContentManager` (super/website/content),
`IsEngineer` (super/website/engineer), `IsOwner` (dead). Applied:
product/category admin writes = `IsContentManager`; services admin =
`IsAdminUser`; site-config admin = `IsSuperAdmin` (read-only settings page
for others); media upload = `IsContentManager`; frontend shell admits
`MANAGER_ROLES`, item-level `roles` filter (settings =
`[super_admin]` only). **No new roles exist; no field-level permission
split exists anywhere** (pricing/media/SEO share one content gate — the
established convention).

## 5. Existing media architecture

`MediaFile` FK-only reuse (`ProductImage`/`ProductDocument` pattern:
`product CASCADE`, `media_file CASCADE`, `sort_order`, `alt_text`).
Upload `POST /media/upload/` (`{file, subfolder}`, `IsContentManager`);
Phase 1/2 enforcement (MIME + Pillow + 10 MB images / `%PDF-` + 25 MB
PDFs, SVG blocked) stays authoritative. `MediaUpload` `subfolder` prop
already generalized (Phase 4) — homepage passes `subfolder="homepage"`.
`next/image` + `resolveMediaUrl` pipeline exists for public covers;
homepage visuals reuse it.

## 6. Existing SEO architecture

Product/Category model: `seo_title/seo_description/canonical_url/robots`
(4-way `ROBOT_CHOICES`) `/og_title/og_description/og_image(FK)` +
per-translation `meta_title/meta_description` (translation-wins fallback).
Frontend: `generateMetadata` + `buildCatalogMetadata` + absolutized OG +
`metadataBase` + sitemap/robots. Homepage SEO = same 7-field shape on the
singleton (no translation table — fa-only this phase, matching the
`SiteSettings` direct-field pattern), rendered by extending the homepage
`generateMetadata` with a server-side homepage fetch (same pattern as
`product-metadata.ts`).

## 7. Existing Homepage architecture

`(public)/page.tsx:33-68` assembles 10 blocks in fixed order (overlays →
Hero → Featured → Categories → About → Services → Calculator → Projects →
Articles → Contact). Every content section is prop-less, self-fetching,
and hide-on-empty (`return null`). Metadata is fully hardcoded (title =
slogan + brand, static description, canonical `${site}/fa`, OG `fa_IR`,
no OG image). `StatsSection` is intentionally unrendered (invented
numbers — Phase 6 ruling, file kept). **Integration rule: keep every
component's visual output identical; change only the data source**
(prefer-CMS → fallback-to-current-source inside each section, minimum
safe refactor to accept optional CMS props).

## 8. Existing singleton patterns

`SiteSettings`: code-enforced `pk=1` (`save` forces, `load()`
`get_or_create`), public `RetrieveAPIView` (`AllowAny`) + admin
`UpdateAPIView` (`IsSuperAdmin`), Django admin hides add when exists.
Homepage follows this exactly: `HomepageConfig.load()` + public
`RetrieveAPIView` (`AllowAny`) + admin `RetrieveUpdateAPIView`
(`IsContentManager`), no new pattern invented.

## 9. Recommended Homepage CMS architecture

New **`apps.homepage`** app (no existing app fits — `core` is
settings/audit, `products` is catalog):

- `HomepageConfig` singleton (pk=1, `load()`): hero CTAs
  (label/url/enabled × primary/secondary), calculator CTA (label/url),
  contact CTA (label/url), articles display count, SEO (7 fields),
  `updated_at`. NO copy of product/category/service/project/article
  fields; NO copy of SiteSettings contact info.
- `HomepageSection` (8 rows, `key` choices
  `hero/featured_products/categories/services/calculator/projects/articles/contact`):
  `enabled`, `order` (unique-ish, numeric + up/down UI), `title`,
  `subtitle`, `content`. Owns section copy/visibility/ordering; hero title
  default = `طلوع آفتاب، از خانه شماست` (seeded, never changed by code).
- Relation tables (relation/order/visibility ONLY, data read from source
  of truth): `HomepageFeaturedProduct(product FK CASCADE, order, enabled,
  unique product)`, `HomepageCategory(category FK CASCADE, order, enabled,
  unique category)`, `HomepageService`, `HomepageProject`,
  `HomepageArticle(article FK CASCADE, order, enabled, unique article)`.
- `HomepageVisual` (`image FK MediaFile CASCADE, alt, order, enabled,
  link_url blank`): floating visuals; NO pixel-position editor (per brief).
- APIs: public `GET /api/v1/homepage/` (single composed, prefetched
  payload — hero/sections/featured_products/categories/services/
  calculator/projects/articles/contact/visuals/seo); admin
  `GET/PUT/PATCH /api/v1/admin/homepage/` (`IsContentManager`, full
  replace semantics for relations like Phase 4 `images_data`).
- Bootstrap: `HomepageConfig.load()` + `ensure_default_sections()`
  (idempotent, called in both views; no flush/delete; optional
  `seed_homepage` command only if needed).
- Frontend: `useHomepage` (public, `staleTime` 5 min) + server
  `fetchHomepage()` for `generateMetadata`; each home section accepts
  optional CMS props with current-source fallback; new admin route
  `/admin/content/homepage` (Homepage Studio, Product-Studio card/sidebar/
  sticky-bar language); nav entry under `admin.nav_content`.

## 10. Models that should be reused (no changes)

`Product`, `ProductCategory`, `ProductPrice.get_effective()`,
`Service`, `Project`, `Article`, `MediaFile`, `SiteSettings` (contact
info), `ProductListSerializer`/`CategoryTreeSerializer`/service/project/
article list serializers for nested public output, `IsContentManager`,
`TranslatedSlugDetailMixin` (not needed — no slugs), sanitizer (plain
text fields need none; `content` uses TipTap→bleach only if rich — keep
plain `TextField`, no HTML).

## 11. Models that genuinely need extension

- **None at the model level.** One behavioral note: `Service`/`Project`
  public list endpoints return `.all()` with no status filter. The
  homepage public composer applies its own filters (`Service:
  status=active`; `Article: status=published`; `Product:
  is_publicly_visible`; `ProductCategory: is_active`; `Project: no
  status field maps to draft/hidden/inactive — selected featured projects
  pass through, `cancelled` excluded as the only clearly non-public
  state`). These filters live in the homepage queryset code, NOT as
  changes to the existing endpoints (zero regression surface).
- `dashboard_stats` may gain homepage counts later — not this phase.

## 12. New models genuinely required

`HomepageConfig`, `HomepageSection`, `HomepageFeaturedProduct`,
`HomepageCategory`, `HomepageService`, `HomepageProject`,
`HomepageArticle`, `HomepageVisual` — 8 models, 1 migration
(`homepage/0001_initial.py`). Justification: no existing table stores
section visibility/ordering, CTA labels/URLs, curated orderings, or
floating visuals; stuffing them into `SiteSettings` would bloat the
super-admin-only singleton and break the content-manager permission
story (§4: site-config writes are `IsSuperAdmin`, but homepage editing
must be `IsContentManager`).

## 13. Potential migration risks

- Single `CreateModel` migration, all-nullable/blank-safe with defaults;
  `order`/`enabled` defaults make existing (empty-DB) behavior =
  sections visible with fallback copy. LOW risk.
- `order` uniqueness: use plain `PositiveIntegerField(default=0)` with
  `ordering`, NOT a DB unique constraint (avoids seed/reorder deadlocks —
  lesson from Phase 2 cover-constraint handling).
- `link_url` uses `URLField(blank)` + validator allowing relative
  `/products...` paths (absolute-only `URLField` would reject internal
  CTAs — handle in serializer validation).
- Post-`0001`, `makemigrations --check` must be clean.

## 14. Potential API compatibility risks

- **None for existing endpoints.** New mounts only:
  `homepage/` (public) + `admin/homepage/` (admin) in `config/api_v1.py`.
  Existing `site-config/` responses byte-identical; `HeroSection` keeps
  reading `useSiteSettings` as fallback.
- Public payload shape is NEW (no consumers to break). Keep the standard
  no-envelope convention (`Response(data)` like `dashboard_stats`).
- Admin PUT replaces relations wholesale (Phase 4 semantics) — document;
  PATCH allows partial (section toggles without resending relations).

## 15. Potential frontend regression risks

- `HeroSection` CTA/copy swap: guard every CMS string with `||` fallback
  to current `t()`/settings source; never render empty `<h1>`.
- `FeaturedProductsSection` data swap: CMS items serialize through the
  SAME `ProductListSerializer`, so `ProductCard` props are unchanged.
- `CursorGlow` color map already has `featured`/`categories` keys; new
  blocks reuse existing `data-section` values — no map change needed.
- `generateMetadata` becomes async-fetch with try/catch fallback to the
  current hardcoded values (sitemap's never-500s pattern).
- Admin nav: additive entry under `nav_content`; `navigation-cms.test.ts`
  + locale tests must be updated, not weakened.
- No animation, theme, RTL, or layout file is in the change set; the
  change set is: 1 new lib hook file, section-component prop additions,
  3 new admin files, locale key additions, 1 nav entry.

---

**Decision log:** section-table + config-singleton + relation-tables was
chosen OVER (a) stuffing everything into `SiteSettings` (wrong
permission gate, bloat) and (b) a generic block-builder (explicitly out
of scope, §36). Translation tables deferred: homepage copy is fa-direct
fields (SiteSettings pattern); ar/en tables, middleware, and locale JSON
stay intact for future activation.

# Phase 5.1 — Public Product Catalog Report

Date: 2026-09-20. Scope: Persian-only public product catalog (read-only storefront).
No homepage redesign, no animation/3D/theme changes, no Services/Projects/Downloads/
Calculator/Contact work, no ar/en UI, no new CMS architecture, no design-system replacement.

## 1. Executive Summary

Phase 5.1 ships the complete public Persian-only Product Catalog on the existing
Phase 2 Product API and the existing frontend architecture: `/fa/products` (hero +
dynamic category navigation + server-filtered, paginated listing), `/fa/products/<slug>`
(gallery, effective pricing, sanitized content, grouped specs, dynamic attributes,
active PDF documents, related products, consultation CTA, JSON-LD), and
`/fa/products/category/<slug>` (cover, description/content, emphasized child
navigation, category products, pagination). All pricing renders the backend
`get_effective()` state — zero discount math in React. SEO uses real `generateMetadata`
(translated meta → object SEO → fallback) plus safe JSON-LD restricted to valid
price states. Verification: backend **97 passed** (93 prior intact + 4 new),
frontend `tsc` 0 errors, `eslint` 0 errors (67 warnings: 63 baseline + 4 `no-img-element`
matching every existing public page), Vitest **99/99** (49 Phase 3+4 intact + 50 new),
`next build` success (all routes incl. 3 new), `manage.py check` clean (2 pre-existing
warnings), `makemigrations --check` clean (no changes). Live PostgreSQL/Redis NOT
verified (no creds/infra) — same limitation as Phases 1–4. Live manual verification
was performed against a scratch SQLite backend + production `next start` server
(curl): all three routes, all three pricing states, category tree, specs/attributes/
related, SEO tags, and 404 fallback all confirmed, then scratch infra deleted.

## 2. Routes Added

All under the existing `[locale]/(public)/` group (Header/Footer/locale shell inherited,
refresh-safe App Router pages, no duplicate competing routes):

| URL | Server shell | Client view |
|---|---|---|
| `/[locale]/products` | `(public)/products/page.tsx` (`generateMetadata`) | `products-client.tsx` |
| `/[locale]/products/[slug]` | `(public)/products/[slug]/page.tsx` (`generateMetadata`, `key={slug}` remount) | `product-detail-client.tsx` |
| `/[locale]/products/category/[slug]` | `(public)/products/category/[slug]/page.tsx` (`generateMetadata`, `key={slug}` remount) | `category/[slug]/category-client.tsx` |

`[slug]` vs `category/[slug]` coexist without conflict (static segment wins).
Public nav gains `{ href: '/products', labelKey: 'nav.products' }` in
`src/config/navigation.ts` (header desktop + mobile pick it up automatically).
Missing product/category renders in-page `NotFoundState` + fallback metadata
(repo has no `not-found.tsx` architecture; this follows the existing pattern).

## 3. Components Added

New `src/components/products/public/` (+ barrel `index.ts`):

- `ProductPrice` — renders all six `PriceState`s from backend `price` only.
- `ProductCard` — cover (4:3), title, short desc, category, price, featured/
  discount badges, CTA link, hover motion, focus-visible ring.
- `ProductGrid` — responsive 1/2/3-col grid with staggered `ScrollReveal`.
- `ProductGallery` — cover-first ordering, thumbnails, prev/next, RTL-aware
  keyboard (ArrowLeft/Right flip in RTL, Home/End), counter, empty placeholder.
- `ProductSpecifications` — section-grouped responsive spec cards.
- `ProductAttributes` — dynamic backend definitions; boolean localized (بله/خیر),
  numbers in Persian digits + backend unit.
- `ProductDocuments` — active-only PDF list with type badges + download links.
- `RelatedProducts` — compact link cards by backend slug (see §25 for N+1 rationale).
- `ProductBreadcrumbs` — `nav[aria-label=breadcrumb]` + `aria-current="page"`.
- `ProductCategoryCard` — folder visual, featured badge, child pills, CTA.
- `ProductCategoryNavigation` — horizontal quick rail + root cards with child
  preview; renders any subtree (`flattenCategoryTree`); unlimited depth.
- `ProductFilters` — search (debounced) / category (indented tree select) /
  featured switch / ordering; 1:1 with API params.
- `ProductEmptyState` — Persian empty state wrapper with optional recovery action.

New `src/lib/product-metadata.ts` — server-side `fetch` helpers + `buildCatalogMetadata`
+ `productMetadata` / `productCategoryMetadata` / `productsIndexMetadata`.

## 4. Components Reused

Unchanged: `Header/Footer` (+ locale shell), `ScrollReveal` (+ RTL flip),
`PageHeader` visual language (motion hero pattern copied from articles/projects
pages), `CardLoading/TableLoading/PageLoading`, `EmptyState/ErrorState/NotFoundState`,
`formatPrice` (`lib/product-form.ts`), `sanitizeHtml` (`lib/sanitize.ts`, DOMPurify),
`productsApi` (axios instance, no new HTTP client), `cn`, shadcn `Button`-level
tokens via Tailwind classes, `activeLocales=['fa']` + `localeNames` + `isRTL`.
No animation/3D file touched (`Hero3D/CursorGlow/particles/ripple/gradient/
ScrollReveal/TextReveal/parallax/tilt` intact). No new animation or HTTP library.

## 5. API Endpoints Consumed

Existing public contract only (all `AllowAny`, no auth):

- `GET /api/v1/product-categories/` — navigation, filters, titles, children,
  breadcrumb parent chain (single request, cached 5 min).
- `GET /api/v1/product-categories/<slug>/` — category landing detail.
- `GET /api/v1/products/` — listing (`search`, `category` [UUID], `is_featured`,
  `ordering`, `page`; paginated, never bulk-fetched).
- `GET /api/v1/products/<slug>/` — product detail (single request; never
  reconstructed from list endpoints).
- `GET /api/v1/products/featured/` — wired as `useFeaturedPublicProducts`
  (available for future rails; not yet rendered — no fake section added).

New React Query hooks in `src/hooks/use-api.ts`: `usePublicProductCategories`,
`usePublicProductCategory`, `usePublicProducts(params, {enabled})`,
`usePublicProduct`, `useFeaturedPublicProducts`.

## 6. Backend Changes

One minimal backward-compatible fix (no migration, no removed/reshaped fields):

- `apps/products/api/v1/serializers/products.py` — `ProductDetailSerializer.get_related`
  now also exposes the translated `slug` per related item (fallback mirrors
  `get_slug`: translation slug else SKU). Without it, related products were
  unlinkable (only `id/title/relation_type` exposed; public detail lookup is
  slug-only per `TranslatedSlugDetailMixin`), which blocked the required
  "related products" section without N+1 detail fetches.
- `apps/products/tests/test_phase5_1.py` — 4 regression tests (related slug
  exposure, SKU fallback with no translation row, public endpoints need no auth,
  public detail leaks no admin price internals).

`makemigrations --check`: **No changes detected**.

## 7. Product Catalog UX

`/fa/products`: Persian hero (title/subtitle/label from `products.*` keys,
existing motion + gradient/blur language, breadcrumbs) → dynamic category
navigation (rail + cards, active-only, deterministic `sort_order` order) →
filter card (search/category/featured/ordering + clear) → result count in Persian
digits → responsive card grid → prev/next pagination with `صفحه X / Y` + `aria`
labels. Loading (`CardLoading`), API error (`ErrorState` + retry), empty
(`ProductEmptyState` + clear-filters recovery) states throughout. Category filter
uses UUIDs per the API; titles resolve from the cached tree (no N+1).

## 8. Category UX

`/fa/products/category/<slug>`: breadcrumbs incl. parent chain resolved from the
tree (unlimited depth walk) → title + plain description + cover image (when set) +
sanitized rich `content` → **emphasized child-category section** (when children
exist, rendered through the same data-driven navigation) → category products
(`category=<uuid>`, paginated) → empty state when childless/productless.
Detail lookup by canonical/translated slug; 404 → `NotFoundState` + back link.
Category detail serializer carries no children — children come from the one cached
tree request (2 requests total, no N+1).

## 9. Product Detail UX

`/fa/products/<slug>`: breadcrumbs (home/products/[parent categories]/title) →
hero grid (gallery + title/short/SKU-LTR/category-link/price-panel/CTAs) →
sanitized description + features cards → grouped specifications → dynamic
attributes → active PDF documents → related products → consultation CTA panel
(درخواست مشاوره / تماس با ما / مشاهده محصولات). No cart/checkout. 404 (bad slug)
→ `NotFoundState` + `product_gone_hint`; other errors → `ErrorState` + retry.
`key={slug}` remount prevents gallery/pagination leakage between products.

## 10. Pricing Rendering

`ProductPrice` consumes ONLY `price` (`state/currency/regular_price/sale_price/
final_price` from `get_effective()`):

- `contact_for_price` → «برای اطلاع از قیمت تماس بگیرید» (numbers asserted absent
  in tests); `regular` → backend final price + تومان in Persian digits;
  `discounted` → original line-through + prominent final + تخفیف‌دار badge
  (tests assert no `%`/`٪` is ever computed); `scheduled` → backend final +
  «به‌زودی» note; `expired` → backend final + ended note; `hidden`/missing →
  renders nothing. Discount percentage is never derived (backend provides no
  percentage value to display). Admin price internals never exposed (backend test).

## 11. SEO / Metadata

First `generateMetadata` in the repo (existing detail pages are client-only):
priority translated `meta_*` → object `seo_*` → title/short fallback; `robots`
4-way mapped (`index_follow/noindex_follow/...`); `canonical_url` emitted only
when set; OpenGraph title/description prefer dedicated `og_*` with fallback to
resolved page copy, OG image from `og_image_url || cover_image_url`
(category) — product public detail exposes **no** `og_image*` field, so
`cover_image_url || images[0]` is used (documented limitation, §24).
Verified live via curl: index title «محصولات | ابر انرژی», detail title/meta/OG
from backend rows, category title from backend, missing slug → fallback metadata.
Unit-tested priority/robots/canonical gating. Global sitemap work stays deferred
to the SEO phase.

## 12. Accessibility

Semantic `h1/h2`, breadcrumb `<nav>` + `aria-current`, gallery `region/carousel`
role with labeled prev/next/thumbnail `tab`s + `aria-selected` + live counter,
`role="switch"` featured toggle, labeled pagination nav, `dir="auto"` on Persian
user content, `dir="ltr"` on SKU/slug/counter, alt text from backend (`alt_text`
else product title, `""` for thumbnails), visible focus rings on all interactive
elements, status never conveyed by color alone (badges carry text labels).

## 13. Responsive Behavior

Grid `1 → sm:2 → lg:3/4` cols; hero `1 → lg:2` cols; filters `1 → md:2 →
lg:[search/category/order/actions]`; gallery thumbnails `5 → sm:6` cols; spec rows
stack → `sm:2-col`; rail `overflow-x-auto snap-x`; CTA buttons wrap; no fixed
widths. Verified by code (Tailwind breakpoints, no horizontal overflow vectors)
and production build; device-lab testing remains operator-side (§24).

## 14. Performance

Paginated listing (`page_size=20` default, `page` param only); category pages
fetch detail + tree + one product page (all React-Query cached); detail uses the
single detail endpoint; related/docs/specs/attributes arrive embedded (zero extra
requests); search debounced 350 ms; category tree `staleTime` 5 min; images stay
`<img loading=lazy>` (detail hero `eager`) — no repo-wide `next/image` migration;
animations limited to existing `ScrollReveal`/motion primitives.

## 15. Tests Added

Backend `test_phase5_1.py` (4). Frontend 50 new (99 total, 17 files):

- `product-price.test.tsx` (5): regular/discounted/contact/scheduled-expired/
  hidden-missing; no-percentage assertion.
- `product-card.test.tsx` (6): regular/featured/discounted/contact/hidden,
  aspect-ratio + focus target.
- `product-gallery.test.tsx` (7): cover-first sort, thumbs, prev/next, thumbnail
  select, RTL keyboard, empty placeholder, backend alt text.
- `product-detail-sections.test.tsx` (10): spec grouping/ordering/render/empty;
  boolean/number/text attributes; active-only docs + download link; empties.
- `product-catalog.test.tsx` (10): grid + category titles; breadcrumbs;
  empty + recovery action; related slug links + empty; tree flatten; rail+cards;
  active pill; empty tree.
- `product-metadata.test.ts` (4): meta→SEO→fallback, robots map, canonical/OG gating.
- `public-products-api.test.ts` (4): endpoint paths/params, no-auth public usage.
- `public-catalog-locale.test.ts` (4): `activeLocales==['fa']` with ar/en intact,
  all 54 catalog keys present in fa + ar/en parity, nav entry.

Plus `vitest.setup.ts`: `IntersectionObserver` no-op mock (jsdom lacks it;
`ScrollReveal`/`useInView` require it).

## 16. Full Test Results

- Backend: `python -m pytest apps/ -o DJANGO_SETTINGS_MODULE=config.settings.tmp_sqlite_51`
  → **97 passed** (93 Phases 1–4 intact + 4 new). Temp settings file deleted after run.
- Frontend: `npm test` (`vitest run`) → **17 files, 99/99 passed**
  (49 Phase 3+4 intact + 50 new).

## 17. TypeScript Result

`npx tsc --noEmit` → **0 errors** (final run post-lint-fixes).

## 18. ESLint Result

`npm run lint` → **0 errors, 67 warnings**. Baseline was 63 (61 + 2 Phase-4
`no-img-element`); the +4 are `no-img-element` in `ProductCard` (1),
`ProductGallery` (2), `category-client` (1) — identical convention to every
existing public page (articles/projects/gallery/detail all use `<img>` with the
same warning). `next/image` migration stays deferred per prior phases. Five
`set-state-in-effect`/compiler errors introduced mid-phase were all fixed
(render-time sync, derived clamping, `key={slug}` remounts).

## 19. Build Result

`npm run build` → **success** (`✓ Compiled successfully`, static generation OK).
New routes present: `/[locale]/products`, `/[locale]/products/[slug]`,
`/[locale]/products/category/[slug]`. All pre-existing routes (public, auth,
dashboard, 14+ admin) still render. Homepage/Hero3D/CursorGlow/particles/ripple/
gradients/ScrollReveal/TextReveal/parallax/tilt/theme untouched.

## 20. Backend Check Result

`python manage.py check` → 0 errors; 2 pre-existing warnings (ckeditor 4 EOL
`ckeditor.W001`, missing `static/` dir `staticfiles.W004`) — identical to
Phases 1–4, untouched.

## 21. Migration Check Result

`python manage.py makemigrations --check` → **No changes detected** (exit 0).
(PG auth warnings in output are the known no-creds limitation; the check itself
completed.) No new migrations in this phase.

## 22. Manual Verification

Scratch SQLite backend (seeded 2 categories + 3 products: regular/discounted/
contact, spec, attribute, relation; DB + seed script deleted afterwards) +
production `next start -p 3100`, verified with `Invoke-RestMethod`/`Invoke-WebRequest`:

| Check | Result |
|---|---|
| `GET /api/v1/products/` | 3 items; states `regular/discounted/contact_for_price` with correct `final_price` |
| `GET /api/v1/product-categories/` | tree with nested active child |
| `GET /api/v1/products/panel-discount-test/` | `related[0].slug=panel-regular-test`, 1 spec row, 1 attribute (`550.000 W`) |
| `GET /api/v1/products/no-such-slug/` | 404 |
| `/fa/products` | 200, RTL shell, static Persian copy |
| `/fa/products` `<title>`/meta | «محصولات \| ابر انرژی» + catalog description (SSR `generateMetadata`) |
| `/fa/products/panel-discount-test` | title «پنل تست تخفیف‌دار \| ابر انرژی», meta + `og:title` from backend |
| `/fa/products/category/pkg-test` | title «پکیج‌های خورشیدی تستی \| ابر انرژی» |
| `/fa/products/no-such-product` | 200 shell + fallback title «محصول \| ابر انرژی» (client shows `NotFoundState`) |
| `/fa` homepage | renders (regression: header gains محصولات link only) |

Client-interactive states (filters/pagination/gallery/keyboard/empty/error/RTL
layout, mobile/tablet breakpoints) verified by tests + code inspection; physical
device-lab pass remains operator-side.

## 23. Files Changed

Backend (modified 1, new 1):

- `AbrEnergy/apps/products/api/v1/serializers/products.py` (related `slug`)
- `AbrEnergy/apps/products/tests/test_phase5_1.py` (new)

Frontend modified (7):

- `abr-energy-frontend/src/hooks/use-api.ts` (5 public hooks)
- `src/types/index.ts` (`ProductRelatedItem.slug`)
- `src/config/navigation.ts` (`/products` entry)
- `locales/{fa,ar,en}.json` (`nav.products` + 54-key `products` namespace ×3)
- `vitest.setup.ts` (IO mock)

Frontend new (30):

- `src/lib/product-metadata.ts`, `src/lib/product-metadata.test.ts`,
  `src/lib/public-catalog-locale.test.ts`, `src/api/public-products-api.test.ts`
- `src/components/products/public/`: `ProductPrice`, `ProductCard`, `ProductGrid`,
  `ProductGallery`, `ProductSpecifications`, `ProductAttributes`, `ProductDocuments`,
  `RelatedProducts`, `ProductBreadcrumbs`, `ProductCategoryCard`,
  `ProductCategoryNavigation`, `ProductFilters`, `ProductEmptyState`, `index.ts`
  + tests: `product-price`, `product-card`, `product-gallery`,
  `product-detail-sections`, `product-catalog`
- `src/app/[locale]/(public)/products/page.tsx`, `products-client.tsx`,
  `[slug]/page.tsx`, `[slug]/product-detail-client.tsx`,
  `category/[slug]/page.tsx`, `category/[slug]/category-client.tsx`

No homepage, animation, theme, CMS, auth, admin, or settings files touched.

## 24. Known Limitations

- Live PostgreSQL/Redis unverified (no creds/infra) — same as Phases 1–4;
  backend suite runs on SQLite; PG-specific DDL relies on prior-phase coverage.
- Public product detail exposes no `og_image*` field → OG image falls back to
  cover/first gallery image (serializer-level; changing it is SEO-phase scope).
- Related items carry no cover/price → compact link cards (full `ProductCard`
  reuse would cost one request per item).
- `?category=` accepts a single UUID (backend); multi-category filtering is
  client-sequential, not implemented.
- Physical device/RTL visual QA (mobile/tablet breakpoints, gallery gestures)
  is code/test-verified only.
- `select`-type attribute options still have no backend metadata (Phase 2/4
  limitation; public side renders backend `display` verbatim).

## 25. Deferred Work

Global sitemap/dynamic entries (SEO phase), `next/image` migration, slug history/
redirects, Arabic/English catalog UI (architecture preserved; flip `activeLocales`),
shopping cart/checkout (explicitly out of scope), homepage product rails/carousel,
per-field permissions, approval workflow, product counts on tree rows, drag-drop
ordering, caching/S3/CI.

## 26. Technical Debt Discovered

- Related-product `slug` gap (fixed minimally, §6).
- `ProductDetailSerializer` lacks `og_image*` while category serializer has it —
  API asymmetry to reconcile in the SEO phase (not blocking; documented fallback).
- `vitest.setup.ts` lacked `IntersectionObserver` (fixed; test-only).
- Pre-existing, untouched: `UserCreateSerializer` dead code, `LargePagination`
  unused, ckeditor4 EOL + `static/` warnings, single-`category` filter, no
  `not-found.tsx` architecture.

## 27. Regression Verification

- Backend 93/93 prior tests pass unmodified; frontend 49/49 prior tests pass;
  `tsc`/`lint`/`build` green; all pre-existing routes render in build output.
- Homepage, Hero3D, CursorGlow, particles, ripple, gradients, ScrollReveal,
  TextReveal, parallax, tilt, dark/light theme, CMS (category + Product Studio),
  auth, admin permissions, existing routes: no edits (verified via scoped file
  list; only additive nav entry renders a header link).
- `navigation-cms.test.ts` (Phase 3) passes with the new nav entry.

## 28. Exact Recommendation for Phase 5.2

**Phase 5.2 — Catalog polish + SEO phase:** (1) reconcile `og_image*` asymmetry
on the public product detail serializer (additive, mirrored from categories);
(2) dynamic sitemap entries for published products/categories + slug-history/
redirect map; (3) narrow `next/image` adoption for catalog covers/gallery
(`remotePatterns` currently localhost-only); (4) homepage featured-products rail
reusing `ProductCard` + new `useFeaturedPublicProducts` hook; (5) operator
device-lab RTL pass (gallery, filters, spec tables, sticky CTA). No Product API
reshaping beyond (1); no cart/checkout until explicitly scoped.

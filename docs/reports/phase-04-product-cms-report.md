# Phase 4 — Product CMS / Product Studio Report

Date: 2026-09-20. Scope: React Product CMS only (list + editor + supporting API
extensions). No public product pages, no homepage redesign, no new roles, no schema
changes.

## 1. Executive Summary

Phase 4 ships the complete Persian-only Product Studio: `/admin/products` (filterable,
paginated table with cover/SKU/category/status/visibility/price/updated actions),
`/admin/products/new` and `/admin/products/[id]/edit` (structured editor: identity,
rich content, gallery, PDF documents, pricing, category-dependent attributes,
section-grouped specifications, related products, SEO, publishing sidebar, sticky
action bar). Backend contract was consumed first; three minimal backward-compatible
extensions were required (attribute/relation writes, admin-only price round-trip
fields, product/attribute filters) — no migrations, no removed fields, public API
byte-identical. Verification: backend **93 passed** (82 prior intact + 11 new),
frontend `tsc` 0 errors, `eslint` 0 errors (63 warnings: 61 baseline + 2
`no-img-element` matching existing admin convention), Vitest **49/49** (15 Phase 3
intact + 34 new), `next build` success (all routes incl. 3 new). Live
PostgreSQL/Redis NOT verified (no creds/infra) — same limitation as Phases 1–3.

## 2. Files Changed

Backend (modified):

- `AbrEnergy/apps/products/api/v1/serializers/products.py` — `attributes_data` /
  `relations_data` write support (create + replace-on-update), FK-UUID
  normalization (`media_file`/`definition`/`to_product` → `*_id`), model validation
  surfaced as DRF 400s via `_save_row` (was unhandled 500 paths), `is_active` +
  `updated_at` added to `ProductListSerializer`, new `AdminProductDetailSerializer`
  (raw price inputs + `og_image_url` + full `relations_admin` rows).
- `AbrEnergy/apps/products/api/v1/views/products.py` — admin product list gains
  `is_active` filter; attribute-definitions endpoint gains filter/search/ordering
  (`category`, `is_active`, `data_type`; search `code,name`); admin product detail
  now serves `AdminProductDetailSerializer` (public detail untouched).

Backend (new):

- `AbrEnergy/apps/products/tests/test_phase4.py` — 11 regression tests.

Frontend (modified):

- `src/components/shared/media-upload.tsx` — new optional `subfolder` prop
  (default `'articles'`; articles/categories behavior unchanged).
- `src/types/index.ts` — extended `ProductListItem` (`is_active`, `updated_at`),
  `ProductDetail` (media/doc/spec/attribute/relation item types, SEO/OG/meta,
  admin-only price inputs, `relations_admin`), new `ProductWritePayload`,
  `ProductPriceInput`, `ProductAttributeDefinition`, `ProductListParams`.
- `src/api/index.ts` — `adminProductsApi` (list/get/create/PATCH/remove),
  `adminAttributeDefinitionsApi` (list).
- `src/hooks/use-api.ts` — `useAdminProducts`, `useAdminProduct`,
  `useCreate/Update/DeleteAdminProduct` (invalidate list + detail + dashboard),
  `useAttributeDefinitions`.
- `src/lib/admin-permissions.ts` — `canManageProducts` (same `IsContentManager`
  gate as categories; backend authoritative).
- `src/config/navigation.ts` — `/admin/products` enabled (live link);
  `/admin/products/attributes` stays disabled (no standalone page in scope).
- `src/config/navigation-cms.test.ts` — updated for the live products route.
- `locales/{fa,ar,en}.json` — 131 new `admin.*` product keys each (ar/en properly
  translated per Phase 3 standard) + `common.previous/next`.
- `vitest.setup.ts` — `afterEach(cleanup)` (RTL isolation; previously missing,
  masked by single-render tests).

Frontend (new):

- `src/lib/product-form.ts` — form state, `emptyProductForm`, `productToForm`
  hydration, `buildProductPayload` (fa-only `translations`), price helpers
  (`priceStateLabelKey`, `formatPrice`, `toLocalInput`), `mapProductErrors`
  (DRF → section-keyed map), `groupSpecsBySection`, `attachAttributeDefinitions`.
- `src/components/products/` — `product-status-badge`,
  `category-selector`, `document-upload` (PDF-only), `product-media-manager`,
  `product-documents-manager`, `product-price-editor`,
  `product-attributes-editor`, `product-specifications-editor`,
  `product-relations-editor`, `product-seo-fields`, `product-publish-panel`,
  `product-editor` (shared create/edit shell), `index` barrel.
- `src/app/[locale]/admin/products/page.tsx` — list.
- `src/app/[locale]/admin/products/new/page.tsx` — create.
- `src/app/[locale]/admin/products/[id]/edit/page.tsx` — edit + delete.
- Tests: `product-form.test.ts`, `product-permissions.test.ts`
  (`src/lib/`), `product-badges.test.tsx`, `category-selector.test.tsx`,
  `product-media-manager.test.tsx` (`src/components/products/`).

## 3. Routes Added

| Route | File |
|---|---|
| `/admin/products` | `admin/products/page.tsx` — table, 6 server filters, pagination, toggles, delete |
| `/admin/products/new` | `admin/products/new/page.tsx` — create via shared `ProductEditor` |
| `/admin/products/[id]/edit` | `admin/products/[id]/edit/page.tsx` — edit + delete via shared `ProductEditor` |

All under the existing `[locale]/admin` guard; refresh-safe App Router pages.
Sidebar products section now links the live list first, then categories.

## 4. Components Added/Reused

Reused unchanged: admin shell/sidebar, `PageHeader`, `TableLoading`,
`EmptyState`, `ErrorState`, `PageLoading`, `RichTextEditor` (TipTap RTL),
`MediaUpload`, `ConfirmDialog`, `sonner` toasts, shadcn `Card/Badge/Button/Input/
Textarea/Select/DropdownMenu`, base-nova tokens, `initial + edits` form pattern,
optimistic single-field PATCH + rollback, `beforeunload` dirty guard.
New components are listed in §2 (only what was missing; no AdminTable/SeoCard
duplicates — SEO/publish follow the category inline-card pattern, split by file).

## 5. API Endpoints Consumed

- `GET /admin/products/` (`search/category/status/visibility/is_active/
  is_featured/ordering/page`) — list table (server-filtered, paginated).
- `GET /admin/products/<uuid>/` — editor hydration (admin serializer).
- `POST /admin/products/`, `PATCH /admin/products/<uuid>/`,
  `DELETE /admin/products/<uuid>/` — create/update/delete.
- `GET /admin/product-categories/?page_size=200` — category filter options,
  `CategorySelector`, publish panel.
- `GET /admin/product-categories/attributes/?is_active=true` (+ `category=` in
  principle; client narrows to selected-category + global defs) — attributes.
- `POST /media/upload/` (`subfolder=products` for images, `documents` for PDFs).

## 6. Backend Changes

All additive/backward-compatible, no migration (`makemigrations --check`: no
changes detected):

1. `ProductWriteSerializer` accepts `attributes_data` (`{definition,
   value_text?, value_number?, value_boolean?}`) and `relations_data`
   (`{to_product, relation_type?, sort_order?, is_active?}`); create appends,
   update replaces (same semantics as images/docs/specs). Previously these
   relations were read-only (Django-admin-only writes).
2. FK-UUID normalization + `_save_row`: nested writes with API-friendly string
   UUIDs no longer raise `ValueError` (500); model `full_clean()` and unique
   violations now return 400s. This also fixes the pre-existing
   `images_data/documents_data/specs_data` string-UUID path, which had the same
   latent 500 (no prior test covered API-level nested writes).
3. `ProductListSerializer` exposes `is_active`, `updated_at` (list needs them).
4. `AdminProductListView.filterset_fields` += `is_active`.
5. `AdminAttributeDefinitionView` gains filter/search/ordering (needed for
   category-dependent attributes).
6. `AdminProductDetailSerializer` (admin-only): `price_display_mode`,
   `price_is_active`, `price_regular/sale/discount_type/discount_value/
   starts_at/ends_at`, `og_image_url`, `relations_admin` (full rows incl. order
   + active flag). Public `ProductDetailSerializer` unchanged — verified by test
   that public detail exposes none of these keys.

## 7. Product Editor Architecture

Shared `ProductEditor` (`mode: create|edit`) composes section cards; pages are
thin (mutation + navigation + toasts). Main column: identity (title*/SKU*/
slug/category/short), content (TipTap description + features), media, documents,
specifications, attributes, relations, SEO. Sidebar (sticky): publishing
(status/visibility/active/featured/category/order) + pricing. Sticky bottom bar:
Cancel / Save & publish (when not published) / Save & continue / Save.
Validation: title + SKU required client-side; everything else backend-mapped per
section (`mapProductErrors`) plus a detail-level fallback toast. Edit hydration
uses the Phase 3 `initial + edits` memo pattern (no set-state-in-effect);
attribute definition ids attach by code once defs load; out-of-scope rows hide
(and are dropped on submit) when the category changes.

## 8. Media Implementation

`MediaUpload` generalized with `subfolder` prop (default `articles` — article
and category uploads byte-identical to before). Product gallery passes
`subfolder="products"`; cover selection (exactly-one-cover guaranteed
client-side, DB partial-unique server-side), accessible up/down ordering,
alt/caption editing, optimistic-local thumbnails. Documents use a dedicated
`DocumentUpload` (PDF-only accept; backend enforces `%PDF-` magic, PDF MIME,
25 MB; all Phase 1 restrictions preserved). No drag-and-drop dependency added;
no `next/image` migration (deferred per prior phases; 2 new `no-img-element`
warnings match existing admin convention).

## 9. Pricing Implementation

Editor edits inputs only (mode, regular/sale, discount type/value, window,
currency display, active flag; Decimal-as-string, never float). The preview card
renders the backend `get_effective()` state returned by the detail response
(contact/regular/discounted/scheduled/expired/hidden) with original-vs-final
display for discounted rows — never computed client-side. Edit round-trips
exactly via the new admin price fields (§6.6).

## 10. Attributes Implementation

Definitions listed from the admin endpoint (active only), narrowed to
selected-category + global; inputs switch by `data_type` (text/select → text
input, number → decimal input with unit hint, boolean → tri-state select).
`select` currently has no options table in the backend (Phase 2 schema), so it
renders as a text input — documented limitation, no incompatible schema
invented. Empty-definition and no-category states have dedicated messages.

## 11. Specifications Implementation

Free-form section/label/value/unit/order rows with add/edit/delete, accessible
reorder, and section-grouped display preserving first-seen order. Empty rows are
dropped from the payload. No hardcoded sections.

## 12. Related Products Implementation

Search-as-you-type picker (`search` + `page_size=10`, `enabled` only while the
picker is open — never loads the catalog), relation-type select, active toggle,
ordering, remove. Self-reference and duplicates blocked client-side with toasts
and enforced server-side (400s; tested). Full rows round-trip via
`relations_admin`.

## 13. SEO Implementation

Same field set as the category CMS: `seo_title` (60-char counter),
`seo_description` (160-char counter), `canonical_url` (LTR), `robots` 4-way,
`og_title/description/image` (`subfolder="products"`), translated
`meta_title/meta_description` (written via `translations.fa`, displayed with
translation-wins fallback). Slug-change warning shown. No sitemap/schema
rendering, no slug history (deferred to the SEO phase).

## 14. Permissions

UI gates via `canManageProducts` (super/website/content); list remains readable
to shell members, write actions hidden otherwise. Backend authoritative
(`IsAuthenticated + IsContentManager` on all admin product/category/attribute
endpoints; customer/anonymous writes 403 — covered by existing + new tests). No
new roles, no per-field split (deferred, as in Phase 2).

## 15. Persian/RTL Implementation

`activeLocales = ['fa']` untouched; switcher components structurally preserved;
fa/ar/en JSONs and backend translation tables intact. Editor is fa-only
(`translations: {fa}`) but payload/attach code is language-keyed for future
tabs. RTL: logical properties, `dir="auto"` on Persian inputs, `dir="ltr"` on
SKU/slug/URL/numeric/date fields, `dir="rtl"` TipTap, RTL-aware chevrons/switch
translations, sticky bar verified in RTL flow.

## 16. Tests Added

Backend `test_phase4.py` (11): attribute+relation create/update round-trip,
invalid attribute 400, self-relation 400, detail exposure, admin price/
relations_admin exposure, public-detail leak check, `is_active` list exposure +
filter, attribute `category`/search filter, full nested media/price/spec
create + detail echo.
Frontend (34 new across 5 files + 1 updated): payload builder (fa-only, cover
guarantee, empty-row dropping, price null-normalization), error mapper
(section mapping, DRF envelope), hydration (price/relations/OG/cover order,
definition attach), price/state helpers, spec grouping, badges (all
status/visibility/price states), category selector (label, empty value, dynamic
data), media manager (empty/cover/alt/reorder/upload-context/section errors),
specs editor (add/group/remove), permissions matrix, navigation liveness.

## 17. Full Test Results

- Backend: `pytest apps/` → **93 passed** (82 Phase 1–3 intact + 11 new),
  run on temporary SQLite settings (live PG creds unavailable; settings file
  deleted after run — same procedure as Phases 1–3).
- `manage.py check`: clean apart from two pre-existing warnings
  (ckeditor EOL, missing `static/` dir).
- `makemigrations --check`: **No changes detected** (exit 0).

## 18. TypeScript Result

`npx tsc --noEmit`: **0 errors**.

## 19. ESLint Result

`npm run lint`: **0 errors**, 63 warnings (baseline 61; +2 `no-img-element` for
admin thumbnails, consistent with every existing admin page — `next/image`
migration remains deferred).

## 20. Build Result

`npm run build`: **success**. New routes `/admin/products`,
`/admin/products/new`, `/admin/products/[id]/edit` render; all pre-existing
routes (public, auth, dashboard, 14+ admin incl. category CMS) still render.
Homepage, Hero3D, CursorGlow, particles, ripple, gradients, ScrollReveal,
TextReveal, parallax, tilt untouched (no shared-CSS/component/home changes).

## 21. Database/Migration Result

No migrations added, none needed (serializer/view-only changes).
`makemigrations --check` clean. No resets, flushes, or data deletions; seed
untouched.

## 22. Known Limitations

- Live PostgreSQL/Redis verification unavailable (no creds/infra) — same as
  Phases 1–3. Suite runs on SQLite; PG-specific behavior (e.g. partial-unique
  cover) relies on model logic + constraints also present in PG DDL.
- Admin category/product lists use `page_size=200` single-fetch for pickers;
  the product table itself is server-paginated (20/page).
- `select`-type attributes have no options metadata in the backend → text
  input (no incompatible schema invented).
- Field-level error mapping is best-effort over DRF shapes; generic toast
  remains as fallback.
- Relations picker has no debounced search (fires per keystroke, cached);
  acceptable at CMS scale.

## 23. Deferred Items

Public product/category pages, homepage product sections, full SEO rendering
(sitemap/schema/slug history), Arabic/English CMS tabs, cart/checkout/orders,
per-field permissions, approval workflow, drag-and-drop ordering, annotated
`products_count` on categories (still N/A — no N+1 introduced), S3/caching,
`next/image` migration, CI.

## 24. Any Technical Debt Discovered

- Fixed during this phase: nested API writes with string-UUID FKs 500'd
  (pre-existing since Phase 2, uncovered); invalid nested rows 500'd instead of
  400ing. Both now covered by regression tests.
- `vitest.setup.ts` lacked `afterEach(cleanup)` — added (test-only change).
- Pre-existing (untouched): `UserCreateSerializer` dead code, `LargePagination`
  unused, ckeditor4 EOL warning, missing `static/` dir warning, admin layout
  active-link mismatch (`/fa/admin/...` vs `/admin` comparison), category
  parent-select lists roots only, `slug_t` naming wart.

## 25. Exact Recommended Next Phase

**Phase 5 — Public Product Catalog (read-only):** public `/products` +
`/products/[slug]` + category pages consuming the existing public API
(`effective.state` pricing, `cover_image_url`, specs/attributes/related/docs),
with SSR `generateMetadata` from SEO fields, dynamic sitemap entries, and the
deferred narrow `next/image` adoption — no backend reshaping expected.

---

PHASE 4 STATUS: COMPLETE

RECOMMENDED NEXT PHASE: Phase 5 — Public Product Catalog (read-only storefront
+ SEO metadata) as specified in §25.

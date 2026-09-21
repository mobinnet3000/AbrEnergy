# Phase 2 — Product & CMS Data Foundation Report

Date: 2026-09-19. Scope: DATA DOMAIN + ADMIN FOUNDATION + API FOUNDATION + TESTS. No React CMS, no homepage redesign, no public product pages.

## 1. Executive Summary

New `apps/products` domain built on Phase 1 patterns (translation tables, prefetch-aware `get_translation()`, bleach sanitization, `IsContentManager`/`IsAdminUser` gates, manual `path()` versioning, `StandardPagination`). 11 models, 9 public/admin endpoints, Django Admin with inlines, idempotent Persian-only seed (22 categories), 41 new tests. Full suite: **75 passed** (34 Phase 1 + 41 Phase 2) on SQLite; frontend `tsc` 0, `lint` 0 errors (61 pre-existing warnings), `build` success. Live PostgreSQL/Redis NOT verified (no creds/infra) — same limitation as Phase 1.

## 2. Architecture Before Phase 2

Per Phase 0/1 reports: 10 apps, no Product/Category/Price/Discount/Attribute/Spec models, no product API/admin/migrations. Translation-table i18n (fa/ar/en) with `prefetch_related` + prefetch-aware `get_translation()`. Media locked to images (jpg/jpeg/png/webp, 10 MB, Pillow-verified, `IsContentManager` upload). Public GETs `AllowAny`; writes role-gated; no success envelope (error envelope only). `TranslatedSlugDetailMixin` for translation-slug lookup.

## 3. New Apps

- `apps/products` (`ProductsConfig`, `name="apps.products"`): isolated catalog domain. Wired in `config/settings/base.py` `INSTALLED_APPS` and `config/api_v1.py` (public `products/`, `product-categories/`; admin `admin/products/`, `admin/product-categories/`).

## 4. New Models

### ProductCategory
- Purpose: unlimited-depth category tree + landing-page shell.
- Fields: `parent` (self FK CASCADE), `slug` (unique, unicode), `sort_order`, `is_active`, `is_featured`, `cover` (MediaFile FK), SEO (`seo_title/description`, `canonical_url`, `robots` index/noindex matrix, `og_title/description`, `og_image`), `created_at/updated_at`.
- Relations: `children`, `products`, `translations`, `attribute_definitions`.
- Constraints: `productcategory_no_self_parent` (parent != self); `clean()` mirrors at model level.
- Indexes: `(parent, is_active, sort_order)`. Ordering: `sort_order, created_at, id`.

### ProductCategoryTranslation
- Purpose: fa/ar/en title/description/content/SEO/slug per category.
- Fields: `category` FK, `language` (db_index), `title`, `slug` (blank→auto slugify), `description`, `content` (bleach on save), `meta_title/description`.
- Constraints: `unique_together (category, language)`.

### Product
- Purpose: catalog item, lifecycle `draft/published/archived` + `public/hidden` visibility split.
- Fields: `category` (SET_NULL), `sku` (unique), `status`, `visibility`, `is_featured`, `is_active`, `sort_order`, `published_at` (auto-stamped on first publish), SEO/OG same shape as category, timestamps.
- Relations: `translations`, `images`, `documents`, `specifications`, `attribute_values`, `price` (1:1), `related_from/related_to`.
- Indexes: `(status, visibility, is_active)`, `(category, status)`, `(status, is_featured)`. Ordering: `sort_order, -created_at, id`.
- `is_publicly_visible` property centralizes the public rule.

### ProductTranslation
- Purpose: fa/ar/en title/short/description/features/SEO/slug per product.
- Fields: as category + `short_description` (1000), `features` (bleach on save).
- Constraints: `unique_together (product, language)`.

### ProductImage
- Purpose: ordered gallery reusing MediaFile.
- Fields: `product` CASCADE, `media_file` CASCADE, `sort_order`, `is_cover`, `alt_text`, `caption`.
- Constraints: partial-unique `uniq_product_cover` (one cover per product, DB-enforced). `save()` demotes siblings (pre-save so concurrent covers can't trip the constraint; ordering `-is_cover, sort_order, id`).
- No binary storage; no MediaFile duplication.

### ProductDocument
- Purpose: PDF downloads (catalog/datasheet/installation guide/spec sheet/other).
- Fields: `product` CASCADE, `media_file` CASCADE, `title`, `doc_type`, `sort_order`, `is_active`, `description`.
- `clean()` rejects non-`document` MediaFile. Ordering `sort_order, created_at, id`.

### ProductAttributeDefinition
- Purpose: per-category reusable spec keys (no fixed power/voltage columns).
- Fields: `code` (unique slug), `name`, `data_type` (text/number/boolean/select), `unit`, `category` (nullable → global), `sort_order`, `is_active`.
- Ordering `sort_order, code`.

### ProductAttributeValue
- Purpose: typed value per (product, definition).
- Fields: `product` CASCADE, `definition` CASCADE, `value_text`, `value_number` (15,3), `value_boolean` (nullable).
- Constraints: `uniq_product_attribute`. `clean()` enforces type-appropriate field. `display` renders with unit.

### ProductSpecification
- Purpose: grouped display rows for product detail pages.
- Fields: `product` CASCADE, `section`, `label`, `value`, `unit`, `sort_order`.
- Index `(product, section, sort_order)`. Ordering `section, sort_order, id`.

### ProductPrice
- Purpose: single price record per product; backend computes final state.
- Fields: `product` OneToOne, `display_mode` (contact/regular/discounted/hidden), `regular_price`/`sale_price` (Decimal 15,2 — never float), `currency` (default IRR, display deferred to frontend), `discount_type` (none/percentage/fixed), `discount_value`, `starts_at/ends_at` (tz-aware), `is_active`.
- `clean()` + 6 DB CheckConstraints: non-negative prices/discount, `sale ≤ regular`, `percentage ≤ 100`, `ends > starts`.
- `get_effective()` returns one of `contact_for_price/regular/discounted/scheduled/expired/hidden` with `final_price` + inputs — frontend never computes.

### RelatedProduct
- Purpose: manual related/similar/accessory/recommended links.
- Fields: `from_product`/`to_product` CASCADE, `relation_type`, `sort_order`, `is_active`.
- Constraints: `uniq_product_relation`, `relation_no_self_reference` + `clean()`. Ordering `sort_order, id`.

## 5. Translation Architecture

Reused verbatim: separate `*Translation` tables, `language` db_index, `unique_together`, bleach on `save()`, prefetch-aware `get_translation()` (fa requested → fa else fallback pattern in serializers; `__str__` uses fa). No `name_fa`-style columns. Seed writes fa only; en/ar rows accepted by API but never seeded.

## 6. Category Tree Architecture

Self-referencing `parent` CASCADE, no depth limit, no mptt/treebeard (no justification). Public list returns active-only tree (`children` filtered to active, prefetched `children__translations`). Ordering deterministic (`sort_order, created_at`). Detail lookup by canonical `slug` (ASCII-safe `<str:slug>` converter chosen deliberately — Persian slugs 404 under `<slug:slug>`; verified by test).

## 7. Product Architecture

`draft/published/archived` status × `public/hidden` visibility × `is_active` × `is_featured`, all independently filterable. `published_at` auto-stamps. No cart/order/payment/shipping. Short summary + rich description + features + gallery + docs + specs + attributes + related + pricing + SEO cover the studio surface without a block builder.

## 8. Media Architecture

`ProductImage`/`ProductDocument` hold only FKs to `MediaFile`. Cover rule DB-backed (partial unique) + demotion logic. Gallery ordering `sort_order`. Upload perms unchanged (`IsContentManager`).

## 9. Pricing Architecture

OneToOne `ProductPrice`; Decimal money; mode + explicit sale price + percentage/fixed computed discounts; scheduled windows; inactive flag. All validation at model (`clean()` + CheckConstraints); write serializer delegates nested `price_data` through `full_clean()`.

## 10. Discount Logic

`get_effective()` precedence: inactive/hidden → `hidden`; contact-mode or no regular price → `contact_for_price`; regular mode → `regular`; future start → `scheduled`; past end → `expired`; else sale price wins, then percentage, then fixed, else `regular`. All datetimes tz-aware (`Asia/Tehran` project TZ).

## 11. Attributes

Definition/value split; `code` stable key; category-scoped or global; 4 data types; per-type validation; `display` helper. Different categories hold different definition sets (tested).

## 12. Specifications

Free-form grouped rows (`section/label/value/unit/order`); ordered per product; no fixed columns.

## 13. Related Products

Directed, typed, ordered, active-flagged; duplicates and self-links rejected at DB + model level.

## 14. SEO Foundation

Both Product and ProductCategory carry `seo_title/description`, `canonical_url`, `robots` (4-way index/follow), `og_title/description/og_image`, plus per-language `meta_title/description` in translations (translation wins, falls back to object SEO). Detail serializer exposes them publicly for published items only. No sitemap/metadata rendering yet (later SEO phase). No slug-history table — documented follow-up.

## 15. Publishing / Status

`draft/published/archived`; public querysets hard-filter `status=published, visibility=public, is_active=True`. Admin can list/filter all states. No `scheduled` state (publish windows live on price, not product — deliberate simplification; `ponytail:` add `scheduled` + `publish_at` when editorial workflow lands).

## 16. Permissions

No new roles, no new framework. Public reads `AllowAny`; all admin product/category/attribute writes `IsAuthenticated + IsContentManager` (super/website/content). Granular per-field perms (pricing vs media vs SEO) NOT separated — one content gate, matching existing article write semantics. Customer/anonymous writes 403 (tested). Content editors gain no system-admin rights. Future `PRODUCT_MANAGER/SEO_MANAGER` map to new `UserRole` values + permission classes without schema change.

## 17. API Endpoints

Public: `GET /api/v1/products/` (filters `category,is_featured`; search title/short/sku; ordering sort/created/published), `GET /api/v1/products/featured/`, `GET /api/v1/products/<slug>/`, `GET /api/v1/product-categories/`, `GET /api/v1/product-categories/<slug>/`. Admin: `GET/POST /api/v1/admin/products/`, `GET/PUT/PATCH/DELETE /api/v1/admin/products/<uuid>/`, same shape for `admin/product-categories/`, `GET/POST .../attributes/`. Conventions: manual paths, `StandardPagination`, `?lang=`→`Accept-Language`→`fa`, `distinct()` on translated search, `TranslatedSlugDetailMixin` for public detail. Homepage-ready without special tables: `?is_featured`, ordering, category filter, `effective.state == discounted` client-filterable, `published_at` latest.

## 18. Public API Exposure Rules

List exposes card fields + `cover_image_url` + normalized `price.effective` only. Detail adds sanitized description/features, active documents, specs, attribute displays, related titles, SEO. Never exposed: drafts/archived/hidden/inactive, internal notes (none exist), audit data, perms, price internals beyond `effective`. Verified: draft/archived detail → 404, lists exclude them.

## 19. Admin Configuration

`ProductCategoryAdmin`: fa-title display, slug/parent/order/active/featured, `translations__title` search, editable order/flags, translation inline. `ProductAdmin`: fa-title/sku/category/status/visibility/featured/order/created, filters + sku/translated-title search, inlines (translations, price 1:1, images, documents, specs, attr values, relations), publish/archive/feature actions. `ProductPriceAdmin`, `ProductImageAdmin` (preview), `AttributeDefinitionAdmin`. No mega-form beyond inlines; React Admin stays primary in Phase 3.

## 20. Seed Data

`python manage.py seed_product_categories` — 4 parents + 18 children (7/4/3/4), Persian titles, parent-scoped idempotency (same child title under different parents creates distinct rows — required since Apartment/Villa/Pharmacy/Medical Office repeat). Rerun: `categories created: 0`. Never deletes, never touches products, preserves manual edits except `sort_order` normalization. Verified live: 22 → 0.

## 21. Migrations

- `products/0001_initial.py`: all 11 models + 9 constraints/indexes.
- `media_manager/0004_*`: `file` validator + `file_type` gain `document`.
- `makemigrations --check`: clean. `migrate --run-syncdb` on SQLite: ok. Live PG migrate NOT run (no creds).

## 22. Tests

`apps/products/tests/test_phase2.py` — 41 tests: categories (6), products incl. visibility/search/N+1/SEO (13), pricing (9), media incl. PDF upload + exe rejection (5), attributes/specs (3), relations (1), permissions (3), seed idempotency (1). Full suite **75 passed** (34 Phase 1 intact + 41 new). Run via temp SQLite settings (repo `test.py` targets PG; creds unavailable — same as Phase 1).

## 23. Query Optimization

Public QS: `select_related(category)` + `prefetch(translations, images→media_file, price, specifications, attribute_values→definition, documents, related_from→to_product)`. Serializers read prefetch cache (cover resolution iterates prefetched images). List N+1 regression test caps 5 products < 25 queries. Translated search uses `distinct()`.

## 24. Security

- Upload: images unchanged; PDFs allowed only with `application/pdf` MIME + `%PDF-` magic + 25 MB cap + `IsContentManager`. exe/svg/zip still 400.
- `ProductDocument.clean()` pins docs to `document`-type media.
- Rich text bleached on save (category content, product description/features).
- No price-float, no mass-assignment beyond declared write fields, role escalation untouched from Phase 1.
- Cache candidates (no implementation): category tree, featured, product list/detail, homepage sections. Never cache admin.

## 25. Frontend Changes

Minimal contract only — no pages, no redesign, no visuals touched:
- `src/types/index.ts`: `ProductStatus/Visibility`, `PriceDisplayMode/State`, `ProductPrice`, `ProductCategory`, `ProductListItem`, `ProductDetail`.
- `src/api/index.ts`: `productsApi` (categories, list, bySlug, featured).
- `src/i18n/config.ts` (+ barrel): `activeLocales = ['fa']` marker; switcher component untouched and still renders all locales — gating it is deferred to the Persian-only UX phase per brief (broad refactor risk).

## 26. Files Changed

New: `apps/products/` (models, translations, admin, api/serializers+views+4 urlconfs, seed command, migration 0001, 41 tests). Modified: `config/settings/base.py` (app), `config/api_v1.py` (4 mounts), `media_manager/models.py` (document type + save inference), `media_manager/api/v1/serializers/media.py` (PDF branch), migration 0004, frontend `types/api/i18n` (above). Phase 1 files otherwise untouched.

## 27. Remaining Technical Debt

- Live PG migrate/seed + Redis unverified (no creds/infra).
- `MediaFile.save()` infers document-by-extension when `file_type` unset (test-path convenience; API always sets it explicitly).
- `CategorySerializer.slug_t` exposes translated slug alongside canonical (naming wart; harmless).
- Slug history/redirects not implemented.
- No per-field pricing/media/SEO permission split.
- Temp SQLite settings used for tests only, deleted after run (not committed).

## 28. Deferred Work

Phase 3 React Admin, public product/category pages, homepage sections (carousel/price cards), dynamic sitemap/metadata, `next/image` migration, switcher gating, approval workflow, per-field perms, slug history, caching, S3, CI.

## 29. Phase 3 Recommendation

Consume `productsApi` contract: admin category tree CRUD, product editor (translations tabs + nested price/images/docs/specs/attributes/relations), public catalog honoring `effective.state`. No backend reshaping expected.

## 30. Phase 2 Acceptance Criteria

- [x] Product app/domain exists — `apps/products`
- [x] Category tree exists — self-FK, unlimited depth
- [x] Seeded — 22 fa categories, idempotent
- [x] Product model + translations + category translations
- [x] Images (single-cover DB rule) + documents (PDF-only)
- [x] Attributes (definition/value, per-category) + specifications
- [x] Pricing (Decimal) + discount logic (`get_effective`, 6 states)
- [x] Related products (typed, dedup, no-self)
- [x] SEO foundation (title/desc/canonical/robots/OG + translated meta)
- [x] Publishing states + visibility split + public filtering
- [x] Search (translated title + SKU + category, distinct, N+1 capped)
- [x] Permissions (content gate, no new roles, editor ≠ admin)
- [x] Django Admin foundation (lists/filters/search/inlines/actions)
- [x] API contract (9 endpoints, tested)
- [x] Migrations clean, seed idempotent
- [x] Backend 75 passed; tsc 0; lint 0 errors; build ok
- [x] UI/animations/homepage untouched; no React CMS; no product pages; no en/ar product content
- [x] This report exists

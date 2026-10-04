# Phase 9.4 — Product & Category Duplicate / Clone Report

## 1. Status

**Status: COMPLETE.** Server-side product/category duplication is implemented,
tested, and fully verified per the approved Phase 9.4 brief. The Phase 9.4
Preflight / Duplicate-Clone Architecture Audit
(`docs/reports/phase-09.4-preflight-duplicate-clone-report.md`) was read first
and remains the authoritative matrix; all of its explicit decisions are
implemented exactly as approved. Phase 9.3-B (Admin Dashboard Hub) is COMPLETE
and ACCEPTED and remains the baseline. No Phase 9.5 work started.

Backend `python -m pytest apps/`: **187 passed** (163 baseline intact + 24 new).
Frontend `npm run test` (vitest): **427 passed / 50 files** (411/48 intact +
16 new / 2 files). `npx tsc --noEmit`: 0 errors. `npm run lint`: 0 errors,
54 warnings (baseline-exact, zero new). `makemigrations --check`: no changes.
Production build: success. Runtime smoke (prod :3100 + dev :3000): green.

## 2. Baseline

Accepted Phase 9.3-B baseline, re-stated (not re-run before edits; suites were
re-run after):

- Backend 163 passed; frontend 411 passed / 48 files; tsc 0 errors;
  ESLint 0 errors / 54 warnings; production build successful.
- Phase 9.3-A URL-persisted list state and 9.3-B Dashboard Hub accepted.
- No Phase 9.4 implementation existed (verified: repo-wide `duplicate|clone`
  grep matched only unrelated relation-picker guards and homepage keys).

Prerequisite reports read completely before any modification:
`phase-09.4-preflight-duplicate-clone-report.md`, `phase-09.3b-dashboard-hub`,
`phase-09.3a-url-persisted-list-state`, `phase-09.2-content-lists-dirty-guards`,
`phase-09.1-list-efficiency`, `phase-08.5-error-mapping`,
`phase-08.3-dirty-navigation-guard`. No report line numbers were trusted;
every target was re-located in current source.

## 3. Approved decisions implemented

All §2 decisions from the brief, implemented exactly:

- Product SKU `<SOURCE_SKU>-COPY`, then `-COPY-2`, `-COPY-3`, … — server-side
  only; request body carries no overrides (the views ignore the body entirely).
- Product resets: status `draft`, visibility `hidden`, `is_active=False`,
  `is_featured=False`, `published_at=NULL`, `canonical_url=""`.
- Product copies: category FK, `sort_order`, SEO advisory fields, `og_image`
  reference; deep-copied translations (every locale), images, documents,
  attribute values (same definitions), specifications, price.
- Product omissions: outgoing `RelatedProduct`, auto-link, `HomepageFeaturedProduct`,
  `SlugHistory` (zero rows); incoming relations untouched; definitions never copied.
- Translation titles: fa `«<title> (کپی)»`, ar `<title> (نسخة)`,
  en `<title> (copy)`; missing locales stay missing.
- Product translation slugs: `<slug>-copy[-N]` per locale; empty source slug
  generates from the suffixed title via the existing `slugify` save behavior,
  then collision-handles.
- Category: node-only under the SAME parent; no children/products copied or
  moved; `is_active=False`, `is_featured=False`; `sort_order` copied; cover +
  `og_image` referenced; SEO advisory copied; `canonical_url=""`; translations
  deep-copied with locale titles/slugs; model slug `<slug>-copy[-N]`;
  zero history; no homepage row; definitions untouched.
- Permissions: backend `[IsAuthenticated, IsContentManager]`; frontend
  `canManageProducts` / `canManageProductCategories`; no new permission/role.

No blocking contradiction was found in current source; no second
architecture/preflight phase was opened.

## 4. Backend files changed

1. `AbrEnergy/apps/products/duplication.py` — **new** (~500 lines): service-level
   `duplicate_product()` / `duplicate_category()` plus small testable helpers
   (SKU/slug candidate walks, locale title suffixes, domain advisory locks,
   `DuplicationError`). ORM only; never touches the write serializers.
2. `AbrEnergy/apps/products/api/v1/views/products.py` — added
   `AdminProductDuplicateView` and `AdminCategoryDuplicateView` (POST,
   `[IsAuthenticated, IsContentManager]`, 201 with existing admin detail
   serializers). All existing views byte-identical in behavior.
3. `AbrEnergy/apps/products/api/v1/urls/admin_urls.py` — added
   `<uuid:pk>/duplicate/` (before the detail route, same family as `preview/`).
4. `AbrEnergy/apps/products/api/v1/urls/admin_category_urls.py` — same for
   categories (existing `attributes/` order untouched).
5. `AbrEnergy/apps/products/tests/test_phase9_4_duplicate.py` — **new**,
   24 tests (§17).

Intentionally untouched: models, serializers, migrations, permissions,
homepage/media apps, public views, preview/token code, pagination, settings.

## 5. Frontend files changed

1. `abr-energy-frontend/src/api/index.ts` — `adminProductsApi.duplicate(id)` →
   `POST /admin/products/:id/duplicate/` and the category counterpart
   (empty-object body; server ignores it).
2. `abr-energy-frontend/src/hooks/use-api.ts` — `useDuplicateAdminProduct`
   (invalidates `admin-products` + `admin-dashboard`, mirroring the create
   hook) and `useDuplicateAdminProductCategory` (invalidates
   `admin-product-categories`). No other hook touched.
3. `abr-energy-frontend/src/app/[locale]/admin/products/page.tsx` — Duplicate
   overflow-menu item (Copy/Loader2 icons, per-item `duplicatingId`
   pending/disabled state, double-submit guard), success toast + `router.push`
   to the returned id's edit page, normalizer-based error toasts. No toolbar
   redesign, no edit-page button, no confirm dialog.
4. `.../admin/products/categories/page.tsx` — identical pattern for categories.
5. `abr-energy-frontend/locales/{fa,ar,en}.json` — 3 keys each, full parity:
   `admin.duplicate`, `admin.product_duplicated`, `admin.category_duplicated`.
   No locale activated, no other locale change.
6. Tests: `product-duplicate.test.tsx` + `category-duplicate.test.tsx`
   (**new**, 8 + 8); mock completion only in `list-efficiency.test.tsx`,
   `products-list-url.test.tsx`, `categories-list-url.test.tsx`
   (added the two new hook stubs; zero assertions changed).

## 6. Exact duplication semantics

Product copy (one `transaction.atomic()`): new UUID; `category_id` preserved;
`sort_order` copied; `seo_title/seo_description/robots/og_title/og_description`
copied; `og_image_id` referenced; status/visibility/active/featured/
`published_at`/`canonical_url` reset per §3. Translations: one new row per
existing locale row (new PK, suffixed title, fresh slug, copied
`short_description/description/features/meta_*`; gaps preserved). Images/
documents: new rows with the SAME `media_file_id` (all scalar fields copied;
exactly-once cover preserved by construction). Attribute values: new rows with
the SAME `definition_id`. Specifications: new rows, all fields. Price: new row
(all fields) when present, else none. Related outgoing: zero rows. Incoming:
untouched. No original↔duplicate edge. No homepage row. Zero history rows
(new translation PKs have no prior slug, so `save()` no-ops by construction).
`full_clean()` on main + owned rows; translations saved via `save()` exactly
like the existing write serializers (sanitization + slug-gen + history no-op).

Category copy (one `transaction.atomic()`): new UUID; same `parent_id`;
fresh model slug; `sort_order` copied; `is_active/is_featured=False`;
`cover_id`/`og_image_id` referenced; SEO advisory copied; `canonical_url=""`;
one new translation row per existing row (suffixed title, copy-family slug
where a slug exists, empty stays empty for `save()` auto-generation).
Products, children, parent, homepage row, history, and attribute definitions
untouched/omitted per §3.

## 7. SKU generation strategy

Candidates: `<SKU>-COPY`, `<SKU>-COPY-2`, … (uppercase `COPY` per the approved
scheme), truncated to the 64-char column by trimming the source part. Walk is
existence-checked (`Product.objects.filter(sku=…)`) and bounded
(`MAX_SKU_ATTEMPTS = 100`). The DB unique constraint is the backstop: each
create attempt runs in an inner savepoint, and an `IntegrityError` advances to
the next candidate (tracked in a `tried` set so a rolled-back SKU is never
retried). Exhaustion raises `DuplicationError` → 409 with the standard
`{status, errors}` envelope. No sequences/counters/models/migrations; the body
SKU is never read.

## 8. Product slug strategy

Independent per-locale walk against the SAME language across other products:
`<source-slug>-copy`, `-copy-2`, … (ASCII `-copy` in all locales, 500-char
fit). The original slug is never reused. Empty source slug: `slugify` the
suffixed duplicate title (existing save behavior — the suffix already embeds
the copy marker), then `<gen>`, `<gen>-2`, … on collision. Bounded
(`MAX_SLUG_ATTEMPTS = 50`); exhaustion → 400/409, never 500. Zero `SlugHistory`
rows are created or copied. Translations are saved with plain `save()` (not
`full_clean`), mirroring `ProductWriteSerializer.create`, so faithfully-copied
source data is never rejected by validation the editor path does not apply
(discovered via test failure §17.1, fixed deliberately).

## 9. Category slug strategy

Model slug: `<slug>-copy[-N]` (255-char fit) with existence checks plus the DB
unique constraint as backstop via the same savepoint-retry shape as SKU
(`MAX_SLUG_ATTEMPTS = 50`, 409 on exhaustion, `IntegrityError`/`ValidationError`
mapped into the existing envelope, never 500). Translation slugs receive the
same copy-family treatment per language where they exist; empty stays empty so
`save()` auto-generates from the suffixed title. Zero history rows.

## 10. Concurrency/locking strategy

Database in use: **PostgreSQL** (dev `abrenv_db`, test `abrenv_test`; test
settings `config/settings/test.py:6-15`). Strategy, in order:

1. One `transaction.atomic()` per duplication (atomicity).
2. `select_for_update()` on the source row — serializes concurrent duplicates
   of the SAME source (the suffix-chain race).
3. Transaction-scoped advisory lock FIRST inside the transaction —
   `SELECT pg_advisory_xact_lock(hashtext('abrenergy:duplicate:product'))`
   (and a separate `…:product-category` key): because
   `ProductTranslation.slug` has NO uniqueness backstop, two duplicates of
   DIFFERENT sources that already share a slug string would otherwise both
   check-then-insert `<slug>-copy` with no error. The per-domain lock makes
   every duplication's existence-check walk atomic with respect to other
   duplications. Lock ordering is fixed (advisory → row lock), scope is
   transaction-only (auto-released), code is isolated to `duplication.py`
   (no generic framework), and it is skipped on non-PostgreSQL backends
   (where walk + row lock still apply).
4. DB constraints remain the backstop for SKU and category slugs
   (savepoint retry, bounded); translation slugs rely on (3).
5. All walks bounded; exhaustion → 400/409; whole-copy failure → full rollback.

Residual (documented, pre-existing): concurrent *editor* creates are not
serialized against duplications (no lock covers `ProductWriteSerializer`);
a lost SKU/category-slug race maps to 409 via the constraint, and editor-path
translation-slug collisions were already possible before this phase (no
constraint exists — unchanged architecture, not introduced here).

## 11. Media behavior

`ProductImage`/`ProductDocument` rows deep-copied (new PKs, all scalar fields
copied); `media_file_id` identical (reuse); zero new `MediaFile` rows
(asserted); zero physical files created; single-cover invariant preserved
(exactly one cover copied); `og_image`/`cover` FKs referenced (`SET_NULL`
semantics unchanged). Shared-media fate caveat (`CASCADE` on image/document
media FKs) is pre-existing FK semantics, editor-documented, not introduced.

## 12. Related-product behavior

Duplicate gets ZERO outgoing `RelatedProduct` rows; the source's outgoing rows
are unchanged; incoming rows (owned by other products) untouched; no reverse
rows created; no original↔duplicate edge in either direction (all asserted).
Editors re-add relations deliberately via the existing picker.

## 13. Homepage behavior

No `HomepageFeaturedProduct` / `HomepageCategory` row is created for either
duplicate kind (asserted); the source's homepage rows are unchanged
(asserted). Duplicates can therefore never auto-surface on the homepage.

## 14. Permission behavior

Backend: both `POST …/duplicate/` endpoints require
`[IsAuthenticated, IsContentManager]`, identical to sibling admin views.
Tested: anonymous → 401, `customer`/`engineer` → 403,
`content_manager`/`website_admin`/`super_admin` → 201, on BOTH endpoints.
Frontend: Duplicate items render iff `canManageProducts` /
`canManageProductCategories` (same `canWrite` gating the menus today); no new
permission, role, or helper. Backend stays authoritative.

## 15. API contract

- `POST /api/v1/admin/products/<uuid:pk>/duplicate/` → 201 + full
  `AdminProductDetailSerializer` of the NEW resource (its `id`).
- `POST /api/v1/admin/product-categories/<uuid:pk>/duplicate/` → 201 + full
  `CategorySerializer` of the NEW resource.
- Body: none required; any body (including `sku`/`slug`) is ignored —
  verified by test (`HACKED` never lands).
- Errors in the existing envelope: unknown/malformed `pk` → 404
  `{"status":404,"errors":{"detail":…}}`; exhaustion → 400/409 field errors;
  nested validation → 400 field map; auth → 401/403 via DRF defaults.
- Non-idempotent by design (each call creates a resource); double-click
  protection is frontend-held (per-item pending + guard).

## 16. Frontend UX

Row overflow-menu Duplicate item on both lists (after Edit, before Delete;
gated by existing `canWrite`). Click → that item shows spinner + disabled
while the single POST is in flight (second clicks blocked) → list queries
invalidated via the new hooks → success toast (`admin.product_duplicated` /
`admin.category_duplicated`, fa/ar/en) → `router.push` to
`/admin/products/<returned-id>/edit` (resp. categories) using the ID from the
response, never the source id. No confirm dialog (non-destructive create).
Errors via the Phase 8.5 normalizer: 403 → `permission_denied`, network/5xx →
`server_connection_failed`, 400/409 → concise `path: message` toast (never
`[object Object]`). List URL state untouched (no `replace` fires; target edit
page loads clean; no dirty dialog exists on lists).

## 17. Test matrix and exact results

Backend `AbrEnergy/apps/products/tests/test_phase9_4_duplicate.py` — **24
tests, all green** (full backend suite **187 passed**, baseline 163 intact):

1. Permissions (4): both endpoints × {anon 401, customer/engineer 403,
   3 manager roles 201}; unknown UUID 404; malformed UUID 404 (not 500).
2. Product happy path (9): new UUID/detail shape; resets + category/SEO/OG;
   translations (suffixes/slugs/originals intact/PK regen); nested rows
   (images/docs/values/specs/price); media reuse (same ids, cover×1,
   MediaFile count constant); defs/relations/homepage; history isolation;
   publication invisibility (`public_product_qs`, public 404, resolve 404);
   body overrides ignored; ×3 repeated copy-family (SKUs + fa slugs).
3. Category happy path (3): node-only placement/resets/copies; fa/en slug
   treatment; products/children/definitions/homepage/history assertions;
   public invisibility; ×2 repeated slugs.
4. Edge cases (6): missing locales stay missing; empty source slug
   regenerates from title; bare product (no price/images/docs); SKU
   exhaustion → 409 envelope; product-slug exhaustion → 409; category-slug
   exhaustion → 409; atomic rollback (forced `RuntimeError` mid-copy →
   zero partial rows incl. earlier-written images/translations).
5. Concurrency (2, real threads on PostgreSQL, `transaction=True` so workers
   see committed rows): 4× same-source duplicates → 4 distinct SKUs/slugs
   (`-COPY…-COPY-4`); cross-source duplicates of two products SHARING a slug
   → `{shared-copy, shared-copy-2}` with no silent collision.

Notable fix during implementation: the first run failed 7 tests because
translation copies used `full_clean()` (stricter than the editor path, which
persists translations without validation). Aligned to the existing behavior
(plain `save()`); re-ran to 24/24. A second fix: pytest fixtures are invisible
inside `unittest.TestCase` methods (`monkeypatch` arg) → switched to
`mock.patch.object`; concurrency classes converted from `TestCase` to plain
pytest classes (threads need committed data).

Frontend — **16 new tests, all green** (full suite **427 passed / 50 files**,
baseline 411/48 intact): per list — visibility iff `canWrite` + hidden for
read-only; exactly one POST per click; pending spinner/disabled +
double-submit blocked; success toast + `router.push` with the RETURNED id
(source id absent); no dirty dialog + no `replace` (URL state intact); 403 /
network / 400 mappings incl. field-context and no `[object Object]`.

## 18. Migration result

`python manage.py makemigrations --check --dry-run`: **No changes detected**
(only the pre-existing `ckeditor.W001` EOL notice). Zero schema changes, as
designed — duplication creates rows with the existing schema.

## 19. Runtime smoke result

Canonical Phase 7.6 workflow (dev :3000 stopped + verified free → build →
prod :3100 → stop prod → delete ONLY `.next` → one dev → verify):

- `npm run build`: success (full route table incl. all admin lists,
  `new`/`[id]`/`[id]/edit` shells, all three preview routes dynamic,
  `/sitemap.xml` + `/robots.txt`).
- Prod `:3100`: `/fa` 200 (exactly one `<h1`, `dir="rtl"`, slogan, zero
  `vendor-chunks` error text); `/fa/products`, `/fa/products/categories`,
  `/fa/admin`, `/fa/admin/products`, `/fa/admin/products/categories`,
  `/fa/preview/homepage` (PREVIEW banner + `noindex`), new/edit shells
  (incl. zero-UUID edit shells) — all 200.
- `/sitemap.xml` 200 with zero `preview` hits; `/robots.txt` 200.
- Django `:8000` was not running in this environment (no process at session
  start, left untouched per data safety — same standing as Phase 9.3-B);
  anonymous-admin authorization is proven by the backend permission tests
  (401 on both duplicate endpoints) rather than a live probe; homepage/public
  API live probes were likewise unavailable and are covered by the
  untouched existing suites.
- End state: exactly ONE `next dev` chain (launcher + single server child),
  `/fa` 200, `/fa/admin` 200, `:3100` free, `.next` removed.

## 20. Data-safety statement

No database reset/seed/flush; no deletion of real content; no migration; no
modification of existing products/categories for testing (all backend tests
use the isolated test DB with fixtures created per-test); no production
content mutation (all runtime probes were read-only GETs plus static shells);
no physical media files copied (reuse-by-reference; the ~pytest
`AbrEnergy/media/**` UUID byproducts from backend re-runs were all deleted —
zero remain); existing `MediaFile` binaries untouched.

## 21. Known limitations

1. Editor-path races are not serialized against duplications (§10 residual);
   SKU/category-slug losses map to 409 via constraints; translation-slug
   collisions with concurrent editor creates were already possible (no
   constraint — pre-existing architecture).
2. Duplicating a product whose source has 100+ colliding SKU/slug siblings
   exhausts the bounded walk → 409 (by design, never unbounded/500).
3. Source rows carrying technically-invalid slugs (created without
   validation, e.g. containing spaces) are faithfully copied with the suffix
   — same fidelity as the editor path, not re-validated.
4. Category list beyond 100 rows still follows the API contract (9.1 §19
   standing — untouched).
5. Click-level browser walkthrough and screen-reader verification NOT TESTED
   (no automation — same standing as Phases 7.5–9.3-B; evidence is SSR/prod
   smoke + unit/integration behavior + code inspection).

## 22. Deferred items

Explicitly NOT started (STOP list honored): media reuse picker, bulk
duplicate, subtree clone, SKU generator/sequence, draft/versioning,
scheduling, approvals, new roles/permissions, edit-page duplicate buttons,
category parent selector, SEO auto-rewrite, physical media copy, migrations,
unrelated UI redesign.

## 23. Git diff/status summary

HEAD unchanged (no commit requested; prior accepted work remains stacked
uncommitted). Phase 9.4 delta only:

- New: `AbrEnergy/apps/products/duplication.py`,
  `AbrEnergy/apps/products/tests/test_phase9_4_duplicate.py`,
  `abr-energy-frontend/.../admin/products/product-duplicate.test.tsx`,
  `.../admin/products/categories/category-duplicate.test.tsx`,
  this report.
- Modified (9.4 hunks only): `views/products.py` (+2 views),
  `admin_urls.py` + `admin_category_urls.py` (+1 route each),
  `src/api/index.ts` (+2 `duplicate` fns), `src/hooks/use-api.ts`
  (+2 hooks), the two list pages (+Duplicate item, pending state, handlers),
  `locales/{fa,ar,en}.json` (+3 keys each), 3 existing list suites (hook-stub
  completion, zero assertions changed).
- `AbrEnergy/media/**`: zero untracked remain. `.next`: removed.

## 24. Final recommendation

**Phase 9.4 is ACCEPTED and ready for the next phase.** All approved semantics
are implemented exactly, the load-bearing concurrency trap (unconstrained
`ProductTranslation.slug`) is closed with a documented, isolated,
transaction-scoped advisory-lock strategy proven by real-thread tests on
PostgreSQL, and the full verification matrix is green with zero regressions.
Next natural slices per the 9.0 plan: P2-4 media reuse picker (pending the
explicit permission decision) — none started.

---

# FINAL REPORT / SUMMARY

**What changed.** Server-side duplicate/clone for products and categories:
new `apps/products/duplication.py` service (`duplicate_product`,
`duplicate_category` — atomic ORM copies with server-generated SKUs, slugs,
and locale titles; advisory-lock-serialized on PostgreSQL); two new admin
detail-action endpoints (`POST …/products/<uuid>/duplicate/`,
`POST …/product-categories/<uuid>/duplicate/`, 201 with the new admin
detail); Duplicate overflow-menu actions on both admin lists (per-item
pending, single POST, success toast, navigate to the returned id's edit
page); two React Query hooks; 3 locale keys × fa/ar/en; 24 backend + 16
frontend tests.

**Files changed.** Backend: `duplication.py` (new), `views/products.py`,
`admin_urls.py`, `admin_category_urls.py`, `test_phase9_4_duplicate.py`
(new). Frontend: `src/api/index.ts`, `src/hooks/use-api.ts`, both list
pages, 3 locale files, 2 new test files, 3 existing suites (stub-only).

**Tests passed.** Backend 187/187 (163 baseline + 24 new); frontend 427/50
(411/48 + 16/2); `tsc` 0 errors; ESLint 0 errors / 54 warnings
(baseline-exact); `makemigrations --check` clean; production build success;
runtime smoke green (prod :3100 all-200 incl. edit shells, sitemap with zero
preview hits, no vendor-chunk regression; dev :3000 single chain verified).

**Limitations.** Editor-path races not serialized vs duplications (409-mapped
by constraints; translation-slug editor collisions pre-existing); bounded
walks exhaust to 409 by design; no browser/AT walkthrough (no automation);
Django :8000 not running so live anonymous-API/homepage probes were replaced
by backend-test proof (same standing as 9.3-B).

**Phase 9.4 is accepted — STOP. No Phase 9.5 work started.**

# Phase 12.11 — Homepage Fixes, SKU Validation, Dynamic Favicon, Detail-Route Wiring & Release Readiness

Date: 2026-10-18
Scope: employer homepage corrections (featured/solutions order, duplicate category pills, featured category filter), SKU serializer validation, dynamic CMS favicon, services/projects/downloads submenu wiring, and a release-readiness verification pass. No architecture rewrite, no Phase 13, no destructive data operations.

Verdict: **PARTIALLY ACCEPTED** (see §9).

---

## 1. Summary of changes

- **Homepage order fixed.** The featured-products rail now renders **directly under the hero** and **above** the "راهکارها، متناسب با نیاز شما" (categories/solutions) section. `AboutSection` moved into the categories slot so the visual group stays intact.
- **Duplicate category pills removed.** The categories/solutions section no longer renders a second pill row that duplicated the hero's green quick-access strip. The strip is now the single source of category shortcuts.
- **Featured-rail category filter added.** The featured rail gained a "همه دستهها / All categories / كل الفئات" pill plus one pill per category actually present among the products (derived from data, never invented). Selecting a category filters the spotlight + rail and restarts at the first product.
- **SKU write is now validated.** The product serializer pre-validates SKU uniqueness with a friendly Persian field error, and wraps `create`/`update` in savepoints so a concurrent-insert `IntegrityError` still returns a **400 on the `sku` field** instead of a 500.
- **CMS favicon is now dynamic.** Server-side `generateMetadata` reads the admin-uploaded favicon from `/site-config/` and advertises it via `metadata.icons`; when unset (or an unusable type) nothing is emitted and the version-controlled `src/app/favicon.ico` file convention stays the fallback.
- **Services/Projects submenus are now data-driven.** They render the **live published entities from the public API** (real titles + real slugs → real `/services/<slug>` and `/projects/<slug>` detail pages), falling back to the configured employer children (section index) when the API returns nothing. Downloads keep the section index because no per-download entity/route exists.
- **Verified:** 66 frontend test files / **552 tests pass**, `tsc` 0 errors, ESLint 0 errors on changed files, backend **245 passed**, `npm run build` **exit 0**.

## 2. Files changed and why

### Homepage

| File | Change | Reason |
|---|---|---|
| `abr-energy-frontend/src/app/[locale]/(public)/homepage-client.tsx` | Section order → `['hero', 'featured_products', 'categories', ...base]`; `AboutSection` rendered inside the `categories` case | Featured products must sit directly under the hero, above solutions; About stays grouped with solutions. |
| `abr-energy-frontend/src/components/home/ProductRailSection.tsx` | Passes `showPills={false}` to `ProductCategoryNavigation` | Removes the duplicate pill row; the hero quick-access strip is the single category row. |
| `abr-energy-frontend/src/components/products/public/ProductCategoryNavigation.tsx` | New optional `showPills` prop (default `true`) | Lets the solutions section suppress its pill row without affecting other usages. |
| `abr-energy-frontend/src/components/home/FeaturedProductsSection.tsx` | Added `categoryFilter` state, `filterOptions` (derived), `activeFilter`, `visibleProducts`, `selectFilter`, `FeaturedFilterPill`, `showFilter` | Category filter submenu for the featured rail; switching a filter resets the spotlight to the first product via the click handler (no cascading effect). |
| `abr-energy-frontend/locales/fa.json`, `en.json`, `ar.json` | New key `home.featured_filter_all` | Localized "All categories" pill (همه دستهها / All categories / كل الفئات). |

### Backend (SKU)

| File | Change | Reason |
|---|---|---|
| `AbrEnergy/apps/products/api/v1/serializers/products.py` | `extra_kwargs = {"sku": {"validators": []}}`; `validate_sku`; `_sku_conflict`; `_is_sku_conflict`; `create`/`update` wrapped in `transaction.atomic()` catching `IntegrityError` → 400 on sku | Friendly field-scoped 400 instead of a DB IntegrityError (500); DB unique constraint remains the final safety net. |

### Favicon

| File | Change | Reason |
|---|---|---|
| `abr-energy-frontend/src/lib/site-metadata.ts` | **New** — `fetchSiteConfig`, `faviconHref`, `buildIconsMetadata` | Server-side favicon resolution + light type validation + graceful fallback. |
| `abr-energy-frontend/src/app/layout.tsx` | Static `metadata` → async `generateMetadata` that adds `icons` only when a usable favicon exists | Advertise the CMS favicon; keep `favicon.ico` as fallback when unset. |

### Navigation wiring

| File | Change | Reason |
|---|---|---|
| `abr-energy-frontend/src/config/navigation.ts` | `source` union extended with `'published-services'` / `'published-projects'`; set on the services/projects items (children kept as fallback) | Data-driven submenus from real CMS entities; configured children remain the empty-API fallback. |
| `abr-energy-frontend/src/components/layout/header-nav.tsx` | `normalizeList`, `useServices`/`useProjects`, new resolver branches (active services only; projects by slug; fallback to configured children) | Submenus link to real detail routes `/services/<slug>` and `/projects/<slug>`. |

### Tests (new)

| File | Tests | Covers |
|---|---|---|
| `abr-energy-frontend/src/components/home/phase-12-11-homepage-featured-filter.test.tsx` | 4 | Featured filter options, filtering, reset, RTL-safe rendering. |
| `abr-energy-frontend/src/components/layout/phase-12-11-nav-detail-links.test.tsx` | 3 | Services detail links, inactive exclusion, projects detail links, empty-API fallback. |
| `abr-energy-frontend/src/lib/site-metadata.test.ts` | 5 | Unset favicon → no href; relative → absolute; absolute passthrough; unusable type → fallback; icons mapping. |
| `AbrEnergy/apps/products/tests/test_phase12_11_sku.py` | 11 | Duplicate SKU on create/update, self-edit allowed, blank/required, error envelope, concurrent IntegrityError → 400. |

Existing tests updated for the new section order: `phase-12-7-homepage-product-experience.test.tsx`, `phase-11-visual-experience.test.tsx`, `phase-12-1-homepage-reference-match.test.tsx`, and the `use-api` mocks in `phase-12-2`/`phase-12-4`/`phase-12-10` (added `useServices`/`useProjects`).

Not changed: no new database migration; no product/service/project/site data was deleted; the approved logo asset is untouched.

## 3. Homepage corrections — evidence

| Requirement | Implementation | Status |
|---|---|---|
| Featured products above "راهکارها" section | `homepage-client.tsx:68` → `['hero', 'featured_products', 'categories', ...base]`; asserted by phase-12.7 / phase-11 / phase-12-1 tests | PASS |
| No duplicate category pills | `ProductRailSection.tsx:123` passes `showPills={false}`; strip is the single category row | PASS |
| Featured rail category filter | `FeaturedProductsSection.tsx` filter pills + `visibleProducts`; 4 tests | PASS |
| "All" option first | `home.featured_filter_all` pill rendered before category pills | PASS |
| Filter options derived from real products only | `filterOptions` built from `products` + real `categoryTitles`; no invented categories | PASS |

Filter behaviour: `activeFilter` falls back to `all` if the selected category disappears; `safeIndex` clamps on every render so a shrinking list can never produce an out-of-range active product; switching filters resets to the first product in the handler.

## 4. SKU validation — evidence

`AbrEnergy/apps/products/api/v1/serializers/products.py`:

- `extra_kwargs = {"sku": {"validators": []}}` disables DRF's auto `UniqueValidator` so the message/field mapping is predictable.
- `validate_sku` rejects a SKU owned by a **different** product; editing a product without changing its own SKU stays valid; blank still follows the model's required rule.
- `create`/`update` run the write inside `transaction.atomic()`. On `IntegrityError`, `_is_sku_conflict` re-checks and raises a **400 `{"sku": [...]}`**; any other integrity error is re-raised unchanged (no swallowed errors).
- Error envelope matches the project convention: `{"errors": {"sku": [...]}, "status": 400}`.

Backend test `test_phase12_11_sku.py` (11 tests) passes.

## 5. Dynamic favicon — evidence

- `fetchSiteConfig()` server-fetches `/site-config/` with a 5-minute revalidate; it never throws (returns `null` on any failure).
- `faviconHref()` accepts `.ico/.png/.svg/.jpg/.jpeg/.webp/.gif` (relative or absolute). Anything else (e.g. a PDF accidentally uploaded) is treated as unusable → fallback.
- `buildIconsMetadata()` emits `icon`/`shortcut`/`apple` links only when a usable favicon exists.
- `src/app/layout.tsx` now uses `generateMetadata`; when the CMS favicon is unset it emits **no** icons so the file-convention `src/app/favicon.ico` serves as the fallback.
- **Coexistence note:** the file convention `src/app/favicon.ico` still emits its own `<link rel="icon">` alongside the metadata icons (a documented Next.js behaviour, not a hack). The metadata icons are declared after the file-based ones, so the CMS value takes precedence in browsers; the static file guarantees a fallback never disappears.

## 6. Services / Projects / Downloads wiring — evidence

Live dev DB content: **6 services** (3 named on/off/hybrid-grid + 3 "نمونه" demo) and **5 projects**. The employer's exact 7-service / 4-project taxonomy is **not** present in the DB, and the spec forbids fabricating slugs, so the submenus are **data-driven** (chosen approach):

| Section | Behaviour | Status |
|---|---|---|
| Services | Renders **active** services from `/services/` as `/services/<slug>` detail links; inactive excluded; falls back to the configured 7 children (section index) when the API is empty | PASS |
| Projects | Renders projects from `/projects/` as `/projects/<slug>` detail links; falls back to the configured 4 children when empty | PASS |
| Downloads | Two catalog items link to `/gallery` (the section index) — no per-download entity or detail route exists in the architecture | PASS (section index) |
| Parent items | Still open their list pages (`/services`, `/projects`, `/gallery`) | PASS |

Detail pages (`/services/[slug]`, `/projects/[slug]`) and public APIs already existed and are unchanged — the gap was only menu wiring. Because the menu now reflects live CMS content, real published content automatically replaces the current demo entries as it is entered.

## 7. Test / typecheck / lint / backend / build results

| Check | Command | Result |
|---|---|---|
| Frontend tests | `npx vitest run` | **66 files / 552 tests passed, 0 failed** |
| TypeScript | `npx tsc --noEmit` | **0 errors** |
| ESLint (changed files) | `npx eslint <changed files>` | **0 errors** |
| Backend tests | `python -m pytest -q` | **245 passed** |
| Production build | `npm run build` | **exit 0** |

Note: a repo-wide `npx eslint` reports a large pre-existing volume (~62k) of warnings/errors from generated/build directories; the **changed files lint clean**. One error introduced earlier in `FeaturedProductsSection.tsx` (`react-hooks/set-state-in-effect`) was fixed by moving the index reset into the click handler.

## 8. Remaining issues, external dependencies and environment limits

1. **Visual / browser verification NOT VERIFIED.** This environment has no browser, so pixel-level review, hover/focus persistence, and exact overflow behaviour on every viewport were not visually confirmed. The spec's screenshots under `docs/reports/phase-12.11-screenshots/` were **not** captured — **NOT VERIFIED** (hard environment limit).
2. **Favicon file-convention coexistence.** The static `src/app/favicon.ico` still emits a link; the CMS favicon is layered on top. Fully suppressing the file link would require removing the fallback asset — a fragile trade-off that was deliberately avoided and documented instead.
3. **Downloads detail routes.** No per-download entity/route exists; the two items link to `/gallery`. Wiring real per-file pages would need a new model/route (out of scope for this phase).
4. **Demo CMS content.** The data-driven services/projects menus currently surface the existing demo ("نمونه") entries until real content is entered; this is a content task, not a code gap.
5. **Full repo ESLint noise.** Pre-existing generated-dir lint volume remains; not addressed (out of scope).

## 9. Final verdict

**PARTIALLY ACCEPTED**

Completed and verified: the homepage reordering (featured above solutions), removal of the duplicate category pills, the featured-rail category filter, SKU serializer validation with race-safe 400 responses, dynamic CMS favicon metadata, and data-driven services/projects submenus linking to real detail routes — all backed by 552 frontend tests, 245 backend tests, clean `tsc`, clean changed-file lint, and a green production build.

It is not a full `ACCEPTED` because of the explicit environment limit that the agent cannot perform true visual/pixel verification (screenshots **NOT VERIFIED**), plus the documented `favicon.ico` coexistence and the absent downloads detail route.

No Phase 13 work was started.

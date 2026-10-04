# Phase 8.2 — Product & Category Preview UI Report

Date: 2026-09-22. Scope: frontend preview UI ONLY (consume the existing
Phase 8.1 preview APIs + focused verification + STOP). No draft
persistence, no versioning, no staging tables, no token redesign, no new
roles, no dirty guard, no read-only UX, no error mapping, no picker
debounce, no cart/checkout/orders/payment, no redesign, no Hero3D/Three.js
change, no i18n activation, no migration, no dependency change, no public
API filter change, no sitemap rewrite, no Phase 8.3+ work. All six
prerequisite reports were read before any action:
`phase-08-preflight-report.md`, `phase-08.1-preview-architecture-report.md`,
`phase-07-cms-content-homepage-report.md`,
`phase-07.5-cms-acceptance-audit-report.md`,
`phase-07.6-three-runtime-recovery-report.md`,
`phase-06.1-runtime-recovery-report.md`. The Phase 8.1 report was treated
as authoritative for preview semantics ("saved but normally-hidden
content", NOT unsaved-draft preview).

---

## 1. Executive Summary

**Status: COMPLETE (frontend UI slice only).** The missing Product and
Category preview UI now exists and consumes the Phase 8.1 backend
contract unchanged: two dedicated locale preview routes that reuse the
existing public `ProductDetailClient` / `CategoryClient` rendering
verbatim (one additive optional prop each — zero duplicated design),
Preview actions in Product Studio and Category Studio that issue tokens
through the existing admin-only endpoint and open the isolated preview
route in a new tab, extended `preview.ts` helpers, `previewApi` methods,
and `useProductPreview` / `useCategoryPreview` hooks (`staleTime 0`,
`gcTime 0`, `retry false`). No backend file was modified.

Suites: backend **163 passed** (unchanged — no backend tests added),
frontend **188 passed / 26 files** (180/26 baseline intact + 8 new),
`tsc --noEmit` 0 errors, `npm run lint` 0 errors / 55 warnings (count
identical to baseline; zero warnings in 8.2 files), production build
success (route table contains both new preview routes, dynamic),
production probes green (valid preview 200 + banner + noindex,
missing/invalid token safe error shell, sitemap 200 with zero preview
hits, public routes byte-untouched and token-ignoring), transient
fixtures deleted afterwards, dev restarted (`/fa` 200).

## 2. Scope

IN SCOPE (all done): product preview route, category preview route,
Product Studio Preview button, Category Studio Preview button, reuse of
existing public Product/Category UI, preview banner indicator,
noindex/nofollow on preview routes, no-store server-side (inherited 8.1)
+ no-cache client hooks, preview helpers, preview hooks, focused
frontend tests, runtime verification, this report.

OUT OF SCOPE (none started): draft persistence, revisions/versioning,
staging tables, scheduled publishing, token revocation, permission
redesign, new roles, per-field scopes, dirty guard (8.3), read-only UX
(8.4), nested error mapping (8.5), picker debounce (8.6), cart/checkout/
orders/payment, any page redesign, Hero3D/Three/R3F/Drei/animation
changes, i18n activation, schema changes, dependency changes, public API
filter changes, sitemap architecture changes, SEO rewrite.

## 3. Baseline

Session-start `git status --short` / `git diff --stat` recorded the
accepted 8.1 end state: 18 modified files (7.5 fixes + 8.1 additions)
plus 8.1 untracked files (`preview_tokens.py`,
`test_phase81_preview.py`, `src/app/[locale]/preview/` (homepage),
`src/lib/preview.ts`, `src/lib/preview.test.ts`, prior reports). The
pre-existing `AbrEnergy/media/…` untracked pytest byproducts (dated
2026-09-19, before this session) were left untouched. Backend 163 /
frontend 180/26 verified green before changes via re-run in this phase
(backend re-run post-change: still 163; frontend: 188).

## 4. Existing Preview Architecture Consumed

Verified in code (not assumed from the report):

- Issue: `POST /api/v1/admin/homepage/preview-tokens/`
  (`IsContentManager` JWT), body
  `{resource_type: product|category, resource_id: <uuid>, locale}` →
  `200 {token, …, expires_in: 600}` (`apps/homepage/preview_tokens.py`,
  600 s, `salt="abrenergy-preview-v1"`, payload `{typ,id,loc,pur}`).
- Consume (verified live §18):
  `GET /api/v1/admin/products/<uuid>/preview/?token=…` →
  public `ProductDetailSerializer` + `preview: True` + `no-store`
  (`apps/products/api/v1/views/products.py:267-306`).
  `GET /api/v1/admin/product-categories/<uuid>/preview/?token=…` →
  public `CategorySerializer` + `preview: True` + `no-store` (`:309-339`).
- Errors: missing/invalid/tampered/cross-resource token → 403 generic;
  valid token + unknown id → 404. Public views never read `token`.
- Token semantics (notably `expected_locale` is only enforced when the
  caller passes it; the product/category preview views bind `typ`+`id`
  — inherited 8.1 behavior, deliberately unchanged per STOP rules; the
  frontend always constructs the issuance-locale URL, same as the
  homepage Studio which hardcodes `fa`).

## 5. Product Preview Route

`src/app/[locale]/preview/products/[id]/page.tsx` (new):
`dynamic = 'force-dynamic'`, `metadata.robots = {index:false,
follow:false}`, `<Suspense>` + `ProductPreviewBody` (new
`preview-body.tsx`): reads `?token=` + `[id]` param, fetches via
`useProductPreview(id, token)` (`staleTime 0`, `gcTime 0`, no retry),
renders shared `<PreviewBanner>` + back-to-Product-Studio link,
`ErrorState` for missing token, `PageLoading` while loading,
`ErrorState` ("Preview unavailable") for invalid/expired tokens,
otherwise `<ProductDetailClient key={id} slug={id}
previewProduct={data}/>`. No admin-only fields (payload is the public
serializer; the component only reads public `ProductDetail` fields).

## 6. Category Preview Route

`src/app/[locale]/preview/products/category/[id]/page.tsx` + 
`preview-body.tsx` (new): identical pattern with
`useCategoryPreview` and `<CategoryClient key={id} slug={id}
previewCategory={data}/>`. The path lives under `/preview/…`, so it
cannot collide with the public `/products/category/[slug]` route
(verified: distinct route-table entries, both dynamic). Noindex/
nofollow, dynamic, absent from the static sitemap (verified §18).
Graceful degradation note: tree-derived chrome (child list, parent
crumbs) resolves against the *public* category tree, so an inactive
previewed category shows its own header/content from preview data while
tree chrome degrades to empty — same components, no duplication, no
public behavior change.

## 7. Product Studio Integration

`admin/products/[id]/edit/page.tsx` (edit mode only — persisted UUID
exists): new `handlePreview` issues
`{resource_type:'product', resource_id:id, locale:'fa'}` via the
existing `previewApi.issue`, opens `buildProductPreviewUrl(token, id,
'fa')` in a new tab (`noopener,noreferrer`) only after successful
issuance; failure → `toast.error(t('admin.preview_failed'))`;
`isPreviewIssuing` state blocks duplicate issuance and shows a spinner.
`ProductEditor` gained optional `onPreview` / `isPreviewIssuing` props
and renders the Preview button (outline, secondary to Save) in the
sticky footer — rendered ONLY when `onPreview` is supplied, so create
mode (no UUID) has no preview path and never auto-saves.

## 8. Category Studio Integration

`admin/products/categories/[id]/edit/page.tsx` (edit mode only): same
pattern with `{resource_type:'category', …}` +
`buildCategoryPreviewUrl`, Preview button (outline, `size="sm"`,
secondary to Save) in `PageHeader` next to status badges, disabled
while saving or issuing, failure toast, no auto-save. New/unsaved
categories have no edit page and therefore no preview entry point.

## 9. API/Hooks

`previewApi` (`src/api/index.ts`, existing axios instance — no parallel
client): `getProductPreview(id, token)` →
`GET /admin/products/${id}/preview/?token=`; `getCategoryPreview(id,
token)` → `GET /admin/product-categories/${id}/preview/?token=`.
Hooks (`src/hooks/use-api.ts`): `useProductPreview(id, token)` (key
`['product-preview', id, token]`) and `useCategoryPreview(id, token)`
(key `['category-preview', id, token]`), both `enabled: !!id &&
!!token`, `staleTime 0`, `gcTime 0`, `retry false`,
`refetchOnWindowFocus false` — preview never cached. `usePublicProduct`
/ `usePublicProductCategory` gained an additive optional
`options?: {enabled?: boolean}` (default preserves existing behavior;
used only to disable the public fetch when preview data is injected).

## 10. Preview URL Helpers

`src/lib/preview.ts` (extended, no second utility system):
`PRODUCT_PREVIEW_PATH_SEGMENT = '/preview/products'`,
`CATEGORY_PREVIEW_PATH_SEGMENT = '/preview/products/category'`,
`buildProductPreviewUrl(token, productId, locale='fa')`,
`buildCategoryPreviewUrl(token, categoryId, locale='fa')` — both
`encodeURIComponent` token and id. Existing `buildHomepagePreviewUrl` /
`isPreviewUrl` untouched.

## 11. Component Reuse

ONE rendering implementation (no `ProductPreviewPage` /
`CategoryPreviewPage` duplicates): `ProductDetailClient` gained
optional `previewProduct?: ProductDetail | null` — when provided, the
public fetch is disabled and the identical JSX below renders the
preview payload; when `undefined`, the public path is byte-identical.
`CategoryClient` gained optional `previewCategory?: 
ProductCategoryDetail | null` with the same contract (product grid
keeps normal public filtering). New shared `PreviewBanner`
(`src/components/preview/preview-banner.tsx`) replicates the accepted
8.1 homepage banner visual language (amber, sticky, `role="status"`,
back-to-Studio link); the 8.1 homepage body was left untouched.

## 12. Security Behavior

Backend-authoritative (unchanged 8.1). Frontend never decodes/validates
tokens, never sends JWT as preview credential, never puts content in
tokens, never constructs tokens client-side. Verified live against
Django :8000 with transient fixtures (draft+hidden product, inactive
category — both deleted afterwards): valid product preview → 200,
valid category preview → 200, missing token → 403, garbage token →
403, cross-resource token (category token on product URL) → 403,
preview payload carries `preview: True` + `Cache-Control: no-store`
and exposes no admin-only pricing internals (payload shape is the
public serializer; draft `status`/`visibility` values are part of the
public `ProductListItem` shape already exposed for published rows).

## 13. Public Route Isolation

Public views never read `token` (code-verified; no public file
touched except additive optional hook params with identical defaults).
Verified live: draft product slug on public detail → 404, inactive
category slug on public detail → 404, public product list with a valid
preview token → 200 with token ignored. Production probe: `/fa/products`
200 with and without `?token=` (no PREVIEW marker in either),
`/[locale]/products/[slug]` and `/products/category/[slug]` routes
unchanged in the route table.

## 14. SEO Behavior

Preview routes: `force-dynamic`, route-level `robots: {index:false,
follow:false}` (verified `noindex` in served prod HTML for both
routes), absent from the static sitemap (`/sitemap.xml` 200, zero
`preview` hits), `/robots.txt` 200 untouched, no change to public
canonical/metadata pipeline (`product-metadata.ts` untouched) except
the additive optional preview props (no metadata impact).

## 15. Locale Behavior

Supported `fa|ar|en` (token-level; active public locale still `fa`
only — no switcher/activation change). Preview URL locale matches the
issuance locale (`fa`, mirroring the homepage Studio convention);
`useLocale` untouched. Live: `/ar/preview/products/<id>?token=<fa
token>` serves the 200 shell with banner (client fetch resolves per
backend binding — inherited 8.1 semantics, §4 note). New locale keys
`admin.product_preview` / `admin.category_preview` /
`admin.preview_failed` added to `fa|ar|en` with parity test.

## 16. Error/Loading States

Existing architecture only: `ErrorState` (missing token → "Missing
preview token" + Back-to-Studio action; invalid/expired → "Preview
unavailable" + Retry), `PageLoading`, `toast` for issuance failure,
existing API error normalization via axios/react-query. No new global
error system, no Phase 8.5 work.

## 17. Tests

- Backend: **no backend tests added; Phase 8.1 backend preview
  contract reused unchanged.** Suite re-run: **163 passed** (4.75 s).
- Frontend: **188 passed / 26 files** (baseline 180/26 intact + **8
  new** in `src/lib/preview.test.ts` → file now 14 tests): product
  URL isolation/encoding/locale, category URL isolation/encoding/
  locale, preview-URL recognition (incl. negatives for public routes),
  fa/ar/en key parity for the 3 new keys, product fetch hits
  `/admin/products/<id>/preview/` with `?token=`, category fetch hits
  `/admin/product-categories/<id>/preview/` with `?token=`, no
  public-route URL generation. No test weakened or skipped.
- `tsc --noEmit`: 0 errors. `npm run lint`: 0 errors / 55 warnings —
  count identical to baseline; zero warnings in any 8.2 file
  (verified by filtered lint pass).

## 18. Runtime Verification

Canonical Phase 7.6 workflow followed (dev on :3000 stopped before
build; port 3000 verified free; build; prod on :3100; prod stopped;
ONLY `.next` deleted; dev restarted; Django :8000 untouched
throughout). `npm run build`: success — route table contains
`/[locale]/preview/products/[id]` (1.03 kB, ƒ dynamic) and
`/[locale]/preview/products/category/[id]` (1.03 kB, ƒ dynamic)
alongside the unchanged homepage preview route. Transient fixtures
(draft+hidden product `PHASE82-TRANSIENT`, inactive category
`phase82-transient-cat`, fa translations, 600 s tokens) used for
probes, then fully deleted (0 remaining rows).

Production (`next start -p 3100`) results:

| Check | Result |
|---|---|
| `GET /fa` | 200 |
| product preview (valid token) | 200, PREVIEW banner, `noindex` |
| category preview (valid token) | 200, PREVIEW banner, `noindex` |
| product/category missing token | 200 shell + "Missing preview token" UI |
| product/category bad token | 200 shell + loading → client "Preview unavailable" branch (SSR shows loading + banner — identical to accepted 8.1 homepage pattern; no browser automation available, same standing as 7.5/7.6/8.1) |
| studio back-links in SSR | correct edit hrefs for both routes |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| `/fa/preview/homepage` | 200 + banner (8.1 intact) |
| `/fa/products` ± `?token=` | 200, no PREVIEW marker |
| backend valid/missing/bad/cross-resource | 200 / 403 / 403 / 403 (§12) |
| public draft/inactive slugs | 404 / 404 (§13) |

Dev restarted afterwards: `/fa` 200, both preview shells 200 on :3000.
Client-side WebGL/interaction: NOT TESTED (no browser automation —
same standing as prior phases; no rendering claim beyond SSR + API).

## 19. Database Changes

**None.** `makemigrations` not needed (no model touched). No flush,
reset, or real-content modification. Only transient verification
fixtures (1 draft+hidden product + 1 fa translation, 1 inactive
category + 1 fa translation), created for probes and deleted
afterwards (verified 0 remaining). Had a migration appeared necessary,
the phase rule was to STOP — it was not.

## 20. Dependency Changes

**None.** `package.json` / `package-lock.json` untouched (not in git
status). No Next/React/Three/R3F/Drei change.

## 21. Animation Impact

**None.** No file under Hero3D, R3F/Drei, CursorGlow, particles,
ScrollReveal, or any homepage animation component was touched. Preview
reuses existing rendering verbatim.

## 22. Files Changed

New (5): `src/app/[locale]/preview/products/[id]/page.tsx`,
`src/app/[locale]/preview/products/[id]/preview-body.tsx`,
`src/app/[locale]/preview/products/category/[id]/page.tsx`,
`src/app/[locale]/preview/products/category/[id]/preview-body.tsx`,
`src/components/preview/preview-banner.tsx`.
Edited (10): `src/lib/preview.ts`, `src/lib/preview.test.ts`,
`src/api/index.ts`, `src/hooks/use-api.ts`,
`(public)/products/[slug]/product-detail-client.tsx`,
`(public)/products/category/[slug]/category-client.tsx`,
`admin/products/[id]/edit/page.tsx`,
`components/products/product-editor.tsx`,
`admin/products/categories/[id]/edit/page.tsx`,
`locales/{fa,ar,en}.json` (+3 keys each). Backend: zero files.

## 23. Git Diff Summary

Session `git diff --stat`: 8.2 deltas stack on the accepted 8.1 state —
`product-detail-client.tsx` +11/−, `category-client.tsx` +13/−,
`admin/products/[id]/edit/page.tsx` +22, `categories/[id]/edit/page.tsx`
+27/−, `product-editor.tsx` +15/−, `use-api.ts` +45/−, `api/index.ts`
+22, locales +4 each (3 files), `preview.test.ts` covered under
untracked→tracked `src/lib/preview.test.ts` (8.1 file, extended).
Every modified file is explainable as Phase 8.2 work; no unrelated
change was cleaned up or reverted (pre-existing 7.5/8.1 modifications
and 2026-09-19 media byproducts intact).

## 24. Known Limitations

1. No token revocation (inherited stateless 8.1 design; 600 s expiry
   is the mitigation).
2. Preview shows saved state only — unsaved Studio edits are NOT
   previewed (by design; buttons preview post-save state; create mode
   has no preview entry point).
3. Category tree chrome (children/parent crumbs) resolves against the
   public tree, so inactive-category previews degrade to empty chrome
   (§6) — header/content/products-grid render from preview/public data.
4. Bad-token error UI renders post-hydration (SSR shows loading shell)
   — same accepted pattern as the 8.1 homepage preview.
5. Product/category consume views bind `typ`+`id` but do not pass
   `expected_locale` (inherited 8.1 semantics, §4) — unchanged by
   design; frontend always builds the issuance-locale URL.
6. No browser/AT walkthrough of the new banners (NOT TESTED).

## 25. Deferred Work

True unsaved-draft/versioning preview, token revocation, per-field
scopes, scheduled publishing, standalone service/project/article
detail previews, Phase 8.3 dirty guard, 8.4 read-only UX, 8.5 error
mapping, 8.6 picker debounce, Phase 9 — none started.

## 26. Acceptance Checklist

- [x] Product preview route exists (`/[locale]/preview/products/[id]`).
- [x] Category preview route exists
  (`/[locale]/preview/products/category/[id]`, collision-free).
- [x] Both reuse existing public rendering components (one optional
  prop each, zero duplication).
- [x] Product Studio has Preview action (edit mode, persisted UUID).
- [x] Category Studio has Preview action (edit mode, persisted UUID).
- [x] Token issuance uses the existing backend endpoint (no client
  signing, no content in token).
- [x] No JWT used as preview credential.
- [x] Missing/invalid/expired tokens fail safely (403 backend +
  ErrorState frontend).
- [x] Preview pages noindex/nofollow (verified in served HTML).
- [x] Preview routes absent from sitemap (verified).
- [x] Public product/category routes unchanged (code + live 404/200).
- [x] Public routes ignore preview tokens (verified live).
- [x] Locale handling preserved (issuance-locale URLs; §4 note
  documented, no weakening).
- [x] No database migration (transient fixtures only, deleted).
- [x] No dependency changes.
- [x] No animation changes.
- [x] Existing tests green (backend 163; frontend baseline 180 intact).
- [x] New frontend tests pass (8 new, 188 total / 26 files).
- [x] tsc passes (0 errors).
- [x] lint passes (0 errors, 55 warnings = baseline).
- [x] Production build passes (both routes in table, dynamic).
- [x] Runtime smoke tests pass (§18).
- [x] Final report written (this file).
- [x] Phase 8.3+ NOT started.

## 27. Final Status

**Phase 8.2 COMPLETE.** Product & Category preview UI implemented
within strict scope by consuming the Phase 8.1 contract unchanged.
End state: `next dev` on :3000 (verified `/fa` 200), Django :8000
untouched, :3100 free, transient fixtures deleted, ONLY `.next` was
removed post-probe (source files intact). Next session must stop dev
before any `npm run build` (shared-`.next` hazard, §7.6).

## 28. STOP Condition

STOP. No 8.3 dirty guard, no 8.4 read-only UX, no 8.5 error mapping,
no 8.6 picker debounce, no Phase 9 work was started. No security issue
was discovered in the 8.1 implementation during this phase (one
semantics note documented in §4/§24.5 without changing behavior).

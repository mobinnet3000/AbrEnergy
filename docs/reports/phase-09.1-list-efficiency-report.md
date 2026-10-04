# Phase 9.1 — Admin List-Efficiency Slice Report

## 1. Phase status

**Status: COMPLETE.** The approved small scope (A–F) is fully implemented,
tested, and verified with no scope expansion. Phase 9.0 Preflight is COMPLETE
and ACCEPTED and remains the baseline.

## 2. Date/time

Date: 2026-09-23 (UTC session, continuation after the aborted prod-probe
attempt; resumed and completed the same day). Scope: Phase 9.1 items ONLY —
product/category list-search debounce, category `page_size` correctness, safe
SPA row navigation, category Save & Continue, focused tests, verification +
STOP. No Phase 9.2, no redesign, no backend change, no migration, no
dependency change.

## 3. Initial git status

Branch `master`, HEAD `342d1da HomePagePhase7Done`. Uncommitted tree exactly
as accepted at Phase 9.0 end: 31 modified files + 24 untracked paths (the
accepted 7.5/8.1–8.6 work plus prior reports). Baseline re-verified BEFORE
any edit: backend **163 passed**, frontend **258 passed / 32 files**,
`tsc` 0 errors, ESLint **0 errors / 55 warnings**.

Prerequisite reports read completely before any modification:

1. `docs/reports/phase-09-preflight-report.md`
2. `docs/reports/phase-08.6-picker-debounce-report.md`
3. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
4. `docs/reports/phase-08.5-error-mapping-report.md`

No line numbers were trusted from reports; every target was re-located in
current source (actual locations differ slightly from §6 citations, e.g. the
category `page_size` literal now lives at `categories/page.tsx:44`).

## 4. Final git status

Branch `master`, HEAD unchanged (`342d1da`). No commit was made (not
requested). Tree = Phase 9.0 accepted state + the 9.1 delta below + this
report. `AbrEnergy/media/**` pytest byproducts: all removed, zero remain.
`.next`: removed after the production probe (source intact). Exactly ONE
`next dev` running at session end (`/fa` 200).

## 5. Files changed

**Source changes (6 files, frontend only, zero backend):**

1. `abr-energy-frontend/src/app/[locale]/admin/products/page.tsx` —
   search debounce, category-prefetch `page_size` 200→100, 2× SPA nav.
2. `abr-energy-frontend/src/app/[locale]/admin/products/categories/page.tsx` —
   search debounce, list `page_size` 200→100, 3× SPA nav.
3. `abr-energy-frontend/src/components/products/product-editor.tsx` —
   `leaveToBack` via `router.push`, category-selector fetch 200→100.
4. `abr-energy-frontend/src/app/[locale]/admin/products/categories/new/page.tsx` —
   Save & Continue, parent fetch 200→100.
5. `abr-energy-frontend/src/app/[locale]/admin/products/categories/[id]/edit/page.tsx` —
   Save & Continue, parent fetch 200→100.
6. `abr-energy-frontend/src/lib/error-mapping.test.tsx` — test-harness only:
   added the missing `useUpdateAdminProductCategory` mock export consumed by
   the new page (zero assertions changed, none weakened).

**Tests (2 new files, 21 tests):**

7. `abr-energy-frontend/src/app/[locale]/admin/products/list-efficiency.test.tsx`
   (11 tests).
8. `abr-energy-frontend/src/app/[locale]/admin/products/categories/category-save-continue.test.tsx`
   (10 tests).

**Documentation (1 new file):**

9. `docs/reports/phase-09.1-list-efficiency-report.md` (this file).

**Generated artifacts:** `.next/` (build output — deleted after probe),
`prod3100` was never written to disk (the first probe-launch attempt was
aborted before execution; the successful probe used direct `node`
invocation with no log files). No test media artifacts remain.

## 6. Files intentionally untouched

Backend: zero files (no view/serializer/URL/pagination/setting touched — no
backend change was necessary). Locales: zero files (`admin.save_continue`
already exists in fa/ar/en). `use-debounced-value.ts` (reused as-is),
`use-dirty-navigation-guard.ts` (unmodified architecture),
`src/lib/api-errors.ts`, all mappers, preview/token code, sitemap/robots,
public routes, homepage, Hero3D/Three.js/R3F/Drei, `package.json` /
`package-lock.json`, services/projects/articles lists, dashboard, DataTable,
`use-api.ts` (no hook signature changed), product host pages
(`products/new`, `products/[id]/edit` — Save & Continue already existed),
preview bodies, dashboard/admin layouts (logout flows keep full reload by
design).

## 7. Exact implementation summary

- **Debounce:** both list pages import the shared Phase 8.6
  `useDebouncedValue` (default 300 ms). `const debouncedSearch =
  useDebouncedValue(search)`; the `params` memo consumes
  `debouncedSearch.trim()`; inputs keep `value={search}` with immediate
  `setSearch` (products keeps its existing `setPage(1)` on change).
- **Page size:** all five `adminProductCategoriesApi.list` call sites that
  passed `page_size: '200'` now pass `'100'` (list page, products-page
  prefetch, product-editor selector, category new/edit parent dropdowns).
  Backend `StandardPagination.max_page_size = 100` (`apps/core/pagination.py`)
  is the default pagination class (`settings/base.py:138`); untouched.
- **SPA nav:** six `window.location.href` CMS row/empty-state navigations
  converted to `router.push` (products empty-state create, product row edit,
  categories empty-state create, category row edit, category add-child,
  `ProductEditor.leaveToBack` which flows through the existing dirty guard).
  Preview back-links, logout flows, and all other surfaces untouched.
- **Save & Continue:** category new gains `createdId` + update-mutation
  branching; category edit gains `submitWithMode` + refetch reconciliation.
  Both reuse the exact Phase 8.5 error-normalization branches (moved, not
  rewritten) and the existing dirty-guard wiring.

## 8. Search debounce behavior

- Input updates immediately on every keystroke (asserted per keystroke).
- Server query consumes only the debounced value; React Query keys therefore
  never contain intermediate values, so no intermediate request can exist.
- Rapid typing A → AB → ABC yields exactly one query with `ABC` after the
  300 ms window (shared `PICKER_SEARCH_DEBOUNCE_MS`, same as Phase 8.6).
- Products: search change still resets `page` to 1 (existing `setPage(1)`
  preserved; verified page 2 → type → page 1 with debounced search).
- Categories: no page state exists (single-fetch tree list, unchanged); other
  filters (`is_active`, `is_featured`, `parent`) pass through untouched.
- Clearing the search removes the `search` param (no stale results).
- React Query cache/`staleTime` behavior untouched (no hook options changed).
- No dirty state involved (list pages own none); no backend API change.

## 9. Category page-size fix

- Every category-list request now sends `page_size=100`, within the backend
  `StandardPagination` max of 100. No request sends `200` anymore (asserted
  across all captured calls on both list pages).
- No backend pagination change, no pagination removal, no new assumption:
  the list still renders the server page (tree over `results`); if categories
  ever exceed 100 rows the API contract (not the UI) governs further pages —
  flagged as follow-up, not silently assumed (§22).
- Page navigation on the products list (the only paginated surface touched)
  remains functional (prev/next, `page/totalPages`, verified in tests).

## 10. SPA navigation changes

| # | Location | Before | After | Destination (tested) |
|---|---|---|---|---|
| 1 | products list empty-state | `window.location.href` | `router.push` | `/admin/products/new` |
| 2 | product row edit menu | `window.location.href` | `router.push` | `/admin/products/:id/edit` |
| 3 | categories empty-state | `window.location.href` | `router.push` | `/admin/products/categories/new` |
| 4 | category row edit menu | `window.location.href` | `router.push` | `/admin/products/categories/:id/edit` |
| 5 | category add-child menu | `window.location.href` | `router.push` | `/admin/products/categories/new?parent=:id` |
| 6 | `ProductEditor.leaveToBack` (Back-link + Cancel) | `window.location.href` | `router.push(backHref)` | `backHref` (guarded) |

No global interception, history manipulation, custom router,
`Router.events`, or Link monkey-patching was introduced.

## 11. Dirty guard verification

- `useDirtyNavigationGuard` architecture unmodified (hook byte-identical;
  all 14 Phase 8.3 hook tests green without changes).
- `leaveToBack` conversion keeps the guard: the Back-link still routes via
  `guard.guardLinkClick`, Cancel via `guard.requestNavigation` — only the
  terminal `navigate` closure changed from full-reload to `router.push`.
  `beforeunload` still covers true reloads while dirty (hook-owned).
- Page-level integration proven by the new suite: dirty Cancel opens the
  single Stay/Leave dialog (Stay dismisses, Leave navigates exactly once);
  clean Cancel navigates directly with no dialog; failed saves stay dirty
  (Cancel still prompts, edits intact); Save & Continue resets dirty (Cancel
  navigates with no prompt on both category pages).
- Preview (`window.open`, new tab) untouched and unaffected.

## 12. Category Save & Continue behavior

**Create** (`categories/new`): Save & Continue validates (title required,
existing key), persists via create, stores the real server id (`createdId`),
clears `saveErrors`, resets the dirty latch, toasts `category_created`, and
stays. Every later save (Save or Continue) PATCHes that id — the create
mutation is never called again (asserted: create ×1, update ×1 after two
continues). Plain Save behavior preserved: create → toast → list; Save after
a continue updates → toast → list.

**Edit** (`categories/[id]/edit`): Save & Continue validates, PATCHes the
same id, toasts `category_updated`, clears `saveErrors`, and stays while
`refetch()` reconciles the `initial` baseline (plus the hook's existing
invalidation). Dirty therefore resets exactly when server state matches the
form — the same semantic as ProductEditor's `dirtyResetSignal`, adapted to
this form's comparison-based dirty state without inventing a second
mechanism. Failed saves never touch `edits`/latch (error branches only set
`saveErrors`), so edits stay dirty for retry.

**UX preserved:** validation, nested error normalization + inline
`role="alert"` summary + `aria-invalid`/`aria-describedby`, permissions,
guard, localization (existing `save_continue` key), RTL, visual design —
all unchanged.

## 13. Tests added

`list-efficiency.test.tsx` (11): products immediate-input/no-intermediate/
final-query; clear-removes-param; page-reset-to-1; categories
immediate/no-intermediate/final/clear; `page_size` never `200` and `100`
with search on both pages; four SPA-nav integrations (empty-state ×2, row
edit ×1, edit + add-child ×1) asserting exact destinations via the mocked
SPA router.

`category-save-continue.test.tsx` (10): create continue persists + stays +
dirty-resets; second continue updates same id (no duplicate); save-after-
continue updates then lists; plain save still lists; failed continue
preserves edits + keeps field-context alert + stays dirty; dirty-Cancel
Stay/Leave flow; clean-Cancel direct; edit continue persists + stays +
refetches; edit dirty-reset after reconciliation; edit failure preserves.

`error-mapping.test.tsx` (+2 lines): mock-harness completion only.

Total new: **21 tests**, zero weakened/skipped/re-counted.

## 14. Full test results

| Suite | Result |
|---|---|
| Backend `python -m pytest apps/` | **163 passed** (exact baseline) |
| Frontend `npm run test` (vitest) | **279 passed / 34 files** (258/32 baseline intact + 21 new / 2 files) |
| `makemigrations --check --dry-run` | No changes detected |
| Pre-existing suites (8.3 guard 14, 8.5 mapping 9+31, 8.6 debounce 12, 8.4 read-only) | all green, unmodified |

## 15. TypeScript result

`npx tsc --noEmit`: exit 0, **0 errors** (before and after).

## 16. ESLint result

`npm run lint`: **0 errors, 55 warnings** — identical count to the Phase 9.0
baseline; no new warnings introduced.

## 17. Build result

Canonical workflow followed: live `:3000` server stopped and port verified
free before build; `npm run build` **success** (full route table; all three
preview routes present and dynamic; all CMS routes present). No concurrent
dev during build.

## 18. Runtime smoke results

Production `next start -p 3100` (Django `:8000` untouched throughout):

| Check | Result |
|---|---|
| `GET /fa` | 200 (75,791 B), exactly one `<h1`, `dir="rtl"`, slogan present, zero `vendor-chunks` error text |
| `GET /fa/products` | 200 |
| `/fa/admin/products`, `/fa/admin/products/categories` | 200 / 200 |
| `/fa/admin/products/new`, `/fa/admin/products/categories/new` | 200 / 200 |
| `GET /fa/preview/homepage` | 200 shell, PREVIEW banner, `noindex` |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| `GET /api/v1/homepage/` (Django `:8000`) | 200 |
| Anonymous `GET /api/v1/admin/homepage/` | 401 (auth enforced, expected) |

Post-probe: prod stopped (`:3100` verified free), ONLY `.next` removed,
exactly ONE dev restarted → `/fa` 200. Single dev chain verified
(one `next dev` parent + its server child; no duplicate instance).

## 19. Known limitations

1. Category list is still a single-fetch tree (`page_size=100`, no pager):
   correct up to 100 rows; beyond that a pager or virtualized fetch is a
   Phase 9.3+ decision (explicitly not silently assumed).
2. Products-page category prefetch and editor/parent dropdowns share the
   same 100-cap; large catalogs will need picker-style search there later.
3. List search/filter/page state is still local-only (URL persistence is
   Phase 9.3 P1-3(b) by plan).
4. Sidebar/top-shell links and browser-back remain unguarded by documented
   Phase 8.3 design (no global interception introduced).
5. Immediately after edit-continue success there is a refetch window before
   the comparison resets; the dialog only appears if the user navigates in
   that window (same class as Product edit's pre-signal behavior, now
   covered by test).

## 20. Browser/AT testing limitation

Click-level browser walkthrough and screen-reader verification: **NOT
TESTED** (no browser automation available — same standing as Phases
7.5–9.0). Evidence is SSR/prod smoke + unit/integration behavior + code
inspection, honestly marked. Dropdown-menu SPA navigation is additionally
covered by integration tests (real Base UI menus, real timers).

## 21. Confirmation that no destructive DB/data operation occurred

No flush, reset, seed, content edit, credential, or permission change. No
migration (check clean). All probes were read-only GETs plus static shells.
The ~pytest `AbrEnergy/media/**` UUID byproducts from backend re-runs
(same-suite artifacts per the 8.3–9.0 precedent) were all deleted — zero
remain (`git status` clean under `AbrEnergy/media`). No fixtures created.

## 22. Follow-up recommendations

Phase 9.2 (per the accepted 9.0 plan): P1-2 services/projects/articles list
capability wiring + P2-2 their dirty guards + P3-1 state standardization.
Phase 9.3: P1-3(b) URL-persisted list filters + category pager if rows
approach 100 + P2-5 dashboard hub. Later: P2-3 duplicate/clone, P2-4 media
reuse (pending the explicit permission decision). None started.

**STOP after this report. No Phase 9.2 work started.**

(End of file)

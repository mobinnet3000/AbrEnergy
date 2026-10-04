# Phase 8.6 — CMS Picker Search Debounce / BUG-07 Report

Date: 2026-09-22. Scope: P3 BUG-07 ONLY ("Picker search has no debounce") —
audit + minimal debounce on request-per-keystroke picker paths + focused
tests + verification + STOP. No Phase 8.7, no Phase 9, no picker redesign,
no backend change, no migration, no dependency change, no animation change,
no i18n activation. Phase 8.5 is COMPLETE and ACCEPTED and remains the
baseline.

---

## 1. Executive Summary

**Status: COMPLETE.** BUG-07 is closed with the smallest change that stops
request bursts while typing without altering picker behavior:

- The audit (§5–§7) found exactly TWO components with a genuine
  request-per-keystroke problem, both sharing one implementation pattern:
  `HomepageRelationPicker` (used 5× in Homepage Studio) and
  `ProductRelationsEditor` (Product related-products picker). Every other
  candidate was proven client-side, already debounced, or out of the picker
  scope (§5).
- Fix: ONE tiny shared hook (`useDebouncedValue`, 300 ms) consumed by both
  pickers. The visible input stays immediate; only the React Query key +
  queryFn consume the debounced copy. Opening, selecting, removing, and
  cancelling are untouched and immediate.
- Suites: backend **163 passed** (unchanged), frontend **258 passed /
  32 files** (246/30 baseline intact + **12 new**), `tsc` 0 errors, `lint`
  0 errors / 55 warnings (identical count), production build success, prod
  + dev smoke probes all 200 with all content markers green.

## 2. Scope

IN SCOPE (all done): picker inventory audit (§5), shared debounce helper
(§8), integration into the two affected pickers (§9), race/stale analysis
(§11), dirty-state verification (§12), focused tests (§21), full regression
+ runtime verification (§22), this report.

OUT OF SCOPE (none started): Phase 8.7, Phase 9, picker UI redesign, picker
library replacement, backend APIs/serializers/views, pagination contracts,
permissions, ProductEditor architecture, Homepage Studio architecture,
Category architecture, global state, data-fetching architecture, React Query
global config, search semantics, animations, i18n activation, database
content, dependencies.

## 3. Prerequisite Reports

All ten required reports were read completely before any modification:

1. `docs/reports/phase-08-preflight-report.md`
2. `docs/reports/phase-08.1-preview-architecture-report.md`
3. `docs/reports/phase-08.2-product-category-preview-report.md`
4. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
5. `docs/reports/phase-08.4-read-only-ux-report.md`
6. `docs/reports/phase-08.5-error-mapping-report.md`
7. `docs/reports/phase-07.5-cms-acceptance-audit-report.md`
8. `docs/reports/phase-07-cms-content-homepage-report.md`
9. `docs/reports/phase-07.6-three-runtime-recovery-report.md`
10. `docs/reports/phase-06.1-runtime-recovery-report.md`

BUG-07's original wording (Phase 7.5 §26/§29: "Picker search uncached-
per-keystroke with no debounce … pre-existing Product-Studio parity") was
re-verified against live code rather than trusted from the report — both
request-per-keystroke sites were reproduced in code before any fix (§7).

## 4. Baseline

Session-start `git status --short` / `git diff --stat` recorded the accepted
8.5 end state (7.5 fixes + 8.1 preview + 8.2 product/category preview UI +
8.3 dirty guard + 8.4 read-only UX + 8.5 error mapping, all uncommitted on
`master`, HEAD `342d1da HomePagePhase7Done`). Re-verified green BEFORE any
modification:

| Suite | Result | Baseline match |
|---|---|---|
| Backend `python -m pytest apps/` (`AbrEnergy/`) | **163 passed** | exact (Phase 8.5) |
| Frontend `npm run test` (`vitest run`) | **246 passed / 30 files** | exact (Phase 8.5) |
| `npx tsc --noEmit` | **EXIT 0, 0 errors** | exact |
| `npm run lint` | **0 errors, 55 warnings** | exact (count identical) |

Next 15.5.21 App Router; Django :8000 running (untouched throughout);
exactly ONE `next dev` chain on :3000 at session start (stopped per the
canonical workflow before building, §22).

## 5. Picker Inventory

Every CMS picker/search control was read in code and classified:

| Picker / control | File | Search input | Request trigger | Server or client | Debounce before | Verdict |
|---|---|---|---|---|---|---|
| Homepage featured-products picker | `homepage-relation-picker.tsx` via Studio `searchProducts` (`productsApi.list`) | yes (`search` state) | `useQuery ['homepage-picker','products',search]` per keystroke | **server** | none | **CHANGED (§9)** |
| Homepage category picker | same component via Studio `searchCategories` (filters pre-fetched `catTree`) | yes | same query key pattern per keystroke | client (async wrapper over cached tree) | none | **CHANGED (§9)** — same component, one fix covers all 5 |
| Homepage service picker | same component via Studio `searchServices` (filters pre-fetched `servicesData`) | yes | same | client | none | **CHANGED** (same component) |
| Homepage project picker | same component via Studio `searchProjects` (`projectsApi.list`) | yes | same | **server** | none | **CHANGED** (same component) |
| Homepage article picker | same component via Studio `searchArticles` (`articlesApi.list`) | yes | same | **server** | none | **CHANGED** (same component) |
| Product related-products picker | `product-relations-editor.tsx` (`adminProductsApi.list`) | yes (`search` state) | `useQuery ['admin-products',{relSearch:search}]` per keystroke | **server** | none | **CHANGED (§9)** |
| Product attribute/value picker | `product-attributes-editor.tsx` (Select over pre-fetched `useAttributeDefinitions`) | none (Select dropdowns) | single mount-time fetch | n/a | n/a | NO CHANGE — no per-keystroke request exists |
| Category parent picker | `category-selector.tsx` (Select over loaded categories) | none | none (pure client render) | n/a | n/a | NO CHANGE |
| Article `CategorySelect` / Service `ServiceCategorySelect` | article/service new/edit pages (single bulk fetch + Select) | none | one fetch on mount | server-once | n/a | NO CHANGE |
| Public catalog `ProductFilters` | `public/ProductFilters.tsx` | yes | `onChange(search)` after **350 ms** draft timer | server | **already present** | NO CHANGE (precedent cited; public catalog is out of CMS-picker scope) |
| Generic `DataTable` | `shared/data-table.tsx` | uncontrolled input, `onSearch` callback | parent-defined (zero call sites in the codebase) | n/a | n/a | NO CHANGE — no consumer issues any request |
| Admin products/categories list search boxes | `admin/products/page.tsx`, `admin/products/categories/page.tsx` | yes | `useAdminProducts(params)` / `useAdminProductCategories(params)` per keystroke | server | none | AUDITED, DEFERRED (§24 — list filters, not relation pickers; outside BUG-07's picker scope) |

No existing debounce helper existed anywhere in the CMS code (`grep`
`debounce|useDebounce|useDeferredValue` over `src/`: only the
`ProductFilters` comment + its inline timer). No `useDeferredValue` usage.
Caching: React Query per-key cache (no `staleTime` on these queries);
cancellation: none (no `AbortController` anywhere in the picker paths).

## 6. Existing Request Behavior

Before the fix, typing `س → سو → سول` into any open picker with server-side
search produced three distinct React Query keys and three backend requests:

- `['homepage-picker', 'products', 'س']` → `GET …/products/?search=س`
- `['homepage-picker', 'products', 'سو']` → `GET …/products/?search=سو`
- `['homepage-picker', 'products', 'سول']` → `GET …/products/?search=سول`

and analogously `['admin-products', { relSearch: … }]` in the relations
editor. The category/service pickers re-ran their (local) async filter per
keystroke through the same key pattern. Empty query (`''`) was requested on
open; minimum search length: none; page size 10 (products/projects/
articles) / slice 0–20 (categories/services); loading indicator `…`;
empty state `noResultsLabel`; error state: none rendered (empty list —
unchanged, §13); duplicate prevention client-side (`usedIds`) + DB
OneToOne; selection/removal immediate via `onChange`.

## 7. Root Cause / Audit Findings

BUG-07 root cause, confirmed in actual code (not assumed): both picker
components bind the RAW keystroke state directly into the React Query
`queryKey` AND `queryFn` (`homepage-relation-picker.tsx:53-56`,
`product-relations-editor.tsx:29-33`). React Query treats every distinct key
as a distinct fetch, so each keystroke deterministically issues one backend
request (server-side pickers) or one query cycle (client-side pickers).
There is no timer, no `useDeferredValue`, no request coalescing. The
`ProductFilters` public-catalog precedent proves the codebase's accepted
remedy shape (immediate draft input + delayed request propagation) but lives
outside CMS-picker scope and was not repurposed as a shared helper (its
timer is inline and coupled to filter-state sync).

## 8. Debounce Design

New `src/hooks/use-debounced-value.ts` (24 lines, zero imports from form
modules — no cycle risk):

- `PICKER_SEARCH_DEBOUNCE_MS = 300` (midpoint of the required 250–350 ms
  window; same family as the catalog's 350 ms precedent).
- `useDebouncedValue(value, delayMs = 300)`: returns `value` delayed by the
  window via an effect-owned `setTimeout`; every update restarts the window
  (rapid updates collapse to the latest value only); cleanup always clears
  the timer (no late emission after unmount — unit-tested).
- Contract made obvious at each call site: input renders `search`
  (immediate); query consumes `debouncedSearch` (delayed); selection/
  removal/cancel never touch either timer.

A shared helper was justified (not over-abstraction): two picker
implementations need byte-identical timing behavior, and the phase test
rules explicitly require thorough helper tests when consumers share one.

NOT debounced: opening the picker (initial `''` fetch fires exactly as
before), selecting, removing, reordering, toggling, cancelling.

## 9. Changed Pickers

Phase 8.6 delta (stacked on the uncommitted 8.5 tree; every hunk is
debounce work, verified via `git diff` on the two files):

1. `src/components/homepage/homepage-relation-picker.tsx` (+8/−2 over its
   8.5 state): import the hook; `const debouncedSearch =
   useDebouncedValue(search)`; queryKey `['homepage-picker', kind,
   debouncedSearch]`; queryFn `onSearch(debouncedSearch.trim())`.
   `enabled: open`, input `value={search}`, `add`/`patch`/remove/cancel
   paths: byte-identical. (The `disabled:…` switch classes in the same
   file's diff context are the accepted 8.4 styling, untouched.)
2. `src/components/products/product-relations-editor.tsx` (+8/−2):
   identical pattern; queryKey `['admin-products', { relSearch:
   debouncedSearch }]`; queryFn `adminProductsApi.list({ search:
   debouncedSearch.trim(), page_size: '10' })`.

One shared fix covers all five Homepage Studio pickers (single component).

## 10. Shared Utility (if any)

`src/hooks/use-debounced-value.ts` — see §8. No second utility system, no
dependency, no global store. Unit tests: `src/hooks/use-debounced-value.
test.ts` (5 tests, §21).

## 11. Request/Race Semantics

No new request architecture was invented, and none was needed:

- React Query already keys responses by query: intermediate keys are never
  created now, so intermediate responses cannot exist, let alone arrive
  stale. The only observable queries are the initial `''` (unchanged) and
  one latest-value query per typing burst.
- Rapid successive bursts each produce exactly one latest-value request;
  the previous debounced query unsubscribes on key change (standard RQ
  behavior, unchanged).
- No `AbortController`/manual cancellation was introduced (phase rule:
  debounce alone is sufficient — confirmed, since there is no cross-key
  ordering hazard left to mitigate).
- Backend behavior, search semantics, ordering, pagination (`page_size`
  10 / slice 20), and result mapping: byte-identical.

## 12. Dirty-State Verification

Phase 8.3 guard untouched (hook + all four integrations byte-identical).
Typing only ever called local `setSearch` before this phase and still does
— `onChange` (the sole dirty-source writer via `set`/latch) fires only on
add/remove/patch, exactly as before:

- Typing into a picker never marks the form dirty (asserted: `onChange`
  untouched by typing + debounce settling, both pickers).
- Selecting/removing still marks dirty exactly as before (synchronous
  `onChange`, asserted without advancing timers).
- Failed save preserves edits; successful save resets (separate error/dirty
  state, 8.5 architecture untouched; full 8.3/8.4/8.5 suites green).
- No second dirty-state mechanism created.

## 13. Preview Safety

Preview token generation, endpoints, routes, security, and `noindex`
behavior: untouched (zero preview files in the delta). Verified live:
`/fa/preview/homepage` 200 + PREVIEW banner + `noindex`; preview issuance
toasts unchanged. Picker debounce cannot affect preview (pickers never
issue tokens; preview fetches bypass pickers entirely).

## 14. Error-Mapping Safety

Phase 8.5 normalization (`src/lib/api-errors.ts`) untouched and reused by
construction: picker search failures render through the pre-existing path
(no error box by design → empty list), proven by the new rejection test
(offline rejection → existing no-results label, no crash). Save-path error
mapping (the only 8.5 surface) is uninvolved in picker typing.

## 15. Accessibility

Labels (`aria-label` on search inputs), `role="switch"` + `aria-checked` on
toggles, keyboard selection (native buttons), focus (`autoFocus` on open),
and screen-reader semantics: all byte-identical. Debounce changes WHEN a
request fires, never WHAT is rendered or announced; selected values remain
synchronously in the DOM. No tooltip-only behavior added.

## 16. Localization

Persian remains the active locale; fa/ar/en architecture preserved. ZERO
locale changes (no keys added, modified, or activated in any bundle) — a
debounce implementation required none. No JSX user-visible string was
touched.

## 17. Security

No security changes. No logging added anywhere. Search terms, headers,
tokens, request configs, and raw axios objects are never logged or
traversed — the hook sees only the opaque query string value. Permissions
(`IsContentManager` backend; `canManage*` frontend gating) untouched.

## 18. Database Safety

ZERO database writes. No migrations (`makemigrations` path untouched; zero
backend files in the delta), no seeds, no flush/reset, no content edits.
Runtime verification used read-only GETs plus static edit shells (no rows
created). The 30 untracked `AbrEnergy/media/**` UUID byproducts from this
session's two backend re-runs (same-suite artifacts per the 8.3–8.5
precedent) were deleted; zero remain. Dev database content untouched.

## 19. Dependency Changes

**None.** `package.json` / `package-lock.json` untouched (not in git
status). No Next/React/React Query/Three.js/R3F/Drei/testing-library
change. No debounce library was needed (24-line local hook; the catalog
precedent already proved inline timers suffice at this scale).

## 20. Animation/Homepage Safety

**None.** Zero files under Hero3D, R3F/Drei, CursorGlow, particles, ripple,
gradients, ScrollReveal, TextReveal, parallax, or tilt touched. Prod + dev
`/fa` markers confirm the stack intact (one h1, RTL, slogan, no
vendor-chunk error, canvas path healthy). `next.config.ts` untouched. No
Homepage redesign of any kind.

## 21. Tests

Baseline: backend 163 / frontend **246 passed / 30 files**. New: **12
tests** (5 + 7), zero weakened/skipped/re-counted. Final: backend **163**,
frontend **258 passed / 32 files**.

New `src/hooks/use-debounced-value.test.ts` — **5 tests, all green**
(`renderHook`, fake timers, restored in `afterEach`):

1. initial value returned immediately
2. old value held inside the window, latest emitted after it
3. rapid updates collapse to the latest value only (intermediates never surface)
4. custom delay respected
5. pending timer cleared on unmount without emitting

New `src/components/homepage/picker-debounce.test.tsx` — **7 integration
tests, all green** (real components, real React Query with `retry: false`,
mocked transport only; fake timers restored in `afterEach`). Each proves
ACTUAL request behavior (`A → AB → ABC` ⇒ one `request(ABC)`, never
`request(A)`/`request(AB)`):

1. Homepage picker rapid typing → input immediate at every keystroke, zero
   intermediate requests inside the window, exactly one `onSearch('سول')`
   after it; `onChange` untouched (no false dirty).
2. Homepage picker selection immediate (synchronous `onChange` with the
   relation shape, no timer wait).
3. Homepage picker cancel immediate (panel closes synchronously), abandoned
   text never requested even after the window, no dirty.
4. Homepage picker loading (`…`) + empty (`noResultsLabel`) states render
   exactly as before (deferred-promise proof).
5. Homepage picker failed search degrades to the existing empty state
   without crashing (rejection → no-results label; no error box by design,
   unchanged).
6. Relations editor rapid typing → input immediate, one
   `adminProductsApi.list({ search: 'ABC', page_size: '10' })`, never `A`/
   `AB`; `onChange` untouched.
7. Relations editor selection + cancel immediate (incl. reopen-after-select
   panel lifecycle); abandoned text never requested; dirty only via
   selection.

Honest test-environment note (verified against the installed
@tanstack/query-core 5.101.4 source): observer notifications are delivered
via a lazily-resolved global `setTimeout(..., 0)` (`notifyManager` +
`timeoutManager`), so under fake timers the helper advances a trailing
`advanceTimersByTime(0)` AFTER promise microtasks settle — otherwise the
re-render commit never fires and assertions read stale UI. The helper
documents this; the intermediate-no-request assertions prove the trailing
advance consumes no debounce window. Timers are restored after every test.

## 22. Runtime Verification

Canonical Phase 7.6 workflow followed exactly (one dev chain stopped before
build; :3000 verified free — no listener; build; prod probe on :3100; prod
stopped; :3100 verified free; ONLY `.next` deleted; exactly ONE dev
restarted; Django :8000 untouched throughout).

- `npm run build`: success (full route table; all three preview routes +
  all CMS routes present, dynamic; zero errors).
- Prod `next start -p 3100`:
  | Check | Result |
  |---|---|
  | `/fa` | 200 (75,791 B), exactly one `<h1`, `dir="rtl"`, slogan «طلوع آفتاب، از خانه شماست», zero `vendor-chunks` error text |
  | `/fa/admin/content/homepage` | 200 |
  | `/fa/admin/products/new` | 200 |
  | `/fa/admin/products/categories/new` | 200 |
  | `/fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
  | `/fa/products` | 200 |
  | `/sitemap.xml` | 200, zero `preview` hits |
  | `/robots.txt` | 200 |
  | `GET /api/v1/homepage/` (live Django :8000) | 200 |
- Post-probe: prod stopped, ONLY `.next` removed, exactly ONE dev restarted
  → `/fa` 200 (one h1, RTL, slogan, no vendor error); single dev chain
  verified by PID/parent/command-line (no duplicate instance).
- Click-level browser walkthrough: NOT TESTED (no browser automation —
  same standing as 7.5–8.5; evidence is SSR + unit/integration behavior +
  code inspection, honestly marked).

## 23. Git Diff

`git status --short` / `git diff --stat` before AND after confirm: the only
8.6 source changes stack on the accepted 8.5 tree; all pre-existing
7.5/8.1–8.5 modifications left intact; no unrelated change cleaned or
reverted; debug scaffolding deleted; media byproducts deleted.

Phase 8.6 delta only:

- New: `abr-energy-frontend/src/hooks/use-debounced-value.ts` (shared
  300 ms hook), `abr-energy-frontend/src/hooks/use-debounced-value.test.ts`
  (5 tests), `abr-energy-frontend/src/components/homepage/
  picker-debounce.test.tsx` (7 integration tests), this report.
- Modified: `src/components/homepage/homepage-relation-picker.tsx`
  (+8/−2: import + hook + queryKey/queryFn), `src/components/products/
  product-relations-editor.tsx` (+8/−2: same pattern).
- Backend: zero files. Locales: zero files. Dependencies: zero files.

Every changed line is explainable as BUG-07 picker debounce work.

## 24. Known Limitations

1. Admin products/categories LIST search boxes issue server requests per
   keystroke (audited, §5) but are list filters, not relation pickers —
   changing them would exceed BUG-07's picker scope and touch pagination-
   reset interactions; left as-is.
2. The debounce window (300 ms) also delays the client-side category/
   service filter refresh by the same window (same component, single code
   path) — behaviorally invisible (local filter, no network) and required
   for implementation uniformity.
3. Reopening a picker within 300 ms of cancelling a typed-but-unrequested
   query can issue one request for the abandoned text before the cleared
   `''` settles (single request, same cost class as the pre-fix baseline —
   not a burst; no test asserts otherwise).

## 25. Deferred Work

Phase 8.7, Phase 9, admin list-search debounce (requires a list-filter
decision, not a picker decision), per-input error mapping, true
unsaved-draft/versioning preview, token revocation, per-field scopes,
scheduled publishing, standalone service/project/article detail previews,
Homepage visual redesign, sidebar/back-button interception — none started.

## 26. Acceptance Checklist

- [x] BUG-07 root cause audited in actual code (§7)
- [x] every relevant picker inventoried (§5)
- [x] only request-per-keystroke paths changed (§9)
- [x] debounce approximately 250–350ms (300 ms, §8)
- [x] visible input remains immediate (tested, §21.1/.6)
- [x] selection remains immediate (tested, §21.2/.7)
- [x] clear remains immediate (tested, §21.3/.7)
- [x] latest query wins (tested, §21.1/.6)
- [x] no stale-request regression introduced (§11)
- [x] dirty-state behavior unchanged (§12)
- [x] Phase 8.3 guard unchanged (§12)
- [x] Phase 8.4 read-only unchanged (file untouched; suite green)
- [x] Phase 8.5 error normalization reused (§14)
- [x] preview architecture unchanged (§13)
- [x] no backend changes (§18/§23)
- [x] no migrations (§18)
- [x] no dependency changes (§19)
- [x] no animation changes (§20)
- [x] no i18n activation (§16)
- [x] no Homepage redesign (§20)
- [x] focused debounce tests pass (§21)
- [x] full frontend suite passes (258/32)
- [x] backend 163 passes
- [x] TypeScript 0 errors
- [x] lint 0 errors / baseline warnings (0/55)
- [x] production build succeeds (§22)
- [x] runtime smoke passes (§22)
- [x] exactly one dev instance at end (§22)
- [x] final report written (this file)
- [x] STOP after Phase 8.6 (§28)

## 27. Final Status

**Phase 8.6 COMPLETE.** BUG-07 verified closed with the minimal debounce
(300 ms shared hook, two picker integrations, 12 focused tests). End state:
single `next dev` on :3000 (verified `/fa` 200 + markers), Django :8000
untouched, :3100 free, transient fixtures deleted, ONLY `.next` was removed
post-probe (source files intact).

## 28. STOP Condition

STOP. No Phase 8.7 work, no Phase 9 work, no picker redesign, no backend
change, no migration, no dependency change, no animation change, no i18n
activation, and no Homepage redesign was started.

(End of file)

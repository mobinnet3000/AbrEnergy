# Phase 9.3-A — URL-Persisted Admin List State Report

## 1. Status

**Status: COMPLETE.** URL-persisted list filters/search/page state is
implemented for all five in-scope CMS lists (products, product categories,
articles, services, projects), tested (55 new tests, zero weakened), and
fully verified (backend 163, frontend 395/47, tsc 0 errors, ESLint 0 errors,
production build success, runtime smoke green). Phase 9.2 is COMPLETE and
ACCEPTED and remains the baseline. No Phase 9.3-B / Dashboard Hub work started.

## 2. Date/time

Date: 2026-09-23 (UTC session, continuation directly after the accepted
Phase 9.2). Scope: Phase 9.3-A items ONLY — preflight audit, shared query
helper, URL wiring for the five lists, focused tests, full verification +
STOP. No backend change, no migration, no dependency change, no new locale
keys, no redesign, no Dashboard Hub.

## 3. Baseline

Accepted Phase 9.2 baseline, re-verified BEFORE any edit (preflight):

- Backend `python -m pytest apps/` (`AbrEnergy/`): **163 passed**
- Frontend `npm run test` (vitest): **340 passed / 41 files**
- `npx tsc --noEmit`: exit 0, 0 errors
- `npm run lint`: 0 errors, 53 warnings
- `makemigrations --check --dry-run`: No changes detected (only the
  pre-existing `ckeditor.W001` EOL notice)
- Dev `:3000` + Django `:8000` running at session start (both pre-existing)

Prerequisite reports read completely before any modification:

1. `docs/reports/phase-09-preflight-report.md`
2. `docs/reports/phase-09.1-list-efficiency-report.md`
3. `docs/reports/phase-09.2-content-lists-dirty-guards-report.md`
4. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
5. `docs/reports/phase-08.5-error-mapping-report.md`
6. `docs/reports/phase-08.6-picker-debounce-report.md`

No report line numbers were trusted; every target was re-located in current
source.

## 4. Preflight findings

Verified in current source (not assumed from reports):

1. **All list state was local-only.** Products (`admin/products/page.tsx`)
   owned `search/category/status/visibility/active/featured/page` via
   `useState`; categories owned `search/statusFilter/featuredFilter/
   parentFilter` (no page — single tree fetch `page_size=100`); articles
   owned `search/status/page`; services owned `search/status/featured/page`;
   projects owned `search/featured/page`. Zero `useSearchParams` on any list
   page; the only admin `useSearchParams` consumer was the category
   `?parent=` prefill (`categories/new/page.tsx:59`).
2. **No query-param/pagination helper existed** (`src/lib/` holds form
   mappers, error normalizer, preview, sitemap, tree — no URL-state utility),
   so one small shared module was justified (§14).
3. **App Router conventions in use:** `useRouter().push` (SPA row
   navigation, Phase 9.1), `useSearchParams().get()` (preview bodies,
   category prefill), `usePathname()` (locale provider, admin layout).
   The implementation reuses exactly these — no new library, no router
   rewrite, no `window.location`, no history interception.
4. **Debounce:** shared `useDebouncedValue` (300 ms) already drives all five
   lists' queries (9.1/9.2); reused as-is.
5. **React Query keys** are `['admin-<entity>', params]` with plain
   serializable records — preserved verbatim.
6. **Baseline was healthy** (§3): implementation started immediately.
7. **Test-harness note (discovered during implementation):** the pre-existing
   list suites mock `next/navigation` with a fresh router object per call.
   Effects that (correctly) depend on the router instance therefore re-ran
   every render under the mock. The new suites use a stable mocked router
   (matching the real App Router, which returns one instance); the pages
   additionally never depend on `useSearchParams()` object identity (§6).

## 5. Exact files changed

**Source (5 files, frontend only, zero backend):**

1. `abr-energy-frontend/src/app/[locale]/admin/products/page.tsx`
   (+142/−, URL init + two sync effects + `goPage`)
2. `abr-energy-frontend/src/app/[locale]/admin/products/categories/page.tsx`
   (+99/−, same pattern, no page)
3. `abr-energy-frontend/src/app/[locale]/admin/articles/page.tsx`
   (+~180/−, same pattern + `goPage`)
4. `abr-energy-frontend/src/app/[locale]/admin/services/page.tsx`
   (+259/−, same pattern + `goPage`)
5. `abr-energy-frontend/src/app/[locale]/admin/projects/page.tsx`
   (+194/−, same pattern + `goPage`)

Tracked diff for the 5 pages: **+800 / −77**.

**New shared helper (2 files):**

6. `abr-energy-frontend/src/lib/admin-list-query.ts` (pure parse/serialize)
7. `abr-energy-frontend/src/lib/admin-list-query.test.ts` (19 tests)

**New per-list URL suites (5 files, 36 tests):**

8. `.../admin/products/products-list-url.test.tsx` (8 tests)
9. `.../admin/products/categories/categories-list-url.test.tsx` (7 tests)
10. `.../admin/articles/articles-list-url.test.tsx` (8 tests)
11. `.../admin/services/services-list-url.test.tsx` (6 tests)
12. `.../admin/projects/projects-list-url.test.tsx` (7 tests)

**Test-harness-only edits (mock completion, zero assertions changed):**

13. `.../admin/products/list-efficiency.test.tsx` (+`replace`,
    `useSearchParams`, `usePathname` mocks)
14. `.../admin/articles/articles-list.test.tsx` (same)
15. `.../admin/services/services-list.test.tsx` (same)
16. `.../admin/projects/projects-list.test.tsx` (same)

(Items 13–16 are untracked Phase 9.1/9.2 files — HEAD is still
`342d1da` — so they do not appear in `git diff`; the 9.1 precedent
`error-mapping.test.tsx` mock completion was followed.)

**Documentation (1 file):** 17. this report.

**Intentionally untouched:** backend (zero files), locales (zero files —
no new keys), `use-debounced-value.ts`, `use-dirty-navigation-guard.ts`,
`use-api.ts` (no hook signature changed), all editors, homepage studio,
preview/token code, sitemap/robots, public catalog, dashboard, DataTable,
`package.json`/`package-lock.json`, Hero3D/Three.js/R3F/Drei, DB.

## 6. URL state architecture

The URL is the source of truth; each page keeps its existing local state as
a mirror that initializes from and converges to the URL:

- **Init:** every `useState` is lazily initialized from parsed search params
  (refresh / deep-link / new-tab reconstruction with zero navigation).
- **URL → state effect:** when parsed URL values change (back/forward,
  external router navigation), each field is adopted via a guarded
  functional set (`p === url ? p : url`). Typing never triggers it (typing
  does not touch the URL), so in-flight input is never clobbered.
- **State → URL effect (commit):** serializes the *settled* state
  (`debouncedSearch` + filters + page) with `buildListQuery` and calls
  `router.replace` when it differs from the canonical URL snapshot.
  Two loop-freedom guards (both regression-tested, §6.1):
  - *settled-gate:* commits only when `debouncedSearch === search`, so a
    stale in-flight debounce can never resurrect a search just abandoned
    via back/forward;
  - *target-only reaction:* the effect depends on the serialized target
    (plus stable `pathname`/`router`), never on the URL — it cannot fire on
    the same commit the sync effect adopts a new URL. The snapshot it
    compares against is a canonical string built from validated parses
    (never raw `URLSearchParams` identity), so param ordering or unknown
    params can never cause a navigation loop, and unknown params are
    preserved (ignored, never dropped).
- **React Query** params are unchanged code reading the same local state
  (`['admin-<entity>', params]`, stable serializable records). In steady
  state they equal the URL; transiently (debounce window) the query follows
  the debounced value, never intermediate keystrokes. No key depends on
  `URLSearchParams` identity.
- **Locales/UX states:** `TableLoading`/`EmptyState`/`ErrorState`+retry,
  permission-aware messages, dirty guards, SPA row navigation — all
  byte-identical in behavior.

### 6.1 Bugs found by the new tests during implementation (fixed)

1. *Stale-debounce resurrection:* back-navigation followed by a pending
   debounce re-committed the abandoned search. Fixed with the settled-gate
   (proven by `replaceMock not called` after back/forward in all five
   suites).
2. *Same-commit stale commit:* the commit effect, when subscribed to the
   URL, fired once with pre-sync state on external navigation. Fixed with
   target-only reaction + canonical snapshot.
3. *Effect identity churn:* depending on `useSearchParams()` object identity
   re-ran the sync effect every render under fresh-identity mocks and reset
   typing/pagination. Fixed by depending only on parsed values + snapshot
   string (robust even if a router ever returns unstable identity).

## 7. Per-list implementation

- **Products** (`/fa/admin/products`): persists `search`, `category` (UUID),
  `status` (draft/published/archived), `visibility` (public/hidden),
  `active` (active/inactive → `is_active`), `featured` (`featured=true`),
  `page`. All six pre-existing controls; semantics unchanged
  (`setPage(1)` on search/filter change preserved).
- **Categories** (`/fa/admin/products/categories`): persists `search`,
  `active` (active/inactive → `is_active`), `featured` (`featured=true`),
  `parent` (UUID). No `page` — see §13.
- **Articles** (`/fa/admin/articles`): persists `search`, `status`
  (draft/published/scheduled), `page`.
- **Services** (`/fa/admin/services`): persists `search`, `status`
  (active/inactive), `featured` (`featured=true`), `page`.
- **Projects** (`/fa/admin/projects`): persists `search`, `featured`
  (`featured=true`), `page`. `status`/`project_type` URL values are
  deliberately ignored (no such controls exist; proven by test).

## 8. Query parameter format

Canonical examples (all covered by tests):

- `/fa/admin/products?search=solar&page=2`
- `/fa/admin/products?search=solar&category=<uuid>&status=published&visibility=public&active=active&featured=true&page=2`
- `/fa/admin/articles?search=panel&status=draft&page=2`
- `/fa/admin/services?search=backup&status=active&featured=true&page=2`
- `/fa/admin/projects?search=tehran&featured=true&page=2`
- `/fa/admin/products/categories?search=solar&active=inactive&featured=true&parent=<uuid>`

Rules (all enforced by `buildListQuery`, tested in §15):

- Stable key order: `search, category, status, visibility, active,
  featured, parent, page`.
- Defaults omitted: `page=1`, blank search, `all`/blank enums,
  `featured=false`.
- `featured=true` is the single boolean representation.
- Encoding via the URL API (`URLSearchParams`); no manual encode/decode
  (Persian/Arabic round-trip tested).
- Invalid values fail safely: `page=abc|0|-3|2.5 → 1`; unknown enum →
  default/all; `featured≠"true"` → false; blank/`all` ids → omitted;
  unknown ids pass through (server-known) and degrade to list defaults.

## 9. Push vs replace decisions

- **Search (debounced) + all filter/select changes → `router.replace`.**
  Typing never creates history entries (and the 300 ms debounce means one
  commit per burst, not per keystroke); filter changes are state refinements,
  not navigation steps.
- **Pagination (prev/next) → `router.push`.** Each page is a meaningful
  navigation step, so browser Back returns to the previous page (asserted:
  pager pushes `?page=2`; back-navigation to `?page=1` reconstructs page 1).
- **Row/edit/create navigation:** unchanged Phase 9.1 SPA `router.push`;
  returning to a list URL (via Back or guarded navigation) reconstructs
  from the URL. No global return-to-list mechanism introduced.

## 10. Debounce behavior

`useDebouncedValue` (shared Phase 8.6, 300 ms) reused untouched. Flow:
typing → immediate input state/UI → 300 ms debounce → `replace` URL update
(only once settled) → query update from debounced state. Tests prove rapid
`A → AB → ABC` typing yields exactly one `replace` with the final value and
zero intermediate URL updates or queries; clearing the input removes the
param after the window. Visible input is never debounced.

## 11. Page reset behavior

Unchanged Phase 9.1/9.2 rule: search/filter change calls `setPage(1)`.
Serialized form omits `page=1`, e.g. `?search=solar&page=4` + status change
→ `?search=solar&status=published` (asserted for articles/services;
analogous coverage for products/projects/categories via filter tests).

## 12. Back/Forward behavior

Component-level URL-driven tests in all five suites: render at a
non-default URL → simulate external navigation (`setUrl('')` + rerender,
i.e. Back) → input/filters/page reconstruct immediately, query follows
after debounce settle, and **no** `replace` resurrects the abandoned state
→ navigate forward again → full state reconstructs. The mock router applies
URLs explicitly on `push`/`replace` in the harness, mirroring a real
router; **no real browser automation exists in this repo** (same standing
as Phases 7.5–9.2), so history-stack click-through is honestly marked NOT
TESTED — the provable surface (URL change ⇒ state reconstruction, state
change ⇒ correct URL request with correct push/replace verb) is fully
covered. No global back-button interception introduced (Phase 8.3 design
upheld).

## 13. Category pagination decision

**Audited:** the category list is still intentionally a single tree fetch
(`useAdminProductCategories({page_size:'100'})`, backend
`StandardPagination.max_page_size = 100`), rendering `buildCategoryTree`
over `results` with no pager UI. **Decision: no `page` persisted, no fake
pagination invented.** A stray `?page=3` is ignored (test asserts no `page`
key reaches the hook, `page_size` stays `100`, and no pager renders).
Persisted: the actually-existing `search/active/featured/parent` state.
Beyond-100-rows paging remains a backend-contract follow-up (9.1 §19
standing).

## 14. Helper/utility decision

No query-param utility existed (§4.2), so the smallest genuinely-shared
module was created — pure, dependency-free, no framework:

`src/lib/admin-list-query.ts`: `parsePageParam`, `parseSearchParam`,
`parseEnumParam`, `parseFeaturedParam`, `parseIdParam`,
`buildListQuery` (+ status/visibility/active constant sets and the
`ListQueryReader` minimal interface satisfied by both `URLSearchParams` and
`useSearchParams()`). Each page passes only the enum set its UI renders;
no per-list parse/build framework, no hook abstraction (the five filter
shapes differ; a config-driven generic was deliberately avoided per §9.9).
19 unit tests; stable ordering doubles as the canonical form for the
commit-effect change detection.

## 15. Tests added

**55 new tests, zero weakened, zero skipped:**

- `src/lib/admin-list-query.test.ts` (19): §15.A parsing (defaults, valid
  page, invalid page ×7 shapes, empty search, per-list supported status,
  cross-list/unsupported status, `all`→default, featured true/omitted ×5,
  id pass-through/blank) + §15.B serialization (defaults omitted, page=1
  omission, status+featured, stable ordering, natural URL-API encoding incl.
  Persian, parse∘build round-trip).
- `products-list-url.test.tsx` (8): minimal + full-filter deep-link,
  invalid→defaults, debounced single replace, status filter → replace +
  page reset, category filter → replace with id, pager push (+disabled-prev
  no-nav), back/forward reconstruction without resurrection.
- `categories-list-url.test.tsx` (7): full-filter deep-link, stray `page`
  ignored + no pager rendered, invalid→defaults, debounced single replace,
  active filter → replace, parent filter → replace with id, back/forward.
- `articles-list-url.test.tsx` (8): deep-link, invalid→defaults, immediate
  input + single replace (never push), no intermediate URL writes, committed
  URL aligns query, status → replace + page reset, pager push, back/forward.
- `services-list-url.test.tsx` (6): deep-link, invalid→defaults, single
  replace, status+featured → replace + reset, pager push, back/forward.
- `projects-list-url.test.tsx` (7): deep-link, `status`/`project_type` URL
  values ignored (negative scope proof), invalid page, single replace,
  featured → replace + reset, pager push, back/forward.
- Harness-only updates to the four pre-existing list suites (mock
  completion; all 43 assertions intact and green).

## 16. Full test results

| Suite | Result |
|---|---|
| Backend `python -m pytest apps/` | **163 passed** (baseline exact, before + after) |
| Frontend `npm run test` (vitest) | **395 passed / 47 files** (340/41 intact + 55 new / 6 files) |
| 8.3 guard (14), 8.5 mapping (9+31+2), 8.6 debounce (12), 9.1 (21), 9.2 (61) | all green, unmodified |
| `makemigrations --check --dry-run` | No changes detected (only pre-existing `ckeditor.W001`) |

## 17. TypeScript

`npx tsc --noEmit`: exit 0, **0 errors** (before and after).

## 18. ESLint

`npm run lint`: **0 errors, 54 warnings** — baseline was 0/55 in Phase 9.2
preflight (0/53 at 9.2 report time; the +1 delta since is the pre-existing
`<img>` warning in `products/page.tsx` relocated 258→364 by added lines —
zero new warnings introduced by this phase).

Two new lint interactions, both documented in code:

- `react-hooks/set-state-in-effect` (5×, one per list page): the URL→state
  adoption effect calls guarded setters. Suppressed per-effect with a block
  disable + justification (address bar is external state; back/forward
  adoption has no render-safe alternative that preserves in-flight typing —
  render-phase adoption cannot distinguish a settled keystroke from an
  external navigation; loop-freedom proven by the URL suites). Precedent:
  two `exhaustive-deps` line-disables already exist in the repo.
- `react-hooks/refs` + identity robustness: the commit effect never reads
  raw `useSearchParams()` identity (which real routers keep stable but
  nothing guarantees); it compares against a canonical snapshot string
  refreshed in the sync effect. No suppression needed for this half.

## 19. Build

Canonical workflow followed (dev `:3000` stopped + verified free before
build; no concurrent dev). `npm run build`: **success**. Route table
verified: all five admin lists, all `new`/`[id]`/`[id]/edit` shells, all
three preview routes (dynamic), `/sitemap.xml` + `/robots.txt`.

## 20. Runtime smoke

Production `next start -p 3100` (Django `:8000` untouched throughout):

| Check | Result |
|---|---|
| `GET /fa` | 200 (75,334 B), exactly one `<h1`, `dir="rtl"`, slogan present, zero `vendor-chunks` error text |
| `GET /fa/products` | 200 |
| `/fa/admin/products`, `?search=solar&page=2` | 200 / 200 |
| `/fa/admin/products/categories` | 200 |
| `/fa/admin/articles`, `?search=test&status=draft&page=2` | 200 / 200 |
| `/fa/admin/services`, `?search=test&status=active&featured=true&page=2` | 200 / 200 |
| `/fa/admin/projects`, `?search=test&featured=true&page=2` | 200 / 200 |
| `GET /fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| `GET /api/v1/homepage/` (Django `:8000`) | 200 |
| Anonymous `GET /api/v1/admin/homepage/` | 401 (auth enforced, expected) |

Post-probe: prod stopped (`:3100` verified free), ONLY `.next` removed,
exactly ONE dev restarted (launcher + single server child verified) →
`/fa` 200 on `:3000`.

## 21. Data safety

No flush, reset, seed, content edit, credential, permission, or role change.
No migration (check clean). All probes were read-only GETs plus static
shells. The 45 untracked `AbrEnergy/media/**` UUID byproducts from this
session's backend re-runs (same-suite artifacts per the 8.3–9.2 precedent)
were all deleted — zero remain. No fixtures created. Django `:8000`
untouched (still the pre-session process).

## 22. Known limitations

1. Real-browser history traversal (Back button across push/replace entries)
   is NOT TESTED — no automation exists; component-level URL-driven
   reconstruction is the proven surface (§12).
2. While the user types continuously without a 300 ms pause, filter/page
   URL commits wait for the search to settle (queries themselves update
   immediately from local state; the URL follows within one window).
3. Pager `push` under a mocked/static router (tests) records both `push`
   and the follow-up `replace`; in production the `push` applies first and
   the replace is a no-op — coherent single history entry.
4. Unknown/invalid query params are preserved-but-ignored (never stripped);
   garbage category/parent ids degrade to backend-empty results, not to a
   broken page.
5. Category rows beyond 100 still governed by the API contract (§13).

## 23. Deferred items

Explicitly deferred per the brief (none started): Dashboard Hub /
Phase 9.3-B; unwired backend filters (article `category`/`author`/
`is_featured`, service `category`/`ordering`, project `status`/
`project_type` + their locale keys); category pager; duplicate/clone; media
reuse/DAM; bulk actions; draft/versioning; scheduling; new roles; global
back-button interception; public/SEO/animation work. Discovered-but-untouched:
`react-hooks/exhaustive-deps` baseline warnings, `<img>`/`no-img-element`
baseline warnings.

## 24. Exact next recommended phase

**Phase 9.3-B — Dashboard Hub** (per the accepted 9.0 plan and this phase's
STOP condition): shortcuts + recent items + pending-action links on
`admin/page.tsx` (counts-only today), no new data sources. Natural
companions now unblocked by 9.3-A: deep-links from dashboard cards straight
into pre-filtered list URLs (e.g. drafts, featured). Later: P2-3
duplicate/clone, P2-4 media reuse (pending the explicit permission
decision). None started.

## 25. Explicit STOP statement

**STOP after this report. No Phase 9.3-B / Dashboard Hub work started, no
duplicate/clone, media reuse, bulk actions, new filters, redesigns, or
public/homepage/animation changes started or implemented; no migration
added; no destructive DB/data operation performed (explicit statement).**
Single `next dev` on `:3000` running (`/fa` 200), Django `:8000` untouched,
`:3100` free.

(End of file)

# Phase 9.2 — Admin Content Lists + Editor Dirty Guards Report

## 1. Status

**Status: COMPLETE.** The approved scope (A–I) is fully implemented, tested,
and verified with no scope expansion. Phase 9.1 is COMPLETE and ACCEPTED and
remains the baseline. No Phase 9.3 work started.

## 2. Date/time

Date: 2026-09-23 (UTC session, continuation directly after the accepted
Phase 9.1). Scope: Phase 9.2 items ONLY — backend audit (no backend change),
services/projects/articles admin-list capability wiring, shared list-UX
standardization for those three lists, dirty-navigation guards for the six
corresponding editors, focused tests, full verification + STOP. No redesign,
no migration, no dependency change, no new locale keys.

## 3. Baseline

Accepted Phase 9.1 baseline, re-verified BEFORE any edit (preflight):

- Backend `python -m pytest apps/`: **163 passed**
- Frontend `npm run test` (vitest): **279 passed / 34 files**
- `npx tsc --noEmit`: exit 0, 0 errors
- `npm run lint`: 0 errors, 55 warnings
- `makemigrations --check`: clean (only the pre-existing `ckeditor.W001`
  EOL notice)
- Production build: successful; `/fa` 200

Prerequisite reports read completely before any modification:

1. `docs/reports/phase-09-preflight-report.md`
2. `docs/reports/phase-09.1-list-efficiency-report.md`
3. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
4. `docs/reports/phase-08.5-error-mapping-report.md`
5. `docs/reports/phase-08.6-picker-debounce-report.md`

No report line numbers were trusted; every target was re-located in current
source and every backend claim was re-verified against the live view/URL
code.

## 4. Git status before/after

Before (session start): branch `master`, HEAD `342d1da HomePagePhase7Done`,
uncommitted tree exactly as accepted at Phase 9.1 end (31 modified files +
accepted untracked work incl. the 9.1 report and suites). One `next dev`
chain on :3000, Django on :8000 (both untouched until the build window).

After (session end): same branch/HEAD, no commit (not requested). Tree =
Phase 9.1 accepted state + the 9.2 delta (§5) + this report.
`AbrEnergy/media/**` pytest byproducts: all removed, zero remain. `.next`:
removed after the production probe (source intact). Exactly ONE `next dev`
chain running at session end (`/fa` 200).

## 5. Files changed

**Source (11 files, frontend only, zero backend):**

1. `abr-energy-frontend/src/api/index.ts` — added `adminArticlesApi`,
   `adminServicesApi`, `adminProjectsApi` (`list(params)` → `/admin/*`).
   Public `articlesApi` / `servicesApi` / `projectsApi` byte-identical.
2. `abr-energy-frontend/src/hooks/use-api.ts` — added `useAdminArticles`,
   `useAdminServices`, `useAdminProjects` (`admin-*` query namespaces).
   All existing hooks byte-identical in behavior.
3. `.../admin/services/page.tsx` — rewritten list (search + status +
   featured + pagination + standard states + Edit/View actions + create).
4. `.../admin/projects/page.tsx` — admin-endpoint switch + search +
   featured + pagination + standard states; edit/delete preserved.
5. `.../admin/articles/page.tsx` — admin-endpoint switch + search +
   status + pagination + standard states; actions preserved.
6. `.../admin/articles/new/page.tsx` — dirty guard (comparison-based).
7. `.../admin/articles/[id]/edit/page.tsx` — dirty guard (`edits`-based).
8. `.../admin/services/new/page.tsx` — dirty guard (comparison-based).
9. `.../admin/services/[id]/edit/page.tsx` — dirty guard (`edits`-based).
10. `.../admin/projects/new/page.tsx` — dirty guard (comparison-based).
11. `.../admin/projects/[id]/edit/page.tsx` — dirty guard (`edits`-based).

9.2 source delta: **+688 / −77 across the 11 files** (`git diff --stat`).

**Tests (7 new files, 61 tests):**

12. `src/api/admin-content-lists.test.ts` (4 tests).
13. `.../admin/articles/articles-list.test.tsx` (11 tests).
14. `.../admin/services/services-list.test.tsx` (9 tests).
15. `.../admin/projects/projects-list.test.tsx` (12 tests).
16. `.../admin/articles/article-editors-dirty.test.tsx` (9 tests).
17. `.../admin/services/service-editors-dirty.test.tsx` (8 tests).
18. `.../admin/projects/project-editors-dirty.test.tsx` (8 tests).

**Documentation (1 new file):**

19. `docs/reports/phase-09.2-content-lists-dirty-guards-report.md` (this file).

**Generated artifacts:** `.next/` (build output — deleted after probe). No
test media artifacts remain. No log files written.

## 6. Files intentionally untouched

Backend: zero files (no view/serializer/URL/pagination/setting touched — no
backend change was necessary; §7 proves why). Locales: zero files (no new
keys; only keys verified present in fa+ar+en are used, §8). Shared
primitives (`use-debounced-value.ts`, `use-dirty-navigation-guard.ts`,
`TableLoading`/`EmptyState`/`ErrorState`, `ConfirmDialog`, error normalizer,
preview/token code, sitemap/robots), public catalog hooks and endpoints,
product/category lists and editors, homepage studio, dashboard, DataTable,
`package.json`/`package-lock.json`, Hero3D/Three.js/R3F/Drei, DB credentials,
production content.

## 7. Backend audit (STEP 0 items 6–9)

Method: read the three list views, the three `admin_urls.py`, the three
public `urls/__init__.py`, `config/api_v1.py`, `apps/core/pagination.py`,
and the three models' `STATUS_CHOICES` — then mapped exactly.

| Entity | Admin endpoint (mounted ✓) | View class | GET permission | Supported params |
|---|---|---|---|---|
| Articles | `/api/v1/admin/articles/` | `ArticleListView` (shared with public) | `AllowAny`; anonymous forced `published`-only; authenticated + `?status=` filters (drafts visible) | `search` (translations title/short/content), filters `category,status,is_featured,author`, `ordering` (publish_date,created_at,view_count), pagination 20/max 100 |
| Services | `/api/v1/admin/services/` | `ServiceListView` (shared with public) | `AllowAny` (no auth-based scoping; writes need `IsAdminUser`) | `search` (translations title/short), filters `category,status,is_featured`, `ordering` (order,created_at), pagination 20/max 100 |
| Projects | `/api/v1/admin/projects/` | `ProjectListView` (shared with public) | `AllowAny` (writes need `IsAdminUser`) | `search` (translations title + location), filters `project_type,status,is_featured`, pagination 20/max 100; **no `ordering_fields` declared → ordering unsupported** |

Statuses: articles `draft/published/scheduled`; services
`active/inactive`; projects `planning/in_progress/completed/on_hold/cancelled`.
Envelope: `StandardPagination` → `{count,next,previous,results}` (same
contract the products list relies on).

Consequences (all honored): no backend change required — the admin
endpoints exist, are mounted, and already support everything the UI now
sends. Writes already require `IsContentManager` (articles) /
`IsAdminUser` (services/projects); permissions untouched. Public
endpoints untouched (proven by test §15.4).

## 8. Services list implementation (A)

Before: `useServices()` (public `/services/`, parameter-less — the api fn
accepted no params), plain-string loading, no error/empty UI, zero row
actions, no create entry point.

After (`admin/services/page.tsx`): `useAdminServices(params)` with
`{page,page_size:20}` + optional `search` (debounced 300 ms via the shared
`useDebouncedValue`; input immediate; `setPage(1)` on change; param removed
on clear) + optional `status` (`active`/`inactive`) + optional
`is_featured=true`. Select changes reset the page; pagination preserves
filters. `TableLoading` / `EmptyState` (+SPA create action) / `ErrorState`
(permission-aware message + retry). New Actions column: Edit →
`/admin/services/:id/edit`, View → public `/services/:slug` new tab.
Header create button → `/admin/services/new` (existing route). All labels
are pre-existing fa/ar/en keys (`search_placeholder`, `filter_all`,
`active`, `inactive`, `filter_featured`, `try_again`, … — each verified YYY
by script before use; zero new keys).

Deliberately NOT wired (audited-supported, documented here, not faked):
`category` filter (needs a category-picker UX), `ordering` UI (matches the
products gold standard, which has none). Services delete UI is not added:
no localized confirm strings exist and inventing keys/copy is out of scope.

## 9. Projects list implementation (B)

Before: raw `useQuery(['admin-projects'])` hitting the PUBLIC `/projects/`
with zero params; error surfaced as toast + bare div (no retry); no
search/filter/pagination.

After (`admin/projects/page.tsx`): `useAdminProjects(params)` →
`/admin/projects/` with `{page,page_size:20}` + optional debounced `search`
(translations title + location) + optional `is_featured=true`. Same
debounce/page-reset/param-removal/persistence semantics as §8. `TableLoading`
kept; empty standardized to `EmptyState` (existing `no_projects` +
`create_first_project` keys, SPA navigation); error standardized to
`ErrorState` (existing `failed_load_projects` + permission-aware message +
retry) — the duplicate error toast was removed (gold-standard parity).

Preserved verbatim: table columns (incl. `project_type` badge,
`location`, `capacity kW`, raw `status` incl. `cancelled`, FA/AR/EN dots),
edit link (`/admin/projects/:id/edit`), delete flow (`confirm()` +
existing toasts + `['admin-projects']` prefix invalidation, which still
matches the new parametrized keys), header create button + description.

Deliberately NOT wired: `status` / `project_type` dropdown filters —
backend-supported but unwirable without new localized option labels (no new
keys per scope discipline; the table already shows raw status values).
`ordering` UI: backend declares no `ordering_fields`, so none is offered.

## 10. Articles list implementation (C)

Before: `useArticles()` (public `/articles/`, no params — drafts invisible,
no filter), `TableLoading` only, bare-div error (no retry), custom empty
card.

After (`admin/articles/page.tsx`): `useAdminArticles(params)` →
`/admin/articles/` (JWT-authenticated: drafts visible + `status` filter
effective) with `{page,page_size:20}` + optional debounced `search` +
optional `status` (`draft`/`published`/`scheduled` — all pre-existing keys).
Same debounce/page-reset/persistence semantics. `TableLoading` kept; empty
→ `EmptyState` (`no_articles` + `create_first_article`, SPA); error →
`ErrorState` (`failed_load_articles` + permission-aware message + retry).

Preserved: PageHeader (title + existing description), create button, all
columns (status badge `published→default` else `secondary`, language dots,
`category_title`, `view_count`, `created`), row actions with EXACT hrefs
(pencil → `/admin/articles/:id` view route — pre-existing destination kept
as-is; external → `/articles/:slug` new tab). Published/draft semantics,
fields, routes, permissions unchanged. Removed one pre-existing lint
warning (unused `useEffect` import).

Deliberately NOT wired: `category`/`author`/`is_featured` filters and
`ordering` UI (audited-supported; deferred per §8 rationale).

## 11. Shared list UX changes (D)

The three lists now follow the products/categories gold standard:
immediate-input + debounced-query search, `setPage(1)` on search/filter
change, filter-preserving pager (`common.previous/next`), `TableLoading`,
`EmptyState` + `ErrorState` with retry, permission-aware error messages
(`permission_denied` on 403, `server_connection_failed` otherwise). No CMS
list-architecture rewrite; `DataTable` untouched (still zero consumers);
visual design preserved; zero new user-facing strings (and zero new locale
keys — an explicit non-goal that held).

## 12. Article dirty guard (E)

`articles/new`: `isDirty` = `JSON.stringify(snapshot) !==
JSON.stringify(emptyArticleSnapshot)` over the page's EXISTING state
(translations/status/category/tags/publishDate/coverImage/featured) —
reverting restores clean. Back-link AND Cancel-link guarded via
`guardLinkClick`; save-success `router.push` left direct (no prompt);
failures never touch the form (dirty preserved). Existing
`ConfirmDialog` + `unsaved_changes*` keys, `variant="default"`.
`articles/[id]/edit`: `isDirty` = `Object.keys(edits).length > 0` (same
latch semantics as Homepage Studio); back-link guarded; save/delete
navigations direct (persisted / intentionally discarded, matching the
accepted 8.3 category-edit precedent). No Save & Continue added (did not
exist). No preview flow exists on either page (unaffected).

## 13. Service dirty guard (F)

Identical pattern: `services/new` comparison-based (`emptyServiceForm`
module const, also used as the `useState` initializer — no duplication);
`services/[id]/edit` `edits`-based. Back-links guarded; save-success
direct; failures preserve edits+dirty. Same dialog/keys/variant. No Save &
Continue added. No preview flow exists (unaffected).

## 14. Project dirty guard (G)

Identical pattern: `projects/new` comparison-based (`emptyProjectForm`);
`projects/[id]/edit` `edits`-based. Back-links guarded; save-success
direct; failures preserve edits+dirty. Same dialog/keys/variant. No Save &
Continue added. No delete UI exists on these editors (nothing to preserve).
No preview flow exists (unaffected).

The shared `useDirtyNavigationGuard` hook is byte-identical (no shared-bug
found; no modification). No global interception, no `beforeunload` change
beyond what the hook already owns, no second dirty mechanism anywhere.

## 15. Tests added (61 new, zero weakened)

- `src/api/admin-content-lists.test.ts` (4): each admin `list()` hits its
  `/admin/*` path with exact params; public `articles/services/projects`
  endpoints byte-identical (services still parameter-less single-arg call).
- `articles-list.test.tsx` (11): initial params; immediate input; rapid
  typing → no intermediates + one final; clear removes param; page-reset on
  type; status filter sent + resets page + persists across pages (real Base
  UI Select driven via pointerdown+click — the commit sequence the
  installed Base UI 1.6 requires); pager; single-page hides pager;
  loading (no table); empty (+SPA create); error (+retry); draft/published
  rows + exact action hrefs/target.
- `services-list.test.tsx` (9): same debounce quartet; status+featured
  filter flow with page reset + cross-page persistence; loading/empty/error;
  status semantics + Edit/View hrefs.
- `projects-list.test.tsx` (12): admin hook used + public `useProjects`
  hook NEVER called (explicit exclusion proof); debounce quartet;
  featured flow; loading/empty/error; type/status semantics incl.
  `cancelled`; edit href; delete hits `/admin/projects/:id/` with confirm;
  delete-cancel makes no request.
- `article-editors-dirty.test.tsx` (9), `service-editors-dirty.test.tsx`
  (8), `project-editors-dirty.test.tsx` (8): per editor — clean navigates
  with no dialog; dirty opens the single dialog; Stay keeps edits with no
  navigation; Leave navigates exactly once; failed save preserves
  edits+dirty; successful save navigates with no prompt; (new pages)
  full revert restores clean. `next/link` is a faithful test double (clean
  click → router record, prevented click → nothing) plus avoids jsdom-missing
  prefetch observers.

Test-environment notes (honest): Base UI Select needs pointerdown before
click (verified against the installed source); `waitFor` is never used
under fake timers (sync assertions instead, per 9.1 precedent); no browser
or screen-reader walkthrough exists (same standing as all prior phases).

## 16. Full test results

| Suite | Result |
|---|---|
| Backend `python -m pytest apps/` | **163 passed** (exact baseline, before and after) |
| Frontend `npm run test` (vitest) | **340 passed / 41 files** (279/34 intact + 61 new / 7 files) |
| Phase 8.3 guard (14), 8.5 mapping (9+31+2), 8.6 debounce (12), 9.1 (21) | all green, unmodified |
| `makemigrations --check --dry-run` | No changes detected (only pre-existing `ckeditor.W001`) |

## 17. TypeScript

`npx tsc --noEmit`: exit 0, **0 errors** (before and after).

## 18. ESLint

`npm run lint`: **0 errors, 53 warnings** — baseline was 0/55; the delta is
−2 pre-existing warnings removed by the rewrite (unused `useEffect` import
on the old articles list; the `useEffect` error-toast on the old projects
list, replaced by `ErrorState`). Three transient new warnings (unused
`container` in new dirty tests) were fixed before the final run — final
state introduces zero new warnings.

## 19. Build

Canonical workflow followed (dev :3000 stopped + verified free before
build; no concurrent dev). `npm run build`: **success**. Route table
verified: `/admin/articles`, `/admin/services`, `/admin/projects` (+ all
`new`/`[id]`/`[id]/edit` shells), all three preview routes present and
dynamic, `/sitemap.xml` + `/robots.txt` present.

## 20. Runtime smoke

Production `next start -p 3100` (Django `:8000` untouched throughout):

| Check | Result |
|---|---|
| `GET /fa` | 200 (75,334 B), exactly one `<h1`, `dir="rtl"`, slogan present, zero `vendor-chunks` error text |
| `GET /fa/products` | 200 |
| `/fa/admin/articles`, `/fa/admin/services`, `/fa/admin/projects` | 200 / 200 / 200 |
| `/fa/admin/articles/new`, `/fa/admin/services/new`, `/fa/admin/projects/new` | 200 / 200 / 200 |
| Edit shells (zero UUID) ×3 | 200 / 200 / 200 (dev SSR) |
| `GET /fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| `GET /api/v1/homepage/` (Django `:8000`) | 200 |
| Anonymous `GET /api/v1/admin/homepage/` | 401 (auth enforced, expected) |

Post-probe: prod stopped (`:3100` verified free), ONLY `.next` removed,
exactly ONE dev restarted → `/fa` 200 (single dev chain verified by
command line: one `next dev` parent + its server child).

## 21. Data safety

No flush, reset, seed, content edit, credential, permission, or role change.
No migration (check clean). All probes were read-only GETs plus static
shells (zero-UUID edit shells create no rows). The `AbrEnergy/media/**`
UUID byproducts from backend re-runs (same-suite artifacts per the
8.3–9.1 precedent) were all deleted — zero remain. No fixtures created.
Unrelated OS processes (Adobe/9router nodes) and Django :8000 untouched.

## 22. Known limitations

1. Unwired-but-supported backend params are documented per list (§8–§10)
   rather than faked; wiring them needs localized labels/pickers (9.3+).
2. Projects `status`/`project_type` filters additionally need locale keys
   that do not exist (fa/ar/en) — deliberately not invented here.
3. Projects has no `ordering` support server-side (no `ordering_fields`) —
   correctly unoffered.
4. Frontend project forms use status value `planned`, but the backend
   `STATUS_CHOICES` list `planning` (no `planned`) — pre-existing
   inconsistency, discovered during audit, NOT touched (out of scope;
   backend rule). Recorded for a future backend decision.
5. Article list pencil icon still routes to the existing `/admin/articles/:id`
   view route (pre-existing destination, preserved as-is).
6. Projects delete keeps `confirm()` + hardcoded English toasts
   (pre-existing behavior preserved; no localized keys exist for it).
7. New-page dirty state is comparison-exact (revert = clean); edit pages
   use edits-latch semantics (revert still counts dirty until save) — the
   accepted 8.3 ProductEditor precedent, preserved consciously.
8. Sidebar/top-shell links and browser-back remain unguarded by documented
   8.3 design (no global interception introduced).

## 23. Browser/AT limitation

Click-level browser walkthrough and screen-reader verification: **NOT
TESTED** (no browser automation available — same standing as Phases
7.5–9.1). Evidence is SSR/prod smoke + unit/integration behavior (incl.
real Base UI menu/select interactions under real timers) + code
inspection, honestly marked.

## 24. Deferred items

Explicitly deferred per the phase brief (none started): URL-persisted
filters/search/page; dashboard redesign; duplicate/clone; media reuse/DAM;
bulk actions; draft/versioning; scheduling; approval workflows; new roles
or permissions; backend pagination redesign; Redux/Zustand; React Query
replacement; router rewrite; global/back-button interception; Hero3D/Three
changes; public redesign; i18n activation; SEO batch; category tree
redesign; product editor rewrite; homepage rewrite. Discovered-but-deferred
additions: §22.2 (project status/type labels), §22.4 (`planned` vs
`planning`), services delete UI, article pencil→edit destination review.

## 25. Recommended Phase 9.3

Per the accepted 9.0 plan: P1-3(b) URL-persisted list filters (now
covering six lists: products, categories, articles, services, projects) +
category pager if rows approach 100 + P2-5 dashboard hub. The unwired
filters catalogued in §8–§10 (§22.1–§22.2) are the natural filter-persistence
companions. Later: P2-3 duplicate/clone, P2-4 media reuse (pending the
explicit permission decision). None started.

## 26. Explicit STOP statement

**STOP after this report. No Phase 9.3 work started, no follow-up item
implemented, no source modified beyond the 9.2 delta above, no migration
added, no destructive DB/data operation performed (explicit statement).**

(End of file)

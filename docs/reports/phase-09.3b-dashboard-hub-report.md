# Phase 9.3-B — Admin Dashboard Hub Report

## 1. Status

**Status: COMPLETE.** The existing `/[locale]/admin` dashboard was upgraded
in place into a practical CMS workflow hub (Quick Actions, Content Overview,
Needs Attention, Recent Items), tested (16 new tests, zero weakened), and
fully verified (backend 163, frontend 411/48, tsc 0 errors, ESLint 0 errors,
production build success, runtime smoke green). Phase 9.3-A is COMPLETE and
ACCEPTED and remains the baseline. No Phase 9.4 work started.

## 2. Date/time

Date: 2026-09-23 (UTC session, continuation directly after the accepted
Phase 9.3-A). Scope: Phase 9.3-B items ONLY — preflight audit, dashboard-hub
rewrite of `admin/page.tsx`, 4 genuinely-necessary locale keys (fa/ar/en
parity), focused tests, full verification + STOP. No backend change, no
migration, no dependency change, no redesign, no new routes, no new roles or
permissions.

## 3. Baseline

Accepted Phase 9.3-A baseline, re-verified BEFORE any edit (preflight):

- Backend `python -m pytest apps/` (`AbrEnergy/`): **163 passed**
- Frontend `npm run test` (vitest): **395 passed / 47 files**
- `npx tsc --noEmit`: exit 0, 0 errors
- `npm run lint`: 0 errors, 54 warnings
- `makemigrations --check --dry-run`: No changes detected (only the
  pre-existing `ckeditor.W001` EOL notice)
- Runtime at session start: nothing listening on :3000 or :8000 (no dev, no
  Django running); `:3100` free

Prerequisite reports read completely before any modification:

1. `docs/reports/phase-09-preflight-report.md`
2. `docs/reports/phase-09.1-list-efficiency-report.md`
3. `docs/reports/phase-09.2-content-lists-dirty-guards-report.md`
4. `docs/reports/phase-09.3a-url-persisted-list-state-report.md`
5. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
6. `docs/reports/phase-08.5-error-mapping-report.md`
7. `docs/reports/phase-08.6-picker-debounce-report.md`

No report line numbers were trusted; every target was re-located in current
source and every backend claim was re-verified against live view code.

## 4. Preflight findings

Verified in current source (not assumed from reports):

1. **Dashboard was static aggregate cards only.** `admin/page.tsx` (62
   lines) consumed `useAdminDashboard` → `/api/v1/admin/dashboard/stats/`
   and rendered counts with zero links, zero shortcuts, zero recents.
2. **The stats endpoint is `IsSuperAdmin`-only**
   (`apps/core/api/v1/views/site.py:49-51`). Content managers and website
   admins receive 403, and the old page (which ignored the error and showed
   `common.no_data` when `stats` was falsy) therefore rendered an empty
   dashboard for every non-super-admin role. This is the load-bearing reason
   the hub does NOT consume that endpoint (see §8).
3. **Ordering audit (backend, re-verified):** articles
   `ordering_fields = [publish_date, created_at, view_count]`
   (`apps/articles/api/v1/views/article.py:46`); services
   `[order, created_at]` (`apps/services/api/v1/views/service.py:36`);
   products-admin `[sort_order, created_at]`
   (`apps/products/api/v1/views/products.py:221`); categories-admin
   `[sort_order, created_at]` (`:193`); **projects declares NO
   `ordering_fields`** (`apps/projects/api/v1/views/project.py:41-43` —
   only `search_fields` + `filterset_fields`). Consequence: recent-items
   ordering (`ordering=-created_at`) is safe for products/articles/
   services and is NEVER sent to projects.
4. **Filter audit (backend, re-verified):** products-admin filterset
   `[category, status, visibility, is_active, is_featured]` (`:219`) →
   `status=draft` and `visibility=hidden` supported; articles filterset
   `[category, status, is_featured, author]` (article.py:44) →
   `status=draft/scheduled` supported; services filterset
   `[category, status, is_featured]` (service.py:34) → `status=inactive`
   supported. Every attention filter used below is backend-declared.
5. **Envelope:** all five admin list endpoints paginate via
   `StandardPagination` → `{count, next, previous, results}` — the same
   contract the list pages rely on. `count` is the server-computed total
   and is therefore trustworthy even with `page_size=1`.
6. **Role model (frontend, re-verified):** `MANAGER_ROLES =
   [super_admin, website_admin, content_manager]`
   (`src/lib/admin-permissions.ts:5`); shell access gated by
   `canAccessAdminShell` (`admin/layout.tsx:51,58`); create UI on the
   product/category lists gated by `canManageProducts` /
   `canManageProductCategories`; **no article/service/project-specific
   capability helper exists** (audited before adding anything — none added).
7. **List pages render create buttons ungated** (services/articles/projects
   show them unconditionally); products/categories gate with the helpers
   above. Backend writes remain authoritative in all cases.

## 5. Existing dashboard audit

Before: 8 aggregate cards from the super-admin-only endpoint (users,
articles, projects, services, contacts, inquiries, pending ×2) plus a
products sub-section (categories/total/published/draft/featured). No
navigation, no filters, no recency, no role-aware actions; non-super-admins
saw `no_data`. Sidebar entry (`adminNavSections`, `/admin` →
`admin.dashboard`) already correct — untouched. No dashboard-specific
components existed; shared primitives (`PageHeader`, `TableLoading`,
`EmptyState`, `ErrorState`, `Card`, `Badge`, `Button`) reused as-is.

## 6. Exact files changed

**Source (1 file rewritten, frontend only, zero backend):**

1. `abr-energy-frontend/src/app/[locale]/admin/page.tsx` — 62-line static
   page → ~400-line workflow hub (see §7–§10). No new hook, no new API
   function, no new route, no `window.location.href`.

**Locales (4 genuinely-necessary section-title keys, fa/ar/en parity):**

2. `abr-energy-frontend/locales/fa.json` — `quick_actions` «اقدامات سریع»,
   `content_overview` «نمای کلی محتوا», `needs_attention` «نیازمند توجه»,
   `recent_items` «موارد اخیر».
3. `abr-energy-frontend/locales/ar.json` — same four keys in Arabic.
4. `abr-energy-frontend/locales/en.json` — same four keys in English.

Every other dashboard string reuses pre-existing keys (entity names, status
labels, `common.view_all`, `common.loading`, `admin.try_again`,
`admin.permission_denied`, `admin.server_connection_failed`, `no_*` /
`create_*` keys).

**Tests (1 new file, 16 tests):**

5. `abr-energy-frontend/src/app/[locale]/admin/dashboard-hub.test.tsx`
   (16 tests, §15).

**Documentation (1 new file):**

6. `docs/reports/phase-09.3b-dashboard-hub-report.md` (this file).

**Intentionally untouched:** backend (zero files — the stats endpoint and
its `IsSuperAdmin` gate are preserved byte-identical), `use-api.ts` (no
hook added or changed; `useAdminDashboard` stays exported, now unconsumed),
`api/index.ts`, all five list pages, all editors, dirty-guard hook, preview
architecture, sidebar/navigation config, admin shell/layout, DataTable,
`package.json`/`package-lock.json`, Hero3D/Three.js/R3F/Drei, DB.

## 7. Dashboard architecture

`/[locale]/admin` upgraded in place. Four sections in fixed hierarchy
(header → quick actions → content overview → needs attention → recent
items), same admin visual language (cards, badges, buttons, RTL, dark-mode
palette classes already in use). Two tiny local presentation components
(`MetricCard`, `RecentGroup`) plus two pure helpers (`getCount`,
`getRows`/`toRecentItems`) live inside the page file — no new shared
generic state system, no second data-fetching abstraction, React Query
reused with stable serializable keys under the existing `admin-*`
namespaces and the global `staleTime` policy (untouched).

Key decision — real data only, readable by every manager role: the hub
derives ALL numbers from the five EXISTING admin list endpoints instead of
the super-admin-only stats aggregate. No count is invented; a count is
shown only when the server returns a trustworthy `count` field
(`getCount` prefers `data.count` and never equates `results.length` with a
total — this is why the category card is honest despite the tree fetch).

## 8. Quick Actions

Six SPA actions via `router.push` (never `window.location.href`, no new
navigation abstraction): New Product (`/admin/products/new`), New Category
(`/admin/products/categories/new`), New Article (`/admin/articles/new`),
New Service (`/admin/services/new`), New Project (`/admin/projects/new`),
Homepage Studio (`/admin/content/homepage`). Gating follows existing
helpers only: products → `canManageProducts`, categories →
`canManageProductCategories`, studio → `canManageHomepage`,
article/service/project → `canManageProductCategories` (audited: no
narrower helper exists; backend stays authoritative; consistent with the
ungated create buttons on those list pages). Non-manager roles see zero
create actions while read-only overview counts still render. No new
permission constant, no backend authorization change.

## 9. Content Overview

Five cards — Products, Categories, Articles, Services, Projects — each with
the real server `count` and a `common.view_all` link to the exact admin
list. Counts come from §11 queries 1–5. Zero is rendered as `0` (real
state, still linked), never hidden or faked.

## 10. Needs Attention

Five cards, each one `page_size=1` filtered count deep-linking to the exact
Phase 9.3-A filtered URL (no invented parameters):

| Card | Params sent (all backend-declared) | Deep link |
|---|---|---|
| Products · draft | `status=draft` | `/admin/products?status=draft` |
| Products · hidden | `visibility=hidden` | `/admin/products?visibility=hidden` |
| Articles · draft | `status=draft` | `/admin/articles?status=draft` |
| Articles · scheduled | `status=scheduled` | `/admin/articles?status=scheduled` |
| Services · inactive | `status=inactive` | `/admin/services?status=inactive` |

Deliberately omitted (documented, not faked): inactive categories — the
category surface is a single tree fetch and an extra request adds no
workflow value beyond the overview card. Labels compose existing keys
(`entity · status`), so no locale invention was needed here.

## 11. Recent Items

Three groups (5 items each: title + status badge + date + edit link):
Recent Products (`ordering=-created_at`, date `updated_at` →
`/admin/products/:id/edit`), Recent Articles (`ordering=-created_at`, date
`created_at` → `/admin/articles/:id/edit` — the existing edit route, whose
dirty guard from 9.2 is untouched), Recent Services
(`ordering=-created_at`, date `created_at` →
`/admin/services/:id/edit`). **Projects is omitted from Recent Items:**
the backend declares no `ordering_fields` for projects, so no supported
recency ordering exists and none is sent (proven by test). No global
"recent" endpoint invented; no rich content/images fetched.

## 12. Deep-link URLs

All card links use the 9.3-A contract verbatim (`status`, `visibility`,
`featured`, `page`; stable key order; `featured=true` form). Overview
cards link to unfiltered lists; attention cards link to the filtered URLs
in §10 (workflow launcher behavior); recent items link to existing edit
routes. No new query parameters, no new routes.

## 13. Role/capability behavior

Shell gating preserved (`canAccessAdminShell`; dashboard reachable by
super_admin, website_admin, content_manager — and now USEFUL to all three,
fixing the §4.2 finding). Quick-action gating per §8. Read sections render
for every role that can read the underlying lists; 403s surface the
existing `permission_denied` message per card, never a page crash. Backend
remains authoritative; frontend visibility is UX only.

## 14. Request-count/performance strategy

Cold load = **10 tiny parallel React Query requests** (no waterfall — all
independent, all `page_size ≤ 5`):

| # | Endpoint | Params | Purpose |
|---|---|---|---|
| 1 | `/admin/products/` | `page=1&page_size=5&ordering=-created_at` | products count + recent |
| 2 | `/admin/articles/` | `page=1&page_size=5&ordering=-created_at` | articles count + recent |
| 3 | `/admin/services/` | `page=1&page_size=5&ordering=-created_at` | services count + recent |
| 4 | `/admin/product-categories/` | `page=1&page_size=1` | categories count |
| 5 | `/admin/projects/` | `page=1&page_size=1` | projects count (never ordered) |
| 6–7 | `/admin/products/` ×2 | `status=draft` / `visibility=hidden` + `page=1&page_size=1` | attention counts |
| 8–9 | `/admin/articles/` ×2 | `status=draft` / `status=scheduled` + `page=1&page_size=1` | attention counts |
| 10 | `/admin/services/` | `status=inactive&page=1&page_size=1` | attention count |

Optimizations applied: each recent query doubles as its entity's overview
count (3 requests saved vs. naive); all counts use `page_size=1` (payload
is one stub row + envelope); no images/rich content fetched; default
React Query caching retained. Replacing the 1-request super-admin-only
aggregate with 10 role-readable tiny requests is the documented trade-off
that makes the dashboard work for all manager roles with zero backend
change.

## 15. Loading/empty/error behavior

Every data unit is isolated: `MetricCard` shows a skeleton pulse while
loading, `—` + `try_again` retry on error (permission-aware title), and
the real number (including `0`) on success. `RecentGroup` shows
`TableLoading` / `ErrorState`+retry / `EmptyState`+create-action using the
existing shared primitives. A failed services query leaves products,
articles, overview, and attention rendering (proven by test); the whole
dashboard can never 500 because of one optional request.

## 16. Locale/RTL behavior

Persian active UI preserved (RTL, fa locale, ar/en architecture intact,
no locale activation). Four new section-title keys added with full fa/ar/en
parity (§6); everything else reuses existing keys. Verified by `t(key)`
passthrough tests plus SSR `dir="rtl"` probe. No hardcoded user-facing
English in the new UI (status/date strings come from API data and locale
keys as before).

## 17. Tests added

`dashboard-hub.test.tsx` — **16 tests, all green** (mocked transport only;
real component + real hook wiring + real Next Link hrefs):

- Quick actions (3): all six labels/routes for managers; SPA `router.push`
  verbs (never external URLs); non-manager sees zero create actions while
  overview still renders.
- Overview (3): real counts rendered; exact list hrefs; `count`-field (42)
  shown despite 2-row payload (anti-fake proof).
- Attention (3): real filtered counts + exact 9.3-A deep links; only
  backend-supported params sent; zero renders as `0` with link intact.
- Recent (4): real records + existing edit hrefs; `ordering=-created_at`
  sent for products/articles/services; **no `ordering` ever sent to
  projects**; empty group shows real empty state with working create
  navigation.
- Isolation (3): all-loading renders placeholders; one failed group keeps
  the rest rendering with per-card retry; 403 surfaces permission-safe UI.

Zero existing tests weakened, skipped, or re-counted.

## 18. Full test results

| Suite | Result |
|---|---|
| Backend `python -m pytest apps/` | **163 passed** (baseline exact, before + after) |
| Frontend `npm run test` (vitest) | **411 passed / 48 files** (395/47 intact + 16 new / 1 file) |
| 8.3 guard (14), 8.5 mapping (9+31+2), 8.6 debounce (12), 9.1 (21), 9.2 (61), 9.3-A (55) | all green, unmodified |
| `makemigrations --check --dry-run` | No changes detected (only pre-existing `ckeditor.W001`) |

## 19. TypeScript

`npx tsc --noEmit`: exit 0, **0 errors** (before and after).

## 20. ESLint

`npm run lint`: **0 errors, 54 warnings** — identical count to the 9.3-A
baseline; zero new warnings introduced.

## 21. Build

Canonical workflow followed (no dev on :3000 at build time — verified free;
`npm run build` **success**; full route table incl. `/[locale]/admin`, all
five admin lists, all `new`/`[id]`/`[id]/edit` shells, all three preview
routes dynamic, `/sitemap.xml` + `/robots.txt`). Post-probe ONLY `.next`
removed (source intact).

## 22. Runtime smoke

Production `next start -p 3100` (Django `:8000` was not running this
session — see §23; all frontend probes below are live):

| Check | Result |
|---|---|
| `GET /fa` | 200 (75,291 B), exactly one `<h1`, `dir="rtl"`, slogan present, zero `vendor-chunks` error text, no 500 |
| `GET /fa/products` | 200 |
| `GET /fa/admin` | 200, no 500 |
| `/fa/admin/products`, `/fa/admin/products/categories`, `/fa/admin/articles`, `/fa/admin/services`, `/fa/admin/projects` | 200 ×5 |
| `/fa/admin/articles?status=draft` (filtered deep link) | 200, no 500 |
| `GET /fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| Dev restart (end state) | exactly ONE `next dev` chain (parent + single server child), `/fa` 200, `/fa/admin` 200 |

Click-level browser walkthrough and screen-reader verification: **NOT
TESTED** (no browser automation available — same standing as Phases
7.5–9.3-A). Evidence is SSR/prod smoke + unit/integration behavior (real
Base UI/Link/router interactions in tests) + code inspection, honestly
marked.

## 23. Data safety

No flush, reset, seed, content edit, credential, permission, or role
change. No migration (check clean). Backend: zero files touched, so
authorization behavior (incl. the stats endpoint's `IsSuperAdmin` gate and
the anonymous-admin 401) is unchanged by construction; the anonymous-401
live probe could not be re-run because Django `:8000` was not running in
this environment (no process at session start, left untouched per data
safety). All probes were read-only GETs. The ~30 untracked
`AbrEnergy/media/**` UUID byproducts from this session's backend re-runs
(same-suite artifacts per the 8.3–9.3-A precedent) were all deleted — zero
remain. No fixtures created. Temp probe files live outside the repo.

## 24. Known limitations

1. Cold load issues 10 small parallel requests (§14) instead of 1 aggregate
   — the documented cost of role-readable real data with zero backend
   change; each payload is ≤5 stub rows.
2. Inactive categories have no attention card (§10 rationale); category
   recency is not shown (tree semantics — count only).
3. Projects have no recent group (no server-side ordering support — cannot
   be fixed frontend-only without inventing ordering semantics).
4. `useAdminDashboard` hook + `adminApi.getDashboard` remain exported but
   unconsumed (backend endpoint preserved; removal would be churn, not a
   fix).
5. Real-browser history traversal of deep links and AT walkthrough NOT
   TESTED (§22).
6. Dashboard numbers follow the global 30 s `staleTime` like all CMS lists
   (fresh enough for a workflow hub; no custom cache policy introduced).

## 25. Deferred items

Explicitly deferred per the brief (none started): duplicate/clone, media
reuse/DAM, bulk actions, draft/versioning, scheduling, approval workflows,
new roles, new permissions, backend dashboard aggregation, analytics/
charts, global browser-back interception, public/homepage redesign,
Hero3D/Three.js/R3F/Drei changes, SEO batch tooling, i18n activation,
category tree redesign, product editor rewrite, backend pagination
redesign, Redux/Zustand, router rewrite, Phase 9.4 work.

## 26. Exact next recommended phase

Per the accepted 9.0 plan, the natural next slice is **P2-3
duplicate/clone** (isolated backend `POST .../duplicate` + row action,
needs slug/SKU uniqueness design first) or **P2-4 media reuse picker**
(pending the explicit `IsAdminUser`-vs-`IsContentManager` permission
decision). Neither started. No Phase 9.4 work begins without review.

## 27. Explicit STOP statement

**STOP after this report. No Phase 9.4 work started, no duplicate/clone,
media reuse, bulk actions, versioning, scheduling, approvals, new roles,
new permissions, backend aggregation, analytics, redesigns, or animation
changes started or implemented; no migration added; no destructive DB/data
operation performed (explicit statement).** Single `next dev` chain on
`:3000` running (`/fa` 200, `/fa/admin` 200), `:3100` free, `.next`
removed.

(End of file)

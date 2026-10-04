# Phase 10.1 — Release Blocker Closure Report

**Date:** 2026-09-24
**Scope:** Narrow release-blocker closure ONLY — Services/Projects permission
alignment (E-01/I-01) + Phase 10 header-hydration report reconciliation, then
STOP. No new feature, no CMS redesign, no deferred P2/P3 item, no Phase 10.2,
no dependency upgrade, no schema change, no destructive DB operation.
**Branch:** `master` (tracking `origin/master`), HEAD `342d1da`. No commit made.

> The Phase 10 report (`phase-10-release-candidate-qa-report.md`) is left
> byte-identical. This file reconciles it and records the 10.1 delta.

---

## 1. Status

**Status: COMPLETE.** Both Phase 10.1 objectives are closed:

1. **E-01 / I-01 resolved** with one coherent permission contract (OPTION A —
   Services + Projects writes join the `IsContentManager` content gate), plus
   one load-bearing companion fix without which the Edit workflow could not
   function for any role (§4).
2. **Header hydration inconsistency reconciled** against current source: the
   claimed fix EXISTS verbatim; it was pre-existing uncommitted work, which is
   why the Phase 10 "exactly 3 files" footprint does not list it (§5).

All required verification is green (§6–§7). No unrelated permission, route,
editor, theme, or config behavior was changed.

---

## 2. Permission decision and evidence

**Decision: OPTION A** — Services + Projects writes are available to
`content_manager` via the existing `IsContentManager` abstraction. No new
permission class, no new role, no read-permission change.

### 2.1 Backend write-gate matrix (current source, before the fix)

| Entity | Write gate | `content_manager`? |
|---|---|---|
| Products (admin list/detail/duplicate) | `IsContentManager` | YES |
| Product categories (admin) | `IsContentManager` | YES |
| Articles (list/detail/publish/archive) | `IsContentManager` | YES |
| Homepage (admin) | `IsContentManager` | YES |
| Media upload / list / retrieve | `IsContentManager` | YES |
| **Services (list/detail)** | **`IsAdminUser`** | **NO — anomaly** |
| **Projects (list/detail)** | **`IsAdminUser`** | **NO — anomaly** |
| Article categories/tags, Service categories (taxonomy) | `IsAdminUser` | NO (intentional, untouched) |
| Media delete / temp cleanup (destructive) | `IsAdminUser` | NO (intentional, untouched) |
| Gallery, contacts admin | `IsAdminUser` | NO (unchanged) |
| Dashboard stats aggregate, users | `IsSuperAdmin` | NO (unchanged) |

`IsContentManager` = super_admin + website_admin + content_manager
(`apps/users/api/v1/permissions.py:23-33`); `IsAdminUser` = super_admin +
website_admin only (`:14-20`). Every primary CMS content write except
Services/Projects already admitted `content_manager`. Services and Projects
are public website content (routes `/services`, `/projects`), not taxonomy
and not destructive operations — their exclusion matches neither the content
pattern nor the taxonomy/destructive pattern that legitimately stays
admin-only.

### 2.2 Frontend evidence (content_manager is offered the workflows)

- Shell admission: `MANAGER_ROLES = [super_admin, website_admin,
  content_manager]` (`src/lib/admin-permissions.ts:5`); no
  article/service/project-specific capability helper exists — the dashboard
  hub deliberately gates their quick actions with `canManageProductCategories`
  (manager-level) and documents the backend as authoritative
  (phase-09.3b §8/§13).
- Sidebar: `/admin/services` and `/admin/projects` sit under `nav_content`
  with NO `roles` restriction, while users/activity-log/settings ARE
  restricted (`src/config/navigation.ts:61-89`) — the IA treats
  services/projects as manager-visible content.
- Lists and all six editors (new + edit for articles/services/projects) render
  Create/Save UI ungated; failures surface only a permission-aware message.
  No helper, button, or route hides these workflows from `content_manager`.

### 2.3 Conclusion

Two backend view files disagreed with ~10 frontend surfaces plus five backend
content entities. No report or code comment documents an intentional
admin-only decision for Services/Projects (phase-09.2 §7 merely records the
gates as found; Phase 10 defers the decision explicitly). OPTION A is the
architecture-consistent resolution. OPTION B (hiding UI) would have removed
working CMS surface to enshrine a two-file anomaly — rejected.

---

## 3. E-01 / I-01 fix

### 3.1 Permission gates (the E-01 fix proper)

- `AbrEnergy/apps/services/api/v1/views/service.py` — `ServiceListView` and
  `ServiceDetailView` write branches: `IsAdminUser()` → `IsContentManager()`
  (GET stays `AllowAny`; import extended, no new class).
- `AbrEnergy/apps/projects/api/v1/views/project.py` — `ProjectListView` and
  `ProjectDetailView` write branches: same substitution (the `IsAdminUser`
  import is replaced; `ProjectFeaturedView`/`ProjectByTypeView` stay
  `AllowAny`).
- Deliberately untouched: `ServiceCategory*` views, article Category/Tag
  views, media delete/cleanup, homepage, gallery, dashboard stats, users —
  the taxonomy/destructive/admin-only splits are preserved exactly.

### 3.2 Companion fix (load-bearing, same workflow)

Probing the Edit path before fixing exposed a second defect masking behind
the 403: the admin detail routes (`<uuid:pk>/`) share their view classes with
the public `<slug:slug>/` routes (`lookup_field = "slug"`), and
`TranslatedSlugDetailMixin.get_object()` resolved the `"pk"` branch through
the default DRF lookup — which asserts on the missing `"slug"` kwarg
(verified: `AssertionError`, i.e. HTTP 500 in production, for EVERY role
including super_admin). The frontend Edit pages fetch/save/delete by UUID
(`s.id` → `/admin/services/<uuid>/`, same for projects), and project-list
delete hits `/admin/projects/<uuid>/` — so without this fix, widening the
gate would have turned `content_manager`'s Edit save from 403 into 500.

- `AbrEnergy/apps/core/mixins.py` — the `"pk"` branch now resolves
  `get_object_or_404(queryset, pk=...)` with the same
  `check_object_permissions` enforcement as the slug branch. This matches the
  branch's evident original intent and fixes the identical latent failure on
  the article admin detail route (article *permissions* unchanged).
- No URL, serializer, or lookup-field change; public slug behavior untouched
  (proven by unchanged public-detail tests + full suite).

### 3.3 Frontend permission consistency

No editor, list, sidebar, or helper change was needed: under OPTION A the
already-ungated Create/Edit UI is now exactly what the backend enforces, so
`content_manager` no longer meets a false 403 (nor a 500). Direct API
mutation by engineer/customer/anonymous remains denied (regression-locked).
One test-only addition locks the UI side of the contract (§6).

---

## 4. Header hydration reconciliation

**Result: the claimed Phase 10 fix EXISTS in current source — no code change
made.**

- `abr-energy-frontend/src/components/layout/header.tsx:21-24,31-37,171`
  contains exactly the documented guard: `mounted` state (default `false`),
  one-shot `useEffect(() => setMounted(true), [])` with an explanatory
  comment (server-identical fallback rationale), and the icon expression
  `mounted && theme === 'dark' ? <Sun/> : <Moon/>`, plus the
  `react-hooks/set-state-in-effect` eslint-disable justifying the mount flag
  as the documented next-themes pattern.
- Why the Phase 10 report omits it: `header.tsx` was already modified in the
  pre-existing uncommitted tree at audit start (Phases 7→9.5 work — present in
  the session-start `git status`, HEAD `342d1da` clean-history). The report's
  "exactly 3 files" counts only files Phase 10 itself touched
  (`sanitize.ts`, `admin/media/page.tsx`, `product-editor.tsx`); it neither
  claims nor disclaims the header change elsewhere. Reconciliation: the header
  guard is real, verified, and attributable to pre-Phase-10 uncommitted work
  — not to Phase 10, and not missing functionality.
- Regression test: none added. No header/next-themes test harness exists in
  the suite (zero `next-themes` mocks under `src/`), so per the brief a new
  harness was out of scope; the file is covered by `tsc` (0 errors) and
  `eslint` (no warnings on the file), and its diff is confined to the guard
  (13 insertions, 1 deletion — comment + flag + expression).
- No unrelated header behavior modified.

---

## 5. Tests

### 5.1 Backend (new, 22 tests — E-01/I-01 matrix, isolated fixtures)

- `AbrEnergy/apps/services/tests/test_phase10_1_permissions.py` (11) and
  `AbrEnergy/apps/projects/tests/test_phase10_1_permissions.py` (11), plus
  `__init__.py` in each new `tests/` package.
- Matrix per entity: anonymous list/admin-list/detail read 200 (unchanged);
  anonymous create/update/delete → 401 with zero rows written; customer and
  engineer create/update/delete → 403 with zero rows written;
  content_manager / website_admin / super_admin → full create (201) → update
  (200, value asserted) → delete (204, count asserted) cycle.
- Pre-fix run reproduced E-01 exactly (`content_manager` POST → 403 with the
  Persian denial envelope) and exposed the §3.2 pk-lookup 500; post-fix all
  22 pass. No existing test weakened or touched.
- Full backend suite: **234 passed** (212 Phase-10 baseline + 22 new), incl.
  all mixin consumers (articles/homepage/products/media).

### 5.2 Frontend (1 new test, zero weakened)

- `src/lib/admin-permissions.test.ts` +1: locks the resolved contract —
  `/admin/services` and `/admin/projects` nav entries carry no role
  restriction, remain visible to `content_manager`, and the shell admits
  `content_manager`.
- Full frontend suite: **51 files / 449 passed** (448 baseline + 1 new).

### 5.3 Static / migration checks

- `npx tsc --noEmit`: **0 errors**. `npm run lint`: **0 errors, 55 warnings**
  (identical to the Phase 10 baseline; none on touched files).
  `python manage.py makemigrations --check --dry-run`: **no changes detected**
  (only the pre-existing `ckeditor.W001` notice).

---

## 6. Build / runtime

Canonical workflow observed (pre-existing dev on :3000 stopped first; :3000
verified free before build):

1. `npm run build`: **PASS** (Next 15.5.21, full route table incl. all admin
   services/projects shells and preview routes; no vendor-chunk failure).
2. Production `next start -p 3100` smoke: **8/8 HTTP 200** — `/fa`,
   `/fa/products`, `/fa/products/categories`, `/fa/admin`,
   `/fa/admin/services`, `/fa/admin/projects`, `/sitemap.xml`, `/robots.txt`.
   `/fa` content: exactly **1 `<h1>`**, slogan present (75,334 B).
3. Prod stopped, `:3100` verified free, **only `.next` deleted**.
4. End state: **exactly ONE dev chain** (`next dev` parent + single server
   child), `/fa` = 200 with 1 H1 and slogan. No duplicate Next processes.
5. Django was not running during smoke (as in several prior phases); catalog
   sitemap entries degrade gracefully by design — no defect claimed.

---

## 7. Data safety

No flush/reset/drop/delete of any database or content; no migration; no
media deletion; no fake production content; no duplicate creation against
real data. All writes exercised isolated test fixtures through the test
database only (denied-write tests additionally assert row counts unchanged).
The 129 `AbrEnergy/media/**` UUID byproducts of this phase's full-suite run
(same-suite T-01 phenomenon) were identified by date and deleted — zero
remain; the 258 tracked seed files are untouched. No browser automation was
available; no click-level walkthrough is claimed.

---

## 8. Git status

- **Pre-existing (untouched):** the uncommitted Phases 7→9.5 tree on HEAD
  `342d1da` (incl. the `header.tsx` guard). Nothing reverted, nothing
  committed.
- **Phase 10.1 delta (6 paths):** `AbrEnergy/apps/core/mixins.py`,
  `AbrEnergy/apps/services/api/v1/views/service.py`,
  `AbrEnergy/apps/projects/api/v1/views/project.py`,
  `abr-energy-frontend/src/lib/admin-permissions.test.ts` (3, 3, 6, and 15
  changed lines respectively), plus new `AbrEnergy/apps/services/tests/` and
  `AbrEnergy/apps/projects/tests/` (`__init__.py` +
  `test_phase10_1_permissions.py` each).
- **Generated artifacts:** `.next/` rebuilt then deleted (absent, as at phase
  start); `prod3100.log` lives outside the repo (temp dir). No commit made.

---

## 9. Remaining known limitations

All Phase 10 P2/P3 findings carry over unchanged (A-01/A-02 metadata, N-02
tag policy, N-03 docs gating, G-01 preview locale, C/D/B/E/J/H/L-track
backlog, T-01 housekeeping noted above, S-01 sitemap-env deploy checklist).
No browser/AT walkthrough (no automation). No new P0/P1 was introduced; the
mixin touch-point also repairs article admin detail-by-UUID as a side effect
(same latent 500, permissions unchanged) — covered implicitly by the article
suite, which stays green.

---

## 10. Release assessment

### RELEASE CANDIDATE — NO P0/P1 FINDINGS

E-01/I-01 is closed under one coherent, regression-locked contract
(`content_manager` Create/Edit for Services and Projects verified end to end
at the API level; UI and backend agree with no UI change required), the
header report inconsistency is reconciled to actual source, and every
required gate is green: backend 234/234, frontend 449/449, tsc clean, lint
0 errors, migrations clean, build PASS, production smoke 8/8 with content
checks, exactly one dev server, zero destructive data operations.

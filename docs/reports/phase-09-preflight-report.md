# Phase 9.0 — Preflight / Discovery Report

Date: 2026-09-23 (~07:15–08:00 UTC+03:30 local session). Scope: INVESTIGATION
ONLY. No source file was modified in this phase. The only new file is this
report. Phase 8.6 is COMPLETE and ACCEPTED and remains the baseline.

All ten prerequisite reports were read completely before any action:

1. `docs/reports/phase-07-cms-content-homepage-report.md`
2. `docs/reports/phase-07.5-cms-acceptance-audit-report.md`
3. `docs/reports/phase-07.6-three-runtime-recovery-report.md`
4. `docs/reports/phase-08-preflight-report.md`
5. `docs/reports/phase-08.1-preview-architecture-report.md`
6. `docs/reports/phase-08.2-product-category-preview-report.md`
7. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
8. `docs/reports/phase-08.4-read-only-ux-report.md`
9. `docs/reports/phase-08.5-error-mapping-report.md`
10. `docs/reports/phase-08.6-picker-debounce-report.md`

Live-code findings below were verified against the CURRENT repository by
reading actual code (three parallel codebase audits with `file:line`
evidence), not assumed from reports. Every claim cites an exact location.

---

## 1. Executive Summary

**Status: PREFLIGHT COMPLETE — no P0/P1 blocker found, no code changed.**

- Baselines re-verified live and match the accepted Phase 8.6 state exactly:
  backend **163 passed**, frontend **258 passed / 32 files**, `tsc` 0 errors,
  ESLint **0 errors / 55 warnings**, `makemigrations --check`: No changes
  detected, production build success, production smoke green.
- **No Phase 8.6 regression.** The picker debounce (shared
  `useDebouncedValue`, both picker integrations) is intact; all 12 debounce
  tests plus the full 258-test suite are green with zero weakening.
- The audit found **zero P0** (security/data-integrity/runtime) issues and
  **no issue requiring immediate implementation**. Per the implementation
  rule, this phase stops at investigation + report + baselines.
- Genuine, evidence-backed workflow friction was found and triaged into
  **3 × P1, 6 × P2, 6 × P3** candidates (§8), plus explicit
  remain-deferred / not-worth-doing lists (§9–§10).
- Recommended next phase: **Phase 9.1 — Admin list-efficiency slice**
  (list-search debounce + category `page_size` cap fix + list-state
  groundwork), detailed in §11.

## 2. Git Status (before / after)

Before (session start): branch `master`, HEAD `342d1da HomePagePhase7Done`,
31 modified files + 24 untracked paths = exactly the accepted uncommitted
7.5/8.1–8.6 tree plus prior reports (verified via `git status --short`,
`git log --oneline -8`, `git diff --stat`: 1082 insertions, 188 deletions
across the same 31 files — all explainable as accepted Phase 7.5–8.6 work).

After (session end): byte-identical tree **plus this report only**.
`git diff --stat` unchanged. No source file touched, no migration added,
no dependency changed.

## 3. Files Changed / Intentionally Untouched

Changed: `docs/reports/phase-09-preflight-report.md` (new, this file).
Nothing else.

Intentionally untouched (architectural rules honored): `next.config`,
Three.js/R3F/Drei versions, Hero3D and all animation components,
`package.json`/`package-lock.json`, all API contracts, all permissions,
preview/token code, dirty-guard hook, error normalizer, debounce hook,
translation architecture, sitemap/robots, public routes, DB credentials,
production content.

## 4. Baseline Tests (before) / Final Tests (after)

| Suite | Before | After | Match |
|---|---|---|---|
| Backend `python -m pytest apps/` (`AbrEnergy/`) | 163 passed (10.41 s) | 163 passed | exact |
| Frontend `npm run test` (vitest) | 258 passed / 32 files | 258 passed / 32 files | exact |
| `npx tsc --noEmit` | exit 0, 0 errors | exit 0, 0 errors | exact |
| `npm run lint` | 0 errors, 55 warnings | 0 errors, 55 warnings | exact |
| `makemigrations --check --dry-run` | No changes detected | No changes detected | exact |
| `npm run build` (port 3000 verified free) | success | success | exact |

No test added, weakened, skipped, or re-counted. The pre-existing
`ckeditor.W001` (CKEditor 4 EOL notice) is unchanged and still deferred.

## 5. Runtime Verification (production `next start -p 3100`)

Canonical Phase 7.6 workflow followed (no dev live during build; build;
prod probe on :3100; prod stopped; no dev restart needed — see §12 note).

| Check | Result |
|---|---|
| `GET /fa` | 200 (74,012 B), exactly one `<h1`, `dir="rtl"`, slogan present, no English fallback, zero `vendor-chunks` error text |
| `GET /fa/products` | 200 |
| `GET /fa/preview/homepage?token=x` | 200 shell |
| Category preview shell (bad token) | 200 shell, `noindex` present, PREVIEW banner present |
| `/sitemap.xml` | 200, zero `preview` hits |
| `/robots.txt` | 200 |
| `GET /api/v1/homepage/` (Django `:8000`, dev PG) | 200 |
| Anonymous `GET /api/v1/admin/homepage/` | 401 (auth enforced, expected) |
| Preview routes in build table | `/preview/homepage`, `/preview/products/[id]`, `/preview/products/category/[id]` — all dynamic, intact |

Probe servers (prod :3100, Django :8000) were started as scoped jobs and
stopped afterwards; ports verified free. No browser/WebGL walkthrough (no
automation — same standing as Phases 7.5–8.6, honestly marked).

## 6. Discovery Answers (from actual code)

1. **Biggest remaining friction** (§8 P1s): (a) admin product/category list
   search fires one server request per keystroke; (b) list
   search/filter/pagination state is local-only and lost on every
   open-and-back, compounded by full-page-reload navigation
   (`window.location.href`) on product/category rows; (c) services/projects/
   articles admin lists expose none of the backend's search/filter/
   pagination capability (projects admin even calls the public endpoint).
2. **P3 items still worth fixing**: list-state standardization
   (loading/empty/error), DataTable dead-code/hardcoded-English cleanup,
   SEO-autofill helpers, copy-fa translation helper. All small, isolated,
   testable — none urgent.
3. **Admin list searches per keystroke? YES** — products
   (`admin/products/page.tsx:38,47-57,61,156-159`, key
   `['admin-products',params]` in `hooks/use-api.ts:73-74`) and categories
   (`admin/products/categories/page.tsx:36,43-51,55,217-223`). The shared
   `useDebouncedValue` (`hooks/use-debounced-value.ts:14`) exists but is
   used only by the two relation pickers. DataTable's own search
   (`shared/data-table.tsx:43-46`) is also un-debounced, but DataTable has
   zero consumers in admin lists.
4. **State preserved on open/save/return? NO.** All list state is local
   `useState` (products `page.tsx:38-44`, categories `:36-40`); zero
   `useSearchParams`/router sync on any list page. All save/delete/Cancel
   destinations are hardcoded literals (product create `:22-26`, edit
   `:37-44,57-62`; category new `:110`, edit `:157,182`; homepage `:242`
   → `/admin`). Only URL usage in admin is `?parent=` prefill
   (`categories/new/page.tsx:59`), not filter restoration.
5. **Save & Continue consistent? NO.** Only Product (create/edit) and
   Homepage offer it. Category/Article/Service/Project force
   leave-to-fixed-list on every save. Homepage Save goes to `/admin`
   (dashboard) while every other Save goes to its own list.
6. **Unnecessary requests?** No refetch loops found (mutations invalidate
   correctly, `use-api.ts:60-105`; global `staleTime:30000`,
   `providers.tsx:9`). Genuine waste is limited to: (a) per-keystroke list
   searches (§6.3); (b) ad-hoc duplicate namespace — relations editor
   (`['admin-products',{relSearch}]`) vs list page (`['admin-products',
   params]`) hitting the same endpoint without dedupe; (c) categories list
   fetching `page_size=200` (capped to 100 server-side — truncation risk,
   §8 P1-3 note).
7. **Loading/empty/error consistent? NO across entities.** Products +
   product-categories share the gold standard (`TableLoading` +
   `EmptyState` + `ErrorState` + retry). Articles/services/projects/users/
   contacts use divergent custom divs, plain strings, missing retry, or no
   error/empty UI at all (full matrix in §7.3 evidence).
8. **Safe quick actions without architecture change? YES, partially.**
   Products/categories already have `is_active`/`is_featured` toggles +
   edit/delete. Services rows have ZERO actions; articles have no
   toggle/delete on row; no entity has duplicate/clone (zero hits for
   `duplicate|clone` as entity operations in frontend or backend).
9. **Dashboard improvement needed?** Current dashboard
   (`admin/page.tsx:1-62`) is static counts only — zero links, shortcuts,
   or recent items. Improvement is P2-convenience, not a blocker; the
   dashboard is sufficient for status display but useless as a workflow hub.
10. **Small isolated changes with strong regression coverage? YES.**
    List-search debounce (picker-debounce test pattern reusable),
    `page_size` cap fix, list-state standardization, services/projects
    list params wiring, row-action additions, dirty-guard adoption for
    article/service/project editors, Save & Continue for categories.

## 7. Detailed Findings (evidence-backed)

### F1. List search per keystroke (deferred item A — now worth fixing)
`admin/products/page.tsx:38` (`useState('')`), `:47-57` (params memo),
`:61` (`useAdminProducts(params)`), `:156-159` (onChange, no debounce);
`admin/products/categories/page.tsx:36,43-51,55,217-223` (same pattern);
hook keys `use-api.ts:43-44,73-74`; transport `api/index.ts:185-189`.
Precedent: public `ProductFilters.tsx:49-54` (350 ms) + 8.6 pickers
(300 ms shared hook). Pagination-reset already correct on products
(`resetPage :59`, search `setPage(1) :159`).

### F2. List state lost + full-reload navigation
No `useSearchParams`/`useRouter` on any list page (grep: 0 hits).
Row edit via `window.location.href` (products `:224,:299`; categories
`:180,:185,:266`; `product-editor.tsx:116` `leaveToBack`). Edit→back→edit-
next costs 5 clicks + 2 full reloads with filters lost; articles/projects
(SPA `Link`s) cost 3 clicks with filters still lost.

### F3. Services/projects/articles admin lists under-exposed
Backend supports search/filter/ordering/pagination (articles
`views/article.py:43-47`; services `views/service.py:33-36`; projects
`views/project.py:41-43` + `settings/base.py:138` pagination) but admin UIs
call param-less endpoints (`services/page.tsx:9`, `use-api.ts:12`,
`api/index.ts:61-64`; projects hits public `/projects/` `:26` with no
params). Services table has no actions column at all (`:19-33`).

### F4. Save-flow inconsistency
Product 3-mode (`save|continue|publish`, `product-editor.tsx:40,364-374`;
create `:22-26` → edit page; edit `:37-44` → stay + `dirtyResetSignal`),
Homepage 2-mode (`page.tsx:228-244,686-693`), everything else single-Save
to fixed list (article new `:50-71`, edit `:85-90`; service new `:43-52`,
edit `:74-83`; project new `:50-55`, edit `:82-87`; category new `:110`,
edit `:157`).

### F5. No duplicate/clone; uneven quick actions; static dashboard
Zero entity-clone hits (frontend + backend grep). Row actions: products
`:286-308` and categories `:156-195` rich; articles `:87-105`
edit/view only (edit link points at view route); projects `:99-108`
edit/delete; services none. Dashboard `admin/page.tsx:1-62`: counts only.

### F6. Dirty-guard gap on article/service/project editors (deferred-item-B class)
Product/category/homepage guarded (`useDirtyNavigationGuard` + dialog);
article/service/project new/edit have NO dirty state/guard/beforeunload
(grep: no files found). Sidebar/global-nav + browser-back remain
unguarded by documented design (`use-dirty-navigation-guard.ts:16-21`) —
no safe fix without global interception; stays deferred.

### F7. Media upload-only, no reuse (deferred item D)
`media-upload.tsx:18-40` (single-file POST only, no library props);
`product-media-manager.tsx:24-37`, `homepage-visuals-editor.tsx:64-68`
(require fresh upload id). Backend list/detail/delete/cleanup exist
(`media_manager/views/media.py:27-58`, `urls/__init__.py:7-18`) but the
admin media page (`admin/media/page.tsx:18-55`) is a read-only first-page
grid with no search/filter/pagination/reuse/delete. Permission asymmetry:
upload = `IsContentManager` (`:17`) vs list/delete = `IsAdminUser`
(`:29,:44`) — content managers can upload but cannot list/delete.

### F8. Preview saved-state-only (deferred item C — stays deferred)
Token architecture intact (`preview_tokens.py`, `preview.ts:1-7`,
`preview-banner.tsx:16` saved-state copy). Preview buttons edit-only with
`locale:'fa'` hardcoded (homepage `:287-307`, product edit `:71-86`,
category edit `:187-202`); create-mode has none by design
(`products/new/page.tsx:38-45`). No preview for articles/services/
projects/gallery. No draft/versioning needed — stays deferred.

### F9. State standardization gaps (P3)
Matrix: products/categories gold standard vs articles (custom div, no
retry `:33-48`), services (plain string, no error/empty `:9-15`),
projects (toast+div, no retry `:31-57`), users/contacts (none `:15`).
`DataTable` (`shared/data-table.tsx`) unused in admin (0 hits), with
hardcoded English `Loading...`/`No data found` (`:63-74`), no sorting/
bulk/actions. SEO 7-field set triplicated (`product-seo-fields.tsx`,
category new/edit, homepage `:596-644`; `ROBOT_OPTIONS` ×3) with counters
only on products. Products/categories are fa-only editing surfaces
(`product-form.ts:12-15,266-292`) while articles demand 12 fields with no
copy-from-fa helper. Category list `page_size:'200'` exceeds server
`max_page_size=100` (truncation past 100 rows). Dead nav: `adminNavItems`
export unused (`navigation.ts:25-35`), `attributes` disabled placeholder
(`:58`, no page on disk), notifications duality
(`/admin/notifications` orphaned vs `/dashboard/notifications` linked).

## 8. Prioritized Candidate List

### P0 — none.
No security, data-integrity, or runtime blocker found. Permissions,
preview isolation, and public filters verified intact (§5).

### P1 — major CMS workflow issues

**P1-1. Admin products/categories list-search debounce (deferred item A).**
Problem: one server request per keystroke (§7 F1). Evidence: F1 locations.
Current: raw `search` in query key. Desired: shared `useDebouncedValue`
(300 ms, 8.6 precedent) — immediate input, debounced query key/fn; keep
`setPage(1)` reset + 30 s cache semantics. Risk: low (picker-proven
pattern). Scope: S (2 list pages + tests). Backend: none. Migration: none.
API contract: none. Tests: integration (rapid typing → single request,
input immediate, selection unaffected) mirroring
`picker-debounce.test.tsx`. Recommendation: **IMPLEMENT (Phase 9.1)**.

**P1-2. Services/projects/articles admin lists expose backend capability.**
Problem: no search/filter/pagination/params; projects admin uses the public
endpoint; services rows have zero actions (§7 F3). Evidence: F3 locations.
Current: param-less fetches, truncated first-page renders. Desired: wire
existing params (search + status/category filters + pagination) through
`api/index.ts` + `use-api.ts` + list pages; switch projects admin to the
admin endpoint; add services row actions. Risk: low-medium (touches 3 list
pages; no backend change). Scope: M. Backend: none. Migration: none. API
contract: none (consume existing params). Tests: hook param-passing +
loading/empty/error states. Recommendation: **IMPLEMENT (Phase 9.2)**.

**P1-3. List-state loss + full-reload navigation.**
Problem: filters lost on every open-and-back; row navigation forces full
reloads (§7 F2). Evidence: F2 locations. Current: local `useState` +
`window.location.href`. Desired (incremental): (a) replace row/edit
`window.location.href` with SPA `router.push` (products `:224,:299`,
categories `:180,:185,:266`, editor `:116`); (b) persist list
search/filter/page in URL (`useSearchParams`) so back-navigation and
Save-return restore context. Risk: medium (touches navigation + dirty-guard
interaction — guard uses `router.push` paths; full-reload paths currently
rely on `beforeunload`). Scope: M. Backend: none. Migration: none. API
contract: none. Tests: URL-sync round-trip, guard still prompts on dirty
URL-nav, save-return restores filters. Recommendation: **IMPLEMENT in two
steps — (a) SPA navigation in 9.1, (b) URL-persisted filters in 9.3.**

### P2 — meaningful productivity improvements

**P2-1. Save & Continue for categories (extend to articles/services/projects
if proven).** Evidence §7 F4. Risk: low. Scope: S per entity. No backend/
migration/contract change. Tests: save-stay + refetch + dirty reset.
Recommendation: **IMPLEMENT for categories in 9.1; others after 9.2 lists.**

**P2-2. Dirty guard for article/service/project editors.** Evidence §7 F6.
Risk: low (adopt existing hook + comparison, no new mechanism). Scope: S.
Tests: hook-level + dirty-preserved-on-error. Recommendation: **IMPLEMENT
(9.2/9.3).**

**P2-3. Duplicate/clone product (+ category).** Evidence §7 F5 (zero hits).
Requires backend `POST .../duplicate` action (deep-copy row + translations
+ relations, new slug/SKU) + row/menu button. Risk: medium (backend write
path; slug/SKU uniqueness). Scope: M. Migration: none. Contract: additive
endpoint only. Tests: backend clone semantics + frontend button flow.
Recommendation: **IMPLEMENT as isolated 9.x slice after product lists
settle — highest repetitive-operation value.**

**P2-4. Media reuse picker (no DAM).** Evidence §7 F7. Requires: frontend
reuse-picker dialog over existing list endpoint (+ search/filter/pagination
wiring) AND a permission decision (list/delete currently `IsAdminUser`
while upload is `IsContentManager`). Risk: medium (permission surface +
picker UX). Scope: M. Migration: none. Contract: none (existing
endpoints). Tests: picker select-existing flow + permission matrix.
Recommendation: **PLAN in 9.x; implement only after permission decision is
explicitly approved. Admin media page search/pagination first (small).**

**P2-5. Dashboard as workflow hub.** Evidence `admin/page.tsx:1-62`
(counts only, zero links). Risk: low. Scope: S (shortcuts + recent items +
pending-action links, no new data). Tests: link presence + loading state.
Recommendation: **IMPLEMENT small version (shortcuts + recents) in 9.3.**

**P2-6. Category `page_size=200` truncation fix.** Evidence
`categories/page.tsx:43-51` vs `pagination.py:4-6` (`max_page_size=100`).
Risk: trivial. Scope: XS (cap to 100 or add pagination). Tests: param cap.
Recommendation: **IMPLEMENT in 9.1 (fold into P1-1 slice).**

### P3 — cosmetic/minor

**P3-1. Standardize list loading/empty/error states** on articles/services/
projects/users/contacts to `TableLoading`/`EmptyState`/`ErrorState`+retry.
Scope: S. **Implement opportunistically in 9.2.**

**P3-2. DataTable dead code:** adopt-or-remove decision; at minimum fix
hardcoded English (`data-table.tsx:63-74`). Scope: XS. **Implement in 9.x.**

**P3-3. SEO editing helpers** (copy title→seo/og, slug→canonical,
short→description; unify counters/`ROBOT_OPTIONS`). Scope: S. **Defer to
late 9.x; editorial, not blocking.**

**P3-4. Copy-fa translation helper** for article/service/project locale tabs
(no ar/en activation change). Scope: S. **Defer to late 9.x.**

**P3-5. Nav hygiene:** remove/ignore dead `adminNavItems` export, resolve
notifications duality, document `attributes` placeholder. Scope: XS.
**Implement opportunistically.**

**P3-6. Dirty-state visibility in save bars** (unsaved-changes badge using
existing `isDirty`, no interception change). Scope: XS. Safe incremental
piece of deferred item B. **Implement opportunistically.**

## 9. Deferred Items — Explicit Verdicts

- **A (list search): NO LONGER DEFERRED** — P1-1, worth fixing now via the
  shared 8.6 abstraction (§8).
- **B (Homepage dirty navigation): REMAINS DEFERRED except P3-6.**
  beforeunload + in-page guards suffice; sidebar/global-nav and browser-back
  interception would need fragile global history handling — explicitly
  rejected again. Only the zero-interception dirty badge (P3-6) is safe.
- **C (preview draft/versioning): REMAINS DEFERRED.** Saved-state preview
  covers the proven need; no evidence demands versioning. Article/service/
  project standalone previews: only if managers request them.
- **D (media): PARTIAL.** No DAM. Small steps only: media-page
  search/pagination (P2-4 sub-slice) → reuse picker pending an explicit
  permission decision.
- **E (repetitive ops): SELECTIVE.** Duplicate/clone (P2-3) and Save &
  Continue extension (P2-1) justified; bulk actions NOT justified (no
  evidence of bulk need; DataTable has no bulk props — inventing bulk UX
  would be architecture work).
- **F (list UX): PROCEED** as P1-1/P1-2/P1-3 + P3-1.

## 10. Explicitly NOT Worth Doing Yet

Draft/versioning/staging, scheduled publishing, approval workflows,
campaigns/banners, A/B content, full DAM, token revocation, per-field
permissions, new roles, Redux/Zustand, React Query replacement, routing
rewrite, form rewrites (ProductEditor/Homepage Studio/category forms),
bulk operations, cart/checkout/orders/payment, Hero3D/animation changes,
dependency changes, i18n activation (ar/en catalog), public redesign,
sitemap/robots changes for previews.

## 11. Recommended Next Phase

**Phase 9.1 — Admin list-efficiency slice (small, isolated, high daily value):**

1. P1-1 list-search debounce (products + product-categories) with
   picker-pattern integration tests.
2. P2-6 category `page_size` cap fix (same slice, same files).
3. P1-3(a) SPA navigation for row/edit links (remove `window.location.href`
   where the dirty guard covers the path; keep `beforeunload` semantics).
4. P2-1 Save & Continue for category new/edit.
5. Full regression (backend 163+, frontend 258+, tsc, lint, build, smoke).

Phase 9.2 then takes P1-2 (services/projects/articles lists) + P2-2 (their
dirty guards) + P3-1; Phase 9.3 takes P1-3(b) URL-persisted filters + P2-5
dashboard + P2-3 duplicate/clone proposal. P2-4 media reuse follows only
after the permission decision.

## 12. Risks / Notes

1. Shared-`.next` hazard (Phase 7.6) respected throughout: port 3000 was
   free (no dev running) before `npm run build`; no dev restart was needed
   afterward (no dev was running at session start — verified via netstat).
   Next session must still follow the canonical workflow.
2. P1-3(b) URL filters interact with the 8.3 dirty guard — implement (a)
   first and re-verify guard prompts before persisting state in URLs.
3. P2-4 touches permissions (`IsAdminUser` vs `IsContentManager` on media
   list/delete) — needs an explicit decision, not a drive-by change.
4. P2-3 duplicate needs slug/SKU uniqueness design before code.
5. No browser/AT walkthrough available; click-level and screen-reader
   verification for 9.x UI changes must be honestly marked NOT TESTED or
   covered operator-side, per precedent.
6. Test byproduct hygiene: this session's backend re-runs created untracked
   `AbrEnergy/media/**` UUID artifacts (same-suite phenomenon per 8.3–8.6);
   all were deleted — zero remain. No production data touched; no fixtures
   created (all probes were read-only GETs plus bogus-UUID shells).

## 13. STOP Condition

**STOP after this preflight report.** No Phase 9 feature work started, no
source modified, no migration added, no destructive DB/data operation
performed (explicit statement). Awaiting review before Phase 9.1.

(End of file)

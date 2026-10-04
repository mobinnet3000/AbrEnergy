# Phase 10 — Release Candidate / Pre-Delivery QA Audit Report

**Date:** 2026-09-24
**Mode:** AUDIT first. Source code wins over reports. No redesign, no new features, no destructive DB ops.
**Branch:** `master` (tracking `origin/master`), HEAD `342d1da HomePagePhase7Done`.

> Report-name mapping note: the Phase 10 brief references several report filenames that do not
> exist verbatim. Actual files read: `phase-07-cms-content-homepage-report.md` (≈ "phase-07-content-homepage"),
> `phase-08.5-error-mapping-report.md` (≈ "phase-08.5-cms-error-mapping"), `phase-09.1-list-efficiency-report.md`
> (≈ "phase-09.1-admin-list-efficiency"), `phase-09.2-content-lists-dirty-guards-report.md`
> (≈ "phase-09.2-admin-content-lists-dirty-guards"). All 19 existing reports under `docs/reports/` were read.

---

## 1. Baseline (stated up front per Phase 10 §2)

| Check | Result |
|---|---|
| Baseline git status | Dirty. HEAD `342d1da`; 49 modified + ~50 untracked files = uncommitted Phases 7→9.5 work. Pre-existing, not touched. Full list captured at audit start; end-state diff shows Phase 10 added modifications to exactly 3 files (see §8). |
| Backend test count | **212 passed** (`python -m pytest apps/`, test settings, `--reuse-db --nomigrations`) |
| Frontend test count | **51 files / 448 passed** (`npm run test`, vitest) |
| TypeScript status | **0 errors** (`npx tsc --noEmit`, before and after fixes) |
| Lint status | **0 errors, 55 warnings** (`npm run lint`; warnings pre-existing: unused imports, `<img>` vs `<Image>`, exhaustive-deps) |
| Migration status | **No changes detected** (`makemigrations --check --dry-run`; only a pre-existing django-ckeditor W001 warning) |
| Build status | **PASS** (`npm run build`, Next 15.5.21, canonical sequence, no dev server running). No vendor-chunk failure. |
| Dev server at start | Running on :3000 (PID 20056, not started by this phase). Stopped per canonical sequence before build. |
| Dev server at end | Exactly ONE dev server on :3000 (PID 11160), `/fa` = 200. `.next` deleted after prod smoke; `prod3100.log`/`dev3000.log` removed. |

---

## 2. QA coverage (Tracks A–N)

| Track | Method | Result |
|---|---|---|
| A — Public website | Dev + prod HTTP smoke (`/fa`, `/fa/products`, `/fa/products/categories`, `/sitemap.xml`, `/robots.txt`); source audit of metadata/sitemap/robots/layouts | All 200. 1 H1, slogan present, RTL present, no English UI strings, no preview URLs in sitemap. 3 findings (A-01 P2, A-02 P2, A-03 P3) + 1 note (A-04 P3). No published product/category fixture in DB scope → product-detail route verified via automated tests only (limitation documented). |
| B — Homepage CMS | Source audit of Studio page + 4 components + `homepage-form.ts` | Workflow intact; read-only/save/dirty/preview semantics correct. 2 findings (B-01 P2, B-05 P2) + 2 P3 notes. |
| C — Product CMS | Source audit of editor/media/docs/SEO/relations + `product-form.ts` + backend views | Gallery/docs/OG/Save&Continue/dirty/errors verified. 2 findings (C-01, C-02 P2) + 3 P3 notes. |
| D — Category CMS | Source audit of list/new/edit + backend `duplication.py` | Duplicate semantics match Phase 9.4 spec. 2 findings (D-01, D-02 P2) + 2 P3 notes. D-05 page-size fixed. |
| E — Articles/Services/Projects | Source audit of 3 lists + 6 editors | **1 P1: E-01** (content_manager 403 on services/projects vs permissive UI). Plus E-02/E-03 P2, deferred. |
| F — Media reuse | Source audit of picker/hook/backend + admin/media page | Matrix/mode/debounce/modal-local/reference-only verified. **F-01 P1 fixed** (stale field wiring on `admin/media`). |
| G — Preview | Source audit of token module, 3 consume views, 3 routes, 3 editors | Binding/expiry/rejection/no-store/noindex/banner/no-autosave verified. G-01 P2 = known locale-binding limitation (still exists, documented). |
| H — Duplicate/clone | Source audit of `duplication.py` + endpoints + list UX + backend tests (24) | Reset/copy/omit matrix verified for products and categories. 3 P3 robustness notes only. No persistent duplicates created (read-only audit). |
| I — Permissions | Source audit of `permissions.py`, all domain views, `admin-permissions.ts` | **1 P1: I-01** (same root cause as E-01). Backend authoritative; anonymous correctly denied. |
| J — Dirty/navigation | Source audit of guard hook + all consumers | Semantics hold; J-01 documents known sidebar/browser-back limitation. 1 P3 latent note (J-03). |
| K — Error handling | Source audit of `api-errors.ts` + all consumers | Normalizer intact, never `[object Object]`, secrets redacted. K-02 P2 = coverage gap (article/service/project editors use static toasts). |
| L — URL list state | Source audit of `admin-list-query.ts` + 5 lists | Persist/refresh/encoding/pager verified. **L-01 P2** (unknown params dropped despite code comment claiming preservation — fix deferred as loop-guard-adjacent). L-02 P2 (edit-return loses state). |
| M — Responsive/a11y/RTL | **No browser automation available — browser QA NOT performed.** Source-level: `fieldset disabled` + `role=note` read-only notice, `role=alert` error summaries, `role=status` preview banner, RTL pager, labels/disabled states present. | Limitation documented; no findings claimed beyond source level. |
| N — Security/technical | Source audit of sanitize, serializers, upload validation, CORS/CSRF, secrets, schema/docs, prod settings | **N-01 P1 fixed** (sanitizer allowed `javascript:`/`data:` URIs). N-02/N-03 P2, N-04 P3 notes. N-04a investigated and cleared (public detail pages are `'use client'`, sanitize runs client-side). |

---

## 3. Findings table

| ID | Severity | Area | Finding | Fixed? | Release impact |
|----|----------|------|---------|--------|----------------|
| N-01 | P1 | Sanitizer (XSS) | `ALLOWED_URI_REGEXP` permitted `javascript:`/`data:` URIs in all CMS HTML sinks | **YES** — allowlist regex tightened, 11-case node check green | Was a blocker; closed |
| F-01 | P1 | `admin/media` page | Read legacy `{file,name,size}`; backend ships `{url,original_name,file_size}` → broken previews/names/sizes | **YES** — field wiring with legacy fallbacks | Was a blocker; closed |
| E-01/I-01 | P1 | Services/Projects perms | `content_manager` sees Create/Edit UI but backend `IsAdminUser` → 403 on save (`service.py:25-28,54-57`, `project.py:24-27,61-64`) | NO — permission-model decision, out of scope | **BLOCKER — open** |
| D-05 | P3 | Product editor | Attribute defs fetched `page_size:200`, backend max is 100 (silent truncation past 100) | **YES** — set to `'100'` (Phase 9.1 convention) | Closed |
| A-01 | P2 | Public SEO | ~7 static routes (about/services/projects/articles/gallery/calculator/contact) are client-only with no `generateMetadata` (no canonical/OG) | NO — scope (needs server-metadata work) | Known gap |
| A-02 | P2 | Root metadata | `app/layout.tsx` title/description hardcoded English; inherited by routes without own metadata | NO — same scope as A-01 | Known gap |
| N-02 | P2 | Sanitizer tags | `<h1>` allowed in CMS HTML → can break single-H1 posture | NO — changing tags alters existing rendering | Backlog |
| N-03 | P2 | API docs | `/api/schema|docs|redoc/` ungated, prod does not disable | NO — config decision | Backlog |
| G-01 | P2 | Preview locale | Token `loc` issued but no HTTP view passes `expected_locale`; fa hardcode masks it (`homepage.py:137`, `products.py:354,395`) | NO — token-architecture change | Known limitation (from 8.1) |
| C-01 | P2 | Product docs | Per-row uploader discards successful re-upload (`product-documents-manager.tsx:88-93`) — must delete + re-add | NO — behavior change, needs UX decision | Backlog |
| C-02 | P2 | Product SEO errors | `ProductSeoFields` takes no errors; SEO keys missing from `SECTION_FOR_FIELD` → SEO errors surface under Identity | NO — small but cross-file wiring; deferred for batch | Backlog |
| D-01 | P2 | Categories | Parent dropdowns/filter top-level-only (`!parent`) → no 3-level nesting from CMS | NO — data-model UX decision | Backlog |
| D-02 | P2 | Category list | Single `page_size=100` fetch, no pager, silent truncation, count shows fetched-only | NO — redesign-adjacent | Backlog |
| B-01 | P2 | Homepage preview | Preview locale hardcoded `'fa'`, ignores studio locale (`content/homepage/page.tsx:299-300`) | NO — tied to G-01 | Backlog |
| B-05 | P2 | Homepage dirty | `JSON.stringify` key-order comparison (stable today, fragile) | NO — working; replacement is redesign | Backlog |
| E-02 | P2 | Services/Projects | No media-reuse cover controls (deferred slice) | NO — explicitly deferred in 9.5 | Deferred |
| E-03/K-02 | P2 | Editors errors | Article/service/project editors use static toasts, bypass `normalizeApiError` (no `[object Object]`, but detail lost) | NO — 6-file rollout, deferred batch | Backlog |
| L-01 | P2 | URL state | Unknown query params dropped on commit despite comment "ignored, never dropped" (`articles/page.tsx:91-96` pattern ×5) | NO — loop-guard-adjacent, needs careful design | Known gap |
| L-02 | P2 | URL state | Edit links/post-save pushes carry no query → return lands on default list | NO — cross-page contract, deferred | Backlog |
| C-03 | P3 | Docs validation | `ProductDocument.clean()` checks only `file_type`; safe in practice (upload path enforces `%PDF-`), hardening note | NO | Backlog |
| C-04 | P3 | Pickers | Single-mode pickers omit `selectedIds` → current OG/cover never highlighted | NO | Backlog |
| C-05 | P3 | Gallery order | `productToForm` sorts cover-first for display without changing `sort_order` → apparent reorder instability | NO | Backlog |
| D-03/D-04 | P3 | Category UX | Duplicate slug hint; raw `?parent=` seeded without validation | NO | Backlog |
| B-02/B-03/B-04 | P3 | Homepage pickers | String `'10'` page sizes; services/categories pickers filter client-side, not server search | NO | Backlog |
| J-01 | P2-doc | Dirty guard | Sidebar/top-shell + browser-back unguarded (App Router constraint, known since 8.3) | NO — architecture-excluded | Known limitation |
| J-03 | P3 | Dirty guard | Article/project editors navigate via raw `router.push` without `navigateAfterSave` (safe today, fragile) | NO | Backlog |
| A-03 | P3 | robots | No `/preview/*` disallow (defense-in-depth; per-page noindex holds) | NO | Backlog |
| A-04 | P3 | Locale layout | `lang/dir` fixed fa+localStorage script; ar/en prefix never changes document lang server-side (`activeLocales=['fa']` so dormant) | NO | Backlog |
| H-01/H-02/H-03 | P3 | Duplicate | Wasteful retry-walk under contention; empty-title yields suffix-only title; list-wide clone serialization (backend safe) | NO | Backlog |
| T-01 | P3 | Test hygiene | Backend media/upload tests write into the tracked `AbrEnergy/media/` dir (258 tracked files); this phase's run added 129 untracked files, all removed (see §7) | Partial — own residue removed | Housekeeping |
| S-01 | P3-note | Sitemap env | `<loc>` uses `http://localhost:3000` (env `siteUrl` default); prod deploy must set site URL env | NO — env config, not code | Deploy checklist |

**P0 findings: none.**

---

## 4. Fixed During Phase 10 (exactly 3 files)

1. **`abr-energy-frontend/src/lib/sanitize.ts`** (N-01, P1): replaced the permissive
   `ALLOWED_URI_REGEXP` with a strict allowlist
   `/^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i`.
   Verified with an 11-case node check: `https/http/mailto/tel`/relative/`#anchor` pass;
   `javascript:` (incl. mixed-case), `data:`, `vbscript:`, `file:` rejected.
2. **`abr-energy-frontend/src/app/[locale]/admin/media/page.tsx`** (F-01, P1): reads Phase 9.5
   serializer shape (`url`/`original_name`/`file_size`) with legacy (`file`/`name`/`size`) fallbacks;
   added missing `alt`. No redesign of `admin/media`.
3. **`abr-energy-frontend/src/components/products/product-editor.tsx`** (D-05, P3):
   attribute-definitions fetch `page_size: '200'` → `'100'` (backend `StandardPagination.max_page_size=100`;
   Phase 9.1 convention). No other change to the file (remainder of its diff is pre-existing Phases 8–9 work).

Post-fix: `tsc` 0 errors, `eslint` on touched files 0 errors (2 pre-existing warnings),
full frontend suite **448/448**, backend suite untouched by the fixes (frontend-only changes).

---

## 5. Deferred / Out of Scope (documented, not implemented)

- E-01/I-01 permission alignment (needs a role-model decision: widen services/projects to
  `IsContentManager` vs gate UI for `content_manager`). **This is the release blocker.**
- A-01/A-02 server metadata for static routes; N-02 tag policy; N-03 docs gating.
- L-01/L-02 URL-state contracts (router loop-guard design area — do not touch without a dedicated phase).
- C-01/C-02/C-04/C-05, D-01/D-02/D-03/D-04, B-01/B-05, E-02/E-03, J-03, H-01–H-03 (backlog P2/P3).
- G-01 locale binding (known 8.1 limitation, token-architecture change).
- Anything in the NOT-allowed list: cart/checkout/orders, versioning/DAM, i18n activation (ar/en stay
  dormant, `activeLocales=['fa']`), animation/Three rewrite, dependency upgrades, destructive DB ops.

---

## 6. Runtime Status (canonical sequence observed)

1. Dev (:3000, PID 20056, foreign) → stopped; port verified free.
2. `npm run build` → **PASS**, all routes compiled (public/admin/preview), no vendor-chunk error.
3. `next start -p 3100` → smoke **11/11 HTTP 200**: `/fa`, `/fa/products`,
   `/fa/products/categories`, `/fa/admin`, `/fa/admin/products`, `/fa/admin/products/categories`,
   `/fa/admin/products/new`, `/fa/admin/articles/new`, `/fa/admin/content/homepage`,
   `/sitemap.xml`, `/robots.txt`.
4. Prod `/fa`: exactly 1 `<h1>`, slogan `«طلوع آفتاب، از خانه شماست»` present, no `vendor-chunks`
   markers. Sitemap: 9 static fa URLs, **zero preview/admin URLs** (catalog entries absent because the
   Django backend was not running — graceful degradation per `catalog-sitemap.ts` design, not a defect).
   Robots: admin/dashboard/auth disallows + sitemap pointer, as designed.
5. Prod stopped; **only `.next` deleted**; log files removed; exactly ONE dev server restarted
   (PID 11160); `/fa` = 200, 1 H1, slogan present. No duplicate Next processes.
6. Preview-route runtime exercise: no valid token fixture minted (would require authenticated issuance
   against a live backend); preview verified via code + backend token tests (20 tests in
   `test_phase81_preview.py`, all passing) + frontend `preview.test.ts` (14 tests).

---

## 7. Test Status

- Backend: **212/212 passed** (incl. 28 phase-7 homepage, 20 phase-8.1 preview, 25 phase-9.5 media,
  24 phase-9.4 duplicate). No test was weakened or deleted.
- Frontend: **448/448 across 51 files** (before and after Phase 10 fixes).
- `tsc --noEmit`: clean. `eslint`: 0 errors / 55 pre-existing warnings.
- `makemigrations --check`: no changes detected.

---

## 8. Git Status

- **A. Pre-existing changes** (untouched): HEAD `342d1da` + 49 modified / ~50 untracked files from
  Phases 7→9.5 (incl. 258 *tracked* seed media files under `AbrEnergy/media/`). Nothing reverted, nothing committed.
- **B. Phase 10 changes** (3 files): `src/lib/sanitize.ts`, `src/app/[locale]/admin/media/page.tsx`
  (both newly modified by this phase), `src/components/products/product-editor.tsx` (1-line change on top
  of pre-existing modification).
- **C. Generated artifacts**: `.next/` rebuilt then deleted (absent, as at phase start); `prod3100.log` /
  `dev3000.log` removed; 129 test-upload files created under `AbrEnergy/media/` by this phase's pytest run
  were identified by timestamp and **deleted** — `git status` confirms zero media residue. No commit made.

---

## 9. Data-Safety Confirmation

No flush/reset/drop/delete of any database or content; no destructive migration; no rewrite of existing
content; no fake production content seeded. Only backend operation was read-only-safe `pytest` on the test
settings path; its 129-file upload residue was removed immediately. Duplicate/preview/media tests relied on
isolated backend tests, never on real dev data. Real `AbrEnergy/media/` content untouched (verified via
`git status`: clean).

---

## 10. Known Limitations

- No browser automation → responsive/a11y/keyboard/focus/overflow verified at source level only (Track M).
- No published product/category fixture in reachable DB scope → product-detail public route covered by
  automated tests, not live HTTP.
- Django backend not running during prod smoke → catalog sitemap entries and API-backed interactions
  degrade gracefully (by design); live authenticated CMS flows (save/duplicate/preview issuance) were
  audited statically, not click-tested.
- Reports vs source: several brief-referenced filenames differ from actual files (§0); source won everywhere.

---

## 11. Release Assessment

### NOT RELEASE READY — P0/P1 FINDINGS

One open P1 blocks release: **E-01/I-01** — the `content_manager` role is offered Create/Edit UI for
services and projects but receives backend 403 on save. Shipped as-is, an entire CMS role's workflow is
broken for two content types. The fix is a role-model decision (widen backend gates vs gate the UI) and is
explicitly out of Phase 10 scope, so it is documented, not implemented.

Two P1s found during this audit were fixed and verified (N-01 sanitizer XSS, F-01 admin/media wiring);
no P0 (data-loss/security-catastrophe) findings exist. Everything else is P2/P3 with no release-blocking
character. Once E-01 is resolved by an explicit follow-up decision, the candidate is otherwise shippable
modulo the known limitations above.

---

## 12. Verified (no defect)

Public filters enforced; preview token binding/expiry/rejection/no-store/noindex/banner/no-autosave;
duplicate reset/copy/omit matrix (products + categories, source unchanged); media picker permissions
(manager list/retrieve, admin-only delete), mode gating, debounce, modal-local staging, reference-only
reuse; dirty only-after-edit, save clears, fail preserves; normalizer intact where wired; URL persist for
5 lists (refresh-safe, encoded, pager via push); sitemap/robots correct; build + prod + dev runtime green;
212 backend / 448 frontend tests green; zero migration drift.

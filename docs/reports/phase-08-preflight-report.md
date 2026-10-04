# Phase 8.0 — Preflight Report

Date: 2026-09-22. Scope: preflight ONLY. No source file was changed in this
phase. All four prerequisite reports were read before any action:

1. `docs/reports/phase-06.1-runtime-recovery-report.md`
2. `docs/reports/phase-07-cms-content-homepage-report.md`
3. `docs/reports/phase-07.5-cms-acceptance-audit-report.md`
4. `docs/reports/phase-07.6-three-runtime-recovery-report.md`

Phase 7.6 is COMPLETE and ACCEPTED and remains the baseline. The procedural
Next.js runtime rule from Phase 7.6 was followed verbatim in this preflight:
no `next dev` was running at any point, so `npm run build` and the
production probe were safe against the shared-`.next` hazard. Port 3000 was
verified free before building.

---

## 1. Current Git State

- Branch: `master`, in sync with `origin/master` (`## master...origin/master`,
  no ahead/behind markers).
- HEAD: `342d1da98613dc7260b4ecf3cd00bf6048cac923`
  (`342d1da HomePagePhase7Done` — same commit as the Phase 7.5/7.6 baseline).
- Modified (unstaged, pre-existing): exactly 4 files, byte-identical in scope
  to the Phase 7.5 accepted fixes (`git diff --stat`: 129 insertions,
  2 deletions):
  - `AbrEnergy/apps/homepage/api/v1/serializers/homepage.py` (+41 — BUG-01
    `_validate_relation_ids` + five `validate_*_data` methods, HTTP 400
    instead of 500 on stale/duplicate relation UUIDs).
  - `AbrEnergy/apps/homepage/tests/test_phase7.py` (+66 —
    `RelationValidationTest`, 4 regression tests).
  - `abr-energy-frontend/src/lib/homepage-form.ts` (+10/− — BUG-02 envelope
    unwrap in `mapHomepageErrors`).
  - `abr-energy-frontend/src/lib/homepage-form.test.ts` (+14 — envelope test).
- Staged: none.
- Untracked reports: exactly 2 —
  `docs/reports/phase-07.5-cms-acceptance-audit-report.md` (pre-existing from
  the Phase 7.5 session) and
  `docs/reports/phase-07.6-three-runtime-recovery-report.md` (the only NEW
  untracked file since Phase 7.5, expected).
- Verification outcome: the 4 modified files are still the only pre-existing
  source modifications; the Phase 7.6 report is the only new untracked
  report; no unrelated work is present. Preflight item 5/6/7: PASS.

## 2. Baseline Test Counts (re-run live in this preflight)

| Suite | Result | Baseline match |
|---|---|---|
| Backend `python -m pytest apps/` (`AbrEnergy/`) | **143 passed** (4.06 s) | exact (Phase 7.5/7.6) |
| Frontend `npm run test` (`vitest run`) | **174 passed / 25 files** (21.93 s) | exact |
| `tsc --noEmit` (`npx tsc --noEmit`) | **EXIT 0, 0 errors** | exact |
| `npm run lint` | **0 errors, 55 warnings** | exact (count identical) |
| `npm run build` | **success** (full route table, sitemap emitted) | exact |
| Production probe `next start -p 3100`, `GET /fa` | **200** (75,479 bytes) | matches Phase 7.6 prod shape |

No test was added, skipped, weakened, or re-counted. The production probe
server was stopped afterwards and port 3100 verified free. Django runserver
on :8000 (PID 15292, pre-existing) was never touched. No `next dev` instance
was started; no `.next` corruption occurred (build ran with port 3000 free).

## 3. Relevant CMS Routes

| Route | File | Guard |
|---|---|---|
| `/admin/content/homepage` (Homepage Studio) | `abr-energy-frontend/src/app/[locale]/admin/content/homepage/page.tsx` | admin shell (`MANAGER_ROLES`); write buttons additionally gated by `canManageHomepage` (frontend only; backend authoritative) |
| `/admin/products/...` (Product Editor) | `src/components/products/product-editor.tsx` + category new/edit pages | same shell + product permission helpers |
| Sidebar entry `admin.homepage` | `src/config/navigation.ts:64` (first under `admin.nav_content`), icon mapped in `admin/layout.tsx:33` | per-item role filter `canViewAdminItem` |

## 4. Relevant Homepage API Routes

Mounted in `AbrEnergy/config/api_v1.py`:

| Method | URL | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/homepage/` | `AllowAny` (`HomepagePublicView`) | composed public payload: `hero, sections, featured_products, categories, services, calculator, projects, articles, contact, visuals, seo` |
| GET | `/api/v1/admin/homepage/` | `IsContentManager` (`HomepageAdminView`) | Studio read |
| PUT/PATCH | `/api/v1/admin/homepage/` | `IsContentManager` (`HomepageAdminView` + `HomepageWriteSerializer`) | Studio write (scalar fields + `sections_data` partial updates + full-replace `*_data` relations + `visuals_data`, `@transaction.atomic`) |

Anonymous admin access → 401 (live-verified in Phase 7.5); customer/engineer
→ 403 (tested). Public read → 200 (live-verified in this preflight's
environment via the running Django :8000 heritage and the Phase 7.6 probes).

## 5. Current Authentication / Permission Model

Backend-authoritative (`apps/users/api/v1/permissions.py`):

- `IsContentManager` = `super_admin`, `website_admin`, `content_manager`.
- Roles in the system: super_admin / website_admin / content_manager /
  engineer / customer. No viewer role exists; `IsOwner` is untouched/dead.
- Homepage Studio read+write uses `IsContentManager` — the same gate as the
  product/category admin APIs. No per-field permission split (Phases 2–4
  convention, unchanged).
- Frontend `canManageHomepage` (`src/lib/admin-permissions.ts:25`) mirrors
  the same role set for button-gating and toasts only. Engineer/customer/
  anonymous gain nothing from the frontend helper.

Preview-relevant consequence (feeds Phase 8.1 design): any preview mechanism
MUST reuse `IsContentManager` (or an equivalent check against the same role
set) and MUST NOT create a new role.

## 6. Current Draft / Published / Public Behavior

No draft system exists. Publication semantics are per-entity, enforced in
the composer/serializers — NOT in a shared draft table:

- Products: `public_product_qs()` (published + public + active). Studio
  picker searches the **public** products endpoint, so drafts cannot even be
  staged (safe default, Phase 7.5 §11).
- Categories: `is_active=True` filter (`serializers/homepage.py:126`).
- Services: `status=active` applied locally in the composer (the standalone
  public services endpoint itself is unfiltered `.all()` — deliberately
  untouched; `serializers/homepage.py` applies the filter).
- Projects: `exclude(status="cancelled")` (`serializers/homepage.py:158`);
  the model has no draft/hidden state.
- Articles: `status=published`; pinned `HomepageArticle` rows render first,
  remainder fills with latest published up to `articles_count` (0–12,
  validated both ends).
- Homepage sections: `HomepageSection.enabled` flag per key (8 keys);
  disabled → section returns `null`. `HomepageVisual.enabled` likewise.
- `HomepageConfig` is a singleton (pk=1); there is no versioning, no staging
  copy, no scheduled publishing.
- SEO: CMS-first with static Persian fallback; sitemap (`src/app/sitemap.ts`)
  and robots are static files, untouched by CMS content, both 200.
- Sanitization/media: Phase 1/2 enforcement unchanged (MIME + Pillow + 10 MB
  images, `%PDF-` + 25 MB PDFs, SVG blocked, `IsContentManager` upload); no
  `dangerouslySetInnerHTML` in any home component.

Implication for Phase 8.1: the smallest additive preview is a signed,
purpose-bound token granting an `IsContentManager`-authorized caller a
preview rendering that bypasses the *above* public filters ONLY inside an
explicit preview path — never on the normal public routes, sitemap, or SEO
metadata.

## 7. Current Form / Dirty-Guard Behavior

- Homepage Studio (`admin/content/homepage/page.tsx:131-138`): `isDirty` via
  `JSON.stringify(initial) !== JSON.stringify(merged)` comparison;
  `beforeunload` listener only. In-app navigation (`router.push('/admin')`
  on Save/Cancel) is UNGUARDED (Phase 7.5 BUG-04, P3, deferred to Phase 8.3).
- Product Editor (`components/products/product-editor.tsx:90`) and category
  new/edit pages: same `beforeunload`-only pattern (shared convention).
- Save flows: `onSave('save')` → PATCH + toast + `setEdits({})` + navigate to
  `/admin`; `onSave('continue')` → PATCH + toast + `setEdits({})` + refetch.
  Edits are retained on error (retry-safe).
- Dirty-state infrastructure to reuse: the existing `initial + edits` merge
  + `isDirty` boolean per form; no router-level guard abstraction exists yet.

## 8. Exact Files Likely To Change (Phase 8, by sub-phase)

- 8.1/8.2 (preview architecture + UX): NEW backend preview module under
  `AbrEnergy/apps/homepage/` (token issue/verify helpers + preview-capable
  read path reusing `build_homepage_payload` filters); `config/api_v1.py`
  mounts (preview-only); NEW frontend preview route reusing
  `homepage-client.tsx` + public sections; `src/api/index.ts`,
  `src/hooks/use-api.ts`, `src/types/index.ts` additions; Studio Preview
  button wiring in `admin/content/homepage/page.tsx`. Product/category
  preview reuses existing public catalog components.
- 8.3 (dirty guard): `admin/content/homepage/page.tsx`, `product-editor.tsx`,
  category new/edit pages; possibly one small shared guard hook (no large
  routing abstraction).
- 8.4 (read-only UX): Studio/editor inputs (`disabled`/`readOnly` +
  styles) in the same three forms; no backend change expected.
- 8.5 (nested errors): `src/lib/homepage-form.ts` (`mapHomepageErrors`) +
  product/category error mappers; `homepage-form.test.ts` additions.
- 8.6 (picker debounce): `src/components/homepage/homepage-relation-picker.tsx`
  (+ shared debounce helper); product/category/service/project/article picker
  call sites in the Studio page; focused tests.
- 8.7/8.8 (security/SEO): preview `noindex` headers, sitemap exclusion
  (static sitemap already excludes CMS/preview — verify), regression tests
  `apps/homepage/tests/` + frontend suites.

Explicitly NOT changing: `Hero3D.tsx`, R3F/Drei/Three versions,
`next.config.ts`, dependency versions, database credentials/content,
homepage animation components, i18n activation, cart/checkout/orders/payment.

## 9. Risks

1. Shared-`.next` procedural hazard (Phase 7.6): any `npm run build` while
   `next dev` is live corrupts dev vendor-chunks. Mitigation: canonical
   workflow only (stop dev → verify port free → build → prod probe on a
   separate port → stop prod → `Remove-Item .next` → start dev → verify).
   This preflight followed it; Phase 8.9 must repeat it.
2. Preview filter-bypass leakage: the biggest design risk is accidentally
   weakening the normal public filters. Mitigation: preview path must be a
   strictly additive, token-gated branch; normal public view/serializer
   code paths stay byte-identical; regression tests assert public routes
   ignore preview tokens.
3. App-Router navigation guard (8.3) may fight Next.js routing semantics;
   keep it minimal and form-local, reusing existing `isDirty` state.
4. No browser automation is known-available in this environment; client-side
   WebGL/interaction QA may have to be honestly marked NOT TESTED (per the
   Phase 7.5/7.6 precedent — never claim SSR HTML proves rendering).
5. Scope creep into redesign/i18n/cart/scheduling: forbidden by phase rules;
   any apparent necessity must STOP and be documented first.

## 10. Phase 8 Start Statement

**Preflight is complete. All unexpected-change checks passed (4 modified
files = the accepted Phase 7.5 fixes; only the Phase 7.6 report is new and
untracked; no unrelated work). Baselines re-verified live: backend 143,
frontend 174/25, tsc 0 errors, lint 0 errors / 55 warnings, production build
success, prod `/fa` 200. Phase 8 work may now start incrementally from this
report, following the constraints in §§8–9.**

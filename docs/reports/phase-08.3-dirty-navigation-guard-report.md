# Phase 8.3 — CMS Dirty Navigation Guard Report

Date: 2026-09-22. Scope: dirty-navigation guard ONLY (audit + reusable
guard + integration into existing dirty forms + focused tests +
verification + STOP). No read-only UX (8.4), no error mapping (8.5), no
picker debounce (8.6), no preview change, no token change, no
draft/versioning/autosave, no architecture change, no redesign, no
Hero3D/Three.js change, no i18n activation, no dependency change, no
database change, no Phase 9 work. All seven prerequisite reports were
read before any change: `phase-08-preflight-report.md`,
`phase-08.1-preview-architecture-report.md`,
`phase-08.2-product-category-preview-report.md`,
`phase-07.5-cms-acceptance-audit-report.md`,
`phase-07-cms-content-homepage-report.md`,
`phase-07.6-three-runtime-recovery-report.md`,
`phase-06.1-runtime-recovery-report.md`. Phase 8.2 is COMPLETE and
ACCEPTED and remains the baseline.

---

## 1. Executive Summary

**Status: COMPLETE.** The P3 BUG-04 gap ("in-app navigation dirty guard
gap") is closed for every CMS form that owns a real dirty state, with no
second dirty-state system and no global router hack. One new reusable
hook (`useDirtyNavigationGuard`) consumes each form's EXISTING `isDirty`
boolean and provides (a) `beforeunload` protection armed only while
dirty and (b) a single Stay/Leave confirmation for in-page SPA
navigation (breadcrumbs, back links, Cancel buttons, guarded
`router.push`). Save-success navigations bypass the prompt via an
explicit path (never by toggling dirty); failed saves preserve dirty by
construction. Suites: backend **163 passed** (unchanged), frontend
**202 passed / 27 files** (188/26 baseline intact + 14 new), `tsc`
0 errors, `lint` 0 errors / 55 warnings (identical count), production
build success, prod + dev smoke probes all 200.

## 2. Scope

IN SCOPE (all done): dirty-state audit (§4), reusable guard hook (§7),
integration into Homepage Studio / Product Editor (create+edit) /
Category edit / Category new (§5), beforeunload preservation (§8),
localized Stay/Leave confirmation reusing the existing `ConfirmDialog`
(§10), dirty-reset on Save & Continue where the latch previously stuck
(§11), focused tests (§13), runtime verification (§14), this report.

OUT OF SCOPE (none started): 8.4 read-only UX, 8.5 nested error
mapping, 8.6 picker debounce, preview/token/draft/versioning/autosave/
scheduling, permissions redesign, SEO rewrite, redesign, animation or
Three.js work, i18n activation, dependency or database changes,
Phase 9.

## 3. Baseline

Session-start `git status --short` / `git diff --stat` recorded the
accepted 8.2 end state (backend preview endpoints + homepage/product/
category preview routes intact). Backend 163 / frontend 188/26
re-verified green before changes. Next 15.5.21 (App Router — no
`router.events` API exists, confirmed by version + code audit; no Pages
Router pattern was introduced).

## 4. Existing Dirty-State Architecture (audit findings)

ONE source of truth per form — reused, not replaced. No
`globalDirtyState`, store, context, localStorage, or autosave was
created.

| Form | Dirty source | beforeunload (before) | Reset on save | Failure retains |
|---|---|---|---|---|
| Homepage Studio (`admin/content/homepage/page.tsx:130`) | `JSON.stringify(form) !== JSON.stringify(initial)` over `initial + edits` merge | only when dirty ✓ | `setEdits({})` on success (save + continue) ✓ | edits kept ✓ |
| ProductEditor (`components/products/product-editor.tsx:83`, shared by create + edit) | boolean latch (`setDirty(true)` on any `set()`) | only when dirty ✓ | **NEVER reset** (stuck true after Save & Continue — fixed §11) | kept ✓ |
| Category edit (`categories/[id]/edit/page.tsx`) | inline `JSON.stringify` compare inside the handler | **always attached, even when clean** (fixed §8) | n/a (navigates away on success) | kept ✓ |
| Category new (`categories/new/page.tsx:69`) | boolean latch | only when dirty ✓ | n/a (navigates away on success) | kept ✓ |
| Article new/edit, Service new/edit, Project new/edit | NO dirty state, NO beforeunload (`edits` tracked, never compared) | none | n/a | n/a — OUT of scope per rule "do not invent isDirty" (§20.1) |

Navigation mechanisms found: `router.push` (all dirty pages: Cancel +
save-success redirects), `<Link>` breadcrumbs/back links (all dirty
pages), `window.location.href` (ProductEditor Cancel + list-page actions
— full reload, so `beforeunload` DOES fire natively there), `window.open`
new tab (Preview buttons — no navigation away, intentionally unguarded).
`router.replace`/`router.back` are NOT used in any dirty page (only in
`admin/layout.tsx` auth redirects + logout — outside dirty context).

## 5. Affected CMS Forms/Routes (integrated)

- `/admin/content/homepage` — breadcrumb Link, Cancel guarded;
  save-success navigates via bypass; Save & Continue refetches (existing
  `setEdits({})` reset kept).
- `/admin/products/new` + `/admin/products/[id]/edit` (via shared
  `ProductEditor`) — back Link + Cancel guarded; edit page bumps
  `dirtyResetSignal` on Save & Continue success (§11).
- `/admin/products/categories/[id]/edit` — two breadcrumb Links + back
  Link + Cancel guarded; save/delete-success navigations run directly
  (save = clean, delete = intentional discard of a deleted entity).
- `/admin/products/categories/new` — back Link + Cancel guarded;
  create-success navigates directly.

## 6. Navigation Surfaces Audited

| Surface | Verdict |
|---|---|
| `beforeunload` (refresh/tab close/full reload) | Guarded everywhere dirty state exists (hook-owned, §8) |
| Breadcrumb `<Link>` inside dirty pages | Intercepted via `guardLinkClick` (preventDefault → dialog → `router.push` on Leave) |
| Back links inside dirty pages | Same interception |
| Cancel buttons | Routed through `requestNavigation` |
| `router.push` Cancel/save redirects | Cancel guarded; save-success via `navigateAfterSave` bypass |
| Preview buttons (`window.open` new tab) | Intentionally unguarded — previews saved state, never navigates away |
| Sidebar / top-shell links (`admin/layout.tsx`) | NOT intercepted — outside the dirty page; App Router offers no interception API; per STOP rules no global hack was introduced (§20.2) |
| Browser back button / `popstate` | NOT intercepted — would require `pushState` loops; documented instead of shipped fragile (§20.3) |
| `window.location.href` Cancel (ProductEditor) | Guarded when dirty (dialog; Leave performs the same full-reload navigation); when clean, direct as before |

## 7. Guard Architecture

New `src/hooks/use-dirty-navigation-guard.ts`
(`useDirtyNavigationGuard({ isDirty })`):

- Consumes the form's existing boolean; creates no state of its own
  except ONE pending navigation slot + dialog open flag.
- `requestNavigation(href, navigate)` — clean → `navigate()`
  immediately; dirty → stores `{ href, navigate }` and opens the dialog.
- `guardLinkClick(e, href, navigate)` — clean → untouched default Link
  behavior; dirty → `preventDefault()` + same pending slot.
- `confirmLeave()` — runs the stored `navigate` exactly once, clears.
- `confirmStay()` / `handleDialogOpenChange(false)` — discards pending
  (dismiss == Stay).
- `navigateAfterSave(navigate)` — explicit bypass for post-save/delete
  navigations; never reads `isDirty`, so it is safe from stale
  pre-save closures (the form already reset its own dirty state).
- Duplicate policy (deterministic, documented in code): rapid
  successive requests while the dialog is open REPLACE the pending
  slot — last wins, never queued, never duplicated; Stay discards
  whatever is pending.
- No `Router.events`, no monkey-patched router, no history
  manipulation, no global wrapper — form-local only.

Two navigation-adjacent bugs fixed as explicitly permitted (§10 allows
fixes "specifically related to navigation"):

1. Category-edit `beforeunload` was attached even on a clean form —
   replaced by the hook (armed only while dirty).
2. ProductEditor dirty latch never reset after Save & Continue —
   `dirtyResetSignal` prop (bumped by the edit page on continue-success
   only) clears the latch via render-phase adjustment; failed saves
   never bump it, so dirty is preserved on error.

## 8. beforeunload Behavior

Preserved everywhere, owned by the hook: exactly one listener, added
only when `isDirty === true`, removed on save-reset and on unmount
(tested §13). Native browser confirmation continues to cover refresh,
tab close, and full-reload navigations (including ProductEditor's
`window.location.href` Cancel path). Internal SPA navigation does not
fire `beforeunload` (unchanged platform behavior) — that half is covered
by the dialog (§5–§6).

## 9. Internal Navigation Behavior

`isDirty = false` → navigation proceeds normally (zero added clicks:
`requestNavigation` calls through; `guardLinkClick` returns without
preventing default). `isDirty = true` → single confirmation. Leave →
originally requested destination runs exactly once (stored closure, not
a reconstructed URL — no form content is ever placed in navigation
state). Stay → cancelled, user remains on the form with edits intact.
Save / Save & Continue / Preview / delete-success navigations never
prompt. Same-route clicks are not special-cased (no `router.back` or
same-route programmatic navigation exists in these pages).

## 10. Confirmation UX

Reuses the existing `ConfirmDialog` (Radix `Dialog` primitive: focus
management, keyboard accessible, dismiss == Stay) with `variant="default"`
(non-destructive semantics). No `confirm()` anywhere. Localized via
existing conventions: message reuses the pre-existing (previously
unused) `admin.unsaved_changes` key; three new keys added with fa/ar/en
parity — `admin.unsaved_changes_title` ("تغییرات ذخیره‌نشده" /
"تغييرات غير محفوظة" / "Unsaved changes"),
`admin.unsaved_changes_stay` ("ماندن" / "البقاء" / "Stay"),
`admin.unsaved_changes_leave` ("ترک صفحه" / "مغادرة الصفحة" / "Leave").
No locale activated, no other locale file touched.

## 11. Save/Reset Semantics (verified)

Initial load → clean (all four forms). Field edit → dirty. Save success
→ clean (Homepage `setEdits({})`; Product create navigates away;
Category create/edit navigate away; Product edit+continue via
`dirtyResetSignal`). Save failure → dirty preserved (error branches
never clear edits/latch; no signal bump). Preview → never touches dirty
state (`window.open`, no save, no reset). No auto-save before navigation
anywhere.

## 12. Router/Link/History Behavior

Next 15 App Router: no interception API exists, so interception is done
at the call site (the only safe granularity). `router.push` Cancel paths
are guarded; save/delete redirects intentionally bypass. `<Link>`
breadcrumb/back navigations are intercepted via `onClick` guards scoped
to the dirty page — no application-wide Link replacement. No
`pushState`/`popstate` handling (history loops explicitly rejected per
STOP rules). Sidebar/top-nav and browser-back remain unguarded by
design; see §20.2–20.3.

## 13. Tests

New `src/hooks/use-dirty-navigation-guard.test.ts` — **14 tests, all
green** (jsdom + `@testing-library/react` `renderHook`, following the
existing `confirm-dialog.test.tsx` pattern):

1. clean form navigates immediately, no dialog
2. dirty form holds navigation + opens dialog with destination preserved
3. Stay cancels + closes + clears pending
4. dialog dismiss behaves as Stay
5. Leave runs the requested destination exactly once
6. duplicate rapid attempts → one dialog, last destination wins
7. save-success bypass navigates immediately even when dirty
8. dirty reset (simulated save) lets the next navigation proceed clean
9. clean Link click untouched (no preventDefault)
10. dirty Link click intercepted into the single dialog
11. no beforeunload listener while clean
12. exactly one listener while dirty; removed on save-reset
13. listener removed on unmount while dirty (no leak)
14. fa/ar/en parity for all four locale keys

Not separately unit-tested (documented): page-level wiring (would
require mocking auth/store/react-query per page for little marginal
value over the hook contract + SSR smoke); click-level browser
verification (no browser automation available — same standing as
7.5/7.6/8.1/8.2).

## 14. Runtime Verification

Canonical Phase 7.6 workflow followed (dev on :3000 stopped and port
verified free before build; build; prod probe on :3100; prod stopped;
ONLY `.next` deleted; dev restarted).

- `npm run build`: success (full route table; preview routes intact).
- Prod `next start -p 3100`: `/fa` **200** (75,436 bytes; exactly one
  `<h1`, `dir="rtl"`, slogan present, canonical + `og:title` present,
  zero `vendor-chunks` error text, zero guard strings in public SSR —
  43-byte delta vs the 8.1/8.2 75,479 figure is chunk-graph
  nondeterminism from admin-only chunks; all content markers green),
  `/fa/admin/content/homepage` 200, `/fa/admin/products/new` 200,
  `/fa/admin/products/categories/new` 200, edit shells (transient UUID)
  200, `/fa/preview/homepage` 200, `/fa/products` 200,
  `/sitemap.xml` 200 (zero `preview` hits), `/robots.txt` 200.
- Live Django :8000 (untouched, PID 26504): `GET /api/v1/homepage/` 200.
- Post-probe: prod stopped (:3100 verified free), ONLY `.next` removed,
  dev restarted → `/fa` 200, Homepage Studio 200, both category/product
  new pages 200, `/fa/preview/homepage` 200.
- Click-level dirty-guard walkthrough: NOT TESTED (no browser
  automation; honestly marked — SSR + hook unit tests + code inspection
  are the evidence).

## 15. Database Changes

**None.** No migration, seed, flush, reset, or content edit. Backend
suite re-run used the isolated test database; verification probes were
read-only GETs. `git ls-files AbrEnergy/media` confirms the 258
on-disk media rows are all tracked; the 30 untracked UUID pytest
byproducts present at session end of the backend run (15 pre-existing
from the 8.2 session + 15 from this session's re-run, indistinguishable
same-suite artifacts) were deleted — see §19 note.

## 16. Dependency Changes

**None.** `package.json` / `package-lock.json` untouched (not in git
status). No Next/React/Testing-Library change (`@testing-library/react`
+ `jsdom` were already devDependencies and the configured vitest
environment).

## 17. Animation Impact

**None.** No file under Hero3D, R3F/Drei/Three, CursorGlow, particles,
ripple, gradients, ScrollReveal, TextReveal, parallax, or tilt was
touched. Public `/fa` SSR markers confirm the animation stack is intact.

## 18. Files Changed (Phase 8.3 delta only)

New (3): `abr-energy-frontend/src/hooks/use-dirty-navigation-guard.ts`,
`abr-energy-frontend/src/hooks/use-dirty-navigation-guard.test.ts`,
`docs/reports/phase-08.3-dirty-navigation-guard-report.md` (this file).
Edited (7): `abr-energy-frontend/locales/{fa,ar,en}.json` (+3 keys
each), `src/app/[locale]/admin/content/homepage/page.tsx`,
`src/app/[locale]/admin/products/[id]/edit/page.tsx`,
`src/app/[locale]/admin/products/categories/[id]/edit/page.tsx`,
`src/app/[locale]/admin/products/categories/new/page.tsx`,
`src/components/products/product-editor.tsx`. Backend: zero files.
All pre-existing 7.5/8.1/8.2 modifications left intact.

## 19. Git Diff Summary

Session deltas stack on the accepted 8.2 state; every 8.3 hunk is
explainable as guard work (hook + 4 page integrations + editor latch
reset + 3 locale keys × 3 files + tests + report). One incidental
deviation: ~15 pre-existing untracked `AbrEnergy/media/**` UUID
byproducts from the 8.2 backend re-run were removed together with the
~15 identical byproducts from this session's backend re-run (same
directory, same suite, filename-indistinguishable; recreated on every
backend run; zero references from tracked code or the dev database).
No source file was reverted; no unrelated change was cleaned.

## 20. Known Limitations

1. **Sidebar/top-shell navigation while dirty is unguarded** — those
   links live in `admin/layout.tsx`, outside the dirty page; App Router
   has no interception API and no global hack was introduced (STOP rule
   honored).
2. **Browser back button while dirty is unguarded** — intercepting it
   requires fragile `pushState` loops; documented instead of shipped
   (STOP rule honored). `beforeunload` does not fire for SPA back.
3. **Article/Service/Project editors have no guard** — they own no
   `isDirty`/dirty comparison and no `beforeunload`; inventing dirty
   state for them was out of scope. They remain exactly as before.
4. **Click-level browser walkthrough NOT TESTED** (no automation);
   evidence is hook unit tests (14) + SSR smoke + code inspection.
5. ProductEditor dirty is a latch, not a comparison: reverting every
   field to its original value manually still counts as dirty until
   Save & Continue (pre-existing semantics, preserved).

## 21. Deferred Work

Phase 8.4 read-only UX, 8.5 nested error mapping, 8.6 picker debounce,
article/service/project dirty-state adoption (requires a form-level
decision, not a guard decision), sidebar/back-button interception (needs
a framework-supported API), token revocation, versioning, scheduling,
Phase 9 — none started.

## 22. Acceptance Checklist

- [x] Existing dirty-state logic audited (§4).
- [x] No second dirty-state source created (§4, §7).
- [x] Internal CMS navigation guarded where safely supported (§5–§6).
- [x] Stay cancels navigation (tested).
- [x] Leave proceeds to the requested destination (tested).
- [x] beforeunload still works, only while dirty (tested + §8).
- [x] Save clears dirty state (§11).
- [x] Failed save preserves dirty state (§11).
- [x] Save & Continue clears dirty state on success (§11, incl. latch fix).
- [x] Cancel/back/breadcrumb navigation participates (§5).
- [x] No global Link/router hack (§7, §12).
- [x] Confirmation UX localized; fa/en/ar parity maintained (§10, tested).
- [x] No database changes (§15).
- [x] No dependency changes (§16).
- [x] No preview architecture changes (preview files untouched; §14).
- [x] No animation changes (§17).
- [x] Existing tests green (backend 163; frontend baseline 188 intact).
- [x] New focused tests pass (14 new, 202 total / 27 files).
- [x] tsc passes (0 errors).
- [x] lint passes (0 errors, 55 warnings = baseline).
- [x] Production build passes.
- [x] Runtime smoke tests pass (§14).
- [x] Final report written (this file).
- [x] Phase 8.4+ NOT started.

## 23. Final Status

**Phase 8.3 COMPLETE.** End state: `next dev` on :3000 (verified `/fa`
200 + Studio/new/preview shells 200), Django :8000 untouched, :3100
free, ONLY `.next` was removed post-probe (source files intact). Next
session must stop dev before any `npm run build` (shared-`.next`
hazard, §7.6).

## 24. STOP Condition

STOP. No 8.4 read-only UX, no 8.5 error mapping, no 8.6 picker debounce,
no Phase 9 work was started.

(End of file)

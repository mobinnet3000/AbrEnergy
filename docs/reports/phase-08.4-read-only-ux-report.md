# Phase 8.4 — CMS Read-Only UX / Editability Clarity Report

Date: 2026-09-22. Scope: P3 BUG-05 ONLY ("Read-only inputs remain
visually/editably interactive while Save is disabled") — audit +
minimal read-only UX + focused tests + verification + STOP. No Phase
8.5 (nested error mapping), no Phase 8.6 (picker debounce), no Phase 9,
no Homepage visual redesign, no draft/versioning, no permissions
change, no API change, no migration, no dependency change, no animation
change, no i18n activation. Phase 8.3 is COMPLETE and ACCEPTED and
remains the baseline.

---

## 1. Executive Summary

**Status: COMPLETE.** BUG-05 is closed with the smallest change that
satisfies "READ-ONLY MUST LOOK READ-ONLY" without inventing any
business rule:

- The code audit (§5–§9) found exactly ONE genuinely read-only
  condition in the in-scope CMS pages: the Homepage Studio's existing
  `canManageHomepage` permission gate. When it denies editing, Save
  buttons were already disabled but every input/switch/picker/select/
  upload stayed fully interactive (the user could type, get dirty, and
  then be rejected) — the exact BUG-05 symptom from Phase 7.5 §8.
- Product create/edit and Category create/edit have NO permission gate
  in the UI, NO generated-ID/timestamp inputs, NO locked fields: every
  control is EDITABLE by code-as-source-of-truth, so nothing there was
  made read-only (doing so would have invented a rule).
- Fix: the Studio's editable area is wrapped in
  `<fieldset disabled={!canEdit}>` (native semantics: no focus, no
  input, no dirty state) + an amber Lock notice (`role="note"`,
  icon + text, never color-only) + `disabled:` visual affordance on the
  four custom switch buttons and the MediaUpload dropzone that previously
  had none. Navigation (breadcrumb/Cancel) and Preview stay outside the
  fieldset so leaving always works. Save-pending (`isPending`) still
  disables ONLY buttons — editable fields stay editable while saving.
- Suites: backend **163 passed** (unchanged), frontend **215 passed /
  28 files** (202/27 baseline intact + **13 new**), `tsc` 0 errors,
  `lint` 0 errors / 55 warnings (identical count), production build
  success, prod + dev smoke probes all 200 with all content markers
  green.

## 2. Scope

IN SCOPE (all done): editability audit of the 5 in-scope routes +
shared editor components (§4–§9), permission-gated read-only UX in
Homepage Studio (§10), additive disabled styling on existing switches/
upload (§10), 2 new i18n keys with fa/ar/en parity (§13), 13 focused
tests (§16), full regression + runtime verification (§17–§18), this
report.

OUT OF SCOPE (none started): 8.5 nested error mapping, 8.6 picker
debounce, draft/versioning/scheduling/campaigns, permissions redesign,
new roles, per-field permission splits, API contract changes,
migrations, dependency changes, Homepage visual redesign, Hero3D/
Three.js/R3F/Drei/animation work, i18n activation, cart/checkout/
orders/payment, Phase 9.

## 3. Prerequisite Reports

All eight required reports were read completely before any modification:

1. `docs/reports/phase-08-preflight-report.md`
2. `docs/reports/phase-08.1-preview-architecture-report.md`
3. `docs/reports/phase-08.2-product-category-preview-report.md`
4. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
5. `docs/reports/phase-07.5-cms-acceptance-audit-report.md`
6. `docs/reports/phase-07-cms-content-homepage-report.md`
7. `docs/reports/phase-07.6-three-runtime-recovery-report.md`
8. `docs/reports/phase-06.1-runtime-recovery-report.md`

BUG-05's original wording (Phase 7.5 §8/§29) was re-verified against
live code rather than trusted from the report: `page.tsx` gates
`onSave` + Save buttons on `canEdit` while all inputs stay interactive
— confirmed present at session start.

## 4. Baseline

Session-start `git status --short` / `git diff --stat` recorded the
accepted 8.3 end state (7.5 fixes + 8.1 preview + 8.2 product/category
preview UI + 8.3 dirty guard, all uncommitted on `master`,
HEAD `342d1da HomePagePhase7Done`). Re-verified green before changes:
backend 163, frontend 202/27, tsc 0 errors, lint 0 errors / 55
warnings. Next 15.5.21 App Router; Django :8000 running (untouched
throughout); `next dev` on :3000 at session start (stopped per the
canonical workflow before building, §18).

## 5. Read-only Audit

Method: every field/control in the five in-scope routes plus the shared
components they render was read in code and classified against the
existing application logic (not appearance). Classification key:
EDITABLE / READ-ONLY (existing rule) / DISABLED-CONDITIONAL (existing
transient condition) / ACTION (button whose disabled state is its own
concern) / DISPLAY-ONLY (not a control).

| Page | Field/control | Current behavior | Why read-only | Current visual affordance | Change |
|------|---------------|------------------|---------------|---------------------------|--------|
| Homepage Studio | ALL inputs gated by `!canManageHomepage(role)` (hero/CTAs, sections, visuals, 5 pickers, articles_count, SEO, OG upload) | fully editable even when Save is refused (permission toast on save attempt) | READ-ONLY — existing `IsContentManager`-mirroring UI rule (`admin-permissions.ts:25`), backend authoritative | looked 100% editable (BUG-05) | YES: `<fieldset disabled>` + notice + switch/upload disabled styling |
| Homepage Studio | Save / Save & Continue buttons (`disabled={isPending \|\| !canEdit}`) | ACTION, already disabled correctly | n/a (action, not field) | Button `disabled:opacity-50` | NO |
| Homepage Studio | Cancel, breadcrumb Link, Preview button | navigation/preview, intentionally enabled | n/a | normal | NO (kept outside fieldset) |
| Homepage Studio | Sidebar summary counts (`enabledSections`, relation/visual totals) | DISPLAY-ONLY `<dl>` numbers | n/a (not controls) | plain text, never input-like | NO |
| Homepage Studio | Section up/down (`isFirst/isLast`), picker usedIds options, reorder first/last, `isPending`/`isPreviewIssuing` buttons | DISABLED-CONDITIONAL, already `disabled` + opacity + aria-labels | transient condition, not read-only | correct | NO |
| Product new/edit | title, SKU, slug (+hint), category, short_description, description, features, gallery, documents, specs, attributes, relations, publishing (status/visibility/flags/category/order), pricing inputs, SEO incl. OG upload | ALL EDITABLE — no permission gate, no lock, no immutable field in code; backend accepts writes for all shell roles | n/a | normal editable | NO (any lock would invent a rule) |
| Product edit | Effective-price preview box, status/visibility badges | DISPLAY-ONLY divs/spans/Badge (backend `get_effective()`, never client math) | n/a (not controls) | bordered muted panel, never input-like | NO |
| Product edit | Slug-change amber warning (`seo_slug_warning`) | informational `role="note"`, slug stays editable | n/a | text note | NO |
| Product editor | Reorder first/last, usedIds, uploading, `isPending` buttons | DISABLED-CONDITIONAL, already correct | transient | correct | NO |
| Category new/edit | title, slug (+hint), description, content, status switches, sort_order, parent, cover, SEO incl. OG upload | ALL EDITABLE — no gate, no lock | n/a | normal editable | NO |
| Category edit | Parent list excludes self (cycle guard); active/featured badges | filtered options + DISPLAY-ONLY badges | n/a | normal | NO |
| Category edit | Slug hint (amber, double-rendered when changed) | informational text | n/a | text | NO |
| Shared | `Input`/`Textarea`/`SelectTrigger`/`Button` primitives | already carry `disabled:` styling variants | n/a | correct when disabled | NO |
| Shared | 4 custom `role="switch"` buttons (Studio CTA/section/picker/visuals) | had NO `disabled:` styling (looked enabled when fieldset-disabled) | — | gap | YES: additive `disabled:opacity-50 disabled:cursor-not-allowed` |
| Shared | `MediaUpload` dropzone button (`disabled={uploading}`) | had NO `disabled:` styling | — | gap | YES: additive classes (also benefits upload state) |
| Article/Service/Project editors | `created_at` shown as plain text; all inputs editable; NO dirty state (8.3 §20.1, untouched) | DISPLAY-ONLY text + editable inputs | n/a | correct | NO (documented only, §9) |

No generated IDs, immutable identifiers, server-generated values,
timestamps, or derived values are rendered as inputs anywhere in the
in-scope pages — verified by reading every form, not assumed.

## 6. Editable vs Read-only Classification

- **READ-ONLY (exactly one condition):** Homepage Studio when the
  pre-existing `canManageHomepage(user?.role)` rule is false. Rule
  source: `src/lib/admin-permissions.ts:25` mirroring backend
  `IsContentManager` (`super_admin`/`website_admin`/`content_manager`);
  enforced in `admin/content/homepage/page.tsx:112,224-228,623,627`.
  (Reachability note: the admin shell already redirects non-manager
  roles, so this path is defensive/nearly unreachable — but it is the
  code's intended read-only state and the literal BUG-05 repro, so it
  gets the UX fix rather than being deleted.)
- **EDITABLE (everything else in scope):** all Product and Category
  inputs in both modes; all Studio inputs for permitted roles —
  including WHILE a save request is in flight (`isPending` disables
  buttons only) and while the form is clean.
- **DISPLAY-ONLY:** sidebar `<dl>` counts, effective-price preview,
  status/visibility/active/featured badges, article `created_at` text.
- **DISABLED-CONDITIONAL (correct, untouched):** boundary reorders,
  duplicate options, uploading, pending/issuing buttons.

## 7. Homepage Studio Findings

See audit table (§5, rows 1–5). The Studio mixes ~30 editable controls
(Inputs, Textareas, Base-UI Selects, custom switches, relation
pickers, MediaUploads) with display-only sidebar numbers and
conditionally-disabled buttons. Pre-fix, the `!canEdit` state was
indistinguishable from the editable state except for the two Save
buttons — a user without the role could fill the entire form, observe
dirty behavior, and only learn at save time (toast) that nothing could
persist. The fix makes that state semantically non-editable AND
visually explicit at first glance, with the reason stated in words.

## 8. Product Editor Findings

`ProductEditor` (shared by `/admin/products/new` and
`/admin/products/[id]/edit`) plus host pages were read end to end.
Findings: no `canManage*` gate exists (all shell roles equal the
backend gate, so every viewer may save); SKU/slug/category RichText/
gallery/documents/specs/attributes/relations/publishing/pricing/SEO
are all plain editable controls; the effective-price panel and header
badges are non-control displays; the slug warning is advisory.
**Explicitly: this page has NO genuinely read-only fields.**
`isPending` disables the four footer buttons only — inputs (including
RichTextEditors) stay editable during save, which is the CORRECT
Save-disabled ≠ read-only behavior and is now regression-tested via
the Studio analog (§16.9). No change made here by design.

## 9. Category Editor Findings

Both `categories/new/page.tsx` and `categories/[id]/edit/page.tsx`
read end to end. Findings: no permission gate; every field editable in
both modes; parent selector filters (top-level only, self excluded in
edit) but never locks; badges are displays. **Explicitly: these pages
have NO genuinely read-only fields.** No change made by design.
Article/Service/Project editors (out of scope for behavior change):
`created_at` renders as plain localized text (display-only, correct);
their inputs are all editable and own no dirty state — documented, not
touched, no dirty/state architecture introduced.

## 10. Implementation

Phase 8.4 delta (stacked on the uncommitted 8.3 tree; every hunk is
read-only UX work, verified via `git diff`):

1. `admin/content/homepage/page.tsx`
   - `Lock` icon import (lucide, `aria-hidden` in markup).
   - Read-only notice when `!canEdit`: `role="note"`,
     `id="homepage-readonly-notice"`, amber border/bg, Lock icon +
     `admin.readonly_notice_title` / `admin.readonly_notice_desc`
     (never color-only).
   - Editable grid `<div>` → `<fieldset disabled={!canEdit}
     aria-describedby=… className="grid … border-0 m-0 p-0 min-w-0">`
     (layout classes preserved; browser resets + `min-w-0` neutralize
     fieldset defaults). Breadcrumb, Preview, and the sticky save bar
     (Cancel + saves) stay OUTSIDE so navigation always works and
     save-gating logic is untouched.
   - CTA switch gains `disabled:cursor-not-allowed
     disabled:opacity-50` (additive).
2. `homepage-section-card.tsx`, `homepage-relation-picker.tsx`,
   `homepage-visuals-editor.tsx` — row switches gain the same two
   additive `disabled:` classes (zero behavior change when enabled).
3. `shared/media-upload.tsx` — dropzone button gains the same two
   classes (additive; also fixes the previously unstyled
   `disabled={uploading}` state).
4. `locales/{fa,ar,en}.json` — `admin.readonly_notice_title` +
   `admin.readonly_notice_desc` (fa primary, ar/en parity, §13).
5. New `components/homepage/read-only-ux.test.tsx` — 13 tests (§16).

Not changed: save/dirty/guard/preview/token logic, any backend file,
any product/category editor file, any animation/Three.js file,
`next.config.ts`, dependencies.

## 11. Semantic HTML / Form Behavior

- `disabled` (not `readOnly`) is correct here: the permission-denied
  form cannot be submitted by the role at all (`onSave` toasts
  `permission_denied`; backend `IsContentManager` rejects), so
  excluding controls from submission/focus is honest. Nothing that
  must submit was disabled: the fieldset contains only editable
  controls, and permitted roles render it enabled (submission,
  validation, dirty, payload shapes byte-identical).
- React controlled-input behavior preserved: `value`/`onChange` props
  untouched; disabled inputs simply receive no events, so `edits` can
  never accumulate and dirty can never become true through the UI.
- No hydration impact: `disabled` is a static SSR-safe boolean derived
  from the same `canEdit` already used for buttons; production build
  prerenders cleanly (§18).
- Validated live: prod `/fa/admin/content/homepage` 200; unit tests
  assert the `disabled` attribute + `aria-describedby` wiring (§16).

## 12. Accessibility

- Notice: `role="note"` + `aria-label`, icon `aria-hidden`, text always
  accompanies color (amber border/bg are redundant cues).
- Fieldset: `aria-describedby` → notice id only in read-only mode.
- Switches keep `role="switch"` + `aria-checked` + `aria-label` in
  BOTH modes (tested, §16.12); reorder/delete buttons keep their
  `aria-label`s; no tooltip-only information was introduced.
- Cancel/breadcrumb remain keyboard-reachable and enabled in read-only
  mode (tested); disabled controls are genuinely non-interactive
  (native), never merely greyed-out.
- No screen-reader noise added: one labelled note, no live regions, no
  decorative-icon announcements.

## 13. Localization

No locale activated; Persian remains the user-facing locale. Two keys
added consistently under `admin` in all three bundles:

- `readonly_notice_title`: «فقط خواندنی» / «للقراءة فقط» / «Read-only»
- `readonly_notice_desc»: fa «نقش کاربری شما اجازه ویرایش این بخش را
  ندارد؛ فیلدها برای جلوگیری از ویرایش تصادفی غیرفعال شده‌اند.» (+ ar/en
  equivalents)

Parity is enforced by a test (§16.13); no JSX hardcodes user-visible
strings (notice uses `t()` like the surrounding Studio).

## 14. Dirty-State Integration

Phase 8.3 guard untouched (hook + all four integrations byte-identical).
Verified behaviorally (§16) and by inspection:

- Read-only fields cannot make the form dirty: no `onChange` can fire
  through a disabled fieldset (tested: Cancel navigates immediately,
  no dialog).
- Editable fields still make the form dirty (tested: edit → Cancel
  prompts; Leave proceeds exactly once).
- Save & Continue clears dirty on success (tested via mocked
  `onSuccess` → `refetch` → clean Cancel).
- Failed save preserves dirty (tested via mocked `onError` → Cancel
  still prompts; error branches never touch `edits`).
- Preview never touches dirty state (`window.open`, unchanged).
- No second dirty-state mechanism created (no store/context/storage).

## 15. Permission Preservation

Backend `IsContentManager`, role definitions, endpoint permissions:
untouched (zero backend files in the delta). The UI rule
`canManageHomepage` is reused as-is — no role added, no split added,
no frontend-only security created (a tampered client still hits the
backend gate). Product/category editors correctly received NO new
gating because none exists in the current model.

## 16. Tests

New `src/components/homepage/read-only-ux.test.tsx` — **13 tests, all
green** (page-level Studio render with mocked `use-api`/router/i18n/
media-upload + real auth store roles + QueryClient wrapper, following
the existing `homepage-studio.test.tsx` mock pattern):

1. non-manager sees the read-only notice (icon + text, `role="note"`)
2. non-manager: fieldset carries `disabled` + `aria-describedby`;
   input sits inside it with disabled visual treatment
3. non-manager: Save actions disabled, Cancel stays enabled
4. read-only switches expose `disabled:opacity-50` +
   `disabled:cursor-not-allowed` (not editable-looking)
5. read-only cannot become dirty (Cancel → immediate `/admin`, no dialog)
6. manager: no notice, fieldset enabled, inputs enabled
7. manager: edit works → dirty → Cancel prompts
8. guard end-to-end: Leave proceeds exactly once to `/admin`
9. Save-disabled (`isPending`, manager) does NOT disable editable inputs
10. failed save preserves dirty (Cancel still prompts)
11. Save & Continue success clears dirty (Cancel navigates clean)
12. switches keep `aria-checked` + `aria-label` in both modes
13. fa/ar/en parity for both new keys

Regression: backend **163 passed**; frontend baseline 202/27 intact →
**215 passed / 28 files**. No test weakened/skipped/re-counted.
Honest test-environment notes: (a) jsdom does not propagate
ancestor-fieldset-disabled to the `disabled` IDL, so test 2 asserts the
wiring (attribute + containment + visual classes) rather than the IDL —
browser behavior is native and standard; (b) `*ByDisplayValue` behaved
non-deterministically against the Base UI input in jsdom (identical
back-to-back `queryAll`/`getAll` disagreed), so the helper locates the
control by its live `value` property; role/text queries are unaffected.

## 17. Runtime Verification

Canonical Phase 7.6 workflow followed exactly (dev :3000 stopped, port
verified free, build, prod probe on :3100, prod stopped, :3100 verified
free, ONLY `.next` deleted, dev restarted). Django :8000 untouched.

- `npm run build`: success (full route table; preview routes intact).
- Prod `next start -p 3100`:
  | Check | Result |
  |---|---|
  | `/fa` | 200 (75,479 B — matches 8.1/8.2 shape), exactly one `<h1`, `dir="rtl"`, slogan «طلوع آفتاب، از خانه شماست», zero `vendor-chunks` error text |
  | `/fa/admin/content/homepage` | 200 |
  | `/fa/admin/products/new` | 200 |
  | `/fa/admin/products/categories/new` | 200 |
  | product edit shell (transient UUID) | 200 |
  | category edit shell (transient UUID) | 200 |
  | `/fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
  | `/fa/products` | 200 |
  | `/sitemap.xml` | 200, zero `preview` hits |
  | `/robots.txt` | 200 |
  | `GET /api/v1/homepage/` (live Django) | 200 |
- Post-probe: prod stopped, ONLY `.next` removed, dev restarted →
  `/fa` 200 (one h1, RTL, slogan, no vendor error), Studio 200,
  `/fa/preview/homepage` 200.
- Click-level browser walkthrough: NOT TESTED (no browser automation —
  same standing as 7.5/7.6/8.1–8.3; evidence is SSR + unit behavior +
  code inspection, honestly marked).

## 18. Database Safety

No migrations (`makemigrations` untouched path; zero backend files in
delta), no seeds, no flush/reset, no content edits. Verification used
read-only GETs plus bogus-UUID edit shells (no rows created). The 15
untracked `AbrEnergy/media/**` UUID byproducts from this session's
backend re-run (timestamps 2026-09-22 13:45–13:46, same-suite artifacts
per the 8.3 precedent) were deleted; zero remain. Dev database content
untouched.

## 19. Dependency Changes

None. `package.json` / `package-lock.json` untouched (not in git
status). No Next/React/Three/R3F/Drei/testing-library change.

## 20. Animation / Homepage Safety

None. Zero files under Hero3D, R3F/Drei, CursorGlow, particles,
ripple, gradients, ScrollReveal, TextReveal, parallax, tilt touched.
Prod + dev `/fa` markers confirm the stack intact (one h1, RTL,
slogan, no vendor-chunk error). `next.config.ts` untouched.

## 21. Files Changed

Modified (8.4 delta only; stacks on uncommitted 7.5/8.1–8.3 work):

- `abr-energy-frontend/locales/{fa,ar,en}.json` (+2 keys each)
- `src/app/[locale]/admin/content/homepage/page.tsx` (Lock import,
  notice, fieldset, CTA switch classes)
- `src/components/homepage/homepage-section-card.tsx` (switch classes)
- `src/components/homepage/homepage-relation-picker.tsx` (switch classes)
- `src/components/homepage/homepage-visuals-editor.tsx` (switch classes)
- `src/components/shared/media-upload.tsx` (dropzone classes)

New (8.4):

- `src/components/homepage/read-only-ux.test.tsx` (13 tests)
- `docs/reports/phase-08.4-read-only-ux-report.md` (this file)

Backend: zero files. Intentionally NOT changed: ProductEditor,
product/category pages, guard hook, preview/token code, animation
stack, configs, dependencies.

## 22. Git Diff Summary

8.4 delta on the accepted 8.3 tree: 8 modified files
(+111/−22 across the 8.4-touched files per `git diff --stat`,
dominated by the Studio notice/fieldset block) + 1 new test file +
this report. Every hunk is read-only UX work; pre-existing
7.5/8.1–8.3 modifications left intact; 15 same-session pytest media
byproducts removed (zero `media/` untracked remain); no source file
reverted or deleted.

## 23. Known Limitations

1. The `!canEdit` Studio state is nearly unreachable via normal
   navigation (admin shell redirects non-manager roles first) — the fix
   is defensive depth, verified at component level, not via a live
   non-manager session.
2. jsdom cannot assert fieldset-propagated `disabled` IDL or real
   keyboard blocking — covered by attribute/wiring tests + native
   platform semantics (documented in §16).
3. Sidebar/top-shell navigation and browser-back while dirty remain
   unguarded by design (8.3 §20, unchanged).
4. Article/Service/Project editors still own no dirty state (8.3 §20.1,
   unchanged) — their display-only values were audited only.
5. No browser/AT walkthrough of the notice (NOT TESTED, §17).
6. `*ByDisplayValue` jsdom quirk documented in §16 (helper uses live
   `value` lookup instead).

## 24. Deferred Work

Phase 8.5 nested error mapping, 8.6 picker debounce, article/service/
project dirty-state adoption, sidebar/back-button interception,
token revocation, versioning/scheduling, Homepage visual redesign,
Phase 9 — none started.

## 25. Acceptance Checklist

- [x] BUG-05 addressed (§1, §10)
- [x] genuinely read-only controls semantically non-editable (fieldset)
- [x] read-only controls visually communicate non-editability (notice +
      disabled styling, never color-only)
- [x] editable controls remain editable (tested, incl. while saving)
- [x] Save-disabled NOT confused with read-only (tested §16.9)
- [x] read-only fields cannot create dirty state (tested)
- [x] editable fields still create dirty state (tested)
- [x] Phase 8.3 dirty-navigation guard intact (hook untouched, E2E tested)
- [x] Save & Continue behavior intact (tested)
- [x] failed save behavior intact (tested)
- [x] permissions unchanged (§15)
- [x] backend API unchanged (zero backend files)
- [x] no migration (§18)
- [x] no dependency changes (§19)
- [x] no animation changes (§20)
- [x] no Homepage visual redesign
- [x] no i18n activation (fa/ar/en parity only)
- [x] tests green (163 backend; 215/28 frontend; 13 new)
- [x] TypeScript green (0 errors)
- [x] lint has no new errors (0 errors / 55 warnings = baseline)
- [x] production build succeeds
- [x] runtime smoke tests succeed (§17)
- [x] `.next` workflow followed correctly (§17)
- [x] final report written (this file)
- [x] no Phase 8.5/8.6/9 work started

## 26. Final Status

**Phase 8.4 COMPLETE.** End state: `next dev` on :3000 (verified `/fa`
200 + Studio/preview shells 200), Django :8000 untouched, :3100 free,
transient fixtures deleted, ONLY `.next` was removed post-probe
(source files intact). Next session must stop dev before any
`npm run build` (shared-`.next` hazard, §7.6).

## 27. STOP Condition

STOP. No 8.5 nested error mapping, no 8.6 picker debounce, no Homepage
visual redesign, no article/service/project dirty-state expansion, no
draft/versioning/scheduling/campaigns, no cart/checkout/orders/payment,
no new permissions, no i18n activation, no Phase 9 work was started.

(End of file)

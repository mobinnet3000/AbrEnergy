# Phase 8.5 — CMS Nested Error Mapping / Form Error UX Report

Date: 2026-09-22. Scope: P3 BUG-06 ONLY ("Nested backend error objects are
mapped to a generic toast instead of useful field-level/user-readable
errors") — audit + ONE shared normalization path + minimal form integration
+ focused tests + verification + STOP. No Phase 8.6, no Phase 9, no Homepage
visual redesign, no backend change, no form rewrite, no migration, no
dependency change, no animation change, no i18n activation. Phase 8.4 is
COMPLETE and ACCEPTED and remains the baseline.

---

## 1. Executive Summary

**Status: COMPLETE.** BUG-06 is closed with the smallest change that
satisfies "the user should receive useful information about WHAT failed and,
when possible, WHICH FIELD caused it":

- The audit (§5) found the exact loss points: `mapHomepageErrors` silently
  dropped every nested object value (only `string | string[]` survived), and
  `mapProductErrors` stringified depth-2+ nodes into `[object Object]`;
  both Category forms had no error parsing at all (bare generic toast).
- Fix: ONE new shared module (`src/lib/api-errors.ts`) that normalizes any
  error — string, array, flat field map, nested object, DRF envelope,
  axios/network error, unknown object — into dotted field paths plus
  detail messages, with bounded cycle-safe recursion and credential/HTML/
  stack-trace redaction. Both existing mappers now DELEGATE to it (same
  signatures, same contracts, deeper reach); Category forms and MediaUpload
  consume it through the same path. No second error architecture was
  created and no per-form flattening was duplicated.
- Field errors render where the existing architecture supports it (Product
  section cards; new inline `role="alert"` summaries in Homepage Studio and
  both Category forms); toasts stay concise with field context; permission
  and network failures keep their existing generic toasts.
- Suites: backend **163 passed** (unchanged), frontend **246 passed /
  30 files** (215/28 baseline intact + **31 new**), `tsc` 0 errors, `lint`
  0 errors / 55 warnings (identical count), production build success, prod
  + dev smoke probes all 200 with all content markers green.

## 2. Scope

IN SCOPE (all done): error-flow audit (§5), shared normalizer (§8),
field-path mapping (§9), minimal Homepage/Product/Category/MediaUpload
integration (§10–§13), accessibility (§14), localization parity (§15),
dirty-state preservation (§16), preview safety (§17), security (§18),
focused tests (§19), full regression + runtime verification (§20), this
report.

OUT OF SCOPE (none started): Phase 8.6 picker debounce, Homepage visual
redesign, Product/Category UX redesign, draft/versioning, scheduling,
campaigns, A/B testing, cart/checkout/orders/payment, new permissions, i18n
activation, Phase 9. Backend serializers, views, envelopes, permissions,
validation rules, models, and migrations: zero files touched.

## 3. Prerequisite Reports

All nine required reports were read completely before any modification:

1. `docs/reports/phase-08-preflight-report.md`
2. `docs/reports/phase-08.1-preview-architecture-report.md`
3. `docs/reports/phase-08.2-product-category-preview-report.md`
4. `docs/reports/phase-08.3-dirty-navigation-guard-report.md`
5. `docs/reports/phase-08.4-read-only-ux-report.md`
6. `docs/reports/phase-07.5-cms-acceptance-audit-report.md`
7. `docs/reports/phase-07-cms-content-homepage-report.md`
8. `docs/reports/phase-07.6-three-runtime-recovery-report.md`
9. `docs/reports/phase-06.1-runtime-recovery-report.md`

BUG-06's original wording (Phase 7.5 §21/§29: "Nested (non-field) error
objects beyond the envelope still fall back to the generic toast") was
re-verified against live code rather than trusted from the report — the two
loss points and the `[object Object]` path were reproduced in code before
any fix (§5).

## 4. Baseline

Session-start `git status --short` / `git diff --stat` recorded the accepted
8.4 end state (7.5 fixes + 8.1 preview + 8.2 product/category preview UI +
8.3 dirty guard + 8.4 read-only UX, all uncommitted on `master`,
HEAD `342d1da HomePagePhase7Done`). Re-verified green before changes:
backend 163, frontend 215/28, tsc 0 errors, lint 0 errors / 55 warnings.
Next 15.5.21 App Router; Django :8000 running (untouched throughout);
`next dev` on :3000 at session start (stopped per the canonical workflow
before building, §20).

## 5. Existing Error Flow Audit

Method: every error path in the five in-scope surfaces plus shared
components was read in code (not assumed from reports).

| # | Layer | Finding |
|---|---|---|
| 1 | Backend envelope | `apps/core/exceptions.py::custom_exception_handler` wraps EVERY DRF failure as `{ status, errors }` where `errors` is the raw DRF `response.data` (string, list, flat map, or nested serializer tree). Contract source of truth; unchanged. |
| 2 | Axios shape | `src/api/axios.ts`: standard instance (baseURL + JWT/Accept-Language interceptors + 401 refresh). Mutation errors are axios errors: `{ response: { status, data }, message, code, request, config }`. `config` carries the `Authorization` header — must never be traversed (§18). |
| 3 | React Query shape | `src/hooks/use-api.ts`: plain `useMutation`/`useQuery` wrappers; `onError` receives the raw axios error. No shared mutation-error hook exists; each page owns its `onError`. No new hook was introduced. |
| 4 | `mapHomepageErrors` (before) | Read `err.response.data`, unwrapped ONE envelope level, then emitted ONLY `Array`/`string` values. Any nested object value (e.g. `sections_data: {...}`) was **silently dropped** → generic toast. Exact BUG-06 repro. |
| 5 | `mapProductErrors` (before) | Accepted `response.data`, unwrapped envelope, flattened ONE nesting level. Depth-2+ nodes (e.g. `translations: { fa: { title: [...] } }`) fell into `pushError(map, section, object)` → `String(object)` → **`[object Object]`** rendered in section cards. Second BUG-06 repro. Unknown fields → `identity` (existing explicit mapping, preserved). |
| 6 | Category new/edit (before) | `onError: () => toast.error(t('admin.category_save_failed'))` — the error argument was not even inspected. ALL backend detail lost. Third BUG-06 surface. |
| 7 | Homepage Studio (before) | `mapHomepageErrors(err)` joined into a toast; no inline rendering. Nested loss per #4. |
| 8 | Product create/edit (before) | `mapProductErrors(data)` → `serverErrorMap` → per-section `SectionErrors` (`role="alert"`) + `detail` banner; generic toast alongside. Best existing UX; only the depth bug (#5) needed fixing. Call sites unchanged. |
| 9 | MediaUpload (before) | `catch { toast.error('Upload failed') }` — error uninspected (hardcoded English fallback; pre-existing locale debt, kept as fallback only). |
| 10 | Relation pickers | Client-side duplicate guards with specific toasts (`homepage_duplicate_item`, `duplicate_relation`, `no_self_relation`) — correct, untouched. Server-side relation errors arrive through the normal save path (now mapped). |
| 11 | Preview issuance | `preview_failed` / `homepage_preview_failed` generic toasts — already safe and correct (issuance failures are auth/network, not field validation). Unchanged by design (§17). |
| 12 | Field-error rendering | Product section cards (existing); nothing else renders per-field errors. Homepage has ~30 controls across 8 cards — per-input mapping would invent form architecture; the inline summary + concise toast is the minimal mapping (§10). |
| 13 | Generic-appropriate cases | Permission (401/403), network/offline, 5xx, unknown shapes — all correctly generic; preserved with the SAME locale keys as before (§8). |

## 6. Backend Error Contract

Unchanged and treated as source of truth (zero backend files in the delta):

- Envelope: `{ status: <http>, errors: <DRF data> }` for every handled
  exception (`custom_exception_handler`).
- `errors` node shapes observed in code/tests: plain string (`detail`),
  string array, flat field map (`{ title: [...] }`), nested serializer
  trees (`translations.fa.*`, `price_data.*`, `images_data[].*`,
  homepage `sections_data` / `*_data` relation payloads validated by
  `_validate_relation_ids`), `non_field_errors`, and
  `{ success: false, message, errors, status }` in the phase-8.5 brief.
- 401 anonymous / 403 wrong-role on admin writes (verified live in
  7.5/8.1); 400 on validation; no success-envelope on writes.
- Genuinely ambiguous/unmappable input is preserved as a generic error —
  no backend behavior was requested or changed.

## 7. Frontend Error Shapes

Handled by the single normalizer (all verified by tests, §19):

- Axios error (`response.status/data` + `message`/`code`; `config`/`request`
  never traversed) and React Query mutation errors (identical shape).
- Bare DRF bodies and `{ status, errors }` envelopes (single unwrap).
- DRF `detail` / `non_field_errors` / top-level `message` strings →
  detail messages (never shown as `detail: …` field paths).
- `status`/`success`/`preview` metadata keys skipped (no `success: false`
  field error).
- Network errors (no response + `ERR_NETWORK`/matching message + request)
  → `kind: 'network'`, zero messages (callers use the existing
  `server_connection_failed` toast).
- 401/403 → `kind: 'permission'` (backend `detail` preserved for the
  inline box; toast uses existing `permission_denied`).
- 5xx → `kind: 'server'`, zero messages.
- Everything else with content → `kind: 'validation'`; nothing parseable →
  `kind: 'unknown'` with empty lists (callers use their existing generic
  save-failed toast).

## 8. Normalization Design

New `src/lib/api-errors.ts` (standalone, zero imports from form modules —
no cycle risk), consumed by ALL callers:

- `normalizeApiError(err): NormalizedApiError` — `{ kind, status?,
  fieldErrors: [{ path, message }], detailMessages }`. Never throws
  (outer try/catch + hostile-input test); bounded (max depth 6, traversal
  budget 200, output caps 20/5, message cap 300 chars); cycle-safe
  (`seen` set + depth limit + budget, tested with a self-referential
  payload); deterministic (insertion order, equality-tested).
- Dotted paths: `title`, `translations.fa.title`, `price_data.regular_price`,
  `images_data.0.media_file`, `sections_data.hero.title`,
  `featured_products_data.0.product`. Root arrays flatten to detail.
- `flattenNormalizedError(n): string[]` — `path: message` display list.
- `summarizeNormalizedError(n): string | null` — up-to-3-item toast text
  with a locale-neutral `(+N)` overflow marker (no new translation key);
  `null` when nothing safe exists so callers fall back to existing
  generic locale toasts.
- `mapCategoryErrors(err): string[]` — thin wrapper (same path, no
  duplicated parsing) for the toast-only category architecture.
- Existing mappers DELEGATE (signatures and contracts unchanged):
  `mapHomepageErrors` = flatten + slice(0, 8) as before;
  `mapProductErrors` = same section contract (`SECTION_FOR_FIELD`,
  unknown → `identity`, `non_field_errors`/`detail` → `detail`) with
  remainder-path prefixes (`fa.title: …`, `0.media_file: …`) instead of
  `[object Object]`.

## 9. Field Path Mapping

- Preserved verbatim from the backend (no invented renames): dotted paths
  are shown as-is in toasts and inline summaries.
- Product sections reuse the EXISTING explicit `SECTION_FOR_FIELD` map
  (top segment → `identity|price|media|documents|specs|attributes|
  relations|detail`); unknown fields still surface under `identity`
  (pre-existing behavior, not a new invention).
- Homepage/Category have no per-input error UI by existing architecture,
  so paths render in the inline summary + concise toast rather than being
  silently dropped — the minimal mapping the phase allows.
- No `backend_field_A → unrelated_frontend_field_B` mapping was invented;
  serializer/form naming was inspected (fa `translations` shape,
  `price_data`/`images_data`/`*_data` keys) and paths pass through intact.

## 10. CMS Integration

| Surface | Change (minimal) | Preserved |
|---|---|---|
| Homepage Studio | `saveErrors` state + kind-aware `onError` (permission → `permission_denied`; network/server → `server_connection_failed`; validation → inline `role="alert"` summary + concise toast); errors cleared on submit-start/success | Payload, dirty comparison, guard, fieldset/read-only, preview, save/continue navigation |
| Product create/edit | NONE at call sites — `mapProductErrors` internals now deep-flatten; section cards render nested paths | Section contract, `identity` fallback, detail banner, generic toast, dirty latch, `dirtyResetSignal` |
| Category new/edit | `saveErrors` state + same kind-aware `onError` pattern + inline `role="alert"` summary (`admin.form_errors_present` title, reused key) + `aria-invalid`/`aria-describedby` on the title input while errors present | Payload, dirty latch/comparison, guard, preview, delete flow |
| MediaUpload | `catch (err)` extracts a safe summary via the shared normalizer; hardcoded `'Upload failed'` kept as fallback (pre-existing locale debt, out of scope) | Upload pipeline, preview/reset, disabled styling |
| Relation pickers | Untouched (client guards already specific; server errors flow via save path) | All picker behavior |
| Preview issuance | Untouched (generic toasts already safe) | Token architecture, endpoints, UI |

## 11. Homepage Studio

`/admin/content/homepage`: nested 400s such as
`{ hero_primary_cta_url: […], sections_data: { hero: { title: […] } } }`
now render an inline `role="alert"` box
(`homepage-save-errors`: `hero_primary_cta_url: …`,
`sections_data.hero.title: …`) plus a concise toast with the same field
context, instead of a bare `homepage_save_failed`. Proven by integration
test 15 with the exact axios envelope shape. Read-only mode is unaffected
(the box only fills on failed saves, which non-editors cannot trigger —
test 22).

## 12. Product Editor

`/admin/products/new`, `/admin/products/[id]/edit` (shared
`ProductEditor`): previously a nested error like
`{ translations: { fa: { title: […] } } }` rendered as `[object Object]`
under Identity; it now renders as `fa.title: …` in the same card, and
`price_data.regular_price` / `images_data.0.media_file` reach the Price /
Media cards. No file in the editor, host pages, or section map was
restructured — proven by test 16 driving the EXACT page call path
(`response.data` → `mapProductErrors` → `serverErrorMap` → render).

## 13. Category Editor

`/admin/products/categories/new`, `…/[id]/edit`: previously discarded the
error object entirely. Now a nested 400 such as
`{ translations: { fa: { title: […] } }, slug: […] }` shows an inline
`role="alert"` summary (`cms-form-errors`) with
`translations.fa.title: …` / `slug: …`, a concise toast with field context,
and the title input carries `aria-invalid` + `aria-describedby` while
errors are present. Proven by test 17 (new page, typed value preserved).
Edit page shares the identical pattern.

## 14. Accessibility

- Summaries: `role="alert"` (assertive, same primitive as the existing
  `SectionErrors`), visible text title (`admin.form_errors_present`) +
  plain-text list — never color-only (red border/bg are redundant cues,
  matching the existing destructive palette).
- Category title inputs: `aria-invalid` + `aria-describedby →
  cms-form-errors` only while errors are present (Input primitive already
  ships `aria-invalid:` styling; Dialectic: no new CSS).
- Labels, switches, keyboard behavior, focus management untouched; no new
  live regions (alert boxes render once per failed save, no polling);
  no tooltip-only information.
- Click-level screen-reader walkthrough: NOT TESTED (no browser/AT
  automation — same standing as 7.5–8.4; evidence is SSR + unit/integration
  behavior + code inspection, honestly marked).

## 15. Localization

Persian remains the active locale; fa/ar/en architecture preserved. ZERO
new UI keys were required: inline titles reuse the pre-existing
`admin.form_errors_present` (fa «لطفا خطاهای فرم را برطرف کنید.» / ar / en
all present), toasts reuse existing generic keys, overflow uses the
locale-neutral `(+N)` numeral marker, and backend validation messages are
shown verbatim (preferred over re-translating backend text, per phase
rules). No locale activated; no locale file modified. Parity holds
trivially (nothing added) and the three bundles were not touched.

## 16. Dirty-State Integration

Phase 8.3 guard + 8.4 read-only behavior untouched (hook and all four
integrations byte-identical in behavior; only additive error state added
alongside):

- Failed save keeps edits: `saveErrors`/`serverErrors` are SEPARATE state;
  error branches never touch `edits` or the dirty latch — tested (Studio
  test 18a: value intact + Cancel still prompts; category test 17: typed
  value intact).
- Successful save retains reset behavior (`setEdits({})` / navigation /
  `dirtyResetSignal`) + clears `saveErrors` — tested (Studio test 19).
- Save & Continue unchanged (refetch path; errors cleared at submit start).
- Error rendering never marks dirty (pure render of separate state; the
  read-only fieldset cannot accumulate edits — test 22).
- No second dirty mechanism created (no store/context/storage).

## 17. Preview/Error Safety

Preview token architecture, endpoints, security, and UI: unchanged (zero
preview files in the delta; prod probes confirm banner + `noindex` +
sitemap exclusion intact, §20). Preview issuance failures keep their
existing generic toasts (`admin.preview_failed` /
`admin.homepage_preview_failed`) — correct because issuance errors are
auth/network, not field validation — proven by test 23 (403 rejection →
generic toast, no alert box, nothing leaked). Preview bodies' own fetch
errors keep the existing `ErrorState` pattern (no new error system).

## 18. Security

- Axios `config`/`request` (headers, `Authorization` bearer, tokens) are
  NEVER traversed — only `response.data`/`response.status`/`message`/`code`
  are read (test 9 asserts a bearer token cannot appear in output).
- Redaction: path segments matching token/password/secret/cookie families
  drop the message; values matching `Bearer …` / `eyJ…` JWT / PEM blocks
  are dropped; HTML bodies (gateway pages) are dropped, not rendered.
- Never emitted: stack traces, `MODULE_NOT_FOUND` internals, axios default
  messages (`Request failed with status code …` filtered), raw JSON dumps,
  `[object Object]`, SQL/paths (capped 300-char single-line messages).
- No sensitive payload is `console.log`ged (no logging added anywhere).

## 19. Tests

New `src/lib/api-errors.test.ts` — **20 tests, all green** (covers the 14
required items: 1 string, 2 array, 3 field-array, 4 nested object, 5 nested
array/object + indices, 6 multiple fields, 7 empty/null/undefined, 8 unknown
object, 9 axios/network, 10 no `[object Object]`, 11 no leakage,
12 determinism, 13 path preservation, 14 cyclic safety, plus permission/5xx
kinds, hostile input, summary null-contract, category wrapper).

New `src/lib/error-mapping.test.tsx` — **9 integration tests, all green**
(real pages/editors, mocked transport only — items 15–23):

15. Homepage nested error → inline alert with all three dotted paths +
    concise field-context toast. 16. Product nested error via the exact page
    call path → section cards, form intact. 17. Category nested error →
    inline alert + aria wiring + typed value preserved + field-context
    toast. 18. Failed save stays dirty (value intact, guard still prompts).
    19. Success unchanged (refetch, edits cleared, no alert). 20. 403 →
    `permission_denied`. 21. Network → `server_connection_failed`, no box.
    22. Read-only intact (fieldset disabled, notice, no box). 23. Preview
    issuance 403 → safe generic toast, no box.

Extended: `homepage-form.test.ts` +1 (nested envelope → dotted paths),
`product-form.test.ts` +1 (deep nesting, no `[object Object]`).
No test weakened, skipped, or re-counted. Total new: **31 tests**
(20 + 9 + 2).

## 20. Runtime Verification

Canonical Phase 7.6 workflow followed (dev stopped + :3000 verified free
before build; prod probe on :3100; prod stopped + :3100 verified free; ONLY
`.next` deleted; dev restarted).

- `npm run build`: success (route table intact, all three preview routes
  present, dynamic).
- Prod `next start -p 3100`:
  | Check | Result |
  |---|---|
  | `/fa` | 200 (75,791 B), exactly one `<h1`, `dir="rtl"`, slogan «طلوع آفتاب، از خانه شماست», zero `vendor-chunks` error text, zero error-box strings in public SSR |
  | `/fa/admin/content/homepage` | 200 |
  | `/fa/admin/products/new` | 200 |
  | `/fa/admin/products/categories/new` | 200 |
  | product/category edit shells (bogus UUID) | 200 / 200 |
  | `/fa/preview/homepage` | 200, PREVIEW banner, `noindex` |
  | `/fa/products` | 200 |
  | `/sitemap.xml` | 200, zero `preview` hits |
  | `/robots.txt` | 200 |
  | `GET /api/v1/homepage/` (live Django :8000) | 200 |
- Post-probe: prod stopped, ONLY `.next` removed, dev restarted → `/fa`
  200 (one h1, RTL, slogan, no vendor error), Studio/new/preview shells 200.
- Incident (honestly recorded): after the first dev restart TWO `next dev`
  instances briefly shared `.next` (a late duplicate launch) and reproduced
  the EXACT Phase 7.6 `vendor-chunks/motion-dom.js` 500 family; canonical
  recovery (stop all project dev processes → verify free → delete ONLY
  `.next` → start exactly ONE) restored `/fa` 200. End state is a SINGLE
  dev chain; no source, dependency, or database action was involved.
- Click-level browser walkthrough: NOT TESTED (no browser automation —
  same standing as 7.5–8.4; evidence is SSR + unit/integration behavior +
  code inspection).

## 21. Database Safety

**None.** No migrations (`makemigrations` path untouched; zero backend
files in the delta), no seeds, no flush/reset, no content edits. Probes
were read-only GETs plus bogus-UUID edit shells (no rows created). The 15
untracked `AbrEnergy/media/**` UUID byproducts from this session's backend
re-run (same-suite artifacts per the 8.3/8.4 precedent) were deleted; zero
remain. Dev database content untouched. Frontend error mapping was verified
exclusively with mocked API responses (no fixtures needed).

## 22. Dependency Changes

**None.** `package.json` / `package-lock.json` untouched (not in git
status). No Next/React/Three/R3F/Drei/testing-library change.

## 23. Animation/Homepage Safety

**None.** Zero files under Hero3D, R3F/Drei, CursorGlow, particles, ripple,
gradients, ScrollReveal, TextReveal, parallax, tilt touched. Prod + dev
`/fa` markers confirm the stack intact (one h1, RTL, slogan, no
vendor-chunk error). `next.config.ts` untouched. No visual redesign of any
page (error boxes reuse the existing destructive/info palette).

## 24. Files Changed

Phase 8.5 delta only (stacked on the uncommitted 7.5/8.1–8.4 tree):

New (4): `abr-energy-frontend/src/lib/api-errors.ts` (shared normalizer),
`abr-energy-frontend/src/lib/api-errors.test.ts` (20 tests),
`abr-energy-frontend/src/lib/error-mapping.test.tsx` (9 integration tests),
`docs/reports/phase-08.5-error-mapping-report.md` (this file).

Modified (8.5 hunks only):
- `src/lib/product-form.ts` (`mapProductErrors` delegates to the shared
  normalizer; section contract unchanged)
- `src/lib/homepage-form.ts` (`mapHomepageErrors` delegates; same
  `string[]`/slice(0,8) contract)
- `src/lib/product-form.test.ts` (+1 nested test)
- `src/lib/homepage-form.test.ts` (+1 nested test)
- `src/app/[locale]/admin/content/homepage/page.tsx` (`saveErrors` state,
  kind-aware `onError`, inline `role="alert"` summary)
- `src/app/[locale]/admin/products/categories/[id]/edit/page.tsx` (same
  pattern + title `aria-invalid`/`aria-describedby`)
- `src/app/[locale]/admin/products/categories/new/page.tsx` (same)
- `src/components/shared/media-upload.tsx` (safe summary via shared
  normalizer, existing fallback kept)

Backend: zero files. Locales: zero files. Intentionally NOT changed:
ProductEditor, product host pages, guard hook, preview/token code,
relation pickers, animation stack, configs, dependencies.

## 25. Git Diff Summary

8.5 delta on the accepted 8.4 tree: 8 modified frontend files (all hunks
are error-mapping work per §24) + 3 new lib/test files + this report.
Pre-existing 7.5/8.1–8.4 modifications left intact; 15 same-session pytest
media byproducts removed (zero `media/` untracked remain); no source file
reverted or deleted. Every changed line is explainable as nested error
mapping work.

## 26. Known Limitations

1. Homepage/Category nested errors render in a top summary, not per-input
   (the forms have no per-field error UI by existing architecture; adding
   one would invent form architecture — STOP rule honored).
2. Product `identity` remains the bucket for unknown backend fields
   (pre-existing explicit mapping, preserved rather than re-designed).
3. Toast shows at most 3 items with a `(+N)` marker; the full list lives in
   the inline summary (toast space constraint, documented).
4. `success/message` envelope notes: top-level backend `message` strings
   surface as detail lines (intended — backend text preferred).
5. Depth cap 6 / traversal budget 200 silently truncate pathological
   payloads (never observed from this backend; safety over completeness).
6. No browser/AT walkthrough of the new summaries (NOT TESTED, §14/§20).
7. MediaUpload toasts remain unlocalized on the fallback path
   (pre-existing debt, out of scope).

## 27. Deferred Work

Phase 8.6 picker debounce, Homepage visual redesign, Product/Category UX
redesign, per-input error mapping (requires a form-architecture decision,
not an error-mapping decision), draft/versioning, scheduling, campaigns,
A/B testing, cart/checkout/orders/payment, new permissions, i18n
activation, Phase 9 — none started.

## 28. Acceptance Checklist

- [x] BUG-06 closed (§1, §5, §19)
- [x] existing backend envelope preserved (zero backend files)
- [x] no backend files changed
- [x] one shared normalization path (§8; no duplicated parsing)
- [x] nested objects handled (tested to depth + indices)
- [x] arrays handled (tested, incl. mixed)
- [x] field paths preserved where possible (dotted paths, §9)
- [x] no [object Object] (tested)
- [x] no raw JSON dump (tested)
- [x] no sensitive data leakage (tested, §18)
- [x] field-level errors shown where supported (Product sections; summaries elsewhere)
- [x] generic errors remain useful (concise field-context toasts)
- [x] permission errors remain meaningful (`permission_denied`, tested)
- [x] network errors remain safe (`server_connection_failed`, tested)
- [x] Homepage errors handled (test 15)
- [x] Product errors handled (test 16)
- [x] Category errors handled (test 17)
- [x] failed save preserves dirty (tests 17/18a)
- [x] successful save behavior unchanged (test 19)
- [x] Save & Continue behavior unchanged (test 19 + code path intact)
- [x] read-only UX unchanged (test 22 + 8.4 suite green)
- [x] preview architecture unchanged (test 23 + §17/§20)
- [x] fa/ar/en parity for any new UI keys (zero new keys, §15)
- [x] backend tests green (163)
- [x] frontend tests green (246/30; 31 new)
- [x] TypeScript green (0 errors)
- [x] lint green (0 errors / 55 warnings = baseline)
- [x] build green
- [x] runtime smoke green (§20)
- [x] no migration (§21)
- [x] no dependency changes (§22)
- [x] no animation changes (§23)
- [x] no Homepage redesign
- [x] final report written (this file)
- [x] Phase 8.6 NOT started
- [x] Phase 9 NOT started

## 29. Final Status

**Phase 8.5 COMPLETE.** End state: single `next dev` on :3000 (verified
`/fa` 200 + Studio/new/preview shells 200), Django :8000 untouched, :3100
free, transient fixtures deleted, ONLY `.next` was removed post-probe
(source files intact). Next session must stop dev before any
`npm run build` AND must start exactly one dev instance (shared-`.next`
hazard, §7.6/§20).

## 30. STOP Condition

STOP. No 8.6 picker debounce, no Homepage visual redesign, no Product UX
redesign, no Category UX redesign, no draft/versioning, no scheduling, no
campaigns, no A/B testing, no cart, no checkout, no orders, no payment, no
new permissions, no i18n activation, no Phase 9 work was started.

(End of file)

# Phase 09.5 — Lightweight Media Reuse / Media Picker Implementation Report

> Implementation of the APPROVED minimal Media Reuse / Media Picker slice per
> `docs/reports/phase-09.5-preflight-media-reuse-report.md`. All 20 approved
> decisions were honored; no deferred item was started.
> Report artifact: `docs/reports/phase-09.5-media-reuse-report.md`

## 1. Status

- **Phase:** 9.5-IMPLEMENTATION (complete).
- **Verdict:** IMPLEMENTED and verified. Reference-based media reuse
  (one `MediaFile` ← many consumer rows, zero duplication, zero migrations)
  is live behind the additive API + dialog slice below.
- **Scope discipline:** no DAM, no folders/tags, no delete UI, no reference
  counting, no ownership/visibility model, no new roles/permissions, no
  migration, no editor redesigns, no `admin/media` rewrite, no SVG/new-type
  support, no article/service/project galleries.

## 2. Baseline

- Backend before: `python -m pytest apps/` → **187 passed**.
- Frontend before: `npm run test` → **50 files / 427 tests passed**.
- `npx tsc --noEmit` clean; `npm run lint` 0 errors (55 pre-existing
  warnings); `makemigrations --check` clean; `npm run build` success
  (verified again after, §16–§18).
- Required reading completed (§2 of the task): all 10 listed reports were
  read; current source was inspected directly and won where it differed
  (notably: no `viewer` role exists; article cover is URL-only in the
  frontend; homepage max-4 visuals is unenforced frontend convention;
  `admin/media` grid uses wrong field names — all left untouched per scope).

## 3. Files changed

Phase 9.5 files only (the working tree also holds uncommitted earlier-phase
work — e.g. `duplication.py`, preview files, Phase 8.5 `media-upload.tsx`
normalizer — which this phase did NOT touch):

Modified (14):

1. `AbrEnergy/apps/media_manager/api/v1/views/media.py` — list permission
   `IsAdminUser` → `IsContentManager`; `+search`/`+ordering`; new
   `MediaDetailView` (GET `IsContentManager`, DELETE `IsAdminUser`);
   `MediaDeleteView` kept as back-compat alias (same route path + name).
2. `abr-energy-frontend/src/api/index.ts` — new `mediaApi.list/retrieve`
   (+`MediaListParams`).
3. `abr-energy-frontend/src/app/[locale]/admin/articles/new/page.tsx` —
   cover `[Choose existing]` + additive `coverImageId` → `cover_image`.
4. `abr-energy-frontend/src/app/[locale]/admin/articles/[id]/edit/page.tsx` —
   cover `[Choose existing]` + `cover_image` in form state, `''→null` on save.
5. `abr-energy-frontend/src/app/[locale]/admin/content/homepage/page.tsx` —
   singleton OG `[Choose existing]`.
6. `abr-energy-frontend/src/app/[locale]/admin/products/categories/new/page.tsx` —
   cover + OG `[Choose existing]`.
7. `abr-energy-frontend/src/app/[locale]/admin/products/categories/[id]/edit/page.tsx` —
   cover + OG `[Choose existing]`.
8. `abr-energy-frontend/src/components/homepage/homepage-visuals-editor.tsx` —
   per-row `[Choose existing]`.
9. `abr-energy-frontend/src/components/products/product-documents-manager.tsx` —
   multi document `[Choose existing]`.
10. `abr-energy-frontend/src/components/products/product-media-manager.tsx` —
    multi image `[Choose existing]`.
11. `abr-energy-frontend/src/components/products/product-seo-fields.tsx` —
    OG `[Choose existing]`.
12. `abr-energy-frontend/locales/fa.json`, `ar.json`, `en.json` — 8 picker
    keys each (fa-first, full parity).
13. `abr-energy-frontend/src/components/products/product-media-manager.test.tsx` —
    picker stub mock + 2 reuse tests.
14. `abr-energy-frontend/src/components/homepage/homepage-studio.test.tsx` —
    picker stub mock (provider-less render fix).

Created (4):

15. `AbrEnergy/apps/media_manager/tests/test_phase9_5_media_library.py` —
    25 backend tests.
16. `abr-energy-frontend/src/hooks/use-admin-media-list.ts` —
    `useAdminMediaList` + `MediaPickerItem`.
17. `abr-energy-frontend/src/components/shared/media-picker-dialog.tsx` —
    `MediaPickerDialog` + `ChooseMediaButton`.
18. `abr-energy-frontend/src/components/shared/media-picker-dialog.test.tsx` —
    19 frontend tests.
19. This report.

## 4. Backend API changes

`AbrEnergy/apps/media_manager/api/v1/views/media.py` (only backend source
file touched; serializers/models/urls/admin untouched):

- `GET /api/v1/media/` — permission widened `IsAdminUser` →
  `IsContentManager` (the one-line preflight blocker fix); additive
  `?search=` (`icontains` over `original_name, alt_text`, mirroring
  `MediaFileAdmin.search_fields`) and `?ordering=` allow-list
  (`-uploaded_at, uploaded_at, original_name, -original_name`; anything else
  falls back to model default `-uploaded_at`). Existing `?file_type=` /
  `?subfolder=` exact filters, `StandardPagination` (20/max-100), and the
  `MediaFileListSerializer` shape are byte-identical.
- `GET /api/v1/media/<uuid:pk>/` — NEW retrieve on the existing detail route
  (`IsContentManager`, same serializer) for stale-selection validation.
  Implemented as `MediaDetailView(RetrieveDestroyAPIView)` with
  per-method permissions (GET → `IsContentManager`, DELETE →
  `IsAdminUser`); `MediaDeleteView` remains as an alias so the route path,
  route name (`media-delete`), and dead `admin_urlpatterns` are untouched.
- Upload (`IsContentManager`, same validation), delete (`IsAdminUser`, same
  cascade/null fate), and `cleanup_temp_media` are behavior-identical.

## 5. Permission changes

- List/retrieve: `IsAdminUser` → `IsContentManager`
  (super_admin ✅, website_admin ✅, content_manager ✅ now allowed;
  engineer/customer/anon still 403/401 — pinned by tests).
- Delete/cleanup: unchanged `IsAdminUser`; content_manager DELETE → 403
  (pinned). No new role, no new permission class, no per-object logic, no
  public endpoint. The media library is a shared staff pool by construction
  (no private-media concept exists); list returns only the pre-existing
  serializer fields (no `uploaded_by` identity expansion).

## 6. Media picker architecture

- `MediaPickerDialog({open, onOpenChange, mode, multiple, selectedIds, onSelect})`
  (`src/components/shared/media-picker-dialog.tsx`) — ONE component for both
  modes; `mode="image"|"document"` is mandatory and maps to `?file_type=`
  (never mixed browsing). Dialog primitives from `ui/dialog` (focus trap,
  title, close label inherited).
- Mount-fresh body per open session: search/page/staging initialize from
  props via `useState` initializers; closing unmounts and discards everything
  (no reset effects — lint `set-state-in-effect` clean by construction).
- `ChooseMediaButton` trigger renders `[Choose existing]` beside every
  existing upload control; upload components are composed, never replaced.
- Data: `mediaApi` (`src/api/index.ts` conventions) +
  `useAdminMediaList(['admin-media', params], staleTime 30 s,
  `keepPreviousData`, `enabled` only while open). No per-query `retry`
  override (provider default applies). Seen-row cache resolves staged ids
  across pages on Apply. Never caches binary bytes; cards use existing
  `url`/file rows only.
- `admin/media` page NOT redesigned; picker is dialog-based and modal-local.

## 7. Consumer integrations

All additive `[Upload] [Choose existing]` pairs writing through the existing
`onUpload/onChange → set()` path (dirty/save/guard inheritance, §10):

- Product gallery (`ProductMediaManager`): multi image; skips already-attached
  ids; `renumber()`/cover-first/remove/reorder untouched; new
  `ProductImage` rows carry the existing `media_file` id.
- Product documents (`ProductDocumentsManager`): multi document (PDF);
  title defaults to filename sans `.pdf`; `doc_type catalog/active` defaults;
  backend `ProductDocument.clean()` remains the authoritative type gate.
- Product OG (`ProductSeoFields`): single image → `og_image_id/url`.
- Category cover + OG (new + edit pages): single image each →
  `cover_id/url`, `og_image_id/url`.
- HomepageVisuals (per-row): single image → row `{image, image_url}` only;
  row alt/order/enabled/link, ordering, and (unenforced) max-4 convention
  unchanged; shared file across rows allowed (rows stay independent).
- Homepage singleton OG: single image → `og_image_id/url`.
- Article cover (new + edit): single image; the small additive `fileId` fix
  (`cover_image` id alongside legacy URL; `''→null` on edit save; old
  URL-only rows keep rendering). No article gallery created.
- Service/Project/Article-gallery wiring: DEFERRED (no consumer UI exists).

Targeted `key={url}` remounts on single-slot `MediaUpload`s only, so the
picker-selected preview syncs despite the pre-existing stale-`currentImage`
prop (preflight §12; scoped to reuse slots, no global upload cleanup).

## 8. Reuse semantics

`existing MediaFile ID → new/updated consumer reference`. Verified by tests:
one file attached to two products + one visual + one OG leaves
`MediaFile.objects.count()` unchanged and the stored `file.name` identical
(zero files touched/copied, zero binaries duplicated, zero ownership change).

## 9. Delete/lifecycle behavior

Option A (preflight recommendation): NO delete in the picker, NO reference
counting, NO orphan logic, NO `on_delete` change. Raw admin DELETE endpoint
unchanged and unlinked from the UI; deleting a consumer still orphans its
`MediaFile` exactly as before (no regression, no improvement). Shared-delete
CASCADE fate documented in the picker hint string (no new file is
created/copied; selection is by reference).

## 10. Error handling

Exclusively the Phase 8.5 normalizer (`normalizeApiError →
summarizeNormalizedError`): 401/403 → `admin.permission_denied` notice;
other failures → safe summary + retry; nested envelopes never render
`[object Object]` (asserted). Upload validation, save-time FK 400s
(`unknown ids`), and relation errors flow through the existing
section/toast paths unchanged.

## 11. Accessibility

Real dialog (role/title/description/close), `aria-pressed` + `aria-label`
(full filename) on cards, selected Check badge (`aria-hidden`), labeled
search/pager/cancel/confirm, disabled states, autofocus search, `dir="ltr"`
filenames vs `dir="auto"` free text, logical properties (`start/end`,
`me-`), RTL-mirrored pager chevrons. No custom a11y framework; full AT
testing unavailable (stated).

## 12. Localization

8 keys × fa/ar/en (`media_choose_existing`, `media_picker_title_image`,
`media_picker_title_document`, `media_picker_hint`, `media_picker_search`,
`media_picker_empty`, `media_picker_select` + reuse of existing
`common.*` / `admin.retry|permission_denied|failed_load`): fa-first, full
parity, zero hardcoded English strings, RTL-correct.

## 13. Performance

Shared `useDebouncedValue` (300 ms) — one request per settled burst
(asserted: A→AB→ABC fires once with ABC); server pagination (20);
`keepPreviousData`; 30 s staleTime; no N+1 (row-local serializer fields);
no binary fetch; no transforms/CDN work. Upload flow invalidates only
`['admin-media']`; selection invalidates nothing.

## 14. Backend tests

New `AbrEnergy/apps/media_manager/tests/test_phase9_5_media_library.py`
(25 tests, isolated `abrenv_test` Postgres DB): list/retrieve permission
matrix (anon 401; customer/engineer 403; content_manager/website_admin/
super_admin 200); retrieve 404; search (name/alt/case-insensitive/empty);
image+document filters; pagination envelope + page_size cap; default
newest-first + explicit + invalid ordering fallback; exact safe-field sets
for list+retrieve; upload permission+validation unchanged (svg/mime/bad-pdf);
multi-consumer reuse with unchanged count + intact file; invalid UUID on
product write → 400; PDF-into-`ProductDocument` accepted /
image-into-`ProductDocument` `full_clean` rejected; delete matrix unchanged
(content_manager 403; website_admin/super_admin 204); GET non-mutating.

## 15. Frontend tests

New `media-picker-dialog.test.tsx` (19) + 2 gallery reuse tests in
`product-media-manager.test.tsx`: open, image/document modes (+type-filter
params), debounce single-request, pagination + URL-unchanged, loading,
empty, error+retry, 403 permission state, single/multi select + toggle-off,
confirm-disabled-until-pick, cancel-clean + staging reset on reopen,
RTL/LTR attrs + `aria-pressed`, no-`[object Object]`, product
documents/OG, category cover+OG (both triggers), homepage visuals row +
homepage OG save payload (`og_image: id`), article cover submit payload
(`cover_image: id`), upload-path coexistence. Existing suites needed only
two stub-mock additions (`product-media-manager`, `homepage-studio`
provider-less renders); zero existing-test behavior changes.

## 16. TypeScript/lint/build

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors. 55 warnings pre-existing + 1 new
  `@next/next/no-img-element` on picker thumbnails (consistent with every
  existing CMS preview; no new architecture).
- `npm run build`: success (all routes compiled; warnings only).

## 17. Migration result

`python manage.py makemigrations --check --dry-run` → **No changes
detected** (only the pre-existing ckeditor W001 warning). Zero migrations,
as approved.

## 18. Runtime smoke

Canonical workflow followed (no `build` during `dev`; ports verified free
before each step):

- Prod `next start :3100`: `/fa`, `/fa/products`,
  `/fa/products/categories`, `/fa/admin`, `/fa/admin/products`,
  `/fa/admin/products/categories`, `/fa/admin/products/new`,
  `/fa/admin/articles/new`, `/fa/admin/content/homepage`, `/sitemap.xml`,
  `/robots.txt` → all **200**; webpack chunk **200** (no vendor-chunk
  failure). Server stopped; ONLY `.next` deleted.
- Dev `next dev :3000` (exactly one chain): `/fa` → **200**.
- End state: `:3000` dev serving, `:3100` free.
- Django `:8000` was unavailable in this environment — no live API
  verification is claimed; API behavior is covered by the 25 backend tests
  against the isolated test DB. No browser-AT pass (stated limitation).

## 19. Data-safety statement

No `flush/reset/seed` against any real/dev DB; no media/product/category
deletion; no reference rewrites; no file copies; no destructive migration.
Backend tests ran on the isolated `abrenv_test` Postgres DB only. Test file
uploads write into `AbrEnergy/media/` (test settings do not override
`MEDIA_ROOT` — pre-existing gap, also true for earlier phases); the 259
files created by THIS session's runs (dated 2026-09-24) were deleted
afterwards; pre-existing residue was left untouched. Frontend tests are
fully mocked (no network, no DB).

## 20. Known limitations

1. `admin/media` grid still uses wrong field names and has no search/pager
   (pre-existing; out of scope by decision).
2. `MediaUpload` stale-prop + unrevoked blob-URL issues remain except the
   scoped `key` remounts on reuse slots.
3. Homepage max-4 visuals is still frontend-conventional (no backend cap
   found) — preserved, not introduced.
4. Article admin write shape otherwise still sends legacy fields the backend
   ignores (`cover_image_url`, locale-flat fields) — only `cover_image` was
   added; no article editor redesign undertaken.
5. `ArticleWriteSerializer.cover_image` accepts any `MediaFile` (PDF not
   blocked server-side for article cover) — picker `mode="image"` is the
   UX gate; backend image-slot validation was deemed non-minimal and deferred.
6. No live-Django smoke (see §18); no browser AT verification.

## 21. Deferred items

Full DAM, folders, tags, bulk actions, media delete UI, orphan cleanup,
reference counting, ownership/private-media, new roles/permissions, media
editing/cropping/transforms/CDN, versioning, approvals, analytics, storage
migration, article/service/project galleries, public library, standalone
library route + dashboard card, URL-persisted picker state, SVG/new MIMEs —
none implemented, none started.

## 22. Git diff/status summary

- Phase 9.5 footprint: 14 modified + 4 created source files + this report
  (§3). Backend diff is confined to
  `AbrEnergy/apps/media_manager/api/v1/views/media.py` (+54/−3 in the
  pre-existing-file subset shown by `git diff --stat`).
- The tree was already dirty before this phase (uncommitted earlier-phase
  work: `duplication.py`, preview files, Phase 8.5 upload normalizer, many
  admin pages, `??` phase reports). Nothing outside §3 was modified by this
  phase; nothing was committed (not requested).
- Untracked test-media residue from this session's pytest runs was removed
  (§19); `git status` shows zero `media/` entries afterwards.

## 23. Final recommendation

Phase 9.5 is COMPLETE and verified: ship the approved slice as-is. Do NOT
start Phase 9.6 or any deferred item. Two suggested follow-ups (NOT this
phase): override `MEDIA_ROOT` to a tmp dir in `config/settings/test.py` so
test uploads stop polluting the working tree; consider the additive
backend image-type check for gallery/OG/cover/visual/article-cover writes
(preflight §23.9) if PDF-in-image-slot ever surfaces in practice.

---

# FINAL REPORT / SUMMARY

- **What changed:** additive media-reuse slice — `IsContentManager`
  list/retrieve + search/ordering on `/api/v1/media/` (+ new retrieve on the
  existing detail route, delete untouched); one `MediaPickerDialog`
  (`mode=image|document`, single/multi, debounced search, server pager,
  loading/empty/error/permission states, RTL + fa/ar/en); `mediaApi` +
  `useAdminMediaList`; `[Choose existing]` beside every existing upload in
  product gallery/documents/OG, category cover/OG (new+edit), homepage
  visuals (per-row) + singleton OG, article cover (new+edit, incl. the small
  `cover_image` id fix). Reference-based reuse only: no copies, no new
  `MediaFile`, no migration, no delete UI, no admin/media redesign.
- **Files changed:** 14 modified + 4 created + this report (exact list §3).
- **Backend tests:** 187 → **212 passed** (+25 new,
  `test_phase9_5_media_library.py`, isolated test DB).
- **Frontend tests:** 50 files/427 → **51 files/448 passed** (+19 dialog
  suite +2 gallery reuse; 2 stub-mock additions to existing suites, zero
  behavior changes).
- **tsc:** clean. **lint:** 0 errors (55 pre-existing warnings + 1
  consistent new `<img>` warning). **migrations:** No changes detected.
  **build:** success.
- **Runtime:** prod `:3100` — 11 routes + 1 chunk all 200, then stopped;
  ONLY `.next` deleted; dev `:3000` — `/fa` 200 (one chain left running);
  `:3100` free at end. Django `:8000` unavailable — no live API claim.
- **Known limitations:** §20 (admin/media rot, MediaUpload debt except
  scoped remounts, unenforced visual max-4, legacy article payload fields,
  no server-side image-slot gate, no AT pass).
- **Explicit STOP:** Phase 9.5 ends here. No Phase 9.6, no deferred items,
  no redesigns.

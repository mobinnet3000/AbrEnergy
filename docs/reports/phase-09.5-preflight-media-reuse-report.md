# Phase 09.5 Preflight — Media Reuse / Lightweight Media Library Architecture Audit

> READ-ONLY preflight. No implementation, no migrations, no DB/file changes were made.
> Report artifact: `docs/reports/phase-09.5-preflight-media-reuse-report.md`

## 1. Status

- **Phase:** 9.5-PREFLIGHT (discovery only).
- **Verdict:** A lightweight reusable Media Library / Media Picker is **feasible with zero migrations** as a strictly additive layer on top of the existing `MediaFile` architecture. Reuse-by-reference (one `MediaFile` ← many consumer rows) is already the schema reality (proven by Phase 9.4 duplicate, which copies `media_file_id` without creating files).
- **Blocking decision before implementation:** the current permission split (`upload = IsContentManager`, `list/delete = IsAdminUser`) means `content_manager` — the primary CMS author — **cannot list media today**. A minimal additive permission change (widen list/retrieve to `IsContentManager`, keep delete restricted) is required; otherwise any picker is dead on arrival for that role.
- **Absolute stop:** no code, migration, permission, route, or UX change was made in this phase. See §24.

## 2. Baseline

Reports read in full (all in `docs/reports/`):

- `phase-09-preflight-report.md` (note: actual filename is `phase-09-preflight-report.md`, not `phase-09.0-…`), `phase-09.1-list-efficiency-report.md`, `phase-09.2-content-lists-dirty-guards-report.md`, `phase-09.3a-url-persisted-list-state-report.md`, `phase-09.3b-dashboard-hub-report.md`, `phase-09.4-preflight-duplicate-clone-report.md`, `phase-09.4-duplicate-clone-report.md`, `phase-08.5-error-mapping-report.md` (actual filename `phase-08.5-error-mapping-report.md`), `phase-08.4-read-only-ux-report.md` (actual `phase-08.4-read-only-ux-report.md`), `phase-07.5-cms-acceptance-audit-report.md`, `phase-07-cms-content-homepage-report.md`.

Key inherited constraints (must not be regressed):

1. **Permissions:** `IsContentManager = super_admin | website_admin | content_manager` (`AbrEnergy/apps/users/api/v1/permissions.py:23-33`). No per-field splits; frontend gating is UX-only, backend authoritative. No `viewer` role exists (`apps/users/choices.py:4-9`; grep `viewer` = 0 hits).
2. **Errors:** single normalizer `normalizeApiError / flattenNormalizedError / summarizeNormalizedError` (`abr-energy-frontend/src/lib/api-errors.ts`). Media Picker must reuse it; no second error system.
3. **List state:** canonical URL-state helpers in `src/lib/admin-list-query.ts` (debounced search + `replace` on type/filter, `push` on pager, `StandardPagination` 20/max-100). Picker-as-modal should stay modal-local (no URL persistence); only a future standalone library route would adopt URL state.
4. **Dirty guards:** `useDirtyNavigationGuard` (single Stay/Leave `ConfirmDialog`, `beforeunload` only). Any picker selection applied to a form must flow through the host form's existing `set()/edits` path so dirty semantics are unchanged.
5. **Read-only UX:** fieldset-disabled pattern only for Homepage Studio `!canManageHomepage` (`src/app/[locale]/admin/content/homepage/page.tsx:324-358`). Picker must degrade the same way (disable dropzone/delete + notice, backend still enforces).
6. **Duplicate semantics:** `duplicate_product/category` (`AbrEnergy/apps/products/duplication.py`) copies images/documents as **new rows pointing at the same `media_file_id`** with zero new `MediaFile` rows and zero file copies (asserted in `apps/products/tests/test_phase9_4_duplicate.py:271-279`). This is the exact reuse-by-reference shape the picker would produce. Caveat: `ProductImage.media_file` is `CASCADE`, so deleting a shared `MediaFile` deletes join rows on all products.
7. **Dashboard hub:** `admin/page.tsx` patterns (parallel tiny queries, per-card isolation, filtered-URL deep links). A media card would follow the same pattern.

Source tree inspected directly (evidence with `file:line` throughout). No behavior inferred where absent — "does not exist" is stated explicitly.

## 3. Media domain audit

### 3.1 Model — `AbrEnergy/apps/media_manager/models.py:14-70` (only model in app)

| Field | Definition | Notes |
|---|---|---|
| `id` | `UUIDField(pk, default=uuid4, editable=False)` (`:27`) | Stable reference key; consumers carry it as UUID string |
| `file` | `FileField(upload_to=media_upload_path, validators=[FileExtensionValidator([jpg,jpeg,png,webp,pdf])])` (`:28-31`) | Second validation layer (serializer is primary) |
| `thumbnail` | `VersatileImageField(upload_to="thumbnails/", blank+null)` (`:32-34`) | **Never populated** — no assignment anywhere in codebase (grep `thumbnail` only reads it in `get_thumbnail_url`). Dead field in practice |
| `original_name` | `CharField(500)` (`:35`) | Client filename, read-only in API |
| `file_type` | `CharField(10, choices=[image,document], db_index=True)` (`:36-38`) | Derived from extension on save (`:65-70`) and in serializer (`:59`) |
| `mime_type` | `CharField(100, blank, default="")` (`:39`) | Client-supplied `content_type`, not sniffed |
| `file_size` | `IntegerField(default=0)` (`:40`) | Client-supplied `size`, bytes |
| `width/height` | `IntegerField(null+blank)` (`:41-42`) | Pillow-extracted for images only; silently skipped on failure (`serializers/media.py:74-79`) |
| `alt_text` | `CharField(500, blank, default="")` (`:43`) | Writable on upload; rarely edited afterwards (no update endpoint) |
| `subfolder` | `CharField(100, default="general")` (`:44`) | Client-supplied grouping hint only, not a security boundary |
| `uploaded_by` | `FK(users.User, SET_NULL, null+blank, related_name="uploaded_media")` (`:45-48`) | Set on upload (`serializers/media.py:66`); no ownership enforcement; added in `migrations/0002_initial.py:18-21` |
| `is_temp` | `BooleanField(default=False, db_index=True)` (`:49`) | Normal uploads never set it → cleanup never touches them |
| `upload_completed` | `BooleanField(default=True)` (`:50`) | No workflow uses it; always true |
| `uploaded_at` | `DateTimeField(auto_now_add)` (`:51`) | Model `ordering = ["-uploaded_at"]` (`:56`); composite indexes `(file_type, subfolder)` and `(is_temp, uploaded_at)` (`:57-60`) |
| `caption/title` | **Does not exist** | Only `alt_text` + `original_name` |
| `created/updated` | Only `uploaded_at`; **no `updated_at`** | |
| `visibility (public/private)` | **Does not exist** | No visibility flag of any kind |
| `owner scoping` | **Does not exist** beyond informational `uploaded_by` | |

### 3.2 Storage / upload path

- `media_upload_path` (`models.py:7-11`): images → `{subfolder}/{id}.{ext}`; documents → `documents/{id}.{ext}` (subfolder ignored). Filename is `{uuid}.{client-ext}` — no collision risk, no user path traversal (ext is taken from client filename but the stored name is server-generated UUID).
- Storage: default filesystem only. `MEDIA_URL="/media/"`, `MEDIA_ROOT=BASE_DIR/"media"` (`config/settings/base.py:124-125`); served via `static()` only when `DEBUG` (`config/urls.py:30-31`). No `STORAGES`/S3 override (grep negative). No CDN, no transformations (except unused `thumbnail` field; `VERSATILEIMAGEFIELD_SETTINGS create_images_on_demand=True` at `settings/base.py:233-240`).
- History: `migrations/0001` once allowed `gif,svg,bmp,doc,docx,xls,xlsx,ppt,pptx,mp4,avi,mov,mkv,zip,rar,txt`; `0003` narrowed images to `jpg,jpeg,png,webp`; `0004` added `pdf`. Current allow-list is deliberately narrow.

### 3.3 Validation (serializer is the real gate — `api/v1/serializers/media.py:21-53`)

- Images: ext ∈ `{jpg,jpeg,png,webp}` + `content_type` ∈ `{image/jpeg,image/png,image/webp}` + size ≤ 10 MB (`MAX_UPLOAD_SIZE`) + `Pillow Image.open().verify()`. **SVG/GIF/BMP explicitly rejected** (`test_phase1.py:51-59`, `evil.svg` → 400). No SVG handling exists anywhere (no sanitizer, no rasterizer) — a deliberate XSS control.
- Documents: ext `pdf` + `content_type == application/pdf` + size ≤ 25 MB (`MAX_DOC_SIZE`) + first-5-bytes `== b"%PDF-"`. No MIME sniffing beyond that header check.
- Model-level `FileExtensionValidator` is a redundant second layer only.
- Writable upload input: `file, alt_text, subfolder` only; everything else read-only (`serializers/media.py:8-19`). `create()` (`:55-81`) derives `file_type/original_name/mime_type/file_size/uploaded_by/width+height`.

### 3.4 Serializers / views / URLs / permissions

- Serializers: `MediaFileUploadSerializer` (`:8-81`, returns `id,file,original_name,file_type,mime_type,file_size,width,height,alt_text,subfolder,uploaded_at`); `MediaFileListSerializer` (`:84-107`, returns `id,url,thumbnail_url,original_name,file_type,file_size,width,height,alt_text,subfolder,uploaded_at` where `url=file.url`, `thumbnail_url=thumbnail.url or file.url (images) or ""`).
- Views (`api/v1/views/media.py:15-58`): `MediaUploadView` (Create, `MultiPartParser+FormParser`, **`IsContentManager`**) → `POST /api/v1/media/upload/` 201; `MediaListView` (List, **`IsAdminUser`**, filters `?file_type=&subfolder=`) → `GET /api/v1/media/`; `MediaDeleteView` (Destroy, **`IsAdminUser`**) → `DELETE /api/v1/media/<uuid:pk>/`; `cleanup_temp_media` (`IsAdminUser`) → `POST /api/v1/media/cleanup/`.
- Routes (`api/v1/urls/__init__.py:6-11`, mounted at `config/api_v1.py:27` under `api/v1/`). `admin_urlpatterns` (`:13-18`) is **defined but never included** anywhere (grep `admin-media|admin_urlpatterns` = zero includes) — dead code. `cleanup/` is declared after `<uuid:pk>/` but safe (`<uuid:pk>` won't match literal `cleanup`).
- Pagination: list uses global `StandardPagination` (`settings/base.py:138-139`, 20/max-100) but **no `pagination_class` override, no `SearchFilter/OrderingFilter`** on `MediaListView` (grep negative). Only exact-match `file_type/subfolder` filters exist.
- Admin: `MediaFileAdmin` (`admin.py:6-13`) with `list_filter=[file_type,subfolder,is_temp]`, `search_fields=[original_name,alt_text]` — Django admin only, not an API.
- **Does not exist:** retrieve/detail endpoint (`GET /<uuid>/`), update/PATCH endpoint (alt rename impossible via API), `permissions.py` / `signals.py` in the app, `post_delete` file cleanup, reference counting, trash/soft-delete, folders, tags, bulk ops, rename, download-as-attachment.

### 3.5 Deletion / replacement / cleanup (current behavior)

- `MediaFile` **can** be deleted directly via `DELETE /api/v1/media/<uuid>/` (admin roles only). No UI calls it.
- Deleting a `MediaFile`: `CASCADE` join rows (`ProductImage`, `ProductDocument`, `ArticleImage`, `ProjectImage`, `GalleryImage`, `HomepageVisual`) are **deleted with it**; `SET_NULL` holders (category cover/og, product og, homepage og, article cover, service image) are **nulled** and survive. See consumer matrix (§4).
- Deleting a parent (Product/Article/…) cascades to the join row but **never** to `MediaFile` — orphans accumulate silently.
- **No file-on-disk cleanup:** neither queryset `delete()` nor `cleanup_temp_media` removes `file`/`thumbnail` from storage (no `post_delete` handler anywhere).
- **No orphan detection/cleanup** except `cleanup_temp_media`, which only handles `is_temp=True AND uploaded_at < now-7d`, capped at 100 ids per call while reporting the full count (count/delete mismatch bug — read-only note, not fixed here). Since the upload serializer never sets `is_temp=True`, real uploads are never cleaned.
- **No replacement behavior:** there is no "replace file in place" endpoint. Every consumer replace = upload new `MediaFile` + repoint FK + old row orphans. Nothing deletes the previous `MediaFile`.

## 4. Consumer matrix (field-level)

Grep `MediaFile` ≈ 60 hits / `media_file` ≈ 70 hits under `AbrEnergy/`. Complete map:

| # | Consumer model.field | File:line | `on_delete` | `related_name` | Null/blank | Single/multi | Type constraint | Frontend upload today? | Stores MediaFile ID? | Displays existing? | Reuse possible via API today? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `ProductCategory.cover` | `apps/products/models.py:27-30` | `SET_NULL` | `product_categories_as_cover` | null+blank (optional) | single | image-only by UX (`MediaUpload` default accept), **no backend image-only check** | yes (`categories/new:313-317`, `edit:383-387`, `subfolder` default articles — sic) | yes (`cover_id`) | yes (preview) | yes — field accepts any existing `MediaFile` UUID incl. PDFs (no type validation) |
| 2 | `ProductCategory.og_image` | `apps/products/models.py:37-40` | `SET_NULL` | `product_categories_as_og` | null+blank | single | same as above | yes (`new:265-269`, `edit:335-339`) | yes (`og_image_id`) | yes | yes (same caveat) |
| 3 | `Product.og_image` | `apps/products/models.py:212-215` | `SET_NULL` | `products_as_og` | null+blank | single | image-expected, unenforced | yes (`product-seo-fields.tsx:63-68`, `subfolder="products"`) | yes (`og_image_id`) | yes | yes |
| 4 | `ProductImage.media_file` (+ `FK product CASCADE related_name=images`) | `apps/products/models.py:257-260` | `CASCADE` | `product_images` | required | multi (gallery) | image-expected, unenforced at product layer | yes (`product-media-manager.tsx:129`, `subfolder="products"`) | yes (`media_file` in `images_data`) | yes (grid + cover star + reorder) | yes — `ImageSerializer`/`DocumentSerializer` (`serializers/products.py:107-132`) carry `media_file` UUID + derived `url`; `addImage` early-returns without `fileId` (`:25`) = id-first attach already |
| 5 | `ProductDocument.media_file` (+ `FK product CASCADE related_name=documents`) | `apps/products/models.py:293-296` | `CASCADE` | `product_documents` | required | multi | **document-only enforced**: `clean():307-310` raises unless `file_type=="document"` | yes (`DocumentUpload`, hardcoded `subfolder='documents'`) | yes (`media_file` in `documents_data`) | yes (file row) | yes (and type-safe — wrong type 400s) |
| 6 | `HomepageConfig.og_image` (singleton pk=1) | `apps/homepage/models.py:108-111` | `SET_NULL` | `homepage_as_og` | null+blank | single | image-expected, `PrimaryKeyRelatedField(queryset=all)` unenforced (`serializers/homepage.py:533-535`) | yes (`admin/content/homepage/page.tsx:634-642`, `subfolder="homepage"`) | yes (`og_image_id/url`) | yes | yes |
| 7 | `HomepageVisual.image` (field named `image`) | `apps/homepage/models.py:228-230` | `CASCADE` | `homepage_visuals` | required | multi rows | image-expected, `VisualWriteSerializer.image = PrimaryKeyRelatedField(all)` (`:499`) unenforced | yes (`homepage-visuals-editor.tsx:64-69`, `subfolder="homepage"`) | yes (`image` + `image_url` pair) | yes | yes — same `MediaFile` may back many visual rows (nothing forbids it); empty `image==''` filtered on submit (`homepage-form.ts:166`) |
| 8 | `Article.cover_image` | `apps/articles/models.py:62-65` | `SET_NULL` | `articles_as_cover` | null+blank | single | image-expected, unenforced | yes but **URL-only**: `onUpload={(url)=>setCoverImage(url)}` (`articles/new:212-216`, `edit:211-215`) — `fileId` **discarded** | **no** (stores URL string, not ID) | yes | partial — API takes the FK but frontend never sends an ID; reuse requires frontend change |
| 9 | `ArticleImage.media_file` (+ `FK article CASCADE related_name=images`) | `apps/articles/models.py:108-111` | `CASCADE` | `article_images` | required | multi | image-expected | no UI found (no gallery editor; `ArticleImageSerializer` exists `serializers/article.py:36` but no manager component) | via API only | no gallery UI | yes via API, unused by UI |
| 10 | `Service.image` | `apps/services/models.py:40-43` | `SET_NULL` | `services` | null+blank | single | image-expected | **no** — service editors have zero media controls (grep `MediaUpload|cover|og_image|DocumentUpload` in service pages = 0 hits) | no | no | yes via API, unused by UI |
| 11 | `ProjectImage.media_file` (+ `FK project CASCADE related_name=images`) | `apps/projects/models.py:60-63` | `CASCADE` | `project_images` | required | multi | image-expected | **no** — project editors have zero media controls (same grep = 0) | no | no | yes via API, unused by UI |
| 12 | `GalleryImage.media_file` (+ `FK category CASCADE related_name=images`) | `apps/gallery/models.py:35-38` | `CASCADE` | `gallery_images` | required | multi | image-expected | no CMS UI found | via API only | — | yes via API |

Explicit non-consumers (direct image fields, not `MediaFile`): `articles.Category.image` (`VersatileImageField`, `apps/articles/models.py:16`), `users.User.avatar` (`apps/users/models.py:30-35`), `core.SiteSettings.logo/favicon/hero_background_image` (`apps/core/models.py:11-12,26-28`). No `ServiceCategory`/`GalleryCategory`/`Project`/section media FKs exist.

Write-path note: product/homepage/article/category serializers already accept **raw UUIDs** for all FK consumers (`PrimaryKeyRelatedField(queryset=MediaFile.objects.all())` or UUID-string payload fields, e.g. `serializers/products.py:376-379`, `serializers/homepage.py:499,533-535`). That means "attach existing" needs **no serializer change** — the picker only has to supply an ID the user is authorized to see.

## 5. Upload flow audit

### Frontend → backend trace (images)

`MediaUpload.handleFile` (`media-upload.tsx:23-58`) → `FormData{file, subfolder}` → `POST /media/upload/` (`:38`) → reads `res.data.file` (URL) + `res.data.id` (`:42-43`) → `setPreview` + `onUpload(url, fileId)` (`:44-45`) → host form `set()` dirties form (§11). Failure → shared normalizer summary toast (`:52-53`), preview reverts. `DocumentUpload` (`document-upload.tsx:23-36`) is identical except hardcoded `accept=".pdf,application/pdf"` + `subfolder='documents'` and **no normalizer** (bare hardcoded Persian toasts — pre-existing debt).

### What is reusable / upload-only today

- Reusable today: the **attach side** (every FK consumer accepts an existing UUID) and the **duplicate side** (Phase 9.4 copies `media_file_id` with zero file copies).
- Upload-only today: the **discovery side**. No list/search/select/reuse UI exists: `admin/media/page.tsx:1-64` is a first-page read-only grid with no search/filter/pagination/selection/delete/retry, using wrong field names (`item.file/name/size` vs serializer's `url/original_name/file_size` — renders mostly empty), and it is unreachable in practice for `content_manager` (403, see §6).
- Every upload creates exactly one new `MediaFile` (no dedup, no hash, no reuse prompt). No existing `MediaFile` ID can be selected in any editor today.
- A `MediaFile` **can** technically attach to unlimited consumers (no uniqueness constraint on any FK; duplicate proves it). No code assumes single-consumer — but no code **protects** multi-consumer either (CASCADE delete is the sharp edge, §8).
- Replacing an image never deletes the previous `MediaFile` (orphan accrual). Deleting a consumer never deletes its `MediaFile` (orphan accrual). Deleting a `MediaFile` cascades/nulls into consumers (§3.5) — the only cross-consumer destructive path.

## 6. Permission / security audit — CRITICAL

### Current matrix (verified in code)

| Action | Endpoint / gate | `super_admin` | `website_admin` | `content_manager` | `engineer` / `customer` / anon |
|---|---|---|---|---|---|
| Upload media | `POST /media/upload/` `IsContentManager` (`views/media.py:17`) | ✅ | ✅ | ✅ | 403 / 401 |
| List media | `GET /media/` `IsAdminUser` (`:29`) | ✅ | ✅ | **❌ 403** | 403 / 401 |
| Retrieve metadata | **no endpoint** | — | — | — | — |
| Attach media to product/category/homepage | product/category/homepage admin writes (`IsContentManager`) — any UUID accepted | ✅ | ✅ | ✅ (blind: can attach IDs they cannot list) | 403 |
| Delete media | `DELETE /media/<uuid>/` `IsAdminUser` (`:44`) | ✅ | ✅ | **❌ 403** | 403 / 401 |
| Cleanup temp | `POST /media/cleanup/` `IsAdminUser` (`:50`) | ✅ | ✅ | ❌ | 403 / 401 |
| Browse `admin/media` page | `GET /media/` via `admin/media/page.tsx:21` | ✅ | ✅ | ❌ (toast `failed_load`) | gated by shell |

Roles source: `apps/users/api/v1/permissions.py:5-54`; roles enum `apps/users/choices.py:4-9` (`super_admin, website_admin, content_manager, engineer, customer`; **no `viewer`**). Frontend helpers `src/lib/admin-permissions.ts:5-33`.

### Answers A–F

- **A. Should all content managers see all reusable media?** Architecture cannot answer alone — it is a product decision. Evidence: today they see **none** via API (403) yet can attach **any** UUID blindly (including admin-uploaded PDFs). Two coherent options: (i) open list to `IsContentManager` (simplest, matches upload privilege — you can attach what you can upload); (ii) introduce scoping. Recommendation: (i) for Phase 9.5, because every existing consumer write is already `IsContentManager`-gated, so list parity adds no new write capability. Record the decision explicitly (§21.1).
- **B. Should media ownership be user-scoped?** Not currently — `uploaded_by` is informational only (`SET_NULL`, no queryset filtering, no object permission). Introducing ownership scoping would be a new access model (new filters, new tests, UX for "my vs all") — **deferred**. Do not build it in 9.5.
- **C. Should media be content-scoped?** Not currently — `subfolder` is a free-text hint, freely spoofable, with no enforcement. Treating it as a boundary would be security theater. **Deferred** (folders are a DAM feature, explicitly out of scope).
- **D. Is there any private-media concept?** **No.** No visibility flag, no private bucket, no signed URLs, no per-object permission. Every `MediaFile` row + file is CMS-visible to whoever can list, and file bytes are served to anyone with the URL (public `/media/` static or future web server alias).
- **E. Could a list endpoint expose sensitive material?** Yes — by design, because nothing is marked sensitive. Listing surfaces `original_name` (client filenames may contain internal project/customer names), `alt_text`, `subfolder`, `file_size`, dimensions, `uploaded_at`, `uploaded_by` id, and `url` for every row including PDFs. Mitigation is not filtering (no signal to filter on) but **decision + hygiene**: restrict list to `IsContentManager+` (already authenticated CMS staff, same population that can upload/attach today), return the existing `MediaFileListSerializer` shape unchanged (no new fields), and document that the library is a shared staff pool with no private uploads. If the business later needs private assets, that is a new visibility model — out of 9.5.
- **F. New permission required, or is `IsContentManager` enough?** `IsContentManager` list/retrieve coverage is sufficient for 9.5. Smallest additive change: change `MediaListView.permission_classes` (and any new retrieve view) from `IsAdminUser` to `IsContentManager`; **keep `DELETE` at `IsAdminUser`** (or disable delete in UI entirely — §8 recommends Option A). No new role, no new permission class, no per-object logic. One-line backend change + permission tests.

## 7. Media type / picker scope decision

Per-consumer analysis:

| Consumer | Needs | Picker filter |
|---|---|---|
| Product gallery (`ProductImage`) | images only (unenforced today; PDFs would break gallery UI) | `file_type=image` enforced client-side **and** documented; consider backend `validate` on `images_data.media_file` in 9.5 only if cheap (additive serializer check) — otherwise rely on picker filter + existing display guards |
| Product documents (`ProductDocument`) | PDFs only (`clean()` enforces `file_type=="document"`) | `file_type=document`; picker in "document mode" |
| Product / Category / Homepage OG (`og_image`) | images only (SEO/JSON-LD/social crawlers; a PDF URL in `og:image` is a public SEO defect — §16.11) | `file_type=image` |
| Category cover, Homepage visuals, Article cover | images only | `file_type=image` |
| `ArticleImage` / `ProjectImage` / `GalleryImage` / `Service.image` | images only | `file_type=image` (when UI arrives) |

Recommendation: **one picker component with a mandatory `mode: 'image' | 'document'` prop** (option C in the brief: images + documents with explicit type filtering, never mixed). No mixed-mode browsing in 9.5 — the mode maps to `?file_type=` on the list endpoint. Smallest abstraction that fits: the backend already filters by `file_type`; the frontend already splits uploaders (`MediaUpload` vs `DocumentUpload`).

## 8. Reuse semantics

Intended semantics: **ONE `MediaFile` ← many consumer references, zero physical duplication.** Verified safe at the schema level:

- All FKs are plain many-to-one with no uniqueness constraint preventing multiple references to the same row.
- Phase 9.4 duplicate already does exactly this in production code paths (`duplication.py:384,389,401`) with a passing no-new-`MediaFile` assertion.
- `HomepageVisual` rows each hold their own `image` FK: reusing a file across visuals creates **two visual rows sharing one file** (correct — rows carry distinct `alt/order/enabled/link_url`), never a shared row.
- Single-cover/single-OG fields just store the same UUID in two owners — independent `SET_NULL` slots, no coupling.

Cross-consumer hazards (must be designed around, not schema-fixed in 9.5):

- **Shared delete:** deleting `MediaFile X` used by Product A + B deletes both `ProductImage` rows (`CASCADE`) — one owner's admin action silently strips another product's gallery. `SET_NULL` consumers are safe (null, survive).
- **No reference counting:** nothing knows X has N references. A future "Delete" button cannot warn accurately without a counting query.
- **No orphan detection:** unused rows are invisible (only `is_temp` cleanup exists and never fires for real uploads).
- **No file copy:** do **not** propose physical copying — nothing in the architecture requires it, and copying would defeat dedup, break the duplicate precedent, and multiply storage without adding safety. Reuse-by-reference is the correct semantics; safety comes from delete policy (§9), not copies.

## 9. Delete / orphan / lifecycle policy

Current lifecycle: create (upload) → attach (via consumer writes) → parent-delete orphans file → file row deletable only by admins (cascades). No counting, no warnings, no disk cleanup.

Comparison for 9.5 (grounded in current architecture):

- **Option A — disable "Delete media" in UI for now (RECOMMENDED).** Zero new risk surface. The delete endpoint stays `IsAdminUser`-only and simply isn't surfaced in the picker. Orphans continue to accrue exactly as today (no regression, no improvement). Smallest safe change; unblocks reuse immediately.
- **Option B — delete only if unreferenced.** Requires a reference-count query across ~12 relations per delete (new code, new tests, TOCTOU race between check and delete). Safe but not minimal; defer to a later phase with proper tests.
- **Option C — delete with dependency warning + confirmation.** Requires B's counting plus UX (per-consumer dependency list, localized strings, confirmation flow). Correct long-term, but 2–3× the scope of A. Deferred.
- **Option D — soft-delete.** Requires a new field + migration + queryset filtering across every consumer + storage semantics. Directly contradicts the zero-migration goal. Rejected for 9.5.

Also note: even Option A leaves the raw `DELETE /media/<uuid>/` endpoint live for admins (current behavior). That is acceptable — it predates 9.5 and is role-restricted — but the picker must not link to it, and the threat model (§16.7) must record the shared-delete fate.

## 10. Data model / migration audit

- PK: `UUIDField` — stable, copyable, no migration needed.
- All FKs: plain `ForeignKey` with explicit `related_name`s, no `unique=True`, no `OneToOne` toward `MediaFile`, no `unique_together` involving media. **Nothing prevents multiple references to one row.**
- Indexes: `(file_type, subfolder)` supports the picker's `?file_type=` filter; `(is_temp, uploaded_at)` supports cleanup; `Meta.ordering = ["-uploaded_at"]` gives a sensible newest-first picker default.
- Nullable: single-slot consumers are all `null+blank` (clear/replace safe); multi-row joins are required-FK (row deleted, never nulled — correct).

Answers:

- Existing rows safely support multiple references? **Yes.**
- Any uniqueness constraint preventing reuse? **No.**
- New relation/table necessary? **No.**
- Reference metadata requiring a new model? **No** (alt/caption/order live on the join rows already: `ProductImage.alt_text/caption/sort_order/is_cover`, `HomepageVisual.alt/order/enabled/link_url`).
- **Migration required? No.** Zero-schema-change implementation is possible. (A future reference-count cache or soft-delete would need one — both deferred.)

## 11. API design audit (proposal only — NOT implemented)

Current conventions to follow: `StandardPagination` envelope `{count,next,previous,results}`; exact-match filterset style (`?file_type=&subfolder=`); UUID PKs; `{status, errors}` error envelope via `custom_exception_handler`; `IsContentManager` for CMS writes.

Smallest future surface (all under existing `/api/v1/media/` mount):

| Method | Route | Change vs today | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/media/?file_type=&search=&ordering=&page=&page_size=` | **widen permission to `IsContentManager`**; add `search` (+`ordering`) | Picker list. `search` over `original_name, alt_text` (mirrors `MediaFileAdmin.search_fields`); `ordering` allow-list `-uploaded_at` (+`original_name` if cheap). Reuse existing `MediaFileListSerializer` shape unchanged |
| `GET` | `/api/v1/media/<uuid:pk>/` | **new** (retrieve, `IsContentManager`) | Stale-selection validation (does this ID still exist?) + picker detail. Same serializer |
| `POST` | `/api/v1/media/upload/` | unchanged (`IsContentManager`) | "Upload new" tab inside picker reuses the exact current contract |
| `DELETE` | `/api/v1/media/<uuid:pk>/` | unchanged (`IsAdminUser`), **not surfaced in picker UI** | No picker delete in 9.5 (Option A) |

Not proposed in 9.5: PATCH/rename, bulk, folders, tags, usage-count endpoint, signed URLs, admin-namespace routes (existing `admin_urlpatterns` dead code should stay dead — do not resurrect a parallel namespace).

Safety invariants: list response must contain **only** the current `MediaFileListSerializer` fields (no `uploaded_by` username/email expansion, no absolute-path leakage); `search` must be bounded (`icontains`, paginated, max `page_size=100` via existing pagination); permission change is list/retrieve only — delete stays admin.

## 12. Frontend picker UX audit

Current upload UX (`media-upload.tsx:1-101`, `document-upload.tsx`): single-file `input[type=file]` + optimistic blob preview + direct `POST /media/upload/` + `onUpload(url, fileId)` + remove-X + toasts. Composite managers (`product-media-manager`, `product-documents-manager`, `homepage-visuals-editor`, `product-seo-fields`) own preview/reorder/cover/clear. No library, dialog, hook, or `mediaApi` exists (grep `MediaPicker|MediaLibrary|MediaDialog` = 0 files; `src/api/index.ts` has zero media methods).

Smallest reusable abstraction (fits existing code better than a framework):

```text
MediaUpload / DocumentUpload   (unchanged upload primitives)
    ↓  (picker COMPOSES them, does not replace them)
MediaPickerDialog              (new: search + type-filtered grid + paginate + [Upload new] tab + select)
    ↓  (controlled, single- and multi-modes)
per-consumer one-line wiring  ([Upload new] [Choose existing] side by side)
```

Picker contract (modal-local state — **no URL persistence**; URL-state helpers stay for full-page lists only):

- Modes: `single` (OG/cover) vs `multi` (gallery/documents) with `max` (gallery: uncapped but confirm large; documents: uncapped; OG/cover: 1). Duplicate selection ignored (id-present check).
- Tabs: `Choose existing | Upload new`. Upload tab embeds the existing uploader component so behavior/validation/toasts are identical; on success the new item auto-selects and the list invalidates.
- Grid: image thumbnails (`url`), document rows (icon + name + size); selected ring/badge; current-selection strip with remove; `Clear` for single slots.
- States: loading skeleton, empty (`no_media`), error + retry, `permission_denied` notice, debounced search (reuse `useDebouncedValue`, 300 ms, one request per settled burst — 9.1/9.3-A rule), `page_size=20` pager.
- Accessibility/RTL: real `Dialog` (`ui/dialog`), focus trap, `aria-selected`, labeled buttons (no hover-only X — current `group-hover:opacity-100` remove in `media-upload.tsx:72-79` is keyboard/touch-hostile), logical properties (`start/end`), `dir="ltr"` for filenames/URLs, `alt` fallbacks, full fa/ar/en key parity.
- Data: React Query `['admin-media', {file_type, search, page}]`, default 30 s `staleTime` (matches `providers.tsx:9`), invalidate `['admin-media']` after upload; never cache binary bytes.
- Dirty integration: picker selection calls the host's existing `onUpload/onChange → set()` path, so dirty latching is inherited with zero guard changes. Cancel/close without Apply selects nothing (no dirty pollution).
- Pre-existing bugs to not replicate: `MediaUpload` stale-`currentImage` prop (`useState(currentImage||'')` never syncs, `:20`), unrevoked blob URLs (`:28-29`, no `revokeObjectURL`), `admin/media/page.tsx` wrong field names (`item.file/name/size` vs `url/original_name/file_size`).

## 13. Consumer-specific UX matrix (future)

| Consumer | Media type | Single/multi | Existing upload | Reuse needed | Preview | Replace | Clear | Max | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Product images | image | multi | `ProductMediaManager` | **high** (same packshots across variants) | grid thumbs | remove + re-add | per-item remove | none enforced; picker `max` optional | enforce `file_type=image` in picker mode; cover-star logic untouched |
| Product documents | document | multi | `ProductDocumentsManager` + `DocumentUpload` | **high** (one datasheet across products) | file rows | per-item remove (fix dead replace path) | per-item remove | none | picker `mode=document`; backend `clean()` already type-safe |
| Product OG image | image | single | `ProductSeoFields` | medium | preview | remove→re-pick | yes | 1 | PDF must be unselectable (SEO defect prevention) |
| Category cover / OG | image | single ×2 slots | category new/edit pages | medium | preview | remove→re-pick | yes | 1 each | same slot component twice; fix `subfolder` default (`articles` sic) to `categories` when touching |
| Homepage visuals | image | multi rows (each single) | `HomepageVisualsEditor` | medium | row thumbs | per-row re-pick | per-row delete | **4** (frontend-enforced; no backend cap found — verify copy before relying) | shared file across rows allowed; row `alt/link/order/enabled` stay per-row |
| Homepage OG | image | single | Studio SEO section | low-medium | preview | remove→re-pick | yes | 1 | singleton config; read-only fieldset pattern when `!canManageHomepage` |
| Article cover | image | single | URL-only upload | medium | preview | remove→re-pick | yes | 1 | **requires** frontend change to store `fileId` (currently discarded) |
| Article gallery (`ArticleImage`) | image | multi | none | low | — | — | — | — | needs a manager UI first — defer picker wiring |
| Service image | image | single | none | low | — | — | — | — | no editor controls exist — defer |
| Project images | image | multi | none | low | — | — | — | — | no editor controls exist — defer |

Phase 9.5 scope recommendation: wire picker for **Product images + Product documents + Product/Category/Homepage OG + Category cover + Homepage visuals + Article cover (with the small fileId fix)**. Defer Service/Project/Article-gallery wiring until those editors have media controls at all.

## 14. HomepageVisual special audit

- Model: `HomepageVisual` (`homepage/models.py:226-243`): UUID pk, `image FK CASCADE related_name="homepage_visuals"` (required), `alt`, `order` (indexed), `enabled` (indexed), `link_url` (CTA-validated), `ordering = [order, id]`.
- Write path: `VisualWriteSerializer.image = PrimaryKeyRelatedField(all)` (`serializers/homepage.py:498-505`); update **deletes all rows then bulk-creates** (`:660-671`) inside `transaction.atomic` (`:614`). So every Studio save rewrites the visual set — shared files are unaffected (rows are recreated, `MediaFile`s untouched).
- **Max-4:** no backend enforcement found (no validator, no `validate_visuals_data`, grep `max.*4|MAX_VISUAL|limit` in homepage = no hits). The "max 4" is a frontend/Studio convention — picker must preserve whatever limit the Studio UI enforces and must not invent its own. Verify the exact Studio-side cap during implementation (read-only note).
- Shared media safe? **Yes:** multiple rows may point at one `MediaFile`; row-level `alt/order/enabled/link_url` remain independent. Reuse creates shared files, never shared rows. Deleting one visual row deletes only the row. Deleting the shared `MediaFile` (admin endpoint) would delete all rows pointing at it — record in picker help text; no UI delete in 9.5.
- `link_url` uses `validate_cta_url`; picker must not bypass it (it doesn't — picker only supplies `image` IDs).

## 15. Product / Category / Homepage integration (additive only)

No screen redesign. In each existing slot, place `[Choose existing]` immediately beside the current upload control; both write through the same `onUpload/onChange → set()` path:

- `ProductMediaManager` (`product-media-manager.tsx:129`): `[Upload] [Choose existing…]` → multi-select appends `ProductImageFormItem`s (`media_file` IDs, `renumber()`, cover rule unchanged).
- `ProductDocumentsManager` (`product-documents-manager.tsx:18`): same in `mode=document`.
- `ProductSeoFields` / category new+edit / Studio SEO: single-slot `[Upload] [Choose existing] [Clear]` writing `*_id + *_url` pairs.
- `HomepageVisualsEditor` (`homepage-visuals-editor.tsx:64-69`): per-row `Choose` writing `{image, image_url}`; new-row flow unchanged; max-4 UI unchanged.
- Article cover (`articles/new:212-216`, `edit:211-215`): change `onUpload={(url)=>…}` to `onUpload={(url, fid)=>…}` storing both, plus `Choose existing` — the only consumer needing a (small, additive) data-shape fix.
- Dirty guards, error maps (`mapProductErrors` section routing `images_data→media`, `mapHomepageErrors`), read-only fieldsets, and save pipelines are untouched — picker output is indistinguishable from upload output downstream.

## 16. Error / UX contract (Phase 8.5 reuse, no new system)

All picker errors flow through `normalizeApiError → flatten/summarize`:

| Case | Backend signal | Picker UX |
|---|---|---|
| Permission denied (list/upload) | 401/403 | generic `permission_denied` toast + inline notice; no detail leakage |
| Unsupported type / too large / invalid image / bad PDF | 400 `{"file": [...]}` | field message under dropzone + toast summary; upload-tab only |
| Upload failure (network/5xx) | 0 / 500 `{status,errors}` | `server_connection_failed`; selection state preserved, retry safe |
| Media not found (stale ID on save or retrieve) | 400 FK error (`…: unknown ids…` homepage style; products `images_data.N.media_file`) or 404 on retrieve | inline per-section `role="alert"` via existing `mapProductErrors`/`mapHomepageErrors` + toast; offer re-pick |
| Already deleted between picker open and Apply | 404 retrieve / 400 on save | drop the stale item, toast, refresh list |
| Invalid media ID (forged UUID) | 400 validation | same as not-found; never trust client IDs (backend `PrimaryKeyRelatedField` re-validates) |
| Incompatible type (PDF into image slot) | picker filter (primary) + backend `clean()` for documents / future image check | blocked in picker; if bypassed via direct API, standard 400 field error |
| Reference conflict (duplicate relation ids) | 400 `_validate_relation_ids` | existing relation-error rendering, unchanged |
| Server failure | 500 envelope | generic failure, edits/dirty preserved (retry-safe rule) |

`DocumentUpload`'s bare hardcoded toasts and article pages' generic toasts should converge on the normalizer when touched (noted debt, not 9.5 scope unless the file is open anyway).

## 17. Security / privacy threat model

| # | Risk | Current defense | Future (9.5) mitigation |
|---|---|---|---|
| 1 | User selects a `MediaFile` they shouldn't see | List is admin-only; attach is blind-UUID (obscurity, not authz) | Widen list to `IsContentManager` (same population that can already attach/upload); no per-object authz in 9.5; document shared-pool model |
| 2 | PDF/document visible through image picker | Nothing (no picker yet; OG/category slots accept PDFs today) | Mandatory `mode` prop → `?file_type=` filter; never mixed browsing; keep `ProductDocument.clean()`; consider additive image-slot validation |
| 3 | Internal asset exposed via metadata | Nothing (no private flag; `original_name` may leak client names) | No new fields in list response; staff-only visibility; operator guidance: no private uploads to the shared pool |
| 4 | Deleted media stays selectable (stale React Query cache) | N/A | Retrieve-on-Apply (`GET /<uuid>/`) or rely on save-time FK validation; 30 s `staleTime` + invalidate on upload; stale pick → friendly re-pick error |
| 5 | UUID enumeration | UUIDv4 unguessable; list requires auth | No change; do not add sequential IDs; rate-limiting out of scope |
| 6 | Direct API access bypassing picker gating | Backend re-validates every UUID (`PrimaryKeyRelatedField`, `clean()`) | Picker gating is UX-only by design; backend remains authoritative (no new trust in client `file_type` claims — re-derive server-side) |
| 7 | Shared delete breaking many consumers | `IsAdminUser`-only delete; CASCADE documented | **No delete in picker UI (Option A)**; record shared fate in operator docs |
| 8 | Malicious upload (polyglot/EXE/etc.) | Ext + content-type + Pillow `verify()` / `%PDF-` header + 10/25 MB caps; SVG/GIF/BMP rejected | Unchanged; picker reuses the same endpoint (no new upload path = no new bypass) |
| 9 | SVG/XSS regression | SVG not in allow-list at serializer **and** model layers | Do not widen allow-list in 9.5 for any reason; any future SVG support needs sanitization design first |
| 10 | Preview URL exposing private content | No private content concept; `/media/` static in DEBUG | Unchanged; picker shows same URLs the CMS already shows; production media serving config out of scope |
| 11 | OG URL becoming public via JSON-LD/SEO | OG serializers already publish whatever UUID is attached | Picker image-mode restriction reduces (not eliminates) PDF-in-`og:image` risk; no crawler-side change |
| 12 | Cross-content leakage between roles | Role gates on writes; list currently admin-only | List widened to `IsContentManager` only — `engineer/customer/anon` still 403/401; no `uploaded_by` PII expansion in list response |

## 18. Query / performance audit

- Backend: `MediaListView` is a plain `ListAPIView` over `MediaFile.objects.all()` with two exact filters and default pagination. No joins in `MediaFileListSerializer` (all fields are row-local; `url`/`thumbnail_url` are storage `.url` properties, not queries) → **no N+1**. Add `search` (`icontains` on `original_name, alt_text` — mirrors admin `search_fields`) and optional `ordering` allow-list; both hit existing indexes/ordering (`(file_type, subfolder)`, `-uploaded_at`). Keep `page_size=20` default, max 100. No `select_related` needed (no FK traversal in serializer; `uploaded_by` not serialized). Future usage-count would add per-row aggregation — **do not add it in 9.5** (that's what makes listing expensive).
- Frontend: `queryKey ['admin-media', {file_type, search, page}]`, `staleTime 30 s` default, `placeholderData: keepPreviousData` for pager smoothness, debounced search (300 ms `useDebouncedValue`, one request per settled input — 9.1 rule), `page_size=20`. Invalidate `['admin-media']` after upload; no binary bytes in cache; thumbnails are plain `<img src=url>` (browser-cached, no transforms).
- Large libraries: pagination + search is sufficient. No virtualization, no prefetch, no CDN in 9.5 (deferred until measured need).

## 19. Backend test plan (to be implemented in 9.5, not here)

1. List permission: admin roles 200; `content_manager` 200 (post-change); `engineer/customer` 403; anon 401.
2. Upload permission unchanged (`content_manager` 201; others as before) + all existing validation cases still 400 (svg/gif/bmp, bad MIME, oversize image/doc, non-PDF-bytes, corrupt image).
3. Search: `?search=` matches `original_name`/`alt_text`, case-insensitive; empty = all.
4. Type filter: `?file_type=image|document` exact; invalid value = all-or-400 per chosen convention (decide in implementation; test pins it).
5. Pagination envelope `{count,next,previous,results}` + `page_size` cap respected.
6. Metadata safety: list/retrieve response contains **exactly** the allow-listed fields; no `uploaded_by` identity, no paths, no email.
7. Reuse: one `MediaFile` attached to two products + one visual + one OG; `MediaFile.objects.count()` unchanged; all renders resolve.
8. Invalid media ID on each consumer write → 400 (not 500); unknown-UUID message path asserted.
9. Incompatible type: PDF UUID into gallery/OG slot → rejected (400) wherever the additive check lands; document UUID into `ProductDocument` → accepted.
10. Delete semantics pinned: admin delete cascades to `ProductImage` rows / nulls OG slots (documents current fate so a future change is deliberate); `content_manager` delete → 403.
11. Stale/deleted selection: save referencing deleted UUID → 400 with actionable message.
12. Direct-API authorization: forged attach without list access still gated by write permission; no IDOR beyond role.
13. No physical duplication: reuse creates zero files (assert storage object count / `file.name` equality).
14. Regression: duplicate flow, homepage `_replace`, article cover, and `cleanup_temp_media` behavior unchanged.

## 20. Frontend test plan (to be implemented in 9.5, not here)

1. Picker opens from each wired slot; upload-only flow still works untouched.
2. Choose-existing (single + multi) writes correct IDs; Apply vs Cancel dirty semantics (cancel = clean).
3. Clear single slot; per-item remove in multi; duplicate pick ignored.
4. Type filtering: image-mode never shows PDFs and vice versa.
5. Permission: 403 list → `permission_denied` notice; upload 403 → dropzone disabled + notice.
6. Loading / empty / error+retry states render.
7. Search debounce: no request per keystroke (assert settled-burst behavior per 9.1/`PICKER_SEARCH_DEBOUNCE_MS` precedent).
8. Selected-ring state + selection strip parity.
9. Host-form dirty behavior unchanged (pick = dirty; failed save preserves edits).
10. Picker open/close leaves URL unchanged (no query pollution).
11. RTL locale parity (fa/ar/en): labels, empty/error strings, `dir` attributes; keyboard operability (focus trap, no hover-only controls).
12. Stale selection: deleted-between-open-and-save → friendly re-pick error, no crash.

## 21. Migration / data-safety assessment

- Migration required? **No.**
- Data migration required? **No.**
- Existing media rows touched? **No.**
- Existing references rewritten? **No.**
- Storage files moved/copied? **No.**
- Backfill required? **No.**
- Default expectation holds fully: additive permission widening (config-level, not data), one new optional retrieve route, and new frontend components. The only data-adjacent fix is Article cover storing `fileId` alongside URL going forward (old URL-only rows keep working).

## 22. MUST HAVE / NICE TO HAVE / DEFERRED

**MUST HAVE (one safe phase):**

1. `GET /api/v1/media/` permission `IsAdminUser` → `IsContentManager` + `search`/`ordering` params (+ tests).
2. `GET /api/v1/media/<uuid>/` retrieve (`IsContentManager`, same serializer) for stale-check/detail (+ tests).
3. `MediaPickerDialog` (`mode=image|document`, single/multi, search, pager, Upload-new tab reusing current upload contract, clear/retry/permission states, RTL/a11y) + minimal `mediaApi` + `useAdminMediaList` hook.
4. Wire `[Choose existing]` next to existing upload in: Product gallery, Product documents, Product OG, Category cover, Category OG, Homepage OG, Homepage visuals (per-row), Article cover (incl. small `fileId` fix).
5. Error mapping exclusively via Phase 8.5 normalizer; permission-denied/empty/error/loading parity fa/ar/en.
6. Docs: shared-pool operator note (no private uploads; shared-delete fate).

**NICE TO HAVE (only if the phase stays small):** additive backend image-type check on gallery/OG/category/visual/article-cover writes; `DocumentUpload` + article-page convergence on the shared normalizer; `admin/media/page.tsx` field-name fix (`url/original_name/file_size`) as a drive-by only if the file is open anyway.

**DEFERRED (explicitly not 9.5):** delete-in-library (any option B/C/D), reference counts, orphan cleanup, rename/alt-edit endpoint, folders, tags, bulk ops, drag/drop asset management, image editing/cropping/transformations, CDN/storage migration, versioning, approvals, analytics, new roles/ownership/visibility models, standalone library route + dashboard card, Service/Project/Article-gallery wiring, URL-persisted picker state, SVG or new MIME support.

## 23. Open decisions (approval required before implementation)

1. **Who can browse reusable media?** Evidence: upload=`IsContentManager`, list=`IsAdminUser` (`views/media.py:17,29`). Options: (a) widen list+retrieve to `IsContentManager`; (b) new permission; (c) admin-only library. Recommendation: (a). Impact: one-line change + tests; unblocks `content_manager`.
2. **Images only vs images + documents?** Evidence: split uploaders + `file_type` filter + `ProductDocument.clean()` type gate. Options: (a) single mode-filtered picker (recommended); (b) two pickers; (c) mixed browser. Impact: (a) = one component, `mode` prop, `?file_type=` passthrough.
3. **Unlimited references per `MediaFile`?** Evidence: no uniqueness constraints; duplicate precedent. Options: (a) unlimited (recommended); (b) cap. Impact: none for (a).
4. **Can a referenced `MediaFile` be deleted?** Evidence: admin-only endpoint with CASCADE fate. Options: (a) no UI delete in 9.5 (recommended, Option A); (b/c/d) per §9. Impact: (a) = zero; others need counting/UX/migration.
5. **Usage/reference count?** Evidence: none exists. Options: (a) defer (recommended); (b) on-demand count endpoint later. Impact: (a) = zero.
6. **Upload + reuse in the same dialog?** Evidence: upload contract is a single POST reused by both uploaders. Options: (a) yes, two tabs (recommended); (b) separate. Impact: (a) = one dialog, shared validation.
7. **Multi-select for ProductImage?** Evidence: gallery is multi-row already. Options: (a) yes (recommended); (b) single-only. Impact: (a) = append-N-items path in manager.
8. **PDF reuse for ProductDocument?** Evidence: `clean()` enforces document type. Options: (a) yes, `mode=document` (recommended). Impact: trivial filter.
9. **OG fields image-only?** Evidence: unenforced today; PDF-in-OG is an SEO defect. Options: (a) image-mode picker + additive backend check (recommended); (b) picker-only. Impact: small serializer validation if (a).
10. **HomepageVisual reuse in 9.5?** Evidence: row-per-visual, shared file safe, full-replace save. Options: (a) include per-row choose (recommended); (b) defer. Impact: one row-level button.
11. **Article/Service/Project in 9.5?** Evidence: article cover URL-only; service/project have no media UI. Options: (a) article-cover only + defer the rest (recommended); (b) all now. Impact: (a) = one small `fileId` fix.
12. **Migration?** Evidence: §10. Options: none needed (recommended). Impact: zero.
13. **New permission?** Evidence: §6F. Options: (a) reuse `IsContentManager` (recommended); (b) new class. Impact: (a) = one-line widening.
14. **Uploader ownership?** Evidence: `uploaded_by` informational only. Options: (a) defer (recommended). Impact: zero.
15. **Route-based library vs dialog-only?** Evidence: only a broken first-page grid exists; URL-state infra reserved for full pages. Options: (a) dialog-only in 9.5 (recommended); (b) full route now. Impact: (a) = modal-local state, no routing/i18n-nav changes.

## 24. Recommended Phase 9.5 implementation contract (proposal only)

**Backend** (`AbrEnergy/apps/media_manager/` + tests):

- `api/v1/views/media.py`: `MediaListView.permission_classes = [IsContentManager]`; add `MediaRetrieveView(RetrieveAPIView, IsContentManager, same serializer)`; add `SearchFilter` (`original_name, alt_text`) + `OrderingFilter` (`uploaded_at, original_name`) or manual equivalents following existing filter style.
- `api/v1/urls/__init__.py`: add `<uuid:pk>/` retrieve route; leave `admin_urlpatterns` dead.
- Serializers: response shape unchanged. Optionally: additive image-type validation on gallery/OG/cover/visual writes (decide per §23.9).
- Permissions: no new class; delete + cleanup stay `IsAdminUser`.
- Tests: `apps/media_manager/tests/test_phase9_5_media_library.py` covering §19.

**Frontend** (`abr-energy-frontend/src/`):

- `src/api/media-api.ts` (new, or extend `api/index.ts`): `listMedia({file_type, search, page, page_size})`, `retrieveMedia(id)`, `uploadMedia(formData)` (shared by dialog tabs; keep endpoint `/media/upload/`).
- `src/hooks/use-admin-media-list.ts` (new): React Query `['admin-media', params]`, 30 s `staleTime`, `keepPreviousData`, 300 ms debounced search.
- `src/components/shared/media-picker-dialog.tsx` (new): `MediaPickerDialog({open, mode, selection, multi, max, onApply, onClose})` + tabs + grid + pager + states + fa/ar/en keys; composes (not replaces) `MediaUpload`/`DocumentUpload`.
- Consumers: one-line `[Choose existing]` wiring in product/category/homepage/article slots (§15); article-cover `fileId` fix.
- Tests: dialog + wiring suites per §20; no `admin-list-query` URL coupling.

**Data:** no migrations; no data rewrite; no file moves/copies; old article URL-only rows keep rendering.

**Security:** list/retrieve `IsContentManager`; delete admin-only and unlinked from UI; same upload validation endpoint; allow-listed response fields; UUIDs re-validated server-side on every attach.

**Runtime verification:** isolated test DB only (`pytest apps/media_manager apps/products apps/homepage apps/articles -q` or equivalent); frontend `vitest` for dialog/hooks/managers; manual RTL + role-matrix click-through (admin vs content_manager vs engineer) against a throwaway environment — never production data.

## 25. Risks

1. Widening list to `IsContentManager` exposes all filenames/metadata to all CMS authors — accepted shared-pool trade-off; document it (no private uploads).
2. Shared-delete fate (`CASCADE` stripping other owners' gallery rows) persists — mitigated by hiding delete from the picker, not by schema change.
3. Article-cover `fileId` fix creates two data shapes transiently (URL-only legacy vs id+URL) — readers must keep the URL fallback.
4. `admin/media/page.tsx` field-name rot shows the media UI has no test coverage — new dialog must ship with tests from day one.
5. Scope creep into DAM (folders/tags/bulk/editing/CDN) — explicitly deferred; any single addition breaks the one-phase budget.

## 26. Explicit STOP

STOP. End of preflight. No Media Library, picker, endpoint, migration, permission, upload-flow, or UX change was implemented. No DB content, file, or route was created, modified, moved, or deleted. Awaiting explicit approval of the architecture (§24) and the 15 open decisions (§23) before any Phase 9.5 implementation begins.

---

# FINAL REPORT / SUMMARY

- **What was inspected:** all 11 required reports (§2); `MediaFile` model/serializers/views/urls/admin/migrations/tests; every `MediaFile`/`media_file` consumer (products, categories, homepage incl. visuals+singleton SEO, articles, services, projects, gallery); `users` roles + all four media permission gates; `MediaUpload`/`DocumentUpload`/all composite managers/all editor pages/`admin/media` grid/`api/index.ts`/permissions/error/dirty/URL-state/React-Query wiring; storage settings, validators, lifecycle, threat surface, and query behavior. All findings grounded in `file:line` evidence above.
- **Key findings:** (1) reuse-by-reference is already schema-legal and production-precedented (duplicate copies `media_file_id` with zero new files); (2) attach-side already accepts existing UUIDs everywhere — only discovery UI is missing; (3) zero migrations needed; (4) the single blocker is permissions — `content_manager` can upload/attach but gets 403 on list/delete, so the picker needs a one-line list/retrieve widening to `IsContentManager` (delete stays admin, UI delete disabled — Option A); (5) one picker with mandatory `image|document` mode fits the split uploader + `?file_type=` backend; (6) no private-media concept exists — the library is a shared staff pool by construction; (7) no SVG/new-type support, no copies, no DAM scope.
- **Decisions required:** the 15 numbered items in §23 (roles/browse scope, type scope, unlimited refs, delete policy, counts, dialog tabs, multi-image, PDF reuse, OG strictness, visuals inclusion, article/service/project scope, migration=no, permission reuse, ownership deferral, dialog-only).
- **Recommended minimal implementation:** backend list-widen + search/ordering + retrieve route; one `MediaPickerDialog` + hook + api methods; `[Choose existing]` beside existing uploads in product gallery/documents/OG, category cover/OG, homepage visuals/OG, article cover (+`fileId` fix); Phase 8.5 error path only — §24 contract.
- **Migrations:** no. **Data mutation:** none (this phase: zero; proposed phase: zero destructive).
- **Files changed (this preflight):** 1 created — `docs/reports/phase-09.5-preflight-media-reuse-report.md`. Zero source files modified.
- **Tests run:** none (read-only phase; existing suites intentionally not re-run to avoid any environment mutation — implementation phase will run the §19/§20 plans on an isolated test DB).
- **Known limitations:** `admin/media/page.tsx` renders wrong fields and is 403 for content managers (documented, not fixed); `MediaUpload` stale-prop + unrevoked-blob-URL bugs noted, not fixed; max-4 homepage-visual cap is frontend-conventional (no backend enforcement found — must re-verify the exact Studio-side cap at implementation); service/project/article-gallery editors have no media controls, so picker wiring there is deferred by design.

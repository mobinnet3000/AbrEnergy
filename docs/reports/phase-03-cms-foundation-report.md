# Phase 3 — CMS Foundation & Product Category Management Report

Date: 2026-09-20. Scope: React CMS shell + Product Category Manager only.
No public-site redesign, no public product pages, no product editor, no new backend API.

## 1. Executive Summary

Phase 3 establishes the CMS foundation and ships the first complete CRUD screen:
`/admin/products/categories` (tree list) + `/new` + `/[id]/edit`, backed exclusively
by the Phase 2 admin category API. Reused: admin layout/guards, TipTap editor,
MediaUpload, sonner toasts, TanStack Query patterns, shadcn/base-nova tokens.
Persian-only UI gated via existing `activeLocales=['fa']` (ar/en architecture intact).
Verification: `tsc` 0 errors, `eslint` 0 errors (61 pre-existing warnings, none in
Phase 3 files), `next build` success (all routes incl. 3 new), new Vitest suite
15/15 pass, backend full suite **82 passed** (75 Phase 1+2 intact + 7 pre-existing
`test_phase3.py`). `manage.py check` clean, `makemigrations --check`: no changes.
Live PostgreSQL/Redis NOT verified (no creds/infra) — same limitation as Phase 1/2.

## 2. Existing Admin Architecture Reused

Inspected before writing code; extended, not rebuilt:

- `src/app/[locale]/admin/layout.tsx` — sidebar shell, mobile overlay, auth/role
  guard, unread-notifications badge. Kept; nav source swapped to sectioned config.
- `PageHeader`, `TableLoading`, `EmptyState`, `ErrorState`, `PageLoading` —
  used as-is in list + forms.
- `RichTextEditor` (TipTap) — reused unchanged for category `content` (RTL mode).
- `MediaUpload` — reused unchanged for `cover` + `og_image` (same Phase 1
  jpg/jpeg/png/webp + 10 MB backend enforcement; no SVG).
- `sonner` toasts, `Dialog/*` (base-ui), `Select`, `Badge`, `Button`, `Input`,
  `Textarea`, `DropdownMenu` — all existing primitives; no duplicates created.
- Data conventions: TanStack Query hooks in `src/hooks/use-api.ts`,
  axios instance with JWT refresh + `Accept-Language`, Zustand `auth-store`.
- No existing component was replaced; no animation/3D/home file touched.

## 3. CMS Navigation

`src/config/navigation.ts` gains `adminNavSections` (5 sections):

- داشبورد: `/admin`
- محصولات (`admin.nav_products`): `…/products/categories` (live);
  `/admin/products` + `/admin/products/attributes` present as **disabled**
  (`disabled: true`, rendered as non-link `<span>` with `coming_soon` title) —
  no fake empty pages.
- محتوا (`admin.nav_content`): articles, services, projects, gallery, media,
  article-categories, tags — all existing routes.
- درخواست‌ها (`admin.nav_requests`): contacts, inquiries, notifications.
- کاربران / دسترسی‌ها (`admin.nav_access`): users + activity-log
  (`super_admin/website_admin`), settings (`super_admin` only).

`admin/layout.tsx` renders sections with per-item role filtering
(`canViewAdminItem`), active-state incl. `startsWith` for nested routes,
`aria-current="page"`, icons per route. Old flat `adminNavItems` kept for
back-compat (unused by layout).

## 4. New Routes

| Route | File |
|---|---|
| `/admin/products/categories` | `admin/products/categories/page.tsx` — tree list, search, filters, toggles, delete |
| `/admin/products/categories/new` (`?parent=` supported) | `…/categories/new/page.tsx` — create form |
| `/admin/products/categories/<id>/edit` | `…/categories/[id]/edit/page.tsx` — edit form + delete |

All under the existing `[locale]/admin` guard; direct navigation + refresh work
(standard App Router pages, no client-state routing). No public product routes added.

## 5. Category Manager

List page (`categories/page.tsx`):

- One admin-list request (`page_size=200`, server filters) → client-side
  `buildCategoryTree` nesting. No N+1 (single request; no per-node fetches).
- Filters map 1:1 to API `filterset_fields`/`search_fields`: `search`
  (translated title + slug), `is_active`, `is_featured`, `parent`. All
  API-supported — nothing faked client-side over incomplete pagination.
- Create/edit: route links (`new`, `<id>/edit`, `new?parent=<id>` for add-child).
- Active toggle (`Power/PowerOff`) + featured toggle (`Star/StarOff`) with
  **optimistic cache patch + rollback on error** (safe: single-field PATCH).
- Delete via `ConfirmDialog`; backend is authoritative (CASCADE children,
  SET_NULL products — see §13).
- Ordering: numeric `sort_order` edited in the form (no drag-and-drop; §17).

## 6. Category Tree

- `src/lib/category-tree.ts`: `buildCategoryTree` (flat → nested, orphans become
  roots, deterministic `sort_order → title` ordering) + `flattenParentOptions`
  (indented parent-select options, self excluded in edit mode).
- UI: expand/collapse (chevron, RTL-aware), `paddingInlineStart` indentation,
  `Folder` icon, `slug` shown LTR on md+, active/inactive `Badge`, featured
  `Badge`, row actions (toggle active, toggle featured, `•••` menu:
  edit / add-child / delete). No product counts — API provides none and no N+1
  was introduced (documented, §25).
- Seed data (4 parents + 18 children) renders naturally from the API; nothing hardcoded.

## 7. Category Form

Shared structure in `new` + `edit` (fa-only, no language tabs):

- اطلاعات اصلی: عنوان* (fa), slug (manual, Persian allowed), والد, ترتیب نمایش.
- محتوا: توضیح کوتاه, محتوای کامل (TipTap RTL), تصویر کاور (MediaUpload).
- سئو: seo_title/description, canonical_url (LTR), robots select (4 options),
  og_title/description, og_image (MediaUpload).
- Sidebar card: وضعیت (custom switch buttons, `role="switch"` + `aria-checked`),
  parent select, order, featured; cover card.
- Sticky bottom action bar: ذخیره (spinner while pending) + انصراف.
- Edit page: breadcrumb (داشبورد / دسته‌بندی‌ها / <title>), status badges in
  header, delete button + dialog. Edit `useMemo(initial + edits)` pattern copied
  from the article editor (avoids set-state-in-effect lint error).
- Payload uses `ProductCategoryWritePayload` (`translations: { fa: {...} }`);
  ar/en translation rows untouched by the UI but the architecture accepts them.

## 8. Media Picker

No new picker built: `MediaUpload` reused for both `cover` and `og_image`
(returns backend `file.url` + MediaFile `id`; the `id` is sent as `cover`/`og_image`
FK). Preview / replace / remove / upload / loading / backend-error toast all
inherited. Phase 1 restrictions preserved (images only, 10 MB, Pillow-verified,
SVG blocked server-side). Reusable for Phase 4 products/homepage/SEO as required.

## 9. Rich Text Integration

Existing `RichTextEditor` (TipTap starter-kit + image/link/table/text-align/
underline/placeholder, headings 1–3, bold/italic, lists, blockquote, alignment,
undo/redo) reused with `dir="rtl"`. No new editor, no HTML injection, no page
builder. Backend bleach sanitizer remains authoritative on save.

## 10. SEO Form

All Phase 2 category SEO fields editable: `seo_title`, `seo_description`,
`canonical_url`, `robots` (4-way select), `og_title`, `og_description`,
`og_image`, plus per-language `meta_title/meta_description` surfaced on detail
read (`toForm` maps `meta_*` for display; writes go through `translations.fa`).
Slug-hint warning shown on the form (URL change affects SEO). **Slug history /
redirects NOT implemented** — deferred per Phase 2 report; follow-up for the SEO phase.

## 11. Permissions

- New `src/lib/admin-permissions.ts`: `MANAGER_ROLES =
  [super_admin, website_admin, content_manager]`, `canAccessAdminShell`,
  `canManageProductCategories`, `canViewAdminItem`. Single source — no role
  strings scattered across pages.
- Admin shell now admits `content_manager` (was super/website only), matching the
  backend `IsContentManager` write gate; role-restricted items (users,
  activity-log, settings) hidden per role. Category write buttons hidden when
  `!canManageProductCategories`.
- Backend remains authoritative: admin category endpoints require
  `IsAuthenticated + IsContentManager` (tested: customer → 403).
- No new roles, no per-field permission split (deferred, as in Phase 2).

## 12. Persian-only Locale Handling

- `activeLocales = ['fa']` already existed; header (desktop + mobile) and footer
  switchers now map `activeLocales` instead of `locales` — en/ar options no
  longer shown to users. Switcher components structurally preserved and reusable
  (flip `activeLocales` to re-enable).
- `locales`, `localeNames`, translation JSONs, middleware, backend translation
  tables untouched. fa/ar/en JSONs all carry the new admin keys (ar/en mirrored
  for structural parity).
- CMS forms render Persian-only editing UI; payload writes `translations.fa` only.

## 13. Reusable Components

New (only what was missing):

- `ConfirmDialog` (`shared/confirm-dialog.tsx`, exported from `shared/index.ts`) —
  accessible dialog (focus on confirm, `AlertTriangle` for destructive),
  `loading` state, Persian defaults.
- `src/lib/category-tree.ts` — `buildCategoryTree`, `flattenParentOptions`
  (unit-tested, reusable for future product/category pickers).
- `src/lib/admin-permissions.ts` — role helpers (unit-tested).

Deliberately NOT created (already exist): AdminPageHeader→`PageHeader`,
AdminTable (inline tables per existing convention), breadcrumbs (inline nav),
StatusBadge→`Badge`, skeletons (`TableLoading`), toasts (sonner), media picker,
rich-text editor.

## 14. API Usage

Existing Phase 2 contract only (`adminProductCategoriesApi` added to
`src/api/index.ts` as a thin client — no new backend):

- `GET /admin/product-categories/` (+ `search/is_active/is_featured/parent`)
- `GET /admin/product-categories/<uuid>/`
- `POST /admin/product-categories/` (`CategoryWriteSerializer`)
- `PATCH /admin/product-categories/<uuid>/`
- `DELETE /admin/product-categories/<uuid>/` (CASCADE children per model;
  products SET_NULL — dialog copy explains server may reject unsafe deletes)

## 15. Query/Cache Strategy

New hooks in `use-api.ts` (same pattern as existing):

- `useAdminProductCategories(params)` — list, key `['admin-product-categories', params]`
- `useAdminProductCategory(id)` — detail, enabled iff id
- `useCreateAdminProductCategory` / `useUpdateAdminProductCategory` /
  `useDeleteAdminProductCategory` — all invalidate `admin-product-categories`
  (update also invalidates its detail key). No full-page reloads, no manual
  `useEffect` fetching. Toggles use optimistic `setQueriesData` patch + rollback.

## 16. Validation

- Client: required `title` (toast `required_field`), `sort_order` numeric ≥ 0,
  parent excludes self (options filtered). Slug uniqueness left to backend
  (409/400 surfaces `category_save_failed` toast; no fake client uniqueness).
- Backend authoritative: model `clean()` (no self-parent + DB constraint),
  translation slug auto-slugify, bleach on content. No business rules duplicated.

## 17. Error Handling

- List: `ErrorState` with Persian messages; 403 → `permission_denied`, else
  `server_connection_failed`; retry action calls `refetch()`. No stack traces.
- Forms: failure toasts; delete failure distinguishes 403.
- Field-level backend messages not mapped 1:1 (DRF error shape varies) —
  documented limitation; generic `category_save_failed` toast used.

## 18. Loading States

- Tree: `TableLoading` skeleton rows. Forms: `PageLoading` on detail fetch;
  save buttons show spinner (persisted `saving` key exists; buttons use inline
  spinner + disabled state). No layout jump (cards reserve structure), no
  `setTimeout` fake loading.

## 19. Empty States

- `EmptyState` with `no_product_categories` ("هنوز دسته‌بندی‌ای ثبت نشده است.")
  + `create_first_category` action for writers; no generic "No data".
- Filtered-to-empty shows the same state (API-driven; not faked).

## 20. Accessibility

- Semantic buttons, `aria-label`s on icon-only actions, `aria-expanded` on tree
  toggles, `role="switch"` + `aria-checked` on status toggles, `aria-current="page"`
  on active nav, breadcrumb `<nav aria-label>`, dialog focus management,
  visible focus rings from base-nova tokens. Destructive actions always labeled
  with text (icon + "حذف"), never icon-only meaning.

## 21. RTL Verification

- Verified by code + tests: `paddingInlineStart` indentation, chevron flip via
  `isRTL`, `dir="auto"` on Persian inputs, `dir="ltr"` on slug/canonical/robots
  values, breadcrumb separators neutral (`/`), sticky action bar works in RTL.
  Root `dir=rtl` preserved by existing `LocaleProvider`; nothing globally forced.

## 22. Tests

Frontend (new minimal Vitest + RTL + jsdom infra; `npm test` → `vitest run`):
15/15 pass across 4 files —

- `category-tree.test.ts` (5): roots/nesting, unlimited depth, deterministic
  sort, orphan tolerance, parent-options exclusion.
- `admin-permissions.test.ts` (3): shell access matrix, category-write gate
  (permission-denied state), restricted-item visibility.
- `navigation-cms.test.ts` (5): fa-only switcher, ar/en architecture preserved,
  live category route link, future routes disabled-not-fake, existing admin
  routes reachable.
- `confirm-dialog.test.tsx` (2): Persian render + confirm callback, cancel path.

Backend: full suite **82 passed** (34 Phase 1 + 41 Phase 2 + 7 pre-existing
`test_phase3.py`: admin filters ×5, detail-field exposure, dashboard product
counts). Run on temp SQLite settings (PG creds unavailable), settings file
deleted after run — same procedure as Phase 1/2.

## 23. Files Changed

Frontend new:

- `src/app/[locale]/admin/products/categories/page.tsx` (tree list)
- `src/app/[locale]/admin/products/categories/new/page.tsx` (create)
- `src/app/[locale]/admin/products/categories/[id]/edit/page.tsx` (edit)
- `src/components/shared/confirm-dialog.tsx` (+ test)
- `src/lib/admin-permissions.ts` (+ test)
- `src/lib/category-tree.ts` (+ test)
- `vitest.config.ts`, `vitest.setup.ts`, `src/config/navigation-cms.test.ts`

Frontend modified:

- `src/types/index.ts` (`ProductCategoryDetail`, `ProductCategoryWritePayload`)
- `src/api/index.ts` (`adminProductCategoriesApi`)
- `src/hooks/use-api.ts` (5 category hooks)
- `src/config/navigation.ts` (`AdminNavEntry/Section`, `adminNavSections`)
- `src/app/[locale]/admin/layout.tsx` (sectioned nav + manager-role access)
- `src/app/[locale]/admin/page.tsx` (Products Overview widget)
- `src/components/layout/header.tsx`, `footer.tsx` (map `activeLocales`)
- `src/components/shared/index.ts` (export ConfirmDialog)
- `locales/{fa,ar,en}.json` (fa 108→180 admin keys; ar/en mirrored)
- `package.json` (+ `typecheck`/`test` scripts; devDeps: vitest 3, RTL, jsdom,
  @vitejs/plugin-react@4 pinned — latest requires babel 8, repo has babel 7)
- `package-lock.json`

Backend: **no changes** (Phase 2 API reused verbatim).
Migrations: none (`makemigrations --check`: no changes detected).

## 24. Existing UI Regression Verification

- `next build` success: all pre-existing routes still render (public pages,
  auth, dashboard, all 14+ admin pages); 3 new category routes added.
- `tsc --noEmit`: 0 errors. `eslint`: 0 errors, 61 warnings — identical count to
  Phase 1/2 baselines; zero warnings in Phase 3 files (verified by filtered run).
- No edits to `components/home/*`, `globals.css`, public pages, animations,
  3D, theme, fonts. Homepage visually untouched (no shared-CSS changes at all).
- Backend suite: all 75 Phase 1+2 tests still pass unmodified.

## 25. Deferred Work

- Slug history / redirects (SEO phase).
- Drag-and-drop ordering (numeric `sort_order` via CRUD is the current mechanism).
- Product counts on tree rows (needs annotated API field; omitted, no N+1).
- Field-level backend error mapping in forms.
- ar/en CMS tabs (architecture ready; UI gated to fa).
- Per-field permission split, approval workflow (backend roadmap).

## 26. Known Limitations

- List uses `page_size=200` single fetch for tree building; beyond ~200
  categories server pagination applies and tree shows the current page (API has
  no unpaginated tree mode). Acceptable for the seeded 22-node catalog.
- Public category tree endpoint nests children but admin list is flat —
  nesting is client-built (documented, single request, no N+1).
- `MediaUpload` posts to `subfolder=articles` (pre-existing hardcoded value);
  works for categories but subfolder naming should be generalized in Phase 4.
- PG/Redis live verification unavailable (no creds/infra) — same as Phase 1/2.

## 27. Phase 4 Recommendation

Consume the Phase 3 shell for the Product Editor: reuse `ConfirmDialog`,
`admin-permissions`, sectioned nav (enable `/admin/products` link when the route
lands), `MediaUpload` (generalize subfolder), TipTap, SEO card pattern, and the
`initial + edits` form pattern. Backend already exposes admin product CRUD +
attributes; add annotated `products_count` to the admin category serializer when
tree counts are needed. No reshaping of Phase 3 components expected.

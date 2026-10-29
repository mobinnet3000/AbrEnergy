# Phase 12.17 — Core CMS Contracts, Header, Brand & Content Closeout

Date: 2026-10-19

Scope: implementation follow-up to the Phase 12.16 full-site audit. This phase
repairs the article/service/project write contracts, restores detail-translation
reads for the edit pages, fixes the fixed-header content overlap, makes
company/contact/SEO SiteSettings editable in the admin, deploys the approved
brand asset, removes fabricated public content and dead legal links, adds
regression tests, and records verification evidence.

Verdict: **ACCEPTED FOR THE PHASE 12.17 SCOPE, WITH RUNTIME LIMITS.**

The Phase 12.16 audit-table P0 items 1–8 are addressed in source and covered by
automated checks. This is **not** a claim that the whole site is release-ready:
the separate roadmap P0 items that were not in this phase (admin contact/inquiry
workflow, SEO basics, auth gaps, calculator correctness, and the theme/RTL pass)
remain open, and no live browser or production PostgreSQL round-trip was run.

No commit, push, tag, deployment, Git reset/clean/restore, database reset,
migration, or owner-media deletion was performed.

---

## 1. Executive summary

Delivered:

- **Article/service/project CMS contracts repaired.** Create and edit now send
  `translations` as locale-keyed objects, tags/features as lists, relations as
  UUIDs or `null`, and project status values from the backend vocabulary. Edit
  pages now load the read-only translation map from the detail API instead of
  reading flat fields that do not exist.
- **Translation reads restored.** Article/service/project detail serializers
  expose a read-only `translations` object to authenticated writers. Anonymous
  public detail responses still return an empty translations object, preserving
  the public contract.
- **Fixed-header overlap removed.** A single `.site-header-offset` utility
  (`3.5rem`, `md:4rem`) is applied to the admin/dashboard internal shells; the
  mobile admin overlay starts below the header.
- **SiteSettings are editable and consumed.** The admin settings page now GETs
  the full settings object and PATCHes company/contact/social/SEO/content
  fields, in addition to the existing logo/favicon uploads. The backend admin
  endpoint now supports GET and PATCH. Contact, footer, and the shared brand
  logo consume public settings.
- **Approved logo deployed byte-for-byte.** Source and deployed file both hash
  to `8901857565B627DC7DD0DB1835E30B32658E611C3BAFAB049529D9E03D54592D`,
  81,301 bytes, 607×246.
- **Fabricated content removed.** About statistics/timeline, contact fake
  phone/email/address/hours, and footer fake contact data plus `href="#"` legal
  links are gone. Public pages render real settings or an honest
  `contact.details_unavailable` empty state.
- **Regression coverage added.** Six shared contract tests, three backend
  translation-detail tests, and three admin SiteSettings contract tests pass.

Verification summary:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass, 0 errors |
| Targeted settings ESLint | Pass, 0 problems |
| `npx eslint src` | 0 errors, 45 pre-existing warnings |
| `npm test` | 72 files, 594 tests passed |
| `python -m pytest -q` | 271 tests passed |
| `npm run build` | Pass on rerun; compiled in 13.0 s, 6/6 static pages |
| Logo hash | Exact source/destination match |
| `git diff --check` | Only LF→CRLF warnings |

Limits:

- No browser automation is installed, so responsive header behavior, settings
  save/reload in a browser, and live CMS create/reload were not visually
  executed. Checks are source/contract/unit/build-level.
- No live PostgreSQL database was used. Backend checks ran against the test
  settings.
- The first build after the final settings rewrite failed page-data collection
  with `PageNotFoundError`/`ENOENT`; an immediate rerun with no code change
  passed. This is recorded as a transient build-cache/environment failure, not
  as a reproduced application defect.
- Backend tests wrote 131 small test-media artifacts into
  `AbrEnergy/media/` (97 PNG, 34 PDF; 8,897 bytes total; timestamps 17:12:34–
  17:12:57). They were preserved because this phase forbids deleting media,
  including test-generated media. See §8.

---

## 2. Scope, constraints, and safeguards

In scope:

- Phase 12.16 audit-table P0 items 1–8: content write contracts, fixed-header
  overlap, SiteSettings editing/consumption, fabricated content/dead legal
  links, and the approved logo.
- Shared frontend payload builders, normalized error feedback, and regression
  tests.
- Report and verification evidence.

Out of scope:

- Remaining Phase 12.16 roadmap P0 items: admin contact/inquiry detail workflow,
  notification deep links, missing SEO basics, auth gaps, calculator
  correctness, and the full theme/RTL pass.
- Production deployment, database writes, real owner content, ar/en activation,
  and legal/privacy page decisions.

Safeguards honored:

- No `git reset`, `git clean`, `git restore`, bulk deletion, database reset,
  migration, deployment, commit, push, or tag.
- Pre-existing modified and untracked owner files, media, reports, screenshots,
  and build directories were preserved.
- No `.env` values or secrets were printed.
- The 0-byte `AbrEnergy/db.sqlite3` placeholder was not used as a substitute for
  PostgreSQL.

---

## 3. Git state

| Item | At phase start | Final |
| --- | --- | --- |
| Branch | `master` | `master` |
| HEAD | `e2e533ab376d1196e7399189e1b33489f95efd41` | `e2e533ab376d1196e7399189e1b33489f95efd41` |
| Working-tree entries | 1,904 | 2,189 |
| Tracked modified | 57 | 74 |
| Untracked | 1,847 | 2,115 |
| Deleted | 0 | 0 |
| Staged | 0 | 0 |

Notes:

- The dirty tree is intentional and largely owner-owned. The 74 tracked
  modifications include pre-existing work from earlier phases; this report does
  not attribute every uncommitted change to Phase 12.17.
- This report itself is the final untracked artifact counted above.
- The 131 test-media files created during backend verification account for 131
  of the untracked entries. They were not removed.

---

## 4. Files changed and rationale

Backend:

| File | Change | Rationale |
| --- | --- | --- |
| `AbrEnergy/apps/articles/api/v1/serializers/article.py` | Read-only `translations` on detail serializer | Edit forms need all locale values; public detail still gets `{}` |
| `AbrEnergy/apps/services/api/v1/serializers/service.py` | Read-only `translations` on detail serializer | Same |
| `AbrEnergy/apps/projects/api/v1/serializers/project.py` | Read-only `translations` on detail serializer | Same |
| `AbrEnergy/apps/core/api/v1/views/site.py` | `SiteSettingsAdminView` → `RetrieveUpdateAPIView` | Admin settings page needs GET as well as PATCH |
| `AbrEnergy/apps/articles/tests/test_translation_detail_contract.py` | **New** — 3 tests | Public/admin translation exposure and write contract |
| `AbrEnergy/apps/core/tests/test_phase12_17_settings_contract.py` | **New** — 3 tests | Admin GET/PATCH permissions and public propagation |

Frontend:

| File | Change | Rationale |
| --- | --- | --- |
| `src/lib/cms-form-contracts.ts` | **New** — shared locale fields, detail mapping, payload builders | One tested contract for all three content types |
| `src/lib/cms-form-contracts.test.ts` | **New** — 6 tests | Payload shape, null/list handling, status mapping, locale preservation |
| `src/lib/cms-error-toast.ts` | **New** — normalized save-error feedback | Field-level API errors reach the toast |
| `src/components/admin/entity-category-select.tsx` | **New** — article/service category selector | Removes duplicated selectors and nullable-value bugs |
| `admin/articles/new/page.tsx` | Translation-object payload; tags list; category/cover normalization | Fixes rejected article create payload |
| `admin/articles/[id]/edit/page.tsx` | Loads detail translations; nested edit/save; slug/SEO fields | Fixes silently ignored article edits |
| `admin/services/new/page.tsx` | Translation-object payload; category id; features list | Fixes rejected service create payload |
| `admin/services/[id]/edit/page.tsx` | Loads detail translations; nested edit/save; slug/SEO fields | Fixes blank edit form and ignored edits |
| `admin/projects/new/page.tsx` | Translation-object payload; valid statuses; relations | Fixes rejected project create payload |
| `admin/projects/[id]/edit/page.tsx` | Loads detail translations; `planned`→`planning`; service category/completion | Fixes ignored edits and invalid status |
| `admin/articles/article-editors-dirty.test.tsx` | Updated payload assertions | Guards the corrected article contract |
| `admin/services/service-editors-dirty.test.tsx` | Updated payload assertions | Guards the corrected service contract |
| `admin/projects/project-editors-dirty.test.tsx` | Updated payload assertions | Guards the corrected project contract |
| `components/shared/media-picker-dialog.test.tsx` | Updated article save assertion | Removed obsolete `cover_image_url`; checks `cover_image` id |
| `admin/settings/page.tsx` | Full settings GET/PATCH editor; `SettingsEditor` child | Closes P0 settings gap; avoids setState-in-effect lint |
| `components/layout/footer.tsx` | Real settings, honest empty state, no dead legal links | Removes fabricated footer data/placeholders |
| `(public)/contact/page.tsx` | Real settings, honest empty state | Removes fake contact details |
| `(public)/about/page.tsx` | Removed fabricated stats/timeline | Content honesty |
| `components/layout/header.tsx`, `components/layout/brand-logo.tsx` | Header height and settings-aware logo | Fixed-header and brand integration |
| `admin/layout.tsx`, `dashboard/layout.tsx`, `globals.css` | Shared header-offset shell | Removes content-under-header overlap |
| `public/abar-energy-logo.png` | Replaced with approved asset | Exact brand deployment |
| `locales/fa.json`, `ar.json`, `en.json` | CMS success/error, contact empty-state, settings strings | Persian feedback and localized empty states |

---

## 5. Contract mismatches: before and after

### 5.1 Article create

Before:

```json
{
  "translations": [
    {
      "language_code": "fa",
      "title": "...",
      "slug": "...",
      "short_description": "...",
      "content": "..."
    }
  ],
  "tags": "tag one, tag two",
  "cover_image_url": "..."
}
```

After:

```json
{
  "translations": {
    "fa": {
      "title": "...",
      "slug": "...",
      "short_description": "...",
      "content": "...",
      "meta_title": "...",
      "meta_description": "..."
    }
  },
  "tags": ["tag one", "tag two"],
  "category": "<uuid-or-null>",
  "cover_image": "<uuid-or-null>",
  "status": "draft",
  "publish_date": "YYYY-MM-DD-or-null",
  "is_featured": false
}
```

### 5.2 Article edit

Before: flat `title_fa`, `short_description_fa`, `content_fa`, etc. The backend
expects `translations`, so edits were ignored. The form also had no persisted
translation values to display.

After: the edit page reads the detail `translations` map, writes nested
`translations`, sends slug and per-locale SEO fields, and preserves existing
locales when another locale is edited.

### 5.3 Service create/edit

Before: flat `title_fa`/`short_description_fa`/`description_fa` fields; the edit
form was blank for persisted translations. Category could arrive as an object
instead of an id, and features were a comma string.

After: nested `translations` with slug and SEO fields; category serialized as an
id; features as a list; edit page reloads existing translations.

### 5.4 Project create/edit

Before: the same flat translation pattern plus the invalid `planned` status.
`service_category` and `completion_percentage` were not preserved.

After: nested `translations`; only `planning`, `in_progress`, `completed`,
`on_hold`, and `cancelled` are selectable; legacy `planned` maps to `planning`;
`service_category`, `is_featured`, and `completion_percentage` are preserved.

### 5.5 Shared preservation rules

`buildTranslationPayload` sends only locales that contain a value, plus locales
that already existed in the detail response. This means:

- Empty locale tabs do not create empty translation rows.
- Clearing an existing locale still persists the cleared values.
- Existing translations are not dropped when editing one locale.

Null handling is centralized: blank dates/capacity/category/cover become `null`,
numbers are parsed safely, and relation objects are reduced to their `id`.

---

## 6. SiteSettings and public consumption

Backend:

- `GET/PATCH /api/v1/admin/site-config/` — `IsSuperAdmin`, `RetrieveUpdateAPIView`.
- `GET /api/v1/site-config/` — public read serializer, unchanged surface.
- New tests verify admin GET, unauthenticated rejection, and that a saved
  phone/email/address appears in the public response.

Admin UI (`admin/settings/page.tsx`):

- Loads the full admin settings object.
- Edits company name/name-en, phone 1/2, email, address, site URL, social links,
  default meta title/description, hero title/subtitle, about text (fa/en), and
  footer text.
- Keeps logo/favicon uploads as multipart PATCH to the same endpoint.
- Invalidates `site-settings` and `admin-settings` after save/upload.
- Uses `SettingsEditor` as a child initialized from fetched data, avoiding the
  earlier `react-hooks/set-state-in-effect` lint failure.

Public UI:

- `BrandLogo` prefers the CMS logo and falls back to the approved static asset.
- Contact renders only real phone/email/address values, otherwise
  `contact.details_unavailable`.
- Footer renders only real contact values and the same honest empty state; the
  dead Privacy/Terms `href="#"` links were removed.

Not exposed in this editor: `default_keywords`, `maintenance_mode`, and
`hero_background_image`. They are outside the requested company/contact/SEO
scope and remain available through the API/model.

---

## 7. Header, content honesty, and brand

Header:

- `.site-header-offset` reserves `3.5rem` on mobile and `4rem` at `md`.
- Applied to admin and dashboard internal shells, not duplicated with
  per-page padding.
- Mobile admin navigation starts below the fixed header (`top-14 md:top-16`).
- Header height remains `h-14 md:h-16`.

Content honesty:

- Removed About `25 MW+`, `150+`, `10+`, `98%`, and the invented timeline.
- Removed contact fake phone/email/address/hours and "Visit our office".
- Removed footer fake contact details and non-routed legal links.
- Empty states are explicit, not filled with plausible-looking data.

Brand:

| Item | Value |
| --- | --- |
| Source | `abar logo.png` |
| Destination | `abr-energy-frontend/public/abar-energy-logo.png` |
| SHA-256 (both) | `8901857565B627DC7DD0DB1835E30B32658E611C3BAFAB049529D9E03D54592D` |
| Bytes (both) | 81,301 |
| Dimensions (both) | 607×246 |

---

## 8. Verification evidence

Commands run from the stated working directories:

```text
abr-energy-frontend> npm run typecheck
  -> pass (tsc --noEmit, 0 errors)

abr-energy-frontend> npx eslint "src/app/[locale]/admin/settings/page.tsx"
  -> pass (0 problems)

abr-energy-frontend> npx eslint src
  -> 0 errors, 45 warnings (pre-existing)

abr-energy-frontend> npm test
  -> 72 test files passed, 594 tests passed

AbrEnergy> python -m pytest -q
  -> 271 passed in 29.92s

abr-energy-frontend> npm run build
  -> first attempt: PageNotFoundError/ENOENT during page-data collection
  -> immediate rerun: pass, compiled in 13.0s, 6/6 static pages generated
```

The 45 ESLint warnings are pre-existing items (unused imports, `<img>` usage,
and exhaustive-deps warnings) outside the changed settings page. The targeted
settings file has no lint problems.

`git diff --check` produced only LF→CRLF warnings, with no whitespace errors.

### Test-media side effect

The backend suite wrote 131 files into `AbrEnergy/media/` during the run:

- 97 PNG and 34 PDF files.
- 8,897 bytes total.
- Timestamps 2026-10-19 17:12:34 through 17:12:57.
- They are untracked test artifacts, not owner content.

They were preserved because no media deletion is permitted in this phase. They
should be removed only with explicit owner approval, ideally after isolating the
test `MEDIA_ROOT` in a future test-infrastructure change.

---

## 9. Acceptance status

| Audit P0 item | Status | Evidence / limit |
| --- | --- | --- |
| 1. Article create contract | Pass at contract/unit level | Payload builder, dirty-page test, backend translation contract test; no live browser create |
| 2. Article edit contract | Pass at contract/unit level | Detail translations read/write; backend test; no live browser round-trip |
| 3. Service create/edit contract | Pass at contract/unit level | Payload builder and dirty-page test; no live browser round-trip |
| 4. Project create/edit contract | Pass at contract/unit level | Payload builder, status mapping, dirty-page test; no live browser round-trip |
| 5. Fixed-header overlap | Pass at source/build level | Shared offset utility and layouts; no responsive browser matrix |
| 6. SiteSettings editable/consumed | Pass at API/test/build level | Admin GET/PATCH tests, public propagation test, typecheck/build; no live browser save/reload |
| 7. Approved logo deployed | Pass | SHA-256, size, and dimensions match exactly |
| 8. Fabricated content/dead links removed | Pass at source level | About/contact/footer inspected; no browser visual pass |

---

## 10. Remaining work and risks

Still open from the Phase 12.16 blueprint (not part of this phase):

- Admin contact/inquiry detail, assignment, status workflow, and notification
  deep links.
- SEO basics: About/Calculator metadata, sitemap entries for published
  service/project/article details, product-category index.
- Auth gaps: password-reset confirmation, profile password change, and the
  documented email-verification decision.
- Calculator correctness and owner-approved tariffs.
- Full theme/RTL pass and browser accessibility/responsive verification.
- Owner decisions on real company/contact/legal/privacy content, real catalog
  PDFs, and ar/en activation.

Risks:

- Without browser execution, the settings save/reload flow and the header at
  320/768/1280/1440 are not visually proven.
- The transient first-build `ENOENT` did not reproduce. If it recurs, inspect
  the generated `.next` state and any concurrent process touching the build
  directory.
- The backend test suite is not media-isolated; every full run adds files to
  the repository media tree, which increases working-tree noise.
- `ar`/`en` remain architecturally supported but not active public locales.

---

## 11. Final safety statement

- No commit, push, tag, deployment, or release was performed.
- No Git reset/clean/restore was performed.
- No database reset, migration, or production database access was performed.
- No owner media, report, screenshot, or content was deleted.
- The working tree remains dirty by design, with all prior owner changes
  preserved.

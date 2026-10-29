# Phase 12.12 — Real Content Readiness, Visual QA & Final UX Polish

Date: 2026-10-18
Scope: post-Phase-12.11 continuation. Real-content audit, browser-based rendering QA, dynamic-favicon/metadata review, downloads/navigation review, targeted accessibility/release checks, regression verification, and a small verified defect fix. No architecture rewrite, no Phase 13, no destructive data operations, no commit.

Verdict: **PARTIALLY ACCEPTED** (see §1 and §9).

---

## 1. Executive summary

- The Phase 12.11 homepage behaviour is present and **verified against the rendered DOM** (not merely "tests pass"): section order `hero → featured → categories → services → calculator → projects → articles → contact`, no duplicate category pill row, and a working featured-rail category filter that derives its options from real product data.
- A **genuine latent defect in the downloads flow was found and fixed**: the product-document `doc_type` values sent by the CMS (`installation`, `spec`) did not match the backend choices (`installation_guide`, `spec_sheet`), so saving those two document types through the admin would have produced a 400, and their labels would not resolve. See §3.1.
- **26 rendered screenshots were captured** from a production build (`docs/reports/phase-12.12-screenshots/`). However, **this agent cannot inspect image pixels** (the model has no image-input capability). Browser automation ran and automated DOM/computed-style assertions were performed, but **human/agent pixel-level visual review remains NOT VERIFIED** — this is the single largest reason the phase is not full `ACCEPTED`.
- All regression baselines hold: frontend **552** tests, backend **245** tests, `tsc` **0** errors, changed-file ESLint **0** errors, `makemigrations --check` clean, production build **exit 0**.
- The database is still full of **demo content** (`[نمونه]`) and **missing en/ar translations**, and the gallery/catalog files are empty. These are **content / owner tasks**, not code gaps; they do not break the layout but they are not release-content-ready.

---

## 2. Initial repository state and files inspected

### 2.1 Git state (verified, not assumed)

- Branch `master`, HEAD `e2e533ab376d1196e7399189e1b33489f95efd41` ("12.9phase", 2026-10-17).
- Working tree was **already dirty** before this session: 24 modified files plus untracked Phase 12.11 artifacts. **Important:** the working tree contains *more* uncommitted changes than `phase-12.11-release-readiness-report.md` documents (e.g. `globals.css`, `components/layout/header.tsx`, `footer.tsx`, `homepage/HomepageShowcase.tsx`, `ContactSection.tsx`, `CalculatorSection.tsx`, `shared/NavLink.tsx`, and several test files). These pre-existed this session and were **preserved untouched**.
- ~500 untracked media files exist under `AbrEnergy/media/` and are **not git-ignored** (`.gitignore` ignores `media/uploads/` and `media/thumbnails/` but not the other media subfolders). Repo-hygiene note only.

### 2.2 Files inspected

- `docs/reports/phase-12.11-release-readiness-report.md` (full).
- Homepage: `src/app/[locale]/(public)/homepage-client.tsx`, `components/home/FeaturedProductsSection.tsx`, `components/home/ProductRailSection.tsx`.
- Metadata/favicon: `src/lib/site-metadata.ts`, `src/app/layout.tsx`, `src/app/[locale]/admin/settings/page.tsx`.
- Navigation: `src/config/navigation.ts`, `src/components/layout/header-nav.tsx`.
- Docs/downloads: `components/products/public/ProductDocuments.tsx`, `components/products/product-documents-manager.tsx`, `src/lib/product-form.ts`; backend `apps/products/models.py`, `apps/gallery/models.py`, `apps/core/models.py`.
- Public APIs (`/api/v1/...`) for products, featured, categories, services, projects, articles, gallery, site-config, homepage.
- Backend settings (`config/settings/base.py`, `dev.py`), `manage.py`, `seed_data.py`.
- Installed tooling: Chrome (headless) + DevTools protocol (no Playwright/Puppeteer); `next.config.ts` supports the documented isolated `NEXT_DIST_DIR` build workflow.

### 2.3 Services used

- Backend `manage.py runserver` on `:8000`; frontend production build served from an **isolated** dist dir on `:3001` (CORS allows only `:3000`/`:3001` — see §7). A temporary QA-only settings module (outside the repo) disabled DRF throttling during the pass; normal `config.settings.dev` was restored afterwards.

---

## 3. Findings

### 3.1 Verified fixes (code changes made this phase)

| # | Defect | Evidence | Fix |
|---|---|---|---|
| F-1 | **Product-document `doc_type` value mismatch.** Backend `DOC_TYPE_CHOICES = catalog, datasheet, installation_guide, spec_sheet, other` (`apps/products/models.py:283`), but the frontend sent/labelled `installation` and `spec` (`src/lib/product-form.ts:100`, `ProductDocuments.tsx:9-10`). Saving those two types via the admin would 400 (`invalid_choice`), and their public labels fell back to “Other”. No documents exist yet, so the defect was latent. | Backend choices vs frontend options; model serializer accepts only model choices. | Aligned all three layers to the backend values: `product-form.ts` options → `installation_guide`/`spec_sheet`; `ProductDocuments.tsx` label-map keys → `admin.doc_type_installation_guide`/`admin.doc_type_spec_sheet`; renamed the keys in `locales/{fa,en,ar}.json`. No type/union changes needed (`doc_type: string`). |

### 3.2 Requirements verified against the rendered page (no change needed)

Automated DOM assertions (viewport-parameterised) on the production build:

| Requirement | Method | Result |
|---|---|---|
| Section order `hero → featured → categories → services → calculator → projects → articles → contact` | `[data-section]` order in DOM | **PASS** (identical at 1440/768/390) |
| No duplicate category pill row in the solutions area | count of `button[aria-pressed]` inside `[data-section="categories"]` | **PASS** (`0`) |
| Featured rail has an **All** filter + category filters derived from real data | pills on `[data-testid="featured-products"]` | **PASS** — `همه دستهها` + 6 category pills (data-derived) |
| Selecting a category shows only that category | click pill → rail count | **PASS** (`6 → 1`, label `پکیجهای خورشیدی`) |
| Selecting **All** restores the full collection | click All → rail count | **PASS** (`→ 6`) |
| Empty/loading/error states do not invent products | throttle-induced error state inspected | **PASS** (error UI + retry, no fake items) |
| No horizontal overflow (RTL) | `scrollWidth − clientWidth` | **PASS** = `0` at 1440×900, 768×1024, 390×844, 360×800 (light and dark) |
| Dark theme applies | `documentElement.class` after `theme=dark` | **PASS** (`… dark`, body bg `rgb(15,23,42)`) |
| Accessible names on controls | buttons/links without text **or** `aria-label` | **PASS** = `0` unnamed across all audited pages |
| Broken images / empty links | `naturalWidth===0`, `href in ('#','')` | **PASS** = `0` |
| Detail routes resolve | `/fa/products|services|projects|articles/<slug>` | **PASS** = HTTP 200 |

Header dropdowns open (Products grid + Services/Projects list) and the mobile menu button opens; `Escape` closes the desktop panel (`header-nav.tsx:160`). Distinct link counts and details are in the audit dump (`opencode/audit.json`).

### 3.3 Remaining defects

| # | Severity | Defect | Evidence | Recommended action |
|---|---|---|---|---|
| D-1 | P2 | **Empty-slug deep links.** Public listings link `/{section}/{slug}`; demo entities without an en/ar translation have `slug=""`, so they link to the section index instead of a detail page. `/fa/articles` renders 3 cards → `/articles`; `/en/services` renders 3 blank cards → `/services`. The header nav already guards empty slugs (`header-nav.tsx:88,92`); the listing pages do not. | Rendered anchors; API responses | Root cause is missing translations (content task). Optional defensive guard in listings (skip/slug-guard entities) — see §9 next actions. |
| D-2 | P3 | **Missing page-level SEO metadata** on `/services`, `/projects`, `/articles`, `/gallery`, `/contact` and all detail pages — they fall back to the root English default title/description. Only `/products` sets its own. | Rendered `document.title`/`meta` | Add `generateMetadata` per route (owner-provided copy or locale keys). |
| D-3 | P3 | **Canonical/OG base uses the default `http://localhost:3000`** because `NEXT_PUBLIC_SITE_URL` is unset; rendered canonicals point at the wrong origin when served elsewhere. | `<link rel="canonical">` | Set `NEXT_PUBLIC_SITE_URL` (and `NEXT_PUBLIC_API_URL`) at deploy — deployment setting, not a code change. |
| D-4 | P2 | **Anonymous DRF throttle is `100/hour`** (`config/settings/base.py:149-152`). One homepage view ≈ 6 API calls, so ~16 page views/hour/IP — low for a public site and risky behind NAT/proxy (shared IP). Observed live during QA (429 with a ~12-min retry). | Live 429 responses; settings | Owner decision: raise/monitor the anon rate for production. |
| D-5 | P3 | **`django-ckeditor` bundles CKEditor 4.22.1** (framework warning: no longer supported, unfixed security issues). | Django system-check warning | Track/replace (dependency decision). |
| D-6 | P3 | **Stale build path committed in `tsconfig.json`**: `".next-prod129/types/**/*.ts"` in `include`. | `tsconfig.json` | Remove during a later housekeeping pass. |

### 3.4 Content gaps (owner-provided content required)

Live DB content (`/api/v1/...`, `fa` + `en` fetched). Numbers are counts of demo-labelled `[نمونه]` items:

| Entity | Live | Demo `[نمونه]` | Notes |
|---|---|---|---|
| Products | 12 | 12 (`DEMO-001…011`, `ADMIN-DEMO-001`) | All are demo; only the admin one has a cover image. Persian titles/slugs only in every locale. |
| Services | 6 | 3 | 3 named (on/off/hybrid grid) + 3 demo; demo ones have no en/ar translation → empty title/slug. |
| Projects | 5 | 2 | 3 named (Tehran/Isfahan/Shiraz) + 2 demo; demo ones untranslated. |
| Articles | 6 | 3 | 3 English seed titles (no fa slug) + 3 demo; demo ones untranslated. |
| Product categories | 22 | — | Includes the 4 intended families but with **duplicate children** (`آپارتمان`×2, `ویلا`×2, `داروخانه`×2, `مطب`×2). |
| Gallery images | 0 | — | Gallery is empty; `/gallery` renders its empty state. |
| Product documents | 0 | — | No catalog/datasheet PDFs anywhere. |

Additional content gaps:

- **Homepage/CMS copy is Persian-only.** The homepage section titles (`homepage/` `sections[].title`) and product/category text are stored as single (Persian) strings; the `/en` and `/ar` homepages therefore render Persian section headings (`محصولات ویژه`, `راهکارها…`, `خدمات ما`, `پروژههای برگزیده`, `آخرین مقالات`), and `/en/products` shows Persian product titles. This is a content/i18n model gap (no per-locale CMS copy), not a layout bug.
- **Intended taxonomy vs actual.** The intended product families/services/projects/downloads are **not** present as real content; the DB holds demo placeholders. Per the spec this is expected — reported, not fabricated.
- The intended **download catalogs** ("Solar power plant catalog", "Modular MEP support system catalog") have **no file** and no entity; the menu labels imply a catalog that does not exist (see §5).

### 3.5 Owner decisions

1. Replace all `[نمونه]` demo content with real products/services/projects/articles (text + prices + photos) — **do not ship demo data**.
2. Provide the two real catalog PDFs (or change the downloads labels so they no longer imply a file exists).
3. Decide the CMS localization strategy for homepage/product copy (per-locale fields or translations).
4. Rotate the seed/demo credentials (see §3.6) and ensure they are never used in production.
5. Set deployment `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL` and confirm the production CORS origin allow-list.
6. Decide the production anonymous API throttle rate.

### 3.6 Security / secrets (release-relevant only)

- **Demo credentials are committed in source** in `AbrEnergy/apps/core/management/commands/seed_data.py` (three hard-coded seed passwords). The values are **not repeated here**. Recommendation: treat as demo-only, rotate them, and confirm the seeder is never run against production. (Already flagged in `phase-00`/`phase-10` reports.)
- `config/settings/base.py:8` defaults `SECRET_KEY` to a clearly-labelled insecure dev string; production must supply a real env value.
- No `.env` file is tracked (`.gitignore` covers `*.env`, `abr-energy-frontend/.env*`). No other secrets were found in tracked source. This is not a full security audit.

---

## 4. Changed files (this phase) and reasons

| File | Change | Reason |
|---|---|---|
| `abr-energy-frontend/src/lib/product-form.ts` | `DOC_TYPE_OPTIONS` → `['catalog','datasheet','installation_guide','spec_sheet','other']` | F-1 — match backend choices so admin saves don’t 400 |
| `abr-energy-frontend/src/components/products/public/ProductDocuments.tsx` | label-map keys → `installation_guide`/`spec_sheet` | F-1 — correct public labels |
| `abr-energy-frontend/locales/fa.json`, `en.json`, `ar.json` | renamed `doc_type_installation`→`doc_type_installation_guide`, `doc_type_spec`→`doc_type_spec_sheet` | F-1 — resolve admin + public labels |
| `docs/reports/phase-12.12-screenshots/` (26 PNGs) | new artifacts | Visual QA evidence for human review |
| `docs/reports/phase-12.12-content-visual-qa-report.md` | new report | this document |

Also transient, then reverted/removed: `tsconfig.json` auto-edit by `next build` was reverted (`git checkout`); the isolated build dir `.next-qa/` was deleted. Nothing else in the pre-existing dirty tree was modified.

---

## 5. Downloads and navigation

- The public navigation “دانلودها / Downloads” item points at **`/gallery`** with two children labelled like catalogs, both also linking to `/gallery` (`navigation.ts:52-59`). There is **no per-download entity or detail route** (backend `apps/gallery/models.py` holds images only; Phase 12.11 documented the same).
- The **real download mechanism** is `ProductDocument` (PDF + `doc_type` incl. `catalog`, `is_active`) rendered on product detail by `ProductDocuments` with a `download` link to the uploaded file. **No such documents exist**, so nothing is downloadable today.
- The gallery API returns **0 images**, so `/gallery` shows its empty state; the catalog-sounding menu labels currently imply files that do not exist.
- Recommendation (no new model in this phase): either (a) supply real catalog PDFs as `ProductDocument`/media and relabel the menu, or (b) relabel the two children to what `/gallery` actually offers until real catalog files exist. Creating a dedicated downloads model/route is **not** justified by current evidence and is out of scope.

---

## 6. Dynamic favicon and metadata

- **Default fallback verified:** with `site-config.favicon = null`, the rendered document has exactly one icon link — the file-convention `src/app/favicon.ico` (`http://localhost:3001/favicon.ico`) — and `generateMetadata` emits **no** `metadata.icons`. The static fallback is intact.
- **Dynamic path reviewed + unit-covered:** `site-metadata.ts` (`faviconHref`, `buildIconsMetadata`) validates the extension (`ico/png/svg/jpe?g/webp/gif`), resolves relative `/media/...` via `resolveMediaUrl`, returns `undefined` for unusable types, and `layout.tsx` only adds `icons` when a usable favicon exists. Covered by `site-metadata.test.ts` (5 tests, part of the 552 passing).
- **Admin control verified live:** logged into the CMS and confirmed `/admin/settings` renders two `input[type=file]` (accept `image/png,image/jpeg,image/webp`) with the visible labels “لوگوی سایت” (logo) and “فاوآیکون” (favicon).
- **NOT VERIFIED end-to-end:** rendering a *valid CMS favicon in the document head* was **not** exercised, because doing so requires writing to `SiteSettings.favicon` (owner/CMS data change) and no favicon is configured. This remains an owner/deployment confirmation; it is intentionally not faked by mutating CMS data.

---

## 7. Accessibility, usability & release checks

- **Keyboard/header:** desktop dropdown opens via its toggle button (`aria-haspopup`, `aria-expanded`, `aria-controls`) and on hover; `Escape` closes; outside-click closes. Mobile menu button has an accessible name.
- **Focus states:** interactive controls carry `focus-visible:outline-*` classes (spotlight CTA, carousel controls, filter pills, header/nav links). Not pixel-verified (see §8).
- **Semantics/naming:** 0 unnamed buttons/links and 0 empty/`#` anchors on all audited pages; one `<h1>` per audited page.
- **RTL / mixed content:** RTL layout renders with **0 horizontal overflow** at 390/360; Persian/Latin mixing renders (e.g. `پروفیل C41`). Locale mixing of *content* is a content gap (§3.4), not a layout defect.
- **States:** loading (skeleton), empty, error (with retry), and unavailable-media (gradient “Sun” fallback) states all present and coherent; no fabricated items.
- **Console/network:** only a `THREE.Clock` deprecation warning; a few `ERR_ABORTED` fetches are Next.js prefetch aborts. No page-level JS errors.
- **CMS boundaries:** admin routes redirect anonymous users to `/login` (verified); admin sidebar hides role-gated items and marks `attributes` as “coming soon”. Public pages load without auth.
- **Smoke:** all tested public routes plus `/robots.txt` and `/sitemap.xml` returned **200**.

---

## 8. Visual QA evidence

26 screenshots in `docs/reports/phase-12.12-screenshots/`, captured with headless Chrome (DevTools protocol) against the **production build** on `:3001`:

| File | Viewport | Page / state |
|---|---|---|
| `home-fa-desktop.png` | 1440×900 (full) | Home, light |
| `home-fa-tablet.png` | 768×1024 (full) | Home, light |
| `home-fa-mobile.png` | 390×844 (full) | Home, light |
| `home-fa-dark-desktop.png` | 1440×900 (full) | Home, dark |
| `home-en-desktop.png` / `home-ar-desktop.png` | 1440×900 (full) | Home, en / ar |
| `products-fa.png`, `product-detail-fa.png` | 1440×900 (full) | Catalog + detail |
| `services-fa.png`, `service-detail-fa.png` | 1440×900 (full) | Services |
| `projects-fa.png`, `project-detail-fa.png` | 1440×900 (full) | Projects |
| `articles-fa.png`, `article-detail-fa.png` | 1440×900 (full) | Articles |
| `gallery-fa.png`, `contact-fa.png` | 1440×900 (full) | Gallery (empty) / Contact |
| `home-fa-featured-filter.png` | 1440×900 | Featured filter after selecting `پکیجهای خورشیدی` |
| `header-dropdown-products-fa.png` / `header-dropdown-services-fa.png` | 1440×900 | Header dropdowns open |
| `mobile-menu-fa.png` | 390×844 | Mobile menu open |
| `login-fa.png`, `admin-dashboard-fa.png`, `admin-settings-fa.png`, `admin-products-fa.png`, `admin-gallery-fa.png`, `admin-homepage-fa.png` | 1440×900 | Auth + CMS screens |

**Inspection status — read carefully:**

- **Automated assertions:** performed (DOM structure, computed class/background, element counts, `naturalWidth`, overflow, anchor/button names, HTTP status). These are assertions, **not** visual inspection.
- **Screenshot capture:** performed (artifacts exist, non-blank — sizes 60 KB–1.4 MB).
- **Visual/pixel inspection by the agent: NOT VERIFIED.** The model cannot ingest image pixels in this environment. The screenshots are provided for **human** review. No visual approval is claimed from DOM checks or from the mere existence of a screenshot.

---

## 9. Results vs Phase 12.11 baseline

| Check | Command | Result |
|---|---|---|
| Frontend tests | `npx vitest run` | **66 files / 552 passed, 0 failed** (= baseline) |
| TypeScript | `npx tsc --noEmit` | **0 errors** (= baseline) |
| ESLint (changed files) | `npx eslint <changed files>` | **0 errors** (= baseline) |
| Backend tests | `python -m pytest -q` | **245 passed** (= baseline) |
| Migrations | `manage.py makemigrations --check --dry-run` | **No changes detected** (exit 0) |
| Production build | `NEXT_DIST_DIR=.next-qa npx next build` | **exit 0** |
| Smoke (public) | Chrome/CDP + HTTP | home/products/services/projects/articles/gallery/contact/detail = 200; robots/sitemap = 200 |

Skipped/limited: **pixel-level visual review** (no image input — §8); **LR/CRAN cross-browser** (only Chrome); **end-to-end CMS-favicon rendering** (would require a CMS data write — §6). No test was modified to hide a failure; the only failing thing encountered during the pass was the API throttle (429), worked around with a temporary out-of-repo QA settings module and restored afterwards.

---

## 10. Remaining blockers & recommended next actions

Blockers to a full `ACCEPTED`:

1. **Human pixel-level visual review** of the 26 screenshots (and real devices) — the agent cannot perform it.
2. **Demo content and empty catalogs** must be replaced by real owner content before the site is release-content-ready.
3. Decide and apply the **throttle**, **deployment env** (`NEXT_PUBLIC_SITE_URL`/`API_URL`), and **seed-credential** items.

Recommended, ordered:

- Owner supplies the real product/service/project/article content + photos, and the two catalog PDFs (or agrees to relabel the downloads menu).
- Decide CMS localization for homepage/product copy (per-locale fields vs translations) to remove the Persian-on-en/ar rendering.
- Optional defensive guard: skip slug-less entities in the public listings (D-1) — small, safe, can land any time.
- Add per-route `generateMetadata` for services/projects/articles/gallery/contact (D-2).
- Set deployment env vars; review the anon throttle; plan CKEditor upgrade (D-4/D-5).
- Human visual pass over `docs/reports/phase-12.12-screenshots/`.

---

## 11. Confirmations

- **No destructive database operation was performed.** No migrations, no seeders, no deletes, no resets. Only read-only API queries plus runtime server restarts. The temporary QA settings module lived **outside the repo** and normal `config.settings.dev` was restored.
- **No commit was created.** Git working tree still reflects the pre-existing Phase 12.11 uncommitted state plus this phase's 5 small file edits and the new report/screenshots.
- **No Phase 13 work was started.**
- The database content was **preserved** (nothing added, overwritten, or removed).

# Phase 12.13 — Release Blockers, Data Integrity & SEO Hardening

Date: 2026-10-18
Scope: post-Phase-12.12 continuation. Verified release-relevant fixes (empty-slug
public links, page-level SEO metadata, seed/config safety guards), a read-only
catalog data-integrity audit, and a dependency/deployment risk assessment.
No architecture rewrite, no Phase 13, no destructive data operations, no commit.

Verdict: **PARTIALLY ACCEPTED** (see §1, §10).

---

## 1. Executive summary and verdict

**PARTIALLY ACCEPTED.**

Delivered and verified this phase:

- **Empty/whitespace-slug public links fixed** (the Phase 12.12 D-1 defect). A
  shared guard (`src/lib/slug.ts`) plus list-level filtering ensures no public
  listing renders a card or detail link for an entity that has no openable
  slug. Covered by 10 new frontend tests; real valid detail routes still
  resolve (HTTP 200).
- **Route-level localized SEO metadata** added for services, projects,
  articles, gallery and contact (list + detail), plus their model/detail
  routes, all derived from the existing locale dictionaries and the configured
  public origin. Verified over HTTP for `fa`/`en`/`ar` (no English-on-Persian
  leak; canonical from `NEXT_PUBLIC_SITE_URL`).
- **Seed-data safety guard**: `seed_data` now refuses to run outside
  development/test, so predictable demo users can no longer be created in
  production. Covered by tests.
- **Production `SECRET_KEY` guard**: production settings now fail fast instead
  of silently booting with the insecure dev secret. Covered by tests.

Not full `ACCEPTED` because release-content readiness (real products/services/
projects/articles, catalog PDFs, gallery media, ar/en CMS copy) remains an
owner task, and the anonymous DRF throttle, CKEditor 4 EOL and the deployment
env vars (`NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_URL`) are owner/deployment
decisions — documented, not silently changed. The production settings module
could not be executed in this environment (see §9 limitation).

All regression baselines hold and improved: frontend **572** tests, backend
**249** tests, `tsc` 0 errors, changed-file ESLint 0 errors, `makemigrations
--check` clean, production build exit 0.

---

## 2. Initial Git state and pre-existing dirty changes

Verified (not assumed):

- Branch `master`, HEAD `e2e533ab376d1196e7399189e1b33489f95efd41` ("12.9phase",
  2026-10-17). No new commit was created this phase.
- The working tree was **already dirty before this session**: 26 modified tracked
  files and ~650 untracked files (mostly `AbrEnergy/media/**` product/document
  uploads that are not git-ignored, plus Phase 12.10–12.12 reports/screenshots).
  All were **preserved untouched**.
- Pre-existing tracked modifications relevant to this phase (present before this
  session, not authored here): `apps/products/api/v1/serializers/products.py`
  (Phase 12.11 SKU validation) and
  `apps/products/management/commands/seed_product_categories.py` (rename-in-place
  taxonomy sync). Both were left as-is.
- No `.env` file is tracked. `abr-energy-frontend/.env.local` exists, is
  git-ignored, and contains only `NEXT_PUBLIC_HOMEPAGE_PREVIEW` (no secret).

---

## 3. Confirmed issues and fixes

### 3.1 Empty-slug public listing links (Phase 12.12 D-1) — FIXED

**Defect.** Public list/detail links were built as `/{section}/{slug}` even when
the active-locale slug was empty (missing translation). Demo/English-only
entities produced blank cards linking to the section index (e.g. `/en/services`
and the English-only article cards on `/fa/articles` linked to `/services`,
`/articles`). The header nav already guarded empty slugs; the listings did not.

**Fix.** New `abr-energy-frontend/src/lib/slug.ts`:

- `hasValidSlug(value)` — true only for a non-empty, non-whitespace string.
- `detailHref(base, slug)` — `base/slug` or `null`.

Applied at every public listing that builds a detail link:

| File | Change |
|---|---|
| `src/app/[locale]/(public)/services/page.tsx` | filter list items by `hasValidSlug(s.slug)` |
| `src/app/[locale]/(public)/projects/page.tsx` | filter list items by `hasValidSlug(p.slug)` |
| `src/app/[locale]/(public)/articles/page.tsx` | filter list items by `hasValidSlug(a.slug)` |
| `src/components/home/ServicesSection.tsx` | filter hook/CMS services (incl. the pre-existing `\|\| ''` href) |
| `src/components/home/ProjectsSection.tsx` | filter hook/CMS projects |
| `src/components/home/ArticlesSection.tsx` | filter hook/CMS articles |
| `src/components/home/FeaturedProductsSection.tsx` | filter featured products (defensive) |
| `src/components/home/ProductRailSection.tsx` | filter family quick-access roots + pipe-clamp shortcut |
| `src/components/products/public/ProductGrid.tsx` | filter grid products (defensive) |
| `src/components/products/public/RelatedProducts.tsx` | filter related links (defensive) |
| `src/components/products/public/ProductCategoryNavigation.tsx` | filter root categories (defensive) |

Behaviour: invalid entities are **skipped** from detail-link cards (not rendered
as blank/misleading links). Valid localized routes and RTL behaviour are
unchanged. No fallback slugs, no fabricated translations, no DB change.

**Verification.** New tests `src/lib/slug.test.ts` (4) and
`src/components/home/phase-12-13-slug-links.test.tsx` (6) cover empty,
whitespace-only, missing, non-string and valid slugs, and render the real
listing pages/sections with mixed data. Valid detail routes were smoke-tested
over HTTP against the API (`/api/v1/services|projects|articles/<real-slug>/` =
200) — see §9.

### 3.2 Page-level SEO metadata (Phase 12.12 D-2/D-3) — FIXED

**Defect.** `/services`, `/projects`, `/articles`, `/gallery`, `/contact` and
their detail pages fell back to the root English default title/description.

**Fix.**

- New `src/lib/content-metadata.ts`:
  - `listMetadata({locale, path, titleKey, descriptionKey})` — localized title
    + description from `locales/{fa,en,ar}.json`, canonical + OG URL from the
    configured site origin (`siteUrl()`), OG locale per language.
  - `detailMetadata({locale, path, entity, ...})` — prefers the entity's own
    locale translation and `meta_title`/`meta_description`; if the locale
    translation is **absent** (detected by the backend's per-locale slug being
    empty) it uses the honest localized section copy rather than leaking
    another language.
  - `fetchPublicService/Project/Article` server-side API fetchers
    (`Accept-Language` per locale, 300s revalidate, never throws).
- New server `layout.tsx` metadata providers (the list/detail pages are client
  components, so metadata lives in route layouts):
  - `services/layout.tsx`, `services/[slug]/layout.tsx`
  - `projects/layout.tsx`, `projects/[slug]/layout.tsx`
  - `articles/layout.tsx` (replaced the previous empty layout),
    `articles/[slug]/layout.tsx`
  - `gallery/layout.tsx`, `contact/layout.tsx`

Products keep their existing backend-driven metadata
(`src/lib/product-metadata.ts`); the homepage keeps `src/lib/homepage.ts`. No
SEO rewrite; the existing dynamic-favicon `generateMetadata` in
`src/app/layout.tsx` is untouched.

**Verification over HTTP** (production build, `NEXT_PUBLIC_SITE_URL` set):

| Route | `<title>` | canonical |
|---|---|---|
| `/fa/services` | `خدمات \| ابر انرژی` | `http://127.0.0.1:3001/fa/services` |
| `/fa/contact` | `تماس با ما \| ابر انرژی` | `http://127.0.0.1:3001/fa/contact` |
| `/ar/projects` | `المشاريع \| أبر إنيرجي` | `http://127.0.0.1:3001/ar/projects` |
| `/en/services` | `Services \| AbarEnergy` | `http://127.0.0.1:3001/en/services` |

No English default appeared on a Persian page; canonical used the configured
origin, never a hardcoded production domain. Unit coverage:
`src/lib/content-metadata.test.ts` (10) — localized copy, missing translation,
missing entity (404-safe), canonical/OG origin, OG image gating.

### 3.3 Seed credentials and demo data safety (§6) — FIXED

**Defect.** `apps/core/management/commands/seed_data.py` creates privileged
accounts (`admin@abrenv.com`, `content@abrenv.com`, `customer@abrenv.com`) with
hard-coded, predictable passwords, and `--force` deletes content and users. No
guard prevented production execution.

**Fix.** Added `Command._assert_dev_environment()`, called first in `handle`.
The command now raises `CommandError` unless the active settings are
development (`DEBUG=True`) or test (`TESTING=True`). Local dev workflows
(`config.settings.dev`/`local`) are unaffected. Password **values are not
repeated here**.

Test: `apps/core/tests/test_phase12_13_seed_guard.py` (2) — blocked under
production-like settings and no users created; allowed under test settings.

`seed_product_categories` was deliberately **not** guarded: it creates no users,
sets no passwords, deletes nothing, and is an idempotent taxonomy sync that may
legitimately seed production. Documented as an owner decision.

### 3.4 Production `SECRET_KEY` guard (§5) — FIXED

**Defect.** `config/settings/base.py` defaulted `SECRET_KEY` to a clearly
labelled insecure dev string; nothing prevented production from silently using
it.

**Fix.** `base.py` now defines `DEFAULT_INSECURE_SECRET` and
`assert_production_secret()`; `config/settings/production.py` calls it and
fails fast (`ImproperlyConfigured`) when the secret is missing or still the dev
default. No other production behaviour was changed.

Test: `apps/core/tests/test_phase12_13_settings_guard.py` (2).

---

## 4. Category integrity findings

**Result: no true duplicate categories. No CMS/data change was made.**

Inspected: `ProductCategory` model (`apps/products/models.py` — global unique
`slug`, self-FK `parent`, check-constraint against self-parenting), the seed
sync command, the translation model, the public/admin serializers, and the live
database (read-only).

Live tree (22 categories, Persian-only translations, all distinct slugs):

| Parent (slug) | Children (title → slug) |
|---|---|
| `پکیجهای-خورشیدی` | آپارتمان→`آپارتمانی`, ویلا→`ویلایی`, داروخانه→`داروخانه`, مطب پزشکی→`مطب`, پارکینگ سرپوشیده→`پارکینگ-مسقف`, آبرسانی زمین کشاورزی→`تأمین-آب-زمین-کشاورزی`, کانکس سبز→`کانکس-سبز` |
| `پکیجهای-برق-اضطراری` | آپارتمان→`آپارتمانی-2`, ویلا→`ویلایی-2`, داروخانه→`داروخانه-2`, مطب پزشکی→`مطب-2` |
| `سازههای-خورشیدی` | سقف مسطح→`سقف-مسطح`, سقف شیروانی→`سقف-شیبدار`, سازه کوبشی در خاک→`سازه-زمینی-کوبشی` |
| `سیستم-نگهدارنده-نصب-ماژولار` | پروفیل→`پروفیل`, بست لوله→`بست-لوله`, سینی کابل→`سینی-کابل`, اتصالات و متعلقات→`اتصالات-و-متعلقات` |

The four titles reported as "duplicates" (`آپارتمان`, `ویلا`, `داروخانه`,
`مطب پزشکی`) are **separate legitimate records under two different parents**,
with **distinct slugs** (`آپارتمانی` vs `آپارتمانی-2`, etc.). No two categories
share both a parent and a title or a slug. Products are assigned to both
variants intentionally (e.g. one product under each `آپارتمان`).

Because there is no data defect, **no serializer validation or DB constraint was
added** (a sibling-title uniqueness rule would wrongly forbid the legitimate
cross-parent reuse, and slug uniqueness is already enforced). The application has
no canonical/alias mechanism; none is required by current evidence. No merge,
delete, rename or reassignment was performed.

Owner note: if the business intends these to be one shared concept, that is a
taxonomy decision, not a data-integrity defect — see §7.

---

## 5. Configuration, throttling, seed-safety and CKEditor findings

### 5.1 Deployment configuration

- Backend `SECRET_KEY`: insecure dev default → now guarded in production (§3.4).
- Frontend `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`
  (`src/lib/media-url.ts`): env-driven with a **localhost fallback**. When
  unset, canonical/OG URLs and media URLs resolve against localhost — correct
  for dev, wrong for production. These **must be set at deploy** (frontend
  `.env.example` already lists them). This is a deployment requirement, not a
  code defect; no production domain is hardcoded anywhere.
- Backend `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` default to
  `http://localhost:3000,http://localhost:3001`; `ALLOWED_HOSTS` defaults to
  `localhost,127.0.0.1`. All are env-configurable. Production must supply real
  origins; documented here as an owner/deployment task. No real credentials are
  reproduced in this report.
- Production settings import `sentry_sdk` unconditionally
  (`config/settings/production.py`); `sentry-sdk` is not installed in this
  environment, so production settings could not be executed here (§9).

### 5.2 Anonymous DRF throttling — reviewed, **not changed**

`config/settings/base.py`:

```
"DEFAULT_THROTTLE_RATES": {"anon": "100/hour", "user": "1000/hour"}
```

Estimate of public impact: a single homepage view triggers roughly the homepage
payload plus featured products, categories, services, projects, articles and
site-config calls (~6–8 anonymous requests). At `100/hour`/IP that is only
~13–16 page views per hour **per IP**, and behind NAT/carriers (shared IP) even
fewer — the Phase 12.12 QA already observed live `429`s. This is low for a
public marketing site. Per the phase rules, the rate was **not** raised or
disabled; this remains a documented owner decision (target value + monitoring).

### 5.3 CKEditor 4 EOL (Phase 12.12 D-5) — documented, not migrated

- `django-ckeditor 6.7.3` (requirement `django-ckeditor>=6.7,<6.8`, both
  `base.txt` and `production.txt`) bundles **CKEditor 4.22.1**, flagged by the
  Django system check `ckeditor.W001` (unsupported, unfixed security issues).
- It is **not used by any current model** — every rich-text field is now a plain
  `TextField`; `ckeditor` survives only in `INSTALLED_APPS`/`CKEDITOR_CONFIGS`
  and in the historical migration files
  (`apps/{articles,projects,services}/migrations/0001_initial.py` reference
  `ckeditor.fields.RichTextField`).
- Consequence: removing the dependency is **not** a one-line change — those
  historical migrations `import ckeditor.fields`, so a safe removal first
  requires rewriting/squashing those migrations (or keeping the package
  installed). No unplanned major migration was performed.

Recommended plan (owner): rewrite the three historical migrations off
`ckeditor.fields` → remove `ckeditor` from `INSTALLED_APPS`,
`CKEDITOR_CONFIGS` and both requirement files → run `makemigrations --check` and
the full suite. Low risk, but a deliberate migration task.

### 5.4 Other

- Phase 12.12 D-6 (stale `.next-prod129/types` include in `tsconfig.json`)
  remains; `next build` rewrites that include, and the auto-change was reverted
  here to avoid noise. Housekeeping only.

---

## 6. Localization and missing content

Read-only audit of the live database (no content was written, overwritten or
deleted):

| Entity | Rows | locale translations | Notes |
|---|---|---|---|
| Products | 14 | fa 13 (fa-only) | one product has no translation row; no en/ar product copy |
| Product categories | 22 | fa 22 (fa-only) | see §4 |
| Services | 6 | fa 6, en 3, ar 3 | 3 demo, 3 named |
| Projects | 5 | fa 5, en 3, ar 3 | 2 demo |
| Articles | 6 | fa 3, en 3, ar 0 | 3 English-only (no fa slug → previously blank `/fa` cards, now filtered), 3 fa demo; no ar at all |
| Gallery images | 0 | — | `/gallery` renders its empty state |
| Product documents (catalog PDFs) | 0 | — | nothing downloadable |

Distinction:

- **UI strings** are fully covered by the locale dictionaries
  (`locales/{fa,en,ar}.json`) — verified by the new SEO tests and the passing
  i18n suites.
- **CMS content** is largely single-language: homepage copy and product/category
  text are Persian-only; services/projects/articles have partial en/ar. The
  `/en` and `/ar` pages therefore render Persian CMS copy for those entities
  (the empty-slug filter now hides entities with *no* active-locale translation
  instead of rendering blank cards).
- **Missing business content** (real products/services/projects/articles, catalog
  PDFs, gallery media, ar/en CMS copy) cannot be fabricated and remains an owner
  task.

The current models **can** store per-locale content (per-language translation
tables exist for services/projects/articles/products/categories); the smallest
safe follow-up for homepage/product copy is to reuse that translation pattern
rather than introduce a new architecture. No new multilingual architecture was
introduced in this phase.

---

## 7. Remaining content and owner decisions

1. Replace all demo content with real products/services/projects/articles
   (text, prices, photos) and supply the catalog PDFs / gallery media.
2. Provide ar/en CMS translations (or accept Persian-only CMS copy on en/ar).
3. Decide the shared-vs-distinct meaning of the cross-parent category titles
   (§4) and whether a canonical/alias concept is wanted.
4. Set production `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, backend
   `SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
   `ALLOWED_HOSTS` and install `sentry-sdk`.
5. Decide the production anonymous throttle rate and monitoring (§5.2).
6. Approve the dependency-removal plan for CKEditor 4 (§5.3) — requires
   rewriting historical migrations first.

---

## 8. Changed files and purpose

### Backend

| File | Purpose |
|---|---|
| `AbrEnergy/config/settings/base.py` | extract `DEFAULT_INSECURE_SECRET` + `assert_production_secret()` |
| `AbrEnergy/config/settings/production.py` | fail fast on insecure/missing `SECRET_KEY` |
| `AbrEnergy/apps/core/management/commands/seed_data.py` | dev/test-only guard against predictable demo users |
| `AbrEnergy/apps/core/tests/__init__.py` (new) | test package |
| `AbrEnergy/apps/core/tests/test_phase12_13_seed_guard.py` (new) | seed guard tests |
| `AbrEnergy/apps/core/tests/test_phase12_13_settings_guard.py` (new) | production secret guard tests |

### Frontend — slug guard

| File | Purpose |
|---|---|
| `src/lib/slug.ts` (new) | `hasValidSlug` / `detailHref` |
| `src/lib/slug.test.ts` (new) | slug guard unit tests |
| `src/components/home/phase-12-13-slug-links.test.tsx` (new) | listing/section empty-slug regression tests |
| `src/app/[locale]/(public)/services/page.tsx` | filter slug-less services |
| `src/app/[locale]/(public)/projects/page.tsx` | filter slug-less projects |
| `src/app/[locale]/(public)/articles/page.tsx` | filter slug-less articles |
| `src/components/home/ServicesSection.tsx` | filter slug-less services |
| `src/components/home/ProjectsSection.tsx` | filter slug-less projects |
| `src/components/home/ArticlesSection.tsx` | filter slug-less articles |
| `src/components/home/FeaturedProductsSection.tsx` | defensive product filter |
| `src/components/home/ProductRailSection.tsx` | filter slug-less category shortcuts |
| `src/components/products/public/ProductGrid.tsx` | defensive product filter |
| `src/components/products/public/RelatedProducts.tsx` | defensive related-item filter |
| `src/components/products/public/ProductCategoryNavigation.tsx` | defensive root-category filter |

### Frontend — SEO metadata

| File | Purpose |
|---|---|
| `src/lib/content-metadata.ts` (new) | localized list/detail metadata + API fetchers |
| `src/lib/content-metadata.test.ts` (new) | metadata unit tests |
| `src/app/[locale]/(public)/services/layout.tsx` (new) | services list metadata |
| `src/app/[locale]/(public)/services/[slug]/layout.tsx` (new) | service detail metadata |
| `src/app/[locale]/(public)/projects/layout.tsx` (new) | projects list metadata |
| `src/app/[locale]/(public)/projects/[slug]/layout.tsx` (new) | project detail metadata |
| `src/app/[locale]/(public)/articles/layout.tsx` | articles list metadata (was empty) |
| `src/app/[locale]/(public)/articles/[slug]/layout.tsx` (new) | article detail metadata |
| `src/app/[locale]/(public)/gallery/layout.tsx` (new) | gallery list metadata |
| `src/app/[locale]/(public)/contact/layout.tsx` (new) | contact list metadata |

No database migration was created. No pre-existing user change was reverted
except the transient `next build` rewrite of `tsconfig.json` (reverted, as in
Phase 12.12).

---

## 9. Actual test / build / migration / smoke results

Baseline per Phase 12.12: frontend 552, backend 245, `tsc` 0, changed-file ESLint
0, migrations clean, build exit 0.

| Check | Command | Result |
|---|---|---|
| Frontend tests | `npx vitest run` | **69 files / 572 passed, 0 failed** (552 + 20 new) |
| TypeScript | `npx tsc --noEmit` | **0 errors** |
| ESLint (changed files) | `npx eslint <changed files>` | **0 errors** (10 pre-existing warnings: unused imports / `no-img-element`) |
| Backend tests | `python -m pytest -q` | **249 passed** (245 + 4 new) |
| Migrations | `manage.py makemigrations --check --dry-run` | **No changes detected** (exit 0; only the known `ckeditor.W001` warning) |
| Django check (dev) | `manage.py check` | exit 0 (only `ckeditor.W001`) |
| Production build | `NEXT_DIST_DIR=.next-qa13 npx next build` | **exit 0** ("Compiled successfully"), isolated dist dir, removed afterwards |
| HTTP smoke (frontend, prod build) | `/fa`,`/fa/products`,`/fa/services`,`/fa/projects`,`/fa/articles`,`/fa/gallery`,`/fa/contact` | **200** |
| HTTP smoke (backend API) | `/api/v1/{services,projects,articles,site-config}/` | **200** |
| Valid detail routes (API, real slugs) | `/api/v1/{services,projects,articles}/<fa-slug>/` | **200** each |
| SEO metadata (HTTP, prod build) | `fa`/`en`/`ar` list routes | localized title + canonical from `NEXT_PUBLIC_SITE_URL` (see §3.2) |

Test-count changes explained: +20 frontend (`slug.test` 4, `content-metadata.test`
10, `phase-12-13-slug-links` 6), +4 backend (`test_phase12_13_seed_guard` 2,
`test_phase12_13_settings_guard` 2).

Note on the first baseline run: `src/components/shared/media-picker-dialog.test.tsx`
("homepage OG" case) hit the 5000 ms vitest timeout once; it passed on the final
full run (66→69 files, all green) and on re-run. This is pre-existing flakiness,
not caused by this phase, and no test was modified to hide it.

Skipped / limited:

- **Production settings runtime** was **not** executed: `config/settings/production.py`
  imports `sentry_sdk`, which is not installed here. The new `SECRET_KEY` guard
  was therefore unit-tested through `assert_production_secret()` (which does not
  import sentry) rather than by loading the production module.
- **Pixel/visual review**: not performed (no image-input capability); unchanged
  from Phase 12.11/12.12.
- Only Chrome/HTTP was used for smoke tests.

No check is reported as passing unless it actually ran.

---

## 10. Remaining risks, by severity

- **P1 — Deployment env vars unset.** If `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_API_URL`, backend `SECRET_KEY`, CORS/CSRF/allowed-hosts are not
  configured, production falls back to localhost origins and the backend would
  (now) refuse to start with the dev secret. Required before deploy.
- **P2 — Anonymous throttle too low** (`100/hour`/IP ≈ 13–16 page views/hour)
  for a public site behind NAT. Owner decision; not changed here.
- **P2 — Release content absent.** Demo data, no catalog PDFs, empty gallery,
  Persian-only CMS copy. Content/owner task.
- **P3 — CKEditor 4.22.1 EOL** bundled by an otherwise-unused dependency;
  removal needs a historical-migration rewrite.
- **P3 — Stale `tsconfig.json` include** (`.next-prod129/types`), cosmetic.
- **P3 — Visual/pixel QA** remains unverified by an agent.

---

## 11. Confirmations

- **No production deployment occurred.** No external systems were contacted; no
  containers or remote hosts were touched.
- **No destructive database operation occurred.** No migrations, seeder runs,
  deletes, resets or data writes. The category and content audits were
  read-only; the only DB access was read queries (Django shell + read-only API
  requests) plus the isolated test databases.
- **No commit was created.** The working tree still holds all pre-existing
  Phase 12.10–12.12 changes plus this phase's additive edits; `tsconfig.json`
  auto-changes from `next build` were reverted and the isolated build dir was
  removed.
- **No real credentials were rotated, created or printed.** Password values are
  not reproduced anywhere in this report.
- **No Phase 13 work was started.**

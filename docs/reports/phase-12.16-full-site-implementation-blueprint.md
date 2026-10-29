# Phase 12.16 — Full-Site Completion Blueprint

Date: 2026-10-19
Status: **AUDIT COMPLETE — IMPLEMENTATION NOT STARTED**
Verdict: **READY FOR OWNER APPROVAL; THE SITE IS NOT RELEASE-COMPLETE**

This is an audit-only blueprint. It does not implement, deploy, reset, delete,
or commit anything. It records what exists, what is broken, what is missing, and
what must be built or decided before the site beyond the homepage can be called
complete. Every claim is labelled by evidence strength in §3.

---

## 1. Executive summary and final verdict

The homepage and the product CMS are materially ahead of the rest of the site.
The public shell, the content editors, the settings pipeline, and several
production concerns are not complete. The most important finding is that three
admin content editors are posting payloads the backend does not accept or
silently ignores, so articles, services, and projects cannot be reliably
created or edited through the current UI.

**Release blockers (P0):**

| # | Blocker | Evidence |
| --- | --- | --- |
| 1 | Article create sends `translations` as an array and `tags` as a string; `ArticleWriteSerializer` expects a dict and a list. | `abr-energy-frontend/src/app/[locale]/admin/articles/new/page.tsx`; `AbrEnergy/apps/articles/api/v1/serializers/article.py` |
| 2 | Article edit sends flat `title_fa` fields instead of `translations`, so edits are ignored. | `admin/articles/[id]/edit/page.tsx` |
| 3 | Service create/edit send flat `title_fa`/`short_description_fa`; `ServiceWriteSerializer` expects `translations`. | `admin/services/{new,[id]/edit}/page.tsx`; `AbrEnergy/apps/services/api/v1/serializers/service.py` |
| 4 | Project create/edit send the same flat pattern; `ProjectWriteSerializer` expects `translations`. | `admin/projects/{new,[id]/edit}/page.tsx`; `AbrEnergy/apps/projects/api/v1/serializers/project.py:101` |
| 5 | Admin content sits under the fixed header because the locale layout does not reserve header height and admin layouts add only page padding. | `src/app/[locale]/layout.tsx`; `src/app/[locale]/admin/layout.tsx`; `src/components/layout/header.tsx` |
| 6 | Company/contact/SEO settings are not editable or rendered: admin settings only PATCHes logo/favicon, and footer/contact pages hardcode values. | `admin/settings/page.tsx`; `components/layout/footer.tsx`; `(public)/contact/page.tsx` |
| 7 | Approved brand asset is not deployed; `public/abar-energy-logo.png` differs from the approved root `abar logo.png`. | `components/layout/brand-logo.tsx`; file hashes in §6 |
| 8 | Fabricated content remains: About stats/timeline and Contact phone/email/address/hours, plus placeholder Privacy/Terms links with no routes. | `(public)/about/page.tsx`; `(public)/contact/page.tsx`; `components/layout/footer.tsx` |

**What is already strong:**

- Homepage CMS/Studio is real: media picker/upload, relation pickers, dirty
  navigation guard, preview, permissions, published-content API.
- Product CMS is the most complete editor: media, documents, attributes,
  specifications, SEO, relations, price, dirty-state handling.
- Admin dashboard is data-driven (four requests, one aggregate) and not fake.
- Backend permissions, JWT rotation, throttling, and API mounts are coherent.
- Sitemap/robots exist and protect admin/auth/dashboard routes.

**What must not be assumed without owner input:** real product/media/content
data, active ar/en locales, TLS topology, electricity tariffs used by the
calculator, and legal/privacy copy are all owner decisions, not code facts.

---

## 2. Scope, constraints, and non-goals

In scope: full-site audit of public routes, admin CMS, auth/user dashboard,
content/API contracts, SEO, i18n, brand, accessibility risk, and production
readiness; then a prioritized implementation blueprint with acceptance criteria.

Out of scope and forbidden in this phase:

- No application implementation or code changes.
- No deployment, container build, or production access.
- No database reset, migration, or destructive operation.
- No commit, push, tag, or Git reset/clean.
- No deletion of media, reports, screenshots, or owner content.
- No guessing of domains, certificates, tariffs, or legal copy.

Persistence rule: all pre-existing modified and untracked files are treated as
owner-owned and must be preserved.

---

## 3. Evidence, methodology, and verification limits

Method: direct source reads of frontend routes/components/hooks/lib and backend
apps/URLs/serializers/views/settings; file hashes; route and table inventories;
read-only database schema probing; targeted searches for contract mismatches.

Evidence classes used throughout:

- **Verified** — read directly from source or measured (hash, count, path).
- **Inferred** — strongly implied by adjacent source but not executed.
- **Owner decision** — cannot be resolved by code audit.
- **Runtime-unverified** — requires running servers/browser/containers.

Verification limits found during this audit:

- No browser automation (no Playwright/Puppeteer/Cypress) is present, so no
  pixel, responsive, focus, or live CMS round-trip was inspected.
- Docker is not available in this environment; container health and nginx TLS
  behavior were not executed.
- No Python virtualenv is present; backend tests were not re-run in this audit.
- `AbrEnergy/db.sqlite3` is a 0-byte placeholder; the project expects
  PostgreSQL, so no live content was measured.
- No `.github/` CI directory exists.
- No secrets or `.env` values were read or printed.

Inherited accepted baseline (from Phase 12.15, not re-run here): frontend 588
passing, backend 265 passing, TypeScript 0 errors, `manage.py check` 0 issues,
production build exit 0.

---

## 4. Baseline repository and Git state

| Item | Value |
| --- | --- |
| Branch | `master` |
| HEAD | `e2e533ab376d1196e7399189e1b33489f95efd41` ("12.9phase") |
| Remote | `git@github.com:mobinnet3000/AbrEnergy.git` |
| Working-tree entries | 1903 changed/untracked at audit start, mostly `AbrEnergy/media/` |
| Stashes | none observed |
| Commits/pushes this phase | none |
| Local DB | `AbrEnergy/db.sqlite3`, 0 bytes; runtime DB is PostgreSQL per `.env.example` |
| CI | none (`.github/` absent) |
| Structure | repo root `AbrEnergy/`; backend `AbrEnergy/AbrEnergy/`; frontend `abr-energy-frontend/`; reports `docs/reports/` |

Safeguards: no reset, clean, restore, DB write, media deletion, or deployment was
performed. The only artifact produced by this phase is this report.

---

## 5. Architecture and route map

### Frontend (Next.js App Router)

Locale segment `[locale]`; `locales = ['fa','ar','en']`, default `fa`, but
`activeLocales = ['fa']`. Existing public pages:

- `/`, `/about`, `/articles`, `/articles/[slug]`, `/calculator`, `/contact`,
  `/gallery`, `/products`, `/products/[slug]`, `/products/category/[slug]`,
  `/projects`, `/projects/[slug]`, `/services`, `/services/[slug]`.

Auth and user pages: `/(auth)/login`, `/(auth)/register`,
`/(auth)/forgot-password`; `/dashboard`, `/dashboard/profile`,
`/dashboard/calculations`, `/dashboard/notifications`.

Admin pages: `/admin`, `/admin/activity-log`, `/admin/articles` (+ `new`,
`[id]`, `[id]/edit`), `/admin/categories`, `/admin/contacts`,
`/admin/content/homepage`, `/admin/gallery`, `/admin/inquiries`, `/admin/media`,
`/admin/notifications`, `/admin/products` (+ `new`, `[id]/edit`,
`categories` + `new`/`[id]/edit`), `/admin/projects` (+ `new`, `[id]`,
`[id]/edit`), `/admin/services` (+ `new`, `[id]`, `[id]/edit`), `/admin/settings`,
`/admin/tags`, `/admin/users`. Preview routes: `/preview/homepage`,
`/preview/products/[id]`, `/preview/products/category/[id]`.

Missing routes: `/products/category` index, `/privacy`, `/terms`,
`not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`.

### Backend

Django + DRF with API v1 mounted in `AbrEnergy/config/api_v1.py`: health, auth,
users, articles/categories/tags, services/service-categories, projects,
products/product-categories, calculator, contact/project-inquiry, gallery,
media, notifications, site-config, homepage, plus admin dashboard,
activity-log, and admin contact-request routes.

REST framework settings (`AbrEnergy/config/settings/base.py`): JWT auth,
`IsAuthenticated` default, `StandardPagination` with `PAGE_SIZE = 20`,
`AnonRateThrottle` 100/hour, `UserRateThrottle` 1000/hour, custom exception
handler, `NUM_PROXIES = 1`. JWT: 15-minute access, 7-day refresh, rotation and
blacklist after rotation.

Data layer in the frontend: React Query-style hooks in `src/hooks/use-api.ts`,
API wrappers in `src/api/index.ts`, axios with refresh handling in
`src/api/axios.ts`, auth state in `src/stores/auth-store.ts`, and typed models in
`src/types/index.ts`.

---

## 6. Design system, branding, theme, responsiveness, and RTL

**Header overlap (P0).** `src/app/[locale]/layout.tsx` wraps pages in
`<main className="flex-1">` with no top offset, while the header is fixed with
`h-14`/`md:h-16`. Public pages compensate individually with `pt-24`/`pt-28`;
admin and dashboard layouts add only page padding, so their first row is hidden
under the header. The correct fix is a shared shell that reserves header height
once, not more per-page padding.

**Theme (P0/P1).** Public pages hardcode `bg-black text-white`; the gallery adds
`bg-black min-h-screen`. `ThemeProvider` defaults to light, so these pages are
effectively broken in the default theme. Internal pages need theme-aware
surfaces and text tokens.

**Brand (P0).** Approved asset is repo-root `abar logo.png`: 81,301 bytes,
SHA-256 `8901857565B627DC7DD0DB1835E30B32658E611C3BAFAB049529D9E03D54592D`,
607x246. Deployed `abr-energy-frontend/public/abar-energy-logo.png` is 72,738
bytes, SHA-256
`911E60E8689A4532595CE03CBE4A4D84AD868EB4C4FCC3EFCCF81291D2F8F94F`, also
607x246 but byte-different. `DEFAULT_LOGO_SRC = '/abar-energy-logo.png'`.
The approved asset must be deployed byte-for-byte or the mismatch explained.

**Layout/nav.** `(public)/layout.tsx` is a bare passthrough; there is no shared
internal-page shell. `navigation.ts` labels `/gallery` as `nav.downloads`
("Downloads"/"دانلودها") and its fallback children all point at `/gallery`, which
is an image gallery, not downloads. Public nav does resolve live product
categories/services/projects.

**RTL/i18n.** fa/ar are RTL and fa is the only active public locale. Root
`html` `lang`/`dir` are bootstrapped per locale. ar/en public pages, CMS
translations, and admin localization are effectively absent.

**Responsive/accessibility.** Not runtime-verified. The hardcoded dark surfaces
plus light-default theme create a real contrast/theme risk; no axe/Lighthouse run
or focus-order audit was possible here.

---

## 7. Homepage audit

Verified strengths: `/admin/content/homepage` implements a media picker/upload,
relation pickers, dirty-navigation guard, preview route, and permission checks; it
posts to the homepage CMS API. The admin dashboard uses real data and a single
aggregate, reducing list round-trips to four requests.

Gaps: the homepage CMS ships Persian-first seed copy
(`DEFAULT_SECTIONS`), so an English-looking live page is a stale CMS/DB-state or
locale issue, not necessarily a missing translation key. `fa.json` has
`products.label = "کاتالوگ محصولات"` and `en.json` has `"Product Catalog"`; confirm
what the live backend returns before changing code. Owner content (real copy,
media, hero, ar/en text) is still absent.

---

## 8. Public catalog (products and categories) audit

Existing: product list, product detail, category detail, product metadata helper,
and a product JSON-LD block in
`(public)/products/[slug]/product-detail-client.tsx` (the only structured data
found).

Gaps:

- Missing `/products/category` index route even though categories exist.
- Public list uses `PAGE_SIZE = 20` with local filter state and does not persist
  filters in the URL, unlike the newer list-state pattern used elsewhere.
- Category/price/SEO coverage exists for products, but category index IA and
  breadcrumb coverage need completion.
- Product CMS itself is strong (see §13) and should be treated as the reference
  implementation for other editors.

---

## 9. Services, projects, articles, and gallery audit

**Articles.** Public list/detail exist with layout metadata. The admin new/edit
forms are broken against the backend contract (§14), use hardcoded English
labels/toasts/placeholders, expose raw category UUIDs and comma-separated tags,
and omit SEO fields even though the translation model has
`meta_title`/`meta_description`. Article category/tag admin pages are list-only.

**Services.** Public list/detail exist. Admin new/edit are broken against
`ServiceWriteSerializer`; the edit GET returns detail fields `title`/`slug`
rather than `title_fa`, leaving the form blank.

**Projects.** Public list/detail exist. Admin new/edit follow the same flat-field
pattern; `ProjectWriteSerializer` at
`AbrEnergy/apps/projects/api/v1/serializers/project.py:101` expects
`translations` and will ignore/reject the flat fields. No SEO fields in the
editor.

**Gallery.** Public gallery is image-only but is labelled "Downloads" in
navigation and fallback menus. Admin gallery and media pages are list-only; no
upload, edit, delete, or ordering UI is exposed despite backend write endpoints.

**SEO/content gaps across all four:** sitemap includes the static index routes
but omits published service/project/article detail URLs; content editors do not
manage per-translation SEO; ar/en content is absent.

---

## 10. Calculator audit

The UI collects `system_type` (`off_grid`/`on_grid`/`hybrid`) but always posts to
`/calculator/off-grid/`, so on-grid and hybrid user intent is discarded. `city`
defaults to the English string "Tehran"; irradiation is manual; zod validation
only enforces positive values. Backend constants in
`AbrEnergy/apps/calculator/calculator.py` (panel standard power, efficiency,
cost rates, electricity tariff) are hardcoded and must be owner-reviewed because
they directly affect user-facing estimates. Existing typos and mixed-language
constants should be cleaned as part of the fix.

---

## 11. Contact, inquiries, footer, and legal audit

The public contact page hardcodes `+98 21 1234 5678`, `info@abrenv.com`,
`Tehran, Iran`, `Sat–Thu, 8:00–17:00`, and "Visit our office"; it never reads
`SiteSettings`. The footer hardcodes contact details, uses `href="#"` for
Privacy/Terms, and does not read settings. No `/privacy` or `/terms` routes
exist. The contact page's metadata layout does exist.

Backend contact/inquiry APIs support detail, assignment, and updates
(`admin/contact-requests/<pk>/`, `admin/project-inquiries/<pk>/`), but the admin
frontend exposes list-only pages with no detail/status/assign workflow. Backend
notifications generate links to `/admin/contacts/{id}` and
`/admin/project-inquiries/{id}`, which are dead frontend routes. Admin
notifications live at `/admin/notifications` but navigation and badges target
`/dashboard/notifications`.

---

## 12. Authentication, user dashboard, and role model

Working: login returns `{ access, refresh, user }` and matches the login page;
register returns `{ user, tokens: { access, refresh } }` and matches the register
page; refresh rotation and blacklist-on-rotation are configured; logout is wired
through the token blacklist.

Gaps: no password-reset confirm endpoint exists despite the serializer, so reset
requests are effectively request-only (logged); no email verification; the user
profile has no password-change UI despite `/auth/password-change/`; no
password-strength policy was verified.

Roles: `MANAGER_ROLES = ['super_admin','website_admin','content_manager']`,
`ADMIN_ONLY_ROLES = ['super_admin','website_admin']`, and
`canManageSiteSettings` is `super_admin` only. Navigation shows `/admin/users`
and `/admin/activity-log` to `website_admin`, but the users list backend requires
`IsSuperAdmin`, producing a 403 for `website_admin`. The users admin page is
read-only, and the `change-role` endpoint has no last-super-admin lockout guard.

---

## 13. Admin CMS capability matrix

| Area | Route | State | Main gap | Priority |
| --- | --- | --- | --- | --- |
| Homepage | `/admin/content/homepage` | Real CMS, media, relations, preview, dirty guard | Owner content only | P1 |
| Products | `/admin/products` | Full editor: media, docs, attrs, SEO, price | Refresh/QA only | P1 |
| Product categories | `/admin/products/categories` | CRUD present | Confirm parity with product editor conventions | P2 |
| Articles | `/admin/articles` | Editor exists | Broken payload contract; raw tags/category; English UI; no SEO | P0 |
| Services | `/admin/services` | Editor exists | Broken payload; blank edit form | P0 |
| Projects | `/admin/projects` | Editor exists | Broken payload; no SEO | P0 |
| Article categories | `/admin/categories` | List-only | Backend write exists | P1 |
| Tags | `/admin/tags` | List-only | Backend write exists | P1 |
| Gallery | `/admin/gallery` | List-only | No upload/edit/delete/order UI | P1 |
| Media | `/admin/media` | List-only | No upload/delete UI | P1 |
| Settings | `/admin/settings` | Logo/favicon PATCH only | Company/contact/SEO settings not editable | P0 |
| Contacts | `/admin/contacts` | List-only | No detail/assign/status UI; dead notification links | P0 |
| Inquiries | `/admin/inquiries` | List-only | No detail/assign/status UI; dead notification links | P0 |
| Users | `/admin/users` | Read-only | Role/active editing; nav/backend role mismatch | P1 |
| Activity log | `/admin/activity-log` | Read-only table | Confirm role gating vs backend | P2 |
| Notifications | `/admin/notifications` | Read-only | Route/link mismatch with nav and backend | P1 |
| Dashboard | `/admin` | Real aggregate + recent lists (4 requests) | None observed | P2 |

---

## 14. Content model and API contract gaps

**Confirmed mismatches (P0):**

| Flow | Frontend sends | Backend expects | Result |
| --- | --- | --- | --- |
| Article create | `translations` array, `tags` string | `DictField` + `ListField` | 400 validation failure |
| Article edit | flat `title_fa`, etc. | `translations` dict | Edits ignored |
| Service create/edit | flat `title_fa`, `short_description_fa`, etc. | `DictField` `translations` | Untitled/untranslated rows or lost edits |
| Service edit GET | reads `title_fa` | returns `title`/`slug` | Blank form |
| Project create/edit | flat `title_fa`, etc. | `DictField` `translations` (project.py:101) | Untitled/untranslated rows or lost edits |

**Other contract/capability gaps:**

- Translation models for articles/services/projects carry
  `meta_title`/`meta_description`, but no content editor exposes them.
- `SiteSettings` is only partially writable from the UI (logo/favicon); public
  header/footer/contact do not consume it.
- Backend supports gallery/media writes, article category/tag writes, and contact
  detail/assign/update, but the frontend exposes read-only or list-only surfaces.
- Notification deep links point at non-existent admin detail routes.
- User management is read-only and role-gated inconsistently with navigation.

**Contracts that are correct (reference quality):** homepage CMS and product CMS
payloads align with their serializers and should be reused as patterns.

---

## 15. SEO, metadata, sitemap, robots, and structured data

| Surface | State |
| --- | --- |
| Root metadata | English `AbarEnergy \| Professional Solar Energy Solutions` |
| Articles/services/projects/contact/gallery | Have layout metadata |
| About, Calculator | No page metadata; inherit the English root title |
| Product pages | Dedicated metadata helper + Product JSON-LD |
| Organization/WebSite JSON-LD | None found |
| Sitemap | Static fa routes + products/categories only; omits content detail URLs |
| Robots | Correctly disallows admin/dashboard/auth |
| Category index | Missing, so no crawlable category hub |

Required: Persian, page-specific metadata for About/Calculator; sitemap entries
for published service/project/article details; a category index; and owner review
of canonical/OG/site name in `SiteSettings`.

---

## 16. Internationalization, localization, and content honesty

- Only `fa` is active publicly; `ar`/`en` are architectural placeholders with no
  public routes or CMS content.
- Admin UI contains hardcoded English strings (especially the article editor),
  inconsistent with the fa-first public experience.
- The About page still contains fabricated statistics (25 MW+, 150+, 10+, 98%),
  an invented timeline, and English headings/fallbacks.
- The Contact page and Footer contain fabricated contact details and placeholder
  legal links.
- The homepage CMS seed copy is Persian-first; the live English "Product Catalog"
  appearance is likely stale CMS/DB state or locale mismatch, not a missing key,
  and must be confirmed against the backend response.

Rule for Phase 12.16 and onward: no fabricated statistics, addresses, phone
numbers, certifications, or legal text may remain in any rendered route. If the
owner has not supplied real data, the UI must show honest empty/coming-soon
states.

---

## 17. Security, privacy, accessibility, and production operations

Security/auth: JWT 15-minute access, 7-day refresh, rotation and blacklist; DRF
throttle 100/hour anonymous and 1000/hour authenticated; `NUM_PROXIES = 1`;
`IsAuthenticated` default. Ownership boundaries are mostly enforced backend-side.

Production blockers inherited and re-confirmed:

- **TLS/reverse proxy is an owner decision (BLOCKED).**
  `AbrEnergy/docker/nginx/nginx.conf` listens on `:80` only, production settings
  force `SECURE_SSL_REDIRECT`, and `docker-compose.prod.yml` maps `443:443`
  without a TLS server block.
- **`python-magic`/`libmagic1`** is configured in requirements/Docker but not
  runtime-verified here.
- No CI pipeline exists; backups (`scripts/backup_db.sh`,
  `scripts/backup_media.sh`) exist but their scheduling and restore drill are
  unverified.
- The runtime DB is PostgreSQL; the local SQLite file is empty, so no data
  migration or content state was assumed.

Privacy/legal: no Privacy/Terms routes, no confirmed privacy copy, and footer
links are placeholders.

Accessibility: not runtime-audited. The dark-hardcoded pages under a light default
theme, the fixed header overlap, and unlabeled icon-only controls are the main
risks to verify with a real browser and axe/Lighthouse.

---

## 18. Prioritized implementation roadmap and acceptance criteria

### P0 — release blockers (must close before external launch)

1. **Repair content write contracts.** Make article/service/project create and
   edit send `translations` dicts and correct tag/category payloads; fix service
   edit loading; add reliable success/error feedback.
   *Acceptance:* create fa article/service/project, reload edit page, confirm
   persisted title/slug/body/SEO via API and UI.
2. **Fix the fixed-header overlap.** Introduce one shared internal shell that
   reserves header height; remove per-page compensation where redundant.
   *Acceptance:* no content hidden under the header at 320/768/1280/1440.
3. **Wire SiteSettings through the site.** Editable company/contact/SEO settings
   in admin; footer, contact, and header consume them.
   *Acceptance:* changing a phone/email/address in admin updates public pages
   after save and reload.
4. **Remove fabricated content and placeholders.** Replace About stats/timeline
   and Contact/Footer fake data with real data or honest empty states; add real
   Privacy/Terms or remove/disable links.
   *Acceptance:* no fabricated numbers/contact details remain in rendered routes;
   no `href="#"` legal links.
5. **Deploy the approved logo.**
   *Acceptance:* `public/abar-energy-logo.png` SHA-256 equals the approved root
   asset hash in §6.
6. **Fix admin contact/inquiry workflow and notification links.**
   *Acceptance:* list → detail → assign/status works; notification links resolve.
7. **Add missing SEO basics.** About/Calculator metadata; sitemap content detail
   entries; product category index.
   *Acceptance:* sitemap contains published service/project/article URLs; each
   page has a unique Persian title/description.
8. **Resolve auth gaps.** Password-reset confirm (backend + frontend), profile
   password change, and a documented email-verification decision.
9. **Calculator correctness.** Honor `system_type`, localize city input, and
   obtain owner-approved tariff/cost constants.
10. **Theme and RTL pass.** Replace hardcoded dark surfaces with theme-aware
    tokens and verify RTL layout on fa.

### P1 — completeness and administration

- Article category/tag CRUD and proper pickers; remove raw UUID/comma UX.
- SEO fields in article/service/project editors.
- Gallery/media upload, edit, delete, ordering.
- Users admin role/active editing with a last-super-admin guard; fix nav/backend
  role mismatch for `/admin/users` and `/admin/activity-log`.
- URL-persisted catalog filters.
- `not-found`, `error`, and `loading` states.

### P2 — polish and hardening

- Organization/WebSite JSON-LD; breadcrumb coverage.
- CI pipeline and backup/restore drill.
- Accessibility and Lighthouse budgets.
- ar/en activation plan once translated content exists.

---

## 19. Verification plan, owner decisions, release gates, and no-implementation statement

### Verification plan

Frontend: `npm run test`, `npm run lint`, `npm run typecheck`, production build.
Backend: `python manage.py check`, migration check, and pytest under
`AbrEnergy/apps/*/tests`. Runtime: launch frontend + backend + Postgres (and
container stack if approved); execute CMS end-to-end create/edit/reload for
articles, services, projects, products, homepage, and settings; run a browser
matrix and axe/Lighthouse; verify sitemap/robots output; verify contact/inquiry
status flow and notification links.

### Owner decisions required

1. Domains, TLS certificates, and reverse-proxy topology (blocks production).
2. Electricity tariff/cost constants and supported calculator system types.
3. Whether/when to activate ar/en locales and who supplies translations.
4. Real company/contact/legal/privacy content (or approval of honest empty
   states).
5. Real product/media/catalog PDFs and homepage copy.
6. Email verification policy and password policy.
7. Backup schedule and restore-drill ownership.

### Release gates

- All P0 items closed with evidence.
- Frontend tests/lint/typecheck/build green; backend check/migrations/tests green.
- TLS and `python-magic` runtime-verified in the target environment.
- No fabricated content and no placeholder legal links in any rendered route.
- Sitemap includes published content details; admin/auth routes remain excluded.
- Owner content approved; backups and monitoring in place.

### No-implementation statement

Phase 12.16 as executed here is audit-only. No application code, configuration,
database, deployment, or Git history was changed. The only output is this
19-section blueprint. Implementation must begin only after owner approval of the
P0 scope and the decisions above.

---

*End of Phase 12.16 blueprint.*

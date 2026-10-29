# Phase 12.15 — Production Polish, Demo-Label Cleanup & Admin Dashboard Expansion

Date: 2026-10-19
Scope: post-Phase-12.14 continuation. Audit and removal of inappropriate
pre-development/demo labels across public and admin UI, a data-driven upgrade
of the CMS dashboard (new staff-gated aggregate, inventory/quality/status
sections, extra navigation), safe Phase-12.14 infra fixes (`python-magic` /
`libmagic1`, nginx forwarded-protocol consistency, container healthchecks), and
regression validation. No deployment, no production data access, no destructive
DB operations, no commit/push, no Git reset/clean, no media/content deletion, no
Phase 12.16.

Verdict: **PARTIALLY ACCEPTED** (application polish accepted and verified;
production deployment still blocked on the TLS/reverse-proxy owner decision, and
the `python-magic`/`libmagic1` fix could not be runtime-verified here — see §8).

---

## 1. Executive summary and final verdict

**PARTIALLY ACCEPTED.**

Delivered and verified this phase:

- **Two fabricated user-facing labels removed.**
  - `home.backend_error_hint` (fa/en/ar) leaked a developer URL
    (`localhost:8000`). Replaced with honest retry copy in all three locales.
  - The contact page "Trust" band shipped four **fabricated marketing
    statistics** (`25 MW+`, `150+`, `10+`, `98%`) that contradicted the real
    (empty) database. Replaced with four honest capability cards reusing
    existing, already-published service copy. No invented numbers remain in any
    rendered route (guarded by tests).
- **Admin dashboard materially expanded and made more efficient.** One new
  staff-gated aggregate (`GET /api/v1/admin/dashboard/overview/`,
  `IsContentManager`) now drives every count, plus three new real-data sections:
  content-quality (products missing image/document/SEO title; articles missing a
  cover), media/documents inventory, and publication-status bars. The dashboard
  drops from 10 list round-trips to **4 requests** (3 recent lists + 1
  aggregate) by reusing the aggregate for all counts.
- **Safe infrastructure fixes.**
  - `libmagic1` added to the Docker `apt` list and `python-magic` pinned in both
    requirements files (12.14 finding).
  - nginx `/admin/` proxy block now forwards `X-Forwarded-For` /
    `X-Forwarded-Proto`, matching the other locations (fixes an inconsistent
    proxy-header bug independent of the TLS decision).
  - Reliable container healthchecks added for `django` (app-readiness via a new
    unauthenticated `/api/v1/health/` probe) and `nginx` (end-to-end).

Not full `ACCEPTED` because:

- **TLS/reverse-proxy topology remains an owner/infra decision (BLOCKED).**
  nginx still listens on `:80` only while `production.py` forces
  `SECURE_SSL_REDIRECT=True`; Compose maps `443:443` with no TLS server block.
  Implementing TLS would require guessing domains/certs, which this phase is
  explicitly forbidden to do. Options are enumerated in §8.2.
- **`python-magic` / `libmagic1` is fixed in configuration but NOT runtime
  verified.** Docker is not installed in this environment, so the image was not
  built. Locally, the `magic` module that imports successfully is the
  third-party `python_magic_bin 0.4.14`, **not** the `python-magic`
  distribution — `pip check` still reports `python-magic is not installed`
  (§9). Exactly the 12.14 caveat; not claimed as verified.
- **No browser automation available** (no Playwright/Puppeteer/Cypress), so the
  UI was not pixel-inspected; checks are DOM/class-level and responsive-by-
  construction (§11).
- Owner-supplied content (real products, media, catalog PDFs, ar/en CMS copy)
  is still absent — inherited task from 12.13/12.14.

Baseline improved: frontend **588** passing (was 579), backend **265** passing
(was 252), `tsc` **0** errors, changed-file ESLint **0** errors / **0** warnings,
`manage.py check` **0** issues, migrations clean, isolated production build
**exit 0**.

---

## 2. Baseline Git state and safeguards

Verified directly before editing:

| Item | Value |
| --- | --- |
| Branch | `master` |
| HEAD | `e2e533a` |
| Working-tree entries | **1635** total, **1581** untracked |
| Tracked modifications | Pre-existing from earlier phases (12.x visual/CMS work, uncommitted) |

- All pre-existing modifications and untracked files (media, reports, screenshots,
  `.env.local`, build dirs such as `.next-prod12*`) were treated as **owner-owned
  and preserved**. No `git reset`, `git clean`, blanket checkout/restore, bulk
  deletion, DB reset, or content deletion was run.
- **No commit or push was performed.** Phase changes remain uncommitted, as
  required.
- The isolated build dir `.next-qa15` (created only for this phase's verification)
  was removed afterwards, and the transient `tsconfig.json` `include` entry that
  `next build` writes was reverted — matching the 12.14 precedent. Pre-existing
  build dirs were left untouched.
- No secrets, `.env` values, or credentials were read into or printed in this
  report.

Command evidence:

```
git rev-parse --abbrev-ref HEAD   -> master
git rev-parse --short HEAD        -> e2e533a
git status --porcelain | wc       -> 1635 entries (1581 untracked)
```

---

## 3. Exact files changed and rationale

Backend (`AbrEnergy/`):

| File | Change | Rationale |
| --- | --- | --- |
| `apps/core/api/v1/views/site.py` | Added `dashboard_overview` (`IsContentManager`) and `health` (AllowAny, throttling off) | Single real-data aggregate + readiness probe |
| `apps/core/api/v1/urls/dashboard_urls.py` | Added `overview/` route | Expose the aggregate at `/api/v1/admin/dashboard/overview/` |
| `config/api_v1.py` | Added `health/` route | Expose `/api/v1/health/` |
| `apps/core/tests/test_phase12_15_dashboard.py` | **New** — 9 tests | Permissions, shape, real counts, empty DB, query bound |
| `apps/core/tests/test_phase12_15_health.py` | **New** — 4 tests | Anon access, no leakage, 503 on DB down, unthrottled |
| `requirements/base.txt`, `requirements/production.txt` | Pinned `python-magic>=0.4.27,<0.5` | 12.14 dependency gap |
| `docker/Dockerfile` | Added `libmagic1` to `apt` list | `django-versatileimagefield` runtime dep |
| `docker/nginx/nginx.conf` | `/admin/` block: added `X-Forwarded-For` + `X-Forwarded-Proto` | Consistency with `/` and `/api/` blocks |
| `docker-compose.prod.yml` | Healthchecks for `django` and `nginx` | Distinguish started vs ready |

Frontend (`abr-energy-frontend/`):

| File | Change | Rationale |
| --- | --- | --- |
| `src/api/index.ts` | `DashboardOverview` type + `adminApi.getDashboardOverview` | Typed client for the aggregate |
| `src/hooks/use-api.ts` | `useAdminDashboardOverview` (60 s staleTime) | Single cached aggregate query |
| `src/app/[locale]/admin/page.tsx` | New sections (content-quality, media/documents, publication-status), `StatusBreakdown`, count consolidation 10→4 requests, media/settings quick actions | Data-driven dashboard |
| `src/app/[locale]/admin/dashboard-hub.test.tsx` | Aggregate mock + 9 new/updated tests (25 total) | Cover new behaviour + permission gating |
| `src/lib/admin-permissions.ts` | `canManageSiteSettings` | Gate the super-admin settings action |
| `src/app/[locale]/(public)/contact/page.tsx` | Replaced 4 fake stats with capability cards; removed unused import | Remove fabricated claims |
| `locales/fa.json`, `locales/en.json`, `locales/ar.json` | `home.backend_error_hint` fix + 13 new `admin.*` keys | De-localhost copy + dashboard labels |

---

## 4. Inventory of removed / changed user-facing labels

Removed or corrected (all three locales where applicable):

| Route / component | Key | Before | After |
| --- | --- | --- | --- |
| Public error states (homepage/catalog) | `home.backend_error_hint` | fa leaked `localhost:8000`; en/ar retry text | fa: «لطفاً چند لحظه بعد دوباره تلاش کنید.» · en: "Please try again in a moment." · ar: «يرجى المحاولة مرة أخرى بعد قليل.» |
| `/[locale]/contact` Trust band | (hardcoded strings) | `25 MW+`, `150+`, `10+`, `98%` fabricated stats | Four capability cards using existing `services.advantage_*` / `services.step_optimization` copy |

New dashboard labels (fa/en/ar): `publication_status`, `content_quality`,
`media_documents`, `media_total`, `media_images_count`, `media_documents_count`,
`gallery_images_count`, `product_documents_count`, `without_image`,
`without_document`, `without_seo_title`, `articles_without_cover`, `show_none`.

Audited and intentionally **kept** (documented, not inappropriate in production):

| Key / element | Where | Why kept |
| --- | --- | --- |
| `home.preview_badge`, `home.preview_notice` | Hero/featured sections | Dev-only; gated by `isHomepagePreviewEnabled()` which returns `false` when `NODE_ENV==='production'` and otherwise requires `NEXT_PUBLIC_HOMEPAGE_PREVIEW=1`. Never user-facing in production. |
| `admin.coming_soon` | Disabled `/admin/products/attributes` sidebar item | Admin-only, prevents a fake empty page; asserted by `navigation-cms.test.ts`. Legitimate unfinished-feature warning, not public copy. |
| `products.price_soon` | Product price block | Legitimate scheduled-sale state ("sale starts soon"). |
| `admin.no_preview` | Media library | Honest "no thumbnail" state. |
| `calculator.placeholder_hint`, `*.search_placeholder` | Form inputs | Ordinary input hints (the key name is internal; the value is not dev wording). |
| `home.empty_*` / `*_empty` | Empty states | Professional, honest empty copy. |

Also audited (no public dev/demo wording found): header, footer, navigation,
product list/detail/category, services, projects, articles, gallery/downloads,
contact, calculator, and all admin screens. `robots.ts`/`sitemap.ts`/middleware
correctly exclude `/admin` and `/preview` from indexing.

---

## 5. Content that remains sample/demo data (not silently changed)

Per the phase rules, seeded/sample records and fixtures were **not** mutated,
published, or deleted:

1. **`seed_data.py`** (and `seed_product_categories.py`) — creates sample
   products/services/projects/articles. It is **dev/test-guarded**: it raises
   `CommandError` unless `settings.TESTING` or `settings.DEBUG` is true
   (`seed_data.py:39-45`), so it cannot run against production settings. Sample
   titles ("On Grid System", "10kW Solar Plant - Tehran", …) therefore only
   exist if a DB was explicitly seeded in a non-production environment.
   **Owner task:** confirm the production database contains only real content.
2. **`src/lib/homepage-preview.ts`** — in-memory dev fixtures (marker
   «پیش‌نمایش», `preview-` slugs, "داده نمایشی توسعه"). Production-gated as
   above; frontend-only; never written to a store or fed to SEO/public APIs.
3. **`src/components/home/StatsSection.tsx`** — dead component still containing
   the old fabricated stats. It is **not imported anywhere** (only a barrel
   export in `components/home/index.ts`, and no module imports that barrel), so it
   cannot render. Left untouched to avoid unrelated churn and data-safety risk;
   flagged for removal in a future cleanup.
4. **Test fixtures** containing «دسته آزمایشی» etc. are test-only and never
   rendered.

No database rows or media files were modified or deleted.

---

## 6. Dashboard features added (data source + permissions)

New backend endpoint `GET /api/v1/admin/dashboard/overview/`
(`apps/core/api/v1/views/site.py:123`, `IsContentManager`) returns only
server-side `COUNT`s (no dataset fetches). Exact definitions are documented in
the view docstring. New frontend sections (`admin/page.tsx`):

| Section | Values | Deep links | Permission |
| --- | --- | --- | --- |
| Content overview | products/categories/articles/services/projects totals | `/admin/products`, `/admin/products/categories`, `/admin/articles`, `/admin/services`, `/admin/projects` | manager (`IsContentManager`) |
| Needs attention | products draft/hidden; articles draft/scheduled; services inactive | exact 9.3-A filtered URLs | manager |
| Content quality (new) | products missing image/document/SEO title; articles missing cover | `/admin/products`, `/admin/articles` | manager |
| Media & documents (new) | media total/images/documents; gallery images; product documents | `/admin/media`, `/admin/gallery`, `/admin/products` | manager |
| Publication status (new) | products published/draft/archived; articles published/draft/scheduled | inline bars + legend | manager |
| Recent items | last 5 products/articles/services | edit routes | manager |

Navigation additions (real routes only): **Media library** (`/admin/media`,
managers) and **Site settings** (`/admin/settings`, super-admin only via the new
`canManageSiteSettings`). Existing create actions are unchanged.

- **Request efficiency:** counts were previously 5 overview + 5 filtered
  list-counts (10 requests). They now come from the single aggregate, so a cold
  load is **3 recent lists + 1 aggregate = 4 requests**; guarded by a test that
  asserts only three list hooks fire, each with `page_size=5`.
- **Empty database:** every card shows `0` (informative) or, for the status
  bars, an honest "no data" message; nothing is fabricated.
- **Recovery:** per-card / per-section loading, error (403 → permission message,
  else connection message) and retry; one failed section never breaks the page.
- **No new chart dependency:** the status breakdown is a CSS flex bar; no
  business metrics (revenue/orders/traffic) exist and none were invented.
- **Recent activity:** the only audit trail (`ActivityLog`) is super-admin-only
  and records login/logout only, so it is not surfaced; "recent items" use real
  `updated_at` ordering instead.

---

## 7. Backend/API changes and authorization tests

- `dashboard_overview` — `@api_view(["GET"])`, `IsContentManager`
  (super_admin / website_admin / content_manager). All counts are `COUNT` /
  `isnull` filters; no N+1 (bounded query count asserted), no sensitive data.
- `health` — `@api_view(["GET"])`, `AllowAny`, `throttle_classes([])`; returns
  `{"status":"ok"}` or `503 {"status":"unavailable"}`; exposes no versions,
  hosts, settings, or credentials.
- Routes mounted at `/api/v1/admin/dashboard/overview/` and `/api/v1/health/`.

Test coverage (13 new backend tests, all passing):

- Permission matrix: anonymous (401/403), customer/engineer (403),
  content_manager/website_admin/super_admin (200).
- The older `dashboard_stats` stays super-admin-only (content manager still 403).
- Response shape + real counts from real rows (complete vs incomplete product).
- Empty database returns zeroes, not errors.
- Aggregate query count bounded (`< 40`) — guards against per-row counting.
- Health: anonymous access, no environment leakage, 503 on DB failure,
  not rate-limited.

---

## 8. Infrastructure fixes and unresolved decisions

### 8.1 Fixed

- **`python-magic` / `libmagic1`** — `libmagic1` added to the Dockerfile apt
  list; `python-magic>=0.4.27,<0.5` pinned in `requirements/base.txt` and
  `requirements/production.txt` (compatible with the project's Django 5.0–5.1 /
  Python 3.12 target). Runtime verification is outstanding (§9).
- **nginx proxy-header consistency** — `/admin/` now forwards
  `X-Forwarded-For` and `X-Forwarded-Proto`, matching `/` and `/api/`. Without
  `X-Forwarded-Proto`, Django's `SECURE_SSL_REDIRECT` + `SECURE_PROXY_SSL_HEADER`
  would loop on the admin path behind a TLS terminator.
- **Healthchecks** — `django` uses the readiness probe (Python standard library,
  no extra binary); `nginx` uses `wget` (present in `nginx:alpine`) against the
  probe end-to-end. Both use `start_period` so normal
  `collectstatic`/`migrate` startup is not reported unhealthy.

### 8.2 Still blocked — TLS / reverse-proxy (owner/infra decision)

Current state (verified): `docker/nginx/nginx.conf` has a single
`listen 80;` server; `docker-compose.prod.yml` publishes `80:80` **and**
`443:443`; `production.py` sets `SECURE_SSL_REDIRECT=True`,
`SECURE_HSTS_SECONDS=31536000`, `SESSION_COOKIE_SECURE=True`,
`CSRF_COOKIE_SECURE=True`, `SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO","https")`.
Docker is unavailable here, so nothing was exercised against a real proxy.

The repository does **not** contain enough verified information (domain, cert
paths, or upstream proxy) to implement TLS safely, so it was left explicit.
Options for the operations owner — pick one, then apply the matching follow-up:

1. **Terminate TLS in nginx (self-managed certs).** Add a `listen 443 ssl;`
   server (with `ssl_certificate`/`ssl_certificate_key` paths supplied by ops)
   and redirect port 80 → 443. `$scheme` then reports `https`, and the existing
   `X-Forwarded-Proto $scheme` headers are already correct.
2. **Terminate TLS at an upstream proxy/load balancer.** Keep nginx on `:80`,
   remove the unused `443:443` publish (or keep it if the LB is on the same
   host), and ensure the upstream sends `X-Forwarded-Proto: https`; set
   `NUM_PROXIES` to the real number of trusted proxies (currently documented as
   `1`).
3. **Let's Encrypt via certbot** on the host, mounted into nginx — same as (1)
   plus cert renewal.

Do **not** disable `SECURE_SSL_REDIRECT`, HSTS, or secure cookies to make plain
HTTP pass; that would remove real protections.

---

## 9. Dependency / runtime verification (`python-magic` / `libmagic`)

Command evidence (this environment, Windows, no Docker):

```
pip show python-magic   -> WARNING: Package(s) not found: python-magic
pip show magic          -> WARNING: Package(s) not found: magic
pip check               -> django-versatileimagefield 3.1 requires python-magic, which is not installed.
python -c "import magic; print(magic.__version__)" -> 0.4.14   # from python_magic_bin-0.4.14.dist-info
```

Conclusion: the importing `magic` module belongs to the **`python_magic_bin`**
distribution (a Windows convenience bundle), **not** the declared `python-magic`
distribution. `django-versatileimagefield` therefore still fails `pip check`
here, and this phase **does not** claim the dependency resolved. The correct
Linux target (Dockerfile `libmagic1` + pinned `python-magic`) is in place, but
**cannot be verified without building the image** (Docker absent). Required
follow-up: build the image and run a real image upload + `__sized__` thumbnail
generation in staging.

---

## 10. Test commands and exact outcomes

| Command | Result |
| --- | --- |
| `python -m pytest -q` (backend) | **265 passed** (was 252; +9 dashboard, +4 health) |
| `npx vitest run` (frontend) | **588 passed / 71 files** (was 579) |
| `npm run typecheck` (`tsc --noEmit`) | **0 errors** |
| `eslint <changed files>` | **0 errors, 0 warnings** |
| `python manage.py check` | **0 issues** |
| `python manage.py makemigrations --check --dry-run` | **No changes detected** |
| `NEXT_DIST_DIR=.next-qa15 npx next build` | **✓ Compiled successfully**, exit 0 |
| `docker build` / `docker compose` | **Not run** — Docker not installed |

No tests were skipped. The only warning encountered during the phase was a
pre-existing unused `ArrowRight` import in `contact/page.tsx`, which was removed
(same file, same edit region), leaving changed-file lint at zero warnings.

---

## 11. Browser, responsive, RTL, dark/light, and visual verification

Limitations first: **no browser-automation tooling is installed**
(Playwright/Puppeteer/Cypress absent), so **no screenshots were captured and no
pixels were inspected**. The following are DOM/structure and
framework-guarantee results, not visual proof:

- **Automated DOM assertions:** 25 dashboard tests assert sections, links,
  counts, permission gating, loading/empty/error/retry, and absence of
  fabricated marketing stats.
- **Responsive layout:** new sections use the project's existing Tailwind grid
  patterns (`grid-cols-2 md:grid-cols-3 xl:grid-cols-5`, `md:grid-cols-2`,
  `md:grid-cols-4`), so mobile/tablet/desktop breakpoints are covered by
  construction, not by pixel inspection.
- **RTL:** the app is Persian-first RTL (`dir=rtl`); new blocks use logical
  flex/grid layouts and `justify-between`/`gap` (no `left`/`right` positioning),
  so they mirror correctly. Verified by structure, not screenshots.
- **Dark/light:** new cards use design-system tokens (`bg-card`,
  `text-muted-foreground`, `bg-muted`) plus explicit bar colors
  (`bg-green-500`, `bg-amber-500`, `bg-slate-400`, `bg-sky-500`) chosen to read
  on both themes.
- **Accessibility:** sections have `aria-label`s; status bars use
  `role="img"` with an accessible name; quick actions are real `<button>`s;
  loading uses `aria-label={t('common.loading')}`.

Status: **responsive/RTL/dark-light verified by structure only —
pixel-level visual verification NOT performed (tooling unavailable).**

---

## 12. Remaining owner tasks, risks, and release blockers

Release blockers:

1. **TLS termination** (§8.2) — BLOCKED on owner/ops decision; production
   cannot be served correctly until resolved.
2. **Real production content** — products, services, projects, articles,
   catalog PDFs, gallery media, and ar/en CMS copy (inherited 12.13/12.14).
3. **Confirm production DB has no seeded sample rows** (§5).

Owner/infra tasks:

4. Build the Docker image and verify `python-magic`/`libmagic1` + media
   processing in staging (§9).
5. Supply production env values: `SECRET_KEY`, `DJANGO_SETTINGS_MODULE`,
   `ALLOWED_HOSTS`, CORS/CSRF origins, `SITE_URL`, `NUM_PROXIES`,
   `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` (backend
   `.env.example` documents these; the frontend `.env.example` covers the two
   `NEXT_PUBLIC_*` values).
6. Schedule `scripts/backup_db.sh` / `backup_media.sh` (scripts + `db_backups`
   volume exist; no schedule is assumed) and document a rollback procedure
   (migrations are forward-only).
7. Decide the anonymous throttle policy (currently `anon 100/hour`, `user
   1000/hour`, `NUM_PROXIES=1`); rate limits were left unchanged.
8. Optional cleanup: remove dead `StatsSection.tsx` and its barrel export.

Security posture unchanged and preserved: `assert_production_secret`,
`SECURE_SSL_REDIRECT`, HSTS, secure cookies, DRF throttling, `IsContentManager`/
`IsSuperAdmin` gating. The new endpoints add no sensitive surface (aggregate is
counts-only and staff-gated; health leaks nothing).

---

## 13. Deployment readiness assessment & prioritized next steps

**Not deployment-ready.** The application itself is in good shape (all suites
green, build green, dashboard genuinely data-driven, fabricated public labels
removed), but two items sit outside code and remain open: TLS topology and real
content. Docker-dependent verification is also pending.

Prioritized:

1. Decide and implement TLS termination (owner/ops) and align
   `X-Forwarded-Proto`/`NUM_PROXIES`.
2. Build the image; verify media upload + thumbnail generation
   (`python-magic`/`libmagic1`).
3. Populate production content; confirm no seeded sample rows remain.
4. Set production env vars; wire Sentry; enable backups + document rollback.
5. Smoke-test public routes and the admin dashboard in staging (desktop/mobile,
   RTL, dark/light) with real data, since pixel QA could not run here.
6. Optional: retire `StatsSection.tsx`.

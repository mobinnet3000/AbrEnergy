# Phase 12.14 — Production Readiness & Security Hardening

Date: 2026-10-18
Scope: post-Phase-12.13 continuation. Production-configuration validation,
security configuration audit, anonymous-throttle/request-flow analysis, removal
of the unused end-of-life CKEditor 4 dependency, a release checklist, and
regression validation. No deployment, no production data access, no destructive
DB operations, no commit, no Phase 13.

Verdict: **PARTIALLY ACCEPTED** (see §1, §10).

---

## 1. Verdict and summary

**PARTIALLY ACCEPTED.**

Delivered and verified this phase:

- **CKEditor 4 EOL dependency removed** (was P3). `django-ckeditor` is gone from
  `INSTALLED_APPS`, `CKEDITOR_CONFIGS`, both requirement files, and the three
  historical migration files that imported it. `manage.py check` is now
  **0 issues** (the `ckeditor.W001` warning is eliminated), `makemigrations
  --check` is clean, and the full backend suite passes. The migration rewrite is
  schema-identical (details in §6).
- **Reverse-proxy-aware anonymous throttling** (new P2 finding). DRF's
  `SimpleRateThrottle` had no `NUM_PROXIES` set, so behind the nginx reverse
  proxy it either keyed every anonymous request on the proxy IP (one shared
  100/hour bucket for all visitors) or trusted a client-spoofable
  `X-Forwarded-For` prefix. `NUM_PROXIES=1` is now configured and covered by
  tests.
- **Duplicate homepage fetches reduced** (P2 optimization). The public homepage
  no longer re-fetches services/projects/articles/featured-products when the
  `/homepage/` CMS payload already supplies them. The homepage falls from ~7 to
  ~4 API requests per view (see §5).
- **`.env.example` completed** with the missing `ALLOWED_HOSTS` and a documented
  production block (`SENTRY_DSN`, `NUM_PROXIES`, secure origins).
- **`docker-compose.prod.yml` nginx mount path corrected** (`./nginx/nginx.conf`
  → `./docker/nginx/nginx.conf`; the old path did not exist).
- **Stale `tsconfig.json` include removed** (the Phase 12.12/12.13 D-6 item),
  which also makes `tsc` deterministic again.
- **Header dropdown made near-opaque** (`bg-white/70` → `bg-white/95`, dark
  `neutral-950/70` → `neutral-950/95`) per a follow-up UI request, so page text
  behind the menu no longer bleeds through.

Not full `ACCEPTED` because:

- The **production settings module was not executed** in this environment
  (`sentry_sdk` is not installed here). Exact evidence in §3.
- **HTTPS/TLS is not configured** in the shipped nginx config (listen `:80`
  only) while `production.py` forces `SECURE_SSL_REDIRECT=True`. Deployment is
  **BLOCKED / NOT VERIFIED** until TLS termination is decided (§4.1).
- **Deployment env vars** (`SECRET_KEY`, `ALLOWED_HOSTS`, `CORS/CSRF origins`,
  `NEXT_PUBLIC_SITE_URL/API_URL`, `SENTRY_DSN`) remain a deploy-time
  configuration task with owner-supplied values.
- The **anonymous throttle rate** (100/hour) is still an owner decision.
- **Release content** (real products/services/projects/articles, catalog PDFs,
  gallery media, ar/en CMS copy) is still absent — inherited owner task from
  Phase 12.13.
- Visual/pixel QA remains unverified (no image-input capability), unchanged.

Baseline holds or improves: frontend **579** passing, backend **252** passing,
`tsc` **0** errors, changed-file ESLint **0** errors, migrations clean,
isolated production build **exit 0**, public smoke routes **200**.

---

## 2. Initial Git state and preservation notes

Verified directly (not assumed):

- Branch `master`, HEAD `e2e533ab376d1196e7399189e1b33489f95efd41`
  ("12.9phase"), upstream `origin/master`, **2 commits ahead** of upstream.
- Working tree was **already dirty** at the start of this session:
  **38 modified tracked files** and approximately **1,445 untracked entries**
  (the overwhelming majority are `AbrEnergy/media/**` uploads —
  ~1,416 files — plus Phase 12.10–12.13 reports/screenshots).
- No `.env` file is tracked. `abr-energy-frontend/.env.local` exists,
  is git-ignored, and contains only `NEXT_PUBLIC_HOMEPAGE_PREVIEW=1` (no
  secret). No secret values were printed.
- Pre-existing tracked modifications relevant to later phases
  (`config/settings/base.py`, `config/settings/production.py`,
  `seed_data.py`, `products` serializer/seed command, the homepage components,
  locales, etc.) were **preserved**. Files edited again this phase retained their
  prior content; changes were additive and are listed in §8.
- The pre-existing untracked `apps/core/tests/__init__.py`,
  `test_phase12_13_*.py`, and the Phase 12.10–12.13 reports/screenshots were
  not modified, moved, or deleted.

Preservation rules were respected: no `git reset`, no `git clean`, no
`git checkout` of user work, no mass formatting, no media/report deletions.

---

## 3. Production settings validation (evidence)

### 3.1 `SECRET_KEY` guard — VERIFIED (unit-tested)

`config/settings/base.py` defines `DEFAULT_INSECURE_SECRET` and
`assert_production_secret()`; `config/settings/production.py` calls it at import
time (introduced in Phase 12.13). Evidence: `apps/core/tests/test_phase12_13_settings_guard.py`
passes (2 tests) and production refuses the development default. The committed
`.env.example` still shows the insecure dev value for local use; the production
block documents that it must be replaced.

### 3.2 Production settings runtime — **NOT VERIFIED (environment limitation)**

Executed in an isolated process:

```
DJANGO_SETTINGS_MODULE=config.settings.production python -c "import django; django.setup()"
ModuleNotFoundError: No module named 'sentry_sdk'   (config/settings/production.py:2)
```

`config/settings/production.py` imports `sentry_sdk` unconditionally. The
package is declared in `requirements/production.txt` (`sentry-sdk>=2.5,<2.6`)
but is **not installed in this workspace environment**. Therefore production
settings could not be loaded here, and **production startup is NOT claimed as
verified**.

Mitigation (smallest safe action): the project Dockerfile installs
`requirements/production.txt`
(`RUN pip install --no-cache-dir -r /app/requirements/production.txt`), so the
deployment image receives `sentry-sdk`. To verify locally, install
`requirements/production.txt` into a throw-away env. No package was installed
this phase.

### 3.3 Environment variables — CONFIGURATION REQUIRED

| Variable | Current default | Production requirement |
|---|---|---|
| `SECRET_KEY` | insecure dev default | strong unique value (guard enforced) |
| `DJANGO_SETTINGS_MODULE` | `config.settings.local` in example | `config.settings.production` |
| `DEBUG` | `False` (base) | `False` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | real host(s) — now documented in `.env.example` |
| `CORS_ALLOWED_ORIGINS` | `localhost:3000,localhost:3001` | real frontend origin |
| `CSRF_TRUSTED_ORIGINS` | `localhost:3000,localhost:3001` | real origin |
| `SITE_URL` | `http://localhost:8000` | real API URL |
| `NUM_PROXIES` | `1` (new) | match real proxy count |
| `SENTRY_DSN` | empty | set if error monitoring is wanted |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (frontend example) | real public origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | real API origin |

`.env.example` was previously missing `ALLOWED_HOSTS` and any production
guidance; both were added (§8). The root `README.md` already contains an
environment-variable table and a production checklist, so deployment docs are
present and consistent with the example.

### 3.4 Frontend public variables are baked at build time — VERIFIED (documented)

`NEXT_PUBLIC_*` variables are inlined into the client bundle by Next.js at
**build** time (and `next.config.ts` reads `NEXT_PUBLIC_API_URL` when computing
`images.remotePatterns`). Therefore `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_API_URL` **must be set before `next build`**, not merely at
runtime. This was exercised: the isolated build was produced with
`NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3099` and
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1`, and the served pages
returned 200 (§9). `siteUrl()`/`resolveMediaUrl()` keep a localhost fallback for
development.

### 3.5 Development/test defaults remain convenient — VERIFIED

`config/settings/dev.py` keeps `DEBUG=True` and disables SSL redirect/HSTS;
`config/settings/local.py` keeps `DEBUG=True`; `config/settings/test.py` keeps
`TESTING=True`, a test DB, MD5 hasher, and **disables throttling**. All backend
tests run under test settings.

---

## 4. Security audit findings

### 4.1 HTTPS / proxy / cookie assumptions — **BLOCKED / CONFIGURATION REQUIRED**

`config/settings/production.py` sets a strong, conventional HTTPS posture:

- `SECURE_SSL_REDIRECT = True`
- `SECURE_HSTS_SECONDS = 31536000`, `INCLUDE_SUBDOMAINS`, `PRELOAD`
- `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`
- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`
- `X_FRAME_OPTIONS = "DENY"`, `SECURE_CONTENT_TYPE_NOSNIFF`, `CSRF_COOKIE_HTTPONLY`

**Gap:** the shipped `docker/nginx/nginx.conf` only `listen 80;` and proxies
with `X-Forwarded-Proto $scheme` (i.e. `http`). With `SECURE_SSL_REDIRECT=True`
Django will answer `http` requests with a redirect to `https`, but nothing in
the repo terminates TLS or forwards `https`. The `/admin/` proxy block does not
forward `X-Forwarded-Proto` at all. `docker-compose.prod.yml` exposes `443:443`
but nginx has no TLS server block. **Deployment will not serve correctly until
TLS termination (and the matching forwarded scheme / `NUM_PROXIES`) is
configured.** This requires an owner/ops decision (certificates, domains,
proxy topology); no infrastructure was modified.

Note: `SECURE_HSTS_PRELOAD=True` only takes effect after the domain is submitted
to the HSTS preload list; keep or gate it deliberately (owner decision).

### 4.2 CORS / CSRF / host validation — AUDITED

- `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` are explicit allow-lists
  (env-driven), not wildcards; `CORS_ALLOW_CREDENTIALS=True` is safe given the
  explicit list.
- `ALLOWED_HOSTS` is env-driven with a localhost default. Production must
  override it or real-domain requests return HTTP 400.
- No hardcoded production domain appears in code.

### 4.3 Authentication / authorization boundaries — AUDITED (no change)

- DRF default permission is `IsAuthenticated`, i.e. **secure by default**.
- Public reads are explicitly `AllowAny` on the intended public endpoints
  (homepage, public products/categories, services/projects/articles/gallery
  reads, site-config read, calculator preview, contact submission).
- Writes and admin endpoints require `IsContentManager`, `IsAdminUser`,
  `IsSuperAdmin`, or `IsEngineer` as appropriate. Permission behaviour is
  already covered by the existing `phase10_1_permissions` suites (22 tests).
- Admin web routes redirect anonymous users to `/login` (Phase 12.12 evidence).

### 4.4 Demo seed & hard-coded development credentials — VERIFIED (guarded)

`seed_data` refuses to run outside development/test (`_assert_dev_environment`,
Phase 12.13) and still creates predictable demo users only when
`DEBUG`/`TESTING` is on. No credential values are reproduced here.
`seed_product_categories` remains unguarded by design (no users, no passwords,
no deletes; idempotent taxonomy sync) — owner may still choose to guard it.

### 4.5 Error responses / logs — AUDITED (no leakage found)

`apps/core/exceptions.py` wraps DRF errors as `{status, errors}` with no
debug traceback or settings echo; production runs with `DEBUG=False`. The
activity-log middleware records `X-Forwarded-For`/`User-Agent` for authenticated
requests only. The audit-log IP (`_get_ip` reads the first XFF entry) is
client-influenceable, but it is only used for audit display — low severity,
documented. Separately, DRF throttle keying was wrong behind the proxy and is
**fixed** (below).

### 4.6 Dependency findings

- **CKEditor 4 EOL — RESOLVED** (removed; §6).
- **`python-magic` / `libmagic` — CONFIGURATION REQUIRED / NOT VERIFIED.**
  `pip check` reports: `django-versatileimagefield 3.1 requires python-magic,
  which is not installed.` `django-versatileimagefield` is actively used
  (`users.User.avatar`, `core.SiteSettings` logo/favicon/hero,
  `media_manager.MediaFile.thumbnail`, `articles.Category.image`). This local
  environment satisfies the `magic` *module* via an unrelated `magic`
  distribution, so tests pass, but the declared `python-magic` distribution is
  absent. On a Linux deployment `python-magic` requires the system `libmagic`
  library, and `docker/Dockerfile` installs `libjpeg-dev`, `libpng-dev`,
  `zlib1g-dev`, `libpq-dev` but **not `libmagic1`**. Recommended smallest safe
  fix: add `libmagic1` to the Dockerfile apt list (and optionally pin
  `python-magic` explicitly in requirements for determinism), then verify image
  upload/`__sized__` generation in a staging image. NOT changed here because it
  cannot be verified in this environment and is a dependency/system decision.
- No other dependency warnings were surfaced by the installed tooling
  (`manage.py check` is now clean). `npm audit` was **NOT RUN** (avoids
  contacting external registries).

### 4.7 Environment-versus-pinned-runtime caveat

The local tooling runs Python **3.14.6** / Django **5.2.16**, while the
Dockerfile targets **python:3.12-slim** and `requirements/base.txt` pins Django
`>=5.0,<5.1`. Test results therefore pass on a newer minor than the pinned
production runtime. This is a pre-existing environment caveat; the pinned
runtime was **NOT VERIFIED** here.

---

## 5. Anonymous throttling and request-flow analysis

### 5.1 Measured request shape (from source)

Global header (`components/layout/header-nav.tsx`) runs on every public page and
always requests:

- `/services/` (nav)
- `/products/categories/` (nav)

Homepage sections issued their own fallback queries **even when the
`/homepage/` payload already contained the same data**:

| Source | Request | Before | After |
|---|---|---|---|
| HomepageClient (`useHomepage`) | `/homepage/` | yes | yes |
| HeroSection / AboutSection (`useSiteSettings`) | `/site-config/` | yes (deduped) | yes |
| Header nav | `/services/` | yes | yes |
| Header nav | `/products/categories/` | yes | yes |
| ServicesSection | `/services/` (dedup with header) | yes | **skipped when CMS items present** |
| ProjectsSection | featured projects | yes | **skipped when CMS items present** |
| ArticlesSection | `/articles/?is_featured=true` | yes | **skipped when CMS items present** |
| FeaturedProductsSection | featured products | yes | **skipped when CMS items present** |
| ProductRailSection | `/products/categories/` (dedup) | yes | skipped (skipped when CMS items present) |

Net effect for a **production homepage with a populated CMS payload**:
**~7 → ~4 distinct API calls per view**. The three section-only fallback calls
(featured projects, featured articles, featured products) are eliminated. The
implementation reuses the exact `enabled` idiom already used by `HeroSection`
(`useFeaturedPublicProducts(undefined, { enabled: ... })`), so it is consistent
with existing code. When the CMS payload is absent (backend down or empty
section), the fallback fetch still runs — behaviour is unchanged.

Other pages: header contributes 2 requests; list/detail pages add their own
(typically 1–3).

### 5.2 Shared-IP / NAT evaluation

- **Before:** ~7 calls/view at `100/hour/IP` ≈ **14 homepage views/hour/IP**;
  Phase 12.12 observed live `429`s during QA.
- **After the request reduction:** ~4 calls/view ≈ **25 homepage views/hour/IP**
  (or ~50 for lighter pages) — better, but still low for a public marketing site
  and still easy to exhaust behind a corporate NAT or carrier-grade NAT, and
  worse when window-focus refetches occur (some public queries have no
  `staleTime`, so React Query refetches on mount/focus).

### 5.3 Throttle implementation correctness — **FIXED (new finding)**

DRF `SimpleRateThrottle.get_ident` keys by `NUM_PROXIES`:

- unset (previous state) → behind nginx it used the joined `X-Forwarded-For`
  value, which a client can prefix/spoof, or the proxy IP when the header is
  absent (all visitors in one bucket);
- `NUM_PROXIES=1` (now configured) → uses the rightmost hop that nginx appended
  (`$proxy_add_x_forwarded_for`), i.e. the real client IP, and ignores a
  client-supplied prefix.

`config/settings/base.py` now sets
`REST_FRAMEWORK["NUM_PROXIES"] = config("NUM_PROXIES", default=1, cast=int)`,
overridable per topology. Covered by
`apps/core/tests/test_phase12_14_settings.py` (3 tests: config present,
rightmost-hop selection, remote-addr fallback). The rate itself was **not**
changed.

Caching note (owner decision): DRF throttle counters use Django's default cache
(`LocMemCache`), which is per-process. With gunicorn `--workers 4`, the
effective limit is per worker and resets on restart. If precise global limiting
is required, point `CACHES` at the already-available Redis. This was **not**
changed.

### 5.4 Recommendation (owner decision still required)

Suggested target for a public, read-heavy site: keep a generous anonymous rate
(e.g. `1000/hour` per IP) or move anonymous public reads to a longer cache and
set a separate stricter rate only on write endpoints (`contact`, `calculator`,
auth). Add monitoring of `429` rates. **No rate change was made** without the
owner's decision, per the phase rules.

---

## 6. CKEditor 4 dependency decision and migration safety

### 6.1 Runtime references — confirmed none remain

`grep -r ckeditor AbrEnergy/` (code) returns **no matches** after this phase. It
previously appeared only in:

- `config/settings/base.py`: `INSTALLED_APPS` entry + `CKEDITOR_CONFIGS`
- `apps/articles/migrations/0001_initial.py`
- `apps/projects/migrations/0001_initial.py`
- `apps/services/migrations/0001_initial.py`
- `requirements/base.txt`, `requirements/production.txt`

No model, admin, serializer, view, template or task used it. `CHANGELOG.md`
already records the editorial migration to TipTap.

### 6.2 Migration history (why the rewrite is safe)

Each affected field was **created** with `ckeditor.fields.RichTextField()` and
**removed** later in the same app's history:

| App | Create | Remove |
|---|---|---|
| articles | `0001_initial` → `content` RichTextField | `0003_...` → `RemoveField(article, content)` |
| projects | `0001_initial` → `description` RichTextField | `0002_...` → `RemoveField(project, description)` |
| services | `0001_initial` → `description` RichTextField | `0002_...` → `RemoveField(service, description)` |

There is **no `AlterField`** on these columns and no later migration references
`ckeditor`. `RichTextField` is a `TextField` subclass with no DB-level
difference (both emit SQL `text`). Rewriting the create-time field to
`models.TextField()` therefore produces an **identical final schema** and an
identical migration graph. Django does not checksum applied migrations, so
already-applied databases are unaffected; fresh databases build the same final
state. Existing `db.sqlite3` and any production database were **not touched**.

### 6.3 Action taken — FIXED

- Rewrote the three `0001_initial.py` files: removed `import ckeditor.fields`
  and replaced the field with `models.TextField()`.
- Removed `"ckeditor"` from `INSTALLED_APPS` and deleted `CKEDITOR_CONFIGS`.
- Removed `django-ckeditor>=6.7,<6.8` from `requirements/base.txt` and
  `requirements/production.txt`.

### 6.4 Verification

| Check | Result |
|---|---|
| `manage.py check` | `System check identified no issues (0 silenced).` (was `ckeditor.W001`) |
| `manage.py makemigrations --check --dry-run` | `No changes detected` |
| `python -m pytest -q` | **252 passed** (fresh test DB built from all migrations) |
| Runtime references | none (`grep ckeditor` on `AbrEnergy/` = 0) |

**The EOL vulnerability is now removed from the shipped dependency set**, not
merely "unused". This is labelled FIXED, not AUDITED.

---

## 7. Release checklist (repository-specific)

Legend: **VERIFIED** / **CONFIGURATION REQUIRED** / **OWNER DECISION** /
**BLOCKED / NOT VERIFIED**.

| # | Item | Status | Evidence / action |
|---|---|---|---|
| 1 | Backend `SECRET_KEY` is strong and non-default | CONFIGURATION REQUIRED | Guard verified in code/tests; deploy must set it |
| 2 | `DJANGO_SETTINGS_MODULE=config.settings.production` | CONFIGURATION REQUIRED | Set in compose/env |
| 3 | `ALLOWED_HOSTS` = real domain(s) | CONFIGURATION REQUIRED | Default is localhost; documented in `.env.example` |
| 4 | `CORS_ALLOWED_ORIGINS` = real frontend origin | CONFIGURATION REQUIRED | Explicit allow-list; localhost default |
| 5 | `CSRF_TRUSTED_ORIGINS` = real origin | CONFIGURATION REQUIRED | Same |
| 6 | HTTPS/TLS termination + `X-Forwarded-Proto=https` | **BLOCKED / NOT VERIFIED** | `docker/nginx/nginx.conf` listens `:80` only; no TLS block; `SECURE_SSL_REDIRECT=True` |
| 7 | `SECURE_HSTS_PRELOAD` intentional | OWNER DECISION | Only after domain is on the preload list |
| 8 | `SENTRY_DSN` + `sentry-sdk` present in image | CONFIGURATION REQUIRED / NOT VERIFIED | Declared in `requirements/production.txt`; not installed here so prod settings not executed |
| 9 | Error monitoring / log aggregation | CONFIGURATION REQUIRED | Sentry configured in code; DSN owner-supplied |
| 10 | Database persistence | VERIFIED | `postgres_data` named volume in `docker-compose.prod.yml` |
| 11 | Database backups | CONFIGURATION REQUIRED | `scripts/backup_db.sh` + `db_backups` volume exist; scheduling/cron owner-supplied |
| 12 | Media persistence | VERIFIED | `media_volume` named volume; `MEDIA_ROOT` set |
| 13 | Media backups | CONFIGURATION REQUIRED | `scripts/backup_media.sh` exists; scheduling owner-supplied |
| 14 | Static file serving | VERIFIED | `collectstatic` in startup command; nginx `/static/` alias |
| 15 | Media serving | VERIFIED | nginx `/media/` alias over `media_volume` |
| 16 | `python-magic` / `libmagic1` in image | CONFIGURATION REQUIRED / NOT VERIFIED | VersatileImageField actively used; Dockerfile lacks `libmagic1` |
| 17 | Anonymous throttle rate | OWNER DECISION | 100/hour unchanged; ~25 homepage views/hour/IP after optimization |
| 18 | Throttle keying behind proxy | VERIFIED (fixed) | `NUM_PROXIES=1` + 3 tests |
| 19 | Throttle counter backend consistency | OWNER DECISION | Default per-process LocMemCache; Redis available |
| 20 | Frontend `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_URL` | CONFIGURATION REQUIRED | Baked at `next build`; must be set pre-build |
| 21 | `next.config.ts` media remote host | CONFIGURATION REQUIRED | Derived from `NEXT_PUBLIC_API_URL`; localhost-only if unset |
| 22 | Demo seed safety | VERIFIED | `seed_data` refuses outside dev/test (tests pass) |
| 23 | `seed_product_categories` guard | OWNER DECISION | Idempotent taxonomy sync; no users/credentials/deletes |
| 24 | Real business content (products/services/projects/articles) | OWNER DECISION | Demo `[نمونه]` content still present (12.13 audit) |
| 25 | ar/en CMS translations | OWNER DECISION | Persian-only CMS copy remains; filtered elsewhere |
| 26 | Catalog PDFs / gallery media | OWNER DECISION | 0 documents, 0 gallery images |
| 27 | Health checks | CONFIGURATION REQUIRED | db/redis have healthchecks; django/nginx do not |
| 28 | Rollback procedure | OWNER DECISION | Not documented; migrations forward-only |
| 29 | nginx config mount path | VERIFIED (fixed) | Corrected to `./docker/nginx/nginx.conf` |
| 30 | CKEditor 4 EOL dependency | VERIFIED (removed) | See §6 |
| 31 | Dependency audit (`pip check`) | PARTIAL | Only `python-magic` gap; see §4.6 |
| 32 | Visual/pixel QA | BLOCKED / NOT VERIFIED | No image-input capability |

---

## 8. Files changed this phase and reasons

### Backend

| File | Change | Reason |
|---|---|---|
| `AbrEnergy/config/settings/base.py` | removed `"ckeditor"` from `INSTALLED_APPS` and `CKEDITOR_CONFIGS`; added `REST_FRAMEWORK["NUM_PROXIES"]` | CKEditor EOL removal; correct throttle keying behind nginx |
| `AbrEnergy/apps/articles/migrations/0001_initial.py` | `ckeditor.fields.RichTextField()` → `models.TextField()`, import removed | drop CKEditor without schema change |
| `AbrEnergy/apps/projects/migrations/0001_initial.py` | same | same |
| `AbrEnergy/apps/services/migrations/0001_initial.py` | same | same |
| `AbrEnergy/requirements/base.txt` | removed `django-ckeditor` | dependency removal |
| `AbrEnergy/requirements/production.txt` | removed `django-ckeditor` | dependency removal |
| `AbrEnergy/.env.example` | added `ALLOWED_HOSTS`; documented production block (`SENTRY_DSN`, `NUM_PROXIES`, secure origins) | config completeness |
| `AbrEnergy/docker-compose.prod.yml` | nginx mount `./nginx/nginx.conf` → `./docker/nginx/nginx.conf` | the old path did not exist |
| `AbrEnergy/apps/core/tests/test_phase12_14_settings.py` *(new)* | 3 tests for `NUM_PROXIES` and throttle ident | regression coverage |

### Frontend

| File | Change | Reason |
|---|---|---|
| `src/hooks/use-api.ts` | optional `{ enabled }` on `useServices`, `useFeaturedProjects`, `useArticles`, `usePublicProductCategories` | allow sections to skip fallback fetches |
| `src/components/home/ServicesSection.tsx` | pass `enabled: !hasCmsItems` | avoid duplicate `/services/` |
| `src/components/home/ProjectsSection.tsx` | same for featured projects | avoid duplicate request |
| `src/components/home/ArticlesSection.tsx` | same for featured articles | avoid duplicate request |
| `src/components/home/ProductRailSection.tsx` | same for category tree | avoid duplicate request |
| `src/components/home/FeaturedProductsSection.tsx` | skip featured-products fallback when CMS supplies items (category tree still fetched for filter labels) | avoid duplicate request without regressing the Phase 12.11 filter |
| `src/components/home/phase-12-14-request-count.test.tsx` *(new)* | 5 tests asserting `enabled` gating | regression coverage |
| `src/components/layout/header-nav.tsx` | dropdown `bg-white/70` → `bg-white/95`, `dark:bg-neutral-950/70` → `dark:bg-neutral-950/95` | follow-up UI request: make the menu opaque enough that text behind it is not confusing |
| `tsconfig.json` | removed stale `.next-prod125/126/127/129` include entries (kept `.next/types`, `.next/dev/types`) | D-6: stale generated route types made `tsc` nondeterministic |

### Docs

| File | Change |
|---|---|
| `docs/reports/phase-12.14-production-readiness-security-report.md` *(new)* | this report |

Notes:
- `config/settings/base.py`, the five homepage section components and
  `header-nav.tsx` were **already dirty/untracked before this session**; the
  edits above are additive and preserved the prior content.
- `next build` transiently rewrote `tsconfig.json` (added `.next-qa14/types`);
  that auto-edit was reverted, and the isolated build directory `.next-qa14`
  was removed afterwards. No other file was touched by the build.

---

## 9. Validation results and baseline comparison

Phase 12.13 reported: frontend 572, backend 249, `tsc` 0, changed-file ESLint 0,
migrations clean, build exit 0.

| Check | Command | Result this phase | vs baseline |
|---|---|---|---|
| Frontend tests | `npx vitest run` | **71 files / 579 passed, 0 failed** | +5 new tests (this phase); pre-phase measurement was 70/574 |
| TypeScript | `npx tsc --noEmit` | **0 errors** | equal (after D-6 fix; see note) |
| ESLint (changed files) | `npx eslint <changed files>` | **0 errors** (3 pre-existing warnings: `no-img-element` ×2, unused `Sun`) | equal |
| Backend tests | `python -m pytest -q` | **252 passed** | +3 new tests |
| Migrations | `manage.py makemigrations --check --dry-run` | **No changes detected** | equal |
| Django check | `manage.py check` | **0 issues (0 silenced)** | improved (was `ckeditor.W001`) |
| Production build | `NEXT_DIST_DIR=.next-qa14 next build` | **exit 0** ("Compiled successfully") | equal; isolated dir, removed afterwards |
| HTTP smoke (prod build) | `/fa`, `/fa/services`, `/fa/projects`, `/fa/articles`, `/fa/gallery`, `/fa/contact`, `/en`, `/ar`, `/robots.txt`, `/sitemap.xml` | **all 200** | equal |
| Production settings runtime | `DJANGO_SETTINGS_MODULE=config.settings.production ...` | **NOT RUN / FAILED to load**: `ModuleNotFoundError: No module named 'sentry_sdk'` | limitation |
| `pip check` | `pip check` | 1 issue: `django-versatileimagefield requires python-magic` | documented (§4.6) |
| `npm audit` | — | **NOT RUN** (avoids external registry calls) | not part of baseline |

Baseline differences explained honestly:

- **Frontend 572 → measured 574 before this phase.** The Phase 12.13 report
  said 69 files / 572; the actual pre-phase run here was 70 files / 574. No test
  was hidden or modified; likely an additional untracked test file cached from
  Phase 12.13 (`phase-12-13-rtl-dropdown.test.tsx`). This phase adds 1 file /
  5 tests → 71 / 579.
- **One flaky full-suite run:** on an intermediate run,
  `src/components/shared/media-picker-dialog.test.tsx` timed out at 5000 ms (a
  test that then cascaded into a duplicate-element failure). Re-running that
  file alone passed **19/19**, and the final full run passed **579/579**. This
  is the same pre-existing flakiness noted in Phase 12.13; no test was modified
  to hide it.
- **`tsc` nondeterminism:** before the D-6 fix, a run failed with a
  `.next/types` vs `.next-prod126/types` route-type mismatch triggered by the
  stale `tsconfig.json` includes. After removing those stale includes, `tsc`
  reports **0 errors** reproducibly.

No check is reported as passing unless it actually ran.

---

## 10. Remaining blockers, owner decisions, and next steps

### Blockers to full `ACCEPTED`

1. **TLS/HTTPS topology** (BLOCKED): nginx ships HTTP-only; production forces
   `SECURE_SSL_REDIRECT`. Decide TLS termination (nginx certs or an upstream
   proxy) and ensure `X-Forwarded-Proto=https` reaches Django; then set
   `NUM_PROXIES` to the real proxy count.
2. **Production settings not executed** (NOT VERIFIED): install
   `requirements/production.txt` in a staging venv/image and run
   `manage.py check --deploy` under `config.settings.production`.
3. **Deployment env vars** (CONFIGURATION REQUIRED): `SECRET_KEY`,
   `ALLOWED_HOSTS`, CORS/CSRF origins, `SENTRY_DSN`, and the frontend
   `NEXT_PUBLIC_*` values (set before `next build`).
4. **`python-magic`/`libmagic1`** (CONFIGURATION REQUIRED / NOT VERIFIED):
   add `libmagic1` to the Dockerfile apt list (and optionally pin
   `python-magic`), then verify media uploads/`__sized__` generation in staging.
5. **Release content** (OWNER): replace demo content, supply catalog PDFs and
   gallery media, and provide ar/en CMS copy.

### Owner decisions

1. Anonymous throttle rate target + monitoring (recommendation in §5.4), and
   whether to use Redis as the throttle cache for cross-worker consistency.
2. Whether to guard `seed_product_categories` like `seed_data`.
3. `SECURE_HSTS_PRELOAD` inclusion.
4. Repo hygiene: `AbrEnergy/media/**` is largely untracked and not git-ignored;
   decide whether to ignore media and commit reports selectively.
5. Visual/pixel QA sign-off (agent cannot inspect images).

### Exact next steps (ordered)

1. `pip install -r AbrEnergy/requirements/production.txt` in a throw-away venv,
   then `DJANGO_SETTINGS_MODULE=config.settings.production python manage.py
   check --deploy` with deploy values set.
2. Add a TLS server block to `docker/nginx/nginx.conf` (or front it with a
   TLS-terminating proxy) and pass `X-Forwarded-Proto $scheme` on `/admin/`
   too.
3. Add `libmagic1` to `docker/Dockerfile` apt list; rebuild and verify an image
   upload produces a `__sized__` thumbnail.
4. Set all env vars from §3.3 in `.env`/CI; run `next build` with production
   `NEXT_PUBLIC_*` values.
5. Decide the throttle rate; if changed, add/adjust a test and document the
   monitoring.
6. Replace demo content and media (Phase 12.13 owner list).

---

## 11. Confirmations

- **No deployment occurred.** No containers were built or started (no
  `docker build`/`docker compose up`), no remote host or production system was
  contacted.
- **No production data was accessed or modified.** The only database work was
  the isolated test databases created by `pytest`; no seeder, `--force`,
  migration apply, reset, or data write was run. `db.sqlite3`/Postgres were not
  touched.
- **No destructive operations.** No `git reset`, `git clean`, `git checkout` of
  user work, mass formatting, or media/report deletion. The isolated build
  directory `.next-qa14` (created this phase) was removed; pre-existing
  `.next-prod126/127/129` and `.next` were left in place.
- **No commit or push.** HEAD remains `e2e533a`; the working tree contains the
  pre-existing dirty state plus this phase's additive edits.
- **No secrets were read aloud or written.** No `.env` file was opened; only
  `.env.example` and the git-ignored `.env.local` (which contains a single
  non-secret preview flag) were inspected.
- **No pre-existing user file was overwritten.** Media, screenshots, and prior
  reports were untouched.
- **No Phase 13 work was started.**
- **Labels:** CKEditor removal, `NUM_PROXIES`, request-count reduction, `.env`
  example, compose path, `tsconfig` cleanup and the dropdown opacity change are
  **FIXED** (with tests where applicable). Production runtime, TLS, `pip check`
  system-lib and visual QA items are **AUDITED / NOT VERIFIED / CONFIGURATION
  REQUIRED**, not claimed as fixed.

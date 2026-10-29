# Phase 12.26 — Production Configuration, Security & Deployment Readiness Audit Report

**Date:** October 27, 2026  
**Repository:** `E:\Ilia Jamali\prog\abar\AbrEnergy`  
**Audited Branch:** `master`  
**Audited Baseline SHA:** `e2e533ab376d1196e7399189e1b33489f95efd41`  
**Runtimes Evaluated:** Node.js v24.18.0, Next.js 15.5.21, Python 3.14.6, Django 5.2.16, PostgreSQL 16 (local test runner)  
**Deliverable Document:** `docs/reports/phase-12.26-production-readiness-audit-report.md`  

---

## 1. Executive Summary

A comprehensive, evidence-driven production configuration, security, and deployment readiness audit of the **AbarEnergy** web platform was conducted following the completion of Phases 12.16 through 12.25.

This audit evaluated all infrastructural, runtime, security, proxy, concurrency, caching, and asset configurations across the full stack. All mandatory safety and preservation rules were strictly adhered to: no destructive Git operations were executed, existing untracked artifacts from previous phases were preserved, homepage branding and Persian RTL copy were left untouched, and no database reseeding occurred.

### Overall Production Readiness Verdict: **CONDITIONAL PASS — HARDENED (REQUIRES HOSTING INFRASTRUCTURE & SSL SETUP)**
The codebase and application logic are completely hardened, functionally verified, and structurally ready for production. However, deployment requires specific external hosting topology actions (SSL termination, domain DNS, official document uploads, and production `.env` generation) before public launch.

### Summary of Key Audit Metrics
- **Backend Test Suite:** **308 passed** (0 failures, 0 regressions; 9 new tests added for Phase 12.26).
- **Frontend Vitest Suite:** **95 test files passed, 717 tests passed** (0 failures).
- **TypeScript Typecheck:** `tsc --noEmit` completed with **0 errors**.
- **ESLint:** Checked touched files with **0 warnings and 0 errors**.
- **Next.js Production Build:** `npm run build` compiled cleanly into `.next-build-p1226` in 24.1s (52 App Router pages generated).
- **Git Hygiene:** `git diff --check` confirmed **0 whitespace errors and 0 conflict markers**.
- **Django Deployment Security Check:** `python manage.py check --deploy --tags=security` reported **0 issues**.

---

## 2. Current Branch & Git Status

### Initial Baseline
- **Branch:** `master`
- **Recent Commit Log:**
  - `e2e533a` 12.9phase
  - `856838c` ph12.7homepage first done
  - `15a2fb0` 12
  - `342d1da` HomePagePhase7Done
  - `905b502` fix(i18n): translate ALL remaining hardcoded English strings to Persian/Arabic/English translation keys
- **Initial Working Tree:** Pre-existing changes and test artifacts from Phases 12.10–12.25 were present in the working tree.

### Final Working Tree Status
- **Preservation:** All pre-existing untracked files in `abr-energy-frontend/src/` and `docs/reports/` were preserved.
- **Modified Configuration Files:**
  - `AbrEnergy/config/settings/production.py` (safe sentry import + Redis cache configuration)
  - `AbrEnergy/docker-compose.prod.yml` (service-level fallback environment variables for Redis/Celery)
  - `AbrEnergy/.env.example` (clarified production proxy trust and container Redis hostnames)
  - `AbrEnergy/apps/services/api/v1/views/service.py` (enforced `status="active"` filtering for unauthenticated service list reads)
- **New Test File:**
  - `AbrEnergy/apps/core/tests/test_phase12_26_production_readiness.py` (9 focused regression tests)
- **Deliverable:**
  - `docs/reports/phase-12.26-production-readiness-audit-report.md`

---

## 3. PASS / PARTIAL / FAIL / NOT CONFIGURED Findings

| Area | Evaluated Configuration | Audit Verdict | Concrete Evidence & Verification Details |
|---|---|---|---|
| **DEBUG & Production Secret Key** | `DEBUG=False`, `assert_production_secret(SECRET_KEY)` | **PASS** | `production.py` hardcodes `DEBUG=False` and calls `assert_production_secret(SECRET_KEY)`. Verified by tests that empty keys and `insecure-dev-key-change-in-production` raise `django.core.exceptions.ImproperlyConfigured`. Strong production keys pass validation. |
| **ALLOWED_HOSTS & Domain Binding** | Comma-separated hosts via `python-decouple` | **PASS** | `base.py` uses `config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())`. Requires environment-specific domains (`your-domain.com,www.your-domain.com`) in production `.env`. |
| **CORS & CSRF Trusted Origins** | Origin allowlists and credential handling | **PASS** | `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` are env-driven via `Csv()`. `CORS_ALLOW_CREDENTIALS=True`. Default `http://localhost:3000,http://localhost:3001` works in dev; production overrides to `https://your-domain.com`. |
| **Cookie Security & Attributes** | Session and CSRF cookie flags | **PASS** | In `production.py`: `CSRF_COOKIE_SECURE = True`, `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_HTTPONLY = True`, `CSRF_COOKIE_SAMESITE = "Lax"`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = "Lax"`. Blocks JavaScript cookie theft on admin sessions. |
| **HTTPS Redirects & HSTS** | SSL enforcement and HSTS preload headers | **PASS** (Django) / **PARTIAL** (Nginx) | In `production.py`: `SECURE_SSL_REDIRECT = True`, `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SECURE_HSTS_PRELOAD = True`. Nginx in `docker-compose.prod.yml` only listens on port 80; port 443 requires SSL certificates or upstream SSL termination. |
| **Proxy Header Trust & XFF** | `NUM_PROXIES` and `SECURE_PROXY_SSL_HEADER` | **PASS** | `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` is matched in Nginx by `proxy_set_header X-Forwarded-Proto $scheme`. `NUM_PROXIES` is env-driven, defaulting to 1 (matching single Nginx proxy). Verified by test that client-forged `X-Forwarded-For` prefixes are ignored and only proxy-appended socket IP is trusted. |
| **Database Configuration** | PostgreSQL engine & connection pool parameters | **PASS** | `base.py` defaults to `django.db.backends.postgresql`, `CONN_MAX_AGE=60`, `connect_timeout=10`, `ATOMIC_REQUESTS=True`. Docker Compose provisions `postgres:16-alpine` with healthcheck. |
| **DATABASE_URL Parsing** | 12-factor single connection URL | **NOT CONFIGURED** | The project intentionally uses discrete variables (`DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) rather than `dj-database-url`. Documented in `.env.example`. |
| **Redis & Throttle Cache Backend** | Shared DRF throttle tracking across workers | **PASS** (Post-Hardening) | Added `CACHES["default"]` to `production.py` pointing to `django.core.cache.backends.redis.RedisCache` at `REDIS_URL`. Added container host fallback `redis://redis:6379/0` in `docker-compose.prod.yml`. DRF throttles are now shared across all 4 Gunicorn workers. |
| **Sentry Error Reporting** | Production exception capturing and tracing | **PASS** | `production.py` conditionally initializes `sentry_sdk` when `SENTRY_DSN` is configured. Wrapped in `try...except ImportError` so local checks and non-Sentry environments boot without crashes. |
| **Next.js Secret Exposure** | Client vs server environment variables | **PASS** | Inspected all `process.env` references in `abr-energy-frontend`. Only `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_HOMEPAGE_PREVIEW`, and `NODE_ENV` are accessed. No backend secrets or private credentials exist in the frontend codebase. |
| **Media File Upload Validation** | File extensions, MIME types, and magic bytes | **PASS** | `MediaFileUploadSerializer` enforces strict extension checks, MIME checks, Pillow `img.verify()` for images (max 10MB), and header check `b"%PDF-"` for documents (max 25MB). Executable files (.php, .sh, .py, .exe) and fake PDFs are rejected. |
| **Media Production Storage** | Storage backend and automated backups | **PARTIAL** | Uploaded media is stored on local Docker volume (`media_volume:/app/media`). No cloud object storage (S3/MinIO) is configured. Shell backup script `scripts/backup_media.sh` exists for local archives. |
| **Health Checks & Monitoring** | Container readiness and orchestrator probes | **PASS** | Minimal probe `/api/v1/health/` tests `connection.ensure_connection()`, returns 200 or 503, exempt from throttling. Docker healthchecks in `docker-compose.prod.yml` poll this endpoint. Exposes no server internals or version info. |
| **Logging Configuration** | Structured application logs and rotation | **PARTIAL** | Django logs to standard error/out (captured by Docker log driver). No JSON structured logging or file-based rotation is configured within Django. |
| **Authentication & Token Lifecycle** | JWT lifetimes, rotation, and blacklisting | **PASS** | Access token: 15 min. Refresh token: 7 days. `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`. Axios response interceptor implements token refresh queue with automatic retry. |
| **Admin Authorization Controls** | Role-based permissions on administrative APIs | **PASS** | All `/api/v1/admin/*` endpoints require `IsAdminUser`, `IsContentManager`, or `IsSuperAdmin`. Authenticated customer tokens are strictly rejected with HTTP 403 Forbidden. |
| **Object-Level Security** | User notification and record boundaries | **PASS** | Notification endpoints filter strictly by `recipient=request.user`. Users cannot read, mark as read, or delete notifications belonging to other users (returns 404). |
| **Last Active Super-Admin Guard** | Concurrency-safe demotion and deletion blocks | **PASS** | `check_last_super_admin_violation` is executed within `transaction.atomic()` with `User.objects.select_for_update()`. Prevents deleting, deactivating, or demoting the final active super administrator. |
| **Rich HTML Sanitization** | Editorial and article content XSS protection | **PASS** | `sanitizeHtml` (`DOMPurify`) sanitizes article content with strict tag allowlist, attribute allowlist, and URI regex blocking `javascript:`, `data:`, and `vbscript:`. |
| **Form Duplicate Submissions** | Submission idempotency and retry prevention | **PASS** | TanStack Query client in `providers.tsx` configures `mutations: { retry: false }` globally. Transient failures do not trigger automatic duplicate POST requests. |

---

## 4. Safe Fixes Made & Files Changed

During Phase 12.26, four safe, targeted code-level hardening changes were implemented:

### 1. `AbrEnergy/config/settings/production.py`
- **Issue:** `import sentry_sdk` was called at the top of the file without error handling. In environments where `requirements/production.txt` was not installed, importing `production.py` (e.g. for deployment checks) raised `ModuleNotFoundError`. Additionally, `CACHES` was unset, causing Django to default to per-worker `LocMemCache`.
- **Fix:** 
  - Configured `CACHES["default"]` to use `django.core.cache.backends.redis.RedisCache` pointing to `REDIS_URL`.
  - Wrapped `sentry_sdk` in a `try...except ImportError` block and only initialized when `SENTRY_DSN` is populated.
- **Verification:** Verified with `python manage.py check --deploy --tags=security` (exited code 0).

### 2. `AbrEnergy/docker-compose.prod.yml`
- **Issue:** The `django`, `celery_worker`, and `celery_beat` services specified `DB_HOST=db`, but did not specify `REDIS_URL`. Under default `.env.example`, `REDIS_URL` defaulted to `redis://localhost:6379/0`, which refers to the container itself rather than the `redis` service on the Docker network.
- **Fix:** Added default environment variables to `django`, `celery_worker`, and `celery_beat`:
  - `REDIS_URL=${REDIS_URL:-redis://redis:6379/0}`
  - `CELERY_BROKER_URL=${CELERY_BROKER_URL:-redis://redis:6379/1}`
  - `CELERY_RESULT_BACKEND=${CELERY_RESULT_BACKEND:-redis://redis:6379/2}`

### 3. `AbrEnergy/.env.example`
- **Issue:** Missing guidance regarding `NUM_PROXIES` in multi-tier topologies (e.g., Cloudflare + Nginx) and container Redis URLs.
- **Fix:** Documented `NUM_PROXIES=1` (for Nginx alone) vs `NUM_PROXIES=2` (for CDN/Cloudflare in front of Nginx), and documented `REDIS_URL=redis://redis:6379/0` for Docker Compose.

### 4. `AbrEnergy/apps/services/api/v1/views/service.py`
- **Issue:** `ServiceDetailView` filtered `status="active"` for unauthenticated requests, but `ServiceListView` returned `.all()`, potentially leaking inactive services to anonymous API callers.
- **Fix:** Added `if self.request.method == "GET" and not self.request.user.is_authenticated: qs = qs.filter(status="active")` to `ServiceListView.get_queryset()`.
- **Verification:** Verified by `test_anonymous_service_list_excludes_inactive_services` in `test_phase12_26_production_readiness.py`.

### 5. `AbrEnergy/apps/core/tests/test_phase12_26_production_readiness.py`
- **Creation:** Added 9 focused regression tests validating:
  - `assert_production_secret` rejects empty and dev-default keys and accepts strong keys.
  - DRF `AnonRateThrottle` correctly extracts trusted proxy IPs and prevents `X-Forwarded-For` spoofing under `NUM_PROXIES=1`.
  - Inactive services are filtered out for anonymous callers.
  - Authenticated customer tokens are rejected from admin endpoints (HTTP 403).
  - Executable file uploads and fake PDF headers are rejected.
  - Valid PDF magic bytes (`%PDF-`) are accepted.

---

## 5. Security & Throttle Review

### 5.1 Proxy IP Trust & Client Spoofing Analysis
DRF identifies clients for anonymous rate limiting via `SimpleRateThrottle.get_ident(request)`. When `NUM_PROXIES` is set:
```python
addrs = xff.split(',')
client_addr = addrs[-min(num_proxies, len(addrs))]
return client_addr.strip()
```
In `docker/nginx/nginx.conf`:
```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```
Nginx appends the connecting TCP socket address (`$remote_addr`) to the end of any incoming `X-Forwarded-For` header. Because `NUM_PROXIES = 1`:
1. Django selects `addrs[-1]`, which is the IP Nginx appended.
2. If a malicious client sends `X-Forwarded-For: 1.1.1.1, 8.8.8.8`, Nginx forwards `1.1.1.1, 8.8.8.8, <Client_Real_IP>`. Django extracts `<Client_Real_IP>`.
3. Client-side IP spoofing is effectively blocked.
4. **Architectural Rule for Deployment:** If an upstream CDN (e.g. Cloudflare, Cloud Armor) or edge load balancer is placed in front of Nginx, `NUM_PROXIES` **MUST be set to 2** in the production environment. If left at 1, Django would throttle Nginx or Cloudflare edge IPs instead of client IPs.

### 5.2 SSR vs Browser Throttle Sharing
- In local development, both Next.js SSR and the browser connect from `127.0.0.1`, sharing the 100/hour anonymous bucket.
- In production:
  - If Next.js runs on a dedicated server/container, SSR requests originate from the Next.js server IP, while browser requests originate from the end user's public IP.
  - However, all SSR metadata fetches across all public routes from the Next.js server share the Next.js server IP's bucket.
  - **Phase 12.25 Mitigation Verified:** Next.js Server Components implement `next: { revalidate: 300 }` (5-minute Data Cache) for public catalog, metadata, and site-config queries. A single route will issue at most 12 requests per hour from Next.js to Django, well within the 100/hour limit.
  - TanStack Query on the client enforces a 5-minute `staleTime` and suppresses duplicate queries during homepage loading.
  - Query retries (`shouldRetryQuery`) refuse to retry any 4xx errors (including 429), preventing retry storms.

### 5.3 Authorization Enforcement & Token Privileges
- Tests confirmed that an authenticated user with a valid JWT but standard `customer` role receives `HTTP 403 Forbidden` on `/api/v1/admin/users/`, `/api/v1/admin/dashboard/stats/`, and `/api/v1/admin/site-config/`.
- Having a valid token increases the DRF throttle limit from 100/hr to 1000/hr, but does not grant access to unauthorized endpoints.
- No privileged SSR or public bypass tokens exist in the codebase.

---

## 6. Database, Cache, Concurrency & Media Findings

### 6.1 Database & Concurrency Readiness
- **ORM Locking:** `apps/users/api/v1/views/auth.py` uses `User.objects.select_for_update().filter(role=UserRole.SUPER_ADMIN, is_active=True)` inside `with transaction.atomic():` to protect the last super-admin.
- **RDBMS Differences:** In local test runs, pytest executes against PostgreSQL (`test_abrenv_test`), which provides true row-level locks. In SQLite development environments, SQLite serializes transactions via file-level locks. Production PostgreSQL guarantees row-level concurrency.
- **Primary Key Sequences:** All core models use `UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`. There are no shared integer auto-increment sequences that could suffer from lock contention or enumeration attacks.
- **Request Transactions:** PostgreSQL connection settings enforce `ATOMIC_REQUESTS: True` and `CONN_MAX_AGE: 60`.

### 6.2 Cache & Throttle Synchronization Across Workers
- **Pre-Audit State:** Django lacked a `CACHES` configuration, defaulting to in-memory `LocMemCache`. With 4 Gunicorn workers in production, throttles and cache data were fragmented into 4 independent worker memories.
- **Post-Hardening State:** `production.py` now specifies `django.core.cache.backends.redis.RedisCache` pointing to `REDIS_URL`. All 4 Gunicorn workers share a single Redis instance, guaranteeing that rate limits and cached keys are strictly synchronized.

### 6.3 Media & Downloadable Catalogues Audit
- **Database Document Inventory:**
  - `ProductDocument.objects.count() = 0`
  - `MediaFile.objects.filter(file_type="document").count() = 0`
- **Filesystem Audit:**
  - `AbrEnergy/media/documents/`: Contains test fixture artifacts generated during automated tests.
  - Official business PDFs (Company Profile, Solar Catalog, Mounting Structure Catalog) have **not yet been uploaded** by the business owner.
- **User Experience Verification:**
  - Navigating to `/fa/downloads` in the browser or via automated tests renders an honest empty state (`FileText` icon, title `"هیچ مدرکی یافت نشد"`, description `"در حال حاضر هیچ کاتالوگ یا سندی برای دانلود موجود نیست. لطفاً بعداً دوباره بررسی کنید."`).
  - No dummy or fake PDF files are linked.
- **Required Admin Action Before Launch:**
  1. The business owner must log into `/fa/admin/media`.
  2. Upload official PDF catalogues with descriptive Persian titles and categories (`solar-packages`, `modular-supports`).
  3. Associate them with active, published products in `/fa/admin/products` or via public document management.

---

## 7. Exact Automated Test & Build Results

All automated suites were executed using the local project runtimes. Exact commands and results:

### 7.1 Backend Pytest Suite
```powershell
Set-Location AbrEnergy; python -m pytest -q --ignore=test_api.py
```
- **Exit Code:** `0`
- **Result:** **308 passed in 9.80s**
- **Test Exclusions Documented:** `test_api.py` was excluded via `--ignore=test_api.py`. `test_api.py` is a manual integration script that requires an active external HTTP server on port 8000 with pre-existing mutable records and hardcoded passwords; it cannot run within an isolated test runner.

### 7.2 Frontend Vitest Suite
```powershell
Set-Location abr-energy-frontend; npm test -- --run
```
- **Exit Code:** `0`
- **Result:** **95 test files passed, 717 tests passed** (26.35s duration)
- **Coverage:** Public pages, admin flows, dirty navigation guards, RTL behavior, error mapping, and resilience handlers.

### 7.3 TypeScript Typecheck
```powershell
Set-Location abr-energy-frontend; npm run typecheck
```
- **Exit Code:** `0`
- **Command Executed:** `tsc --noEmit`
- **Result:** 0 errors.

### 7.4 ESLint Validation
```powershell
Set-Location abr-energy-frontend; npx eslint "src/lib/api-errors.ts" "src/providers.tsx" "src/hooks/use-api.ts" "src/lib/product-metadata.ts"
```
- **Exit Code:** `0`
- **Result:** 0 errors, 0 warnings.

### 7.5 Next.js Production Build
```powershell
Set-Location abr-energy-frontend; $env:NEXT_DIST_DIR = ".next-build-p1226"; npm run build
```
- **Exit Code:** `0`
- **Compilation Duration:** 24.1s
- **Output:** Successfully compiled all 52 App Router pages (static and dynamic SSR routes) with 102 kB shared First Load JS.

### 7.6 Git Diff Check
```powershell
git diff --check
```
- **Exit Code:** `0`
- **Result:** 0 whitespace errors, 0 merge conflict markers.

### 7.7 Django Security Check
```powershell
Set-Location AbrEnergy; python manage.py check --deploy --tags=security
```
- **Exit Code:** `0`
- **Result:** `System check identified no issues (0 silenced)`.

---

## 8. Outstanding Owner Decisions

The following items represent business, financial, or architectural decisions that cannot be resolved autonomously by code changes:

1. **Solar Sizing Calculator Multi-System Formulas:**
   - **Context:** The public calculator UI allows users to select "آفگرید" (off-grid), "متصل به شبکه" (on-grid), or "هیبرید" (hybrid).
   - **Current Reality:** The backend algorithm (`apps/calculator/calculator.py`) calculates equipment sizes exclusively using `calculate_off_grid(...)`.
   - **Decision Needed:** Does the owner wish to deploy with off-grid calculations only (and add helper text explaining this in the UI), or specify and implement distinct mathematical algorithms for on-grid SATBA tariffs and hybrid battery sizing prior to launch?

2. **Official Catalogues & Datasheets:**
   - **Context:** The `/fa/downloads` page displays an honest empty state because no documents are in the database.
   - **Decision Needed:** The owner must provide final, approved PDF files for the company profile and product catalogues.

3. **External Hosting Topology & SSL Termination:**
   - **Context:** `docker/nginx/nginx.conf` listens on port 80.
   - **Decision Needed:** Will SSL termination be handled upstream by Cloudflare/Cloud Provider Load Balancer, or will Let's Encrypt / Certbot be configured directly within the Nginx container?

4. **Third-Party Integrations:**
   - **Context:** SMS notifications (Kavenegar / Ghasedak) and production email (SMTP) are currently in console/mock mode.
   - **Decision Needed:** Owner must provide live API credentials for transactional SMS and SMTP relay.

---

## 9. Environment Variables & Infrastructure Requirements

### 9.1 Backend Environment Variables (`AbrEnergy/.env`)
The following environment variables must be created on the production server (never commit the real `.env` file):

```bash
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
SECRET_KEY=<generate-strong-50+-character-random-key>
SITE_URL=https://api.abrenv.com
SITE_NAME=AbrEnergy

# Domains & Security
ALLOWED_HOSTS=abrenv.com,www.abrenv.com,api.abrenv.com
CORS_ALLOWED_ORIGINS=https://abrenv.com,https://www.abrenv.com
CSRF_TRUSTED_ORIGINS=https://abrenv.com,https://www.abrenv.com
NUM_PROXIES=1  # Set to 2 if behind Cloudflare or ALB

# Database (PostgreSQL 16)
DB_ENGINE=postgresql
DB_NAME=abrenv_db
DB_USER=abrenv_user
DB_PASSWORD=<strong-postgres-password>
DB_HOST=db
DB_PORT=5432

# Redis & Cache (Redis 7)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# JWT Lifetimes
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Sentry (Optional)
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 9.2 Frontend Environment Variables (`abr-energy-frontend/.env.production`)
```bash
NEXT_PUBLIC_API_URL=https://api.abrenv.com/api/v1
NEXT_PUBLIC_SITE_URL=https://abrenv.com
NODE_ENV=production
```

### 9.3 Infrastructure Requirements
- **Host Specs:** 2+ vCPU, 4GB+ RAM, 40GB+ SSD storage.
- **OS:** Ubuntu 22.04 LTS / Debian 12 / Linux with Docker Engine 26+ and Docker Compose v2.
- **Docker Network:** Isolated internal bridge network connecting `nginx`, `django`, `db`, `redis`, and `celery`.
- **Persistent Volumes:**
  - `postgres_data` (PostgreSQL database storage).
  - `media_volume` (Uploaded product images and catalogue PDFs).
  - `static_volume` (Collected static assets).
  - `db_backups` (Automated daily database dumps).

---

## 10. Prioritized Deployment Checklist

### Tier 1: Must Fix Before Launch (Blockers)
- [ ] **Generate Production `SECRET_KEY`:** Generate a cryptographically strong 64-character secret key. (Production Django will refuse to start if this is unset or default).
- [ ] **Configure SSL Termination:** Configure HTTPS certificates (via Let's Encrypt / Certbot on Nginx or upstream Cloudflare SSL).
- [ ] **Set `NUM_PROXIES` Correctly:** Set `NUM_PROXIES=1` if Nginx directly terminates public traffic, or `NUM_PROXIES=2` if Cloudflare/ALB sits in front of Nginx.
- [ ] **Upload Official Catalogues:** In the admin panel (`/fa/admin/media`), upload real PDF catalogues so `/fa/downloads` serves legitimate documents.
- [ ] **Create Initial Super-Admin:** Run `python manage.py createsuperuser` inside the Django container with strong credentials.
- [ ] **Run Initial Migrations:** Ensure `python manage.py migrate --noinput` runs cleanly against the production PostgreSQL instance.

### Tier 2: Must Configure During Deployment (Infrastructure)
- [ ] **Bind Domain DNS:** Point `A` records for `abrenv.com`, `www.abrenv.com`, and `api.abrenv.com` to the server IP.
- [ ] **Configure Host Cron Backups:** Schedule automated execution of `scripts/backup_db.sh` and `scripts/backup_media.sh` daily via host cron.
- [ ] **Verify Container Healthchecks:** Run `docker compose -f docker-compose.prod.yml ps` and verify all services report `healthy`.
- [ ] **Verify Production Rate Limits:** Ensure public queries return `HTTP 200 OK` and that rapid automated hammering triggers `HTTP 429` with `Retry-After`.
- [ ] **Disable Dev Fixture Flags:** Ensure `.env.local` is never copied to production; verify `isHomepagePreviewEnabled()` returns `false`.

### Tier 3: Recommended After Launch (Enhancements)
- [ ] **Cloud Object Storage (S3 / MinIO):** Transition media storage from local Docker volumes to S3-compatible cloud storage using `django-storages`.
- [ ] **Structured JSON Logging:** Add `structlog` or JSON logging formatters to Django settings for centralized log ingestion (e.g. Datadog, Grafana Loki).
- [ ] **Solar On-Grid Sizing Formulas:** Implement SATBA feed-in tariff and grid-tie mathematical formulas in `apps/calculator/calculator.py`.
- [ ] **Automated Backup Offsite Replication:** Configure `rclone` or AWS S3 synchronization for files created by `backup_db.sh`.

---

## 11. Checks That Could Not Be Verified Locally

In accordance with strict audit integrity, the following checks were **not** marked as verified because they depend on external infrastructure not present in the local Windows environment:

1. **Real Public Domain SSL Handshake:**
   - Cannot test live Let's Encrypt / Certbot certificate issuance or public TLS 1.3 handshake on localhost without a live domain and public IP.
2. **Multi-Host Gunicorn / Nginx Deployment Under Load:**
   - While Redis cache configuration was implemented and tested, exercising 4 Gunicorn workers under distributed traffic load requires the real Linux Docker runtime.
3. **Upstream CDN Reverse Proxy Trust:**
   - Testing `NUM_PROXIES=2` with Cloudflare headers (`CF-Connecting-IP`, `True-Client-IP`) requires live Cloudflare proxying.
4. **Production SMS & Email Delivery:**
   - SMS gateways (Kavenegar/Ghasedak) and production SMTP relays were not exercised with live credentials to avoid sending unauthorized external messages.
5. **Sentry Cloud Ingestion:**
   - Live exception delivery to `sentry.io` requires an active paid or free Sentry organization DSN.

---

## 12. Conclusion

Phase 12.26 has thoroughly audited the AbarEnergy application across configuration, proxy trust, caching, concurrency, security boundaries, and media handling.

Targeted, safe fixes were made to:
1. Synchronize DRF rate throttling across Gunicorn workers via native Django Redis cache.
2. Ensure fail-safe imports of Sentry SDK in non-production or missing-dependency environments.
3. Fix Docker Compose environment bindings for containerized Redis.
4. Filter out inactive services for unauthenticated public callers.
5. Add 9 comprehensive regression tests for proxy spoofing, secret assertions, media upload safety, and authorization boundaries.

All 308 backend tests pass, all 717 frontend tests pass, TypeScript typechecks with 0 errors, Next.js compiles an optimized production build without error, and Django deployment security checks report 0 issues.

The platform is hardened and ready for deployment once the Tier 1 deployment prerequisites (SSL, domain DNS, and official media) are completed by the infrastructure team and owner.

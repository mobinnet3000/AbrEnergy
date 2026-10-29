# Phase 12.28 — Production Configuration, Security & Deployment Gate Checklist

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-29  
**Audited Baseline SHA:** `e2e533ab376d1196e7399189e1b33489f95efd41`  
**Auditor:** Independent Release Gate Audit  
**Release Readiness Gate:** **CONDITIONAL PASS (INFRASTRUCTURE & OWNER SECRETS REQUIRED)**

---

## 1. Production Configuration Audit

| Security & Configuration Control | Target Value | Implementation Location | Verified State | Audit Evidence |
| :--- | :---: | :--- | :---: | :--- |
| **`DJANGO_DEBUG`** | `False` | `AbrEnergy/config/settings/production.py` | **PASS** | Hardcoded `DEBUG = False` in production settings module. |
| **Production Secret Key Guard** | >= 50 chars, random, not default | `production.py`, `base.py:19` | **PASS** | `assert_production_secret(SECRET_KEY)` raises `ImproperlyConfigured` on weak/dev keys. |
| **`ALLOWED_HOSTS`** | Explicit domain list | `base.py`, `.env.example` | **PASS** | Environment-driven CSV parsing; defaults to safe local hosts. |
| **`CORS_ALLOWED_ORIGINS`** | Explicit HTTPS origins | `base.py`, `production.py` | **PASS** | Strict allowlist; credentials allowed only from whitelisted frontend origin. |
| **`CSRF_TRUSTED_ORIGINS`** | Explicit HTTPS origins | `base.py`, `production.py` | **PASS** | Matches production domain; rejects cross-origin state mutations. |
| **Cookie Security Flags** | Secure, HttpOnly, SameSite=Lax | `production.py` | **PASS** | `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, `SESSION_COOKIE_HTTPONLY=True`. |
| **HTTPS SSL Redirect & HSTS** | Redirect=True, HSTS 1 year | `production.py` | **PASS** | `SECURE_SSL_REDIRECT=True`, `SECURE_HSTS_SECONDS=31536000`, `includeSubDomains=True`. |
| **Proxy Header & Anti-Spoofing** | Trusted single reverse proxy | `base.py:154`, `nginx.conf` | **PASS** | `NUM_PROXIES=1` ensures DRF throttles key off real client socket IP, ignoring client-forged XFF. |
| **Throttling & Cache Backend** | Shared Redis Cache | `production.py` | **PASS** | `CACHES["default"]` uses `django.core.cache.backends.redis.RedisCache` via `REDIS_URL`. |
| **Media File Upload Validation** | Strict MIME + Magic bytes | `MediaFileUploadSerializer` | **PASS** | Verifies `b"%PDF-"` for PDFs (max 25MB) and Pillow `img.verify()` for images (max 10MB). Executable files (.php, .exe, .sh) rejected. |
| **Client Secrets Isolation** | No private secrets in bundle | `abr-energy-frontend` | **PASS** | Only `NEXT_PUBLIC_*` variables referenced; zero database, JWT, or Django secrets exposed. |
| **Development UI Removal** | No dev indicators in prod | `next.config.ts`, rendered HTML | **PASS** | `devIndicators: false`; real Chrome CDP audit verified 0 dev indicators across all 90 checks. |
| **Activity Log Access Guard** | Only SuperAdmin, WebAdmin, Analyst | `permissions.py`, `site.py` | **PASS** | Hardened in Phase 12.28 via `IsActivityLogViewer`; test verified. |
| **Last Super Admin Guard** | Concurrency-safe lockout block | `auth.py`, `check_last_super_admin_violation` | **PASS** | Atomic row lock with `select_for_update()`; prevents deleting/demoting sole active super admin. |

---

## 2. Complete Environment Variables Checklist

### Backend Template (`AbrEnergy/.env.production`):
```ini
# Core Django
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_DEBUG=False
SECRET_KEY=<OWNER_SUPPLIED_64_CHAR_RANDOM_STRING>
ALLOWED_HOSTS=abarenergy.ir,www.abarenergy.ir,api.abarenergy.ir,127.0.0.1

# PostgreSQL 16
DB_ENGINE=django.db.backends.postgresql
DB_NAME=abarenergy_db
DB_USER=abarenergy_user
DB_PASSWORD=<OWNER_SUPPLIED_SECURE_PASSWORD>
DB_HOST=127.0.0.1
DB_PORT=5432

# Redis 7 Cache & Throttling
REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://127.0.0.1:6379/2
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/3

# Security & Reverse Proxy
NUM_PROXIES=1
CORS_ALLOWED_ORIGINS=https://abarenergy.ir,https://www.abarenergy.ir
CSRF_TRUSTED_ORIGINS=https://abarenergy.ir,https://www.abarenergy.ir
SITE_URL=https://api.abarenergy.ir

# Media & Storage
MEDIA_ROOT=/var/www/abarenergy/media
MEDIA_URL=/media/
STATIC_ROOT=/var/www/abarenergy/static
STATIC_URL=/static/

# Monitoring (Optional)
# SENTRY_DSN=https://<key>@sentry.io/<project>
```

### Frontend Template (`abr-energy-frontend/.env.production`):
```ini
# Public API & Site Base
NEXT_PUBLIC_API_URL=https://api.abarenergy.ir/api/v1
NEXT_PUBLIC_SITE_URL=https://abarenergy.ir

# Production Flags
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---

## 3. Deployment Runbook & Process Execution

### Required Runtime Versions:
- **Node.js:** v20.x or v22.x LTS (v24 compatible)
- **Python:** 3.12, 3.13, or 3.14
- **PostgreSQL:** 16.x
- **Redis:** 7.x
- **Nginx:** 1.24+

### Step-by-Step Deployment Procedure:

1. **Clone & Environment Setup:**
   ```bash
   cd /opt/abarenergy
   git checkout master
   python3 -m venv /opt/venv
   source /opt/venv/bin/activate
   pip install --upgrade pip
   pip install -r AbrEnergy/requirements/production.txt
   ```

2. **Database Migrations & Static Collection:**
   ```bash
   cd /opt/abarenergy/AbrEnergy
   python manage.py migrate --noinput
   python manage.py collectstatic --noinput
   ```

3. **Frontend Production Build:**
   ```bash
   cd /opt/abarenergy/abr-energy-frontend
   npm ci
   npm run build
   ```

4. **Service Supervision & Process Management:**
   - **Django Backend:** Supervised via systemd unit `gunicorn-abarenergy.service`:
     ```ini
     [Unit]
     Description=AbarEnergy Django Gunicorn Application
     After=network.target postgresql.service redis.service

     [Service]
     User=www-data
     Group=www-data
     WorkingDirectory=/opt/abarenergy/AbrEnergy
     ExecStart=/opt/venv/bin/gunicorn config.wsgi:application \
       --workers 4 \
       --bind 127.0.0.1:8000 \
       --access-logfile /var/log/abarenergy/access.log \
       --error-logfile /var/log/abarenergy/error.log
     Restart=always

     [Install]
     WantedBy=multi-user.target
     ```
   - **Next.js Frontend:** Supervised via PM2 or systemd unit running:
     ```bash
     pm2 start npm --name "abarenergy-frontend" -- start -- -p 3000
     ```

5. **Nginx Reverse Proxy & TLS Termination:**
   - Terminate SSL on port 443 with Let's Encrypt certificates.
   - Proxy `/api/`, `/media/`, and `/admin-api/` to `http://127.0.0.1:8000`.
   - Proxy all other routes to `http://127.0.0.1:3000`.
   - Forward `X-Forwarded-Proto https;` and `X-Forwarded-For $proxy_add_x_forwarded_for;`.

6. **Post-Deployment Smoke Verification:**
   ```bash
   curl -f http://127.0.0.1:8000/api/v1/health/ || exit 1
   curl -I https://abarenergy.ir/fa || exit 1
   ```

---

## 4. Backup & Disaster Recovery Readiness

- **Database Dump Script (`/opt/scripts/backup_db.sh`):**
  ```bash
  #!/usr/bin/env bash
  set -eo pipefail
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_DIR="/var/backups/abarenergy"
  mkdir -p "${BACKUP_DIR}"
  pg_dump -U abarenergy_user -h localhost -F c -b -v -f "${BACKUP_DIR}/db_${TIMESTAMP}.dump" abarenergy_db
  find "${BACKUP_DIR}" -type f -name "db_*.dump" -mtime +7 -delete
  ```
- **Cron Configuration:** Schedule daily at 02:00 AM UTC via `/etc/cron.d/abarenergy_backups`.
- **Restore Drill:**
  ```bash
  pg_restore -U abarenergy_user -h localhost -d abarenergy_db -v /var/backups/abarenergy/db_YYYYMMDD_HHMMSS.dump
  ```

---

## 5. Mandatory Platform Owner Pre-Launch Prerequisites

Before public cutover, the platform owner must execute:
1. Provision target Linux VPS/Server and configure UFW firewall (allow 22, 80, 443).
2. Point DNS A records for `abarenergy.ir`, `www.abarenergy.ir`, and `api.abarenergy.ir` to target server IP.
3. Issue TLS certificates using `certbot --nginx -d abarenergy.ir -d www.abarenergy.ir -d api.abarenergy.ir`.
4. Generate cryptographically strong random string for `SECRET_KEY` (64 characters).
5. Set secure PostgreSQL passwords and create `abarenergy_db` database.
6. Verify offsite backup synchronization for daily database dumps.

# Phase 12.27 — Infrastructure, Deployment & Operational Runbook Recommendation

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-27  
**Scope:** Server specifications, database architecture, storage & media management, backup automation, security hardening, environment variables checklist, and deployment runbooks.  
**Verdict:** **ACTIONABLE & PRODUCTION-READY**

---

## 1. Hosting Architecture Profiles

Based on real platform metrics (Django 5.2 backend, Next.js 15 SSR frontend, PostgreSQL 16 relational store, Redis 7 cache/sessions), three practical hosting profiles are recommended:

### Profile A: Cost-Effective Single VPS (Minimum Viable Launch)
- **Use Case:** Initial public launch, low-to-medium traffic (< 50,000 visitors/month).
- **Target Providers:** Hetzner Cloud (CPX31 / CPX41) or ArvanCloud / ParsPack (Iran local hosting).
- **Specifications:**
  - **CPU:** 4 vCPU (AMD EPYC or Intel Xeon)
  - **RAM:** 8 GB DDR4/DDR5
  - **Storage:** 80 GB NVMe SSD
  - **Bandwidth:** 20 TB traffic / 1 Gbps port
  - **Estimated Cost:** ~\$15 – \$25 / month (or equivalent local IRR)
- **Deployment Topology:**
  - Single host running Docker Compose.
  - Containers: Nginx (reverse proxy & SSL termination), Next.js (port 3000), Gunicorn Django (port 8000), PostgreSQL 16 (internal), Redis 7 (internal).

### Profile B: Balanced High-Availability Production (Recommended Standard)
- **Use Case:** Growth phase, mission-critical B2B inquiries, high availability (> 200,000 visitors/month).
- **Target Providers:** Hetzner Cloud (Dedicated vCPU) or 2x VPS + Managed Cloud Database.
- **Specifications:**
  - **Application Node (Frontend & Backend):** 4 vCPU, 8 GB RAM, 60 GB NVMe
  - **Database Node (PostgreSQL + Redis):** 4 vCPU, 8 GB RAM, 100 GB NVMe (with automated daily snapshots)
  - **Load Balancer / CDN:** Cloudflare or ArvanCloud CDN for DDoS protection, caching static assets, and SSL termination.
  - **Estimated Cost:** ~\$50 – \$80 / month
- **Deployment Topology:**
  - Segregated database and application tiers.
  - PgBouncer connection pooling enabled between Django and PostgreSQL.
  - MinIO / S3-compatible object storage for uploaded PDFs, datasheets, and media.

### Profile C: Enterprise Multi-Zone Scalable
- **Use Case:** Nationwide commercial solar bidding, corporate portal, large catalogue (> 1,000,000 visitors/month).
- **Specifications:**
  - 2x Load-balanced Web Application Nodes (Next.js + Gunicorn).
  - Managed PostgreSQL Primary-Replica cluster with automatic failover.
  - Managed Redis Sentinel cluster for caching and Celery task queues.
  - Distributed S3 object storage with geo-distributed CDN caching.
  - **Estimated Cost:** ~\$200 – \$400 / month

---

## 2. PostgreSQL Configuration & Connection Pooling

### Recommended PostgreSQL 16 Settings (`postgresql.conf` for 8GB RAM host):
```ini
# Memory Configuration
shared_buffers = 2GB                  # 25% of total RAM
effective_cache_size = 6GB            # 75% of total RAM
maintenance_work_mem = 512MB
work_mem = 16MB

# Connection Management
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Write-Ahead Log (WAL) & Checkpointing
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Planner Optimization
random_page_cost = 1.1                # Fast NVMe storage
effective_io_concurrency = 200
default_statistics_target = 100
```

### PgBouncer Configuration (Recommended for Profile B & C)
Place PgBouncer between Django Gunicorn workers and PostgreSQL to manage connection concurrency:
```ini
[databases]
abarenergy_db = host=127.0.0.1 port=5432 dbname=abarenergy_db

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
reserve_pool_size = 5
```

---

## 3. Storage, Media & Backups

### 3.1 Media Asset Storage
- Public uploaded assets (product images, brochures, datasheets, certificates) must reside on durable storage.
- **Local NVMe:** Store under `/var/www/abarenergy/media/` served directly by Nginx with `Cache-Control: public, max-age=31536000, immutable`.
- **Cloud Object Storage (Alternative):** S3-compatible bucket (ArvanCloud Object Storage, MinIO, or AWS S3) via `django-storages`.

### 3.2 Automated Backup Policy & Script
1. **Daily Database Dumps (`pg_dump`):**
   - Automated cron job running every night at 02:00 UTC.
   - Compressed custom-format dumps (`.dump`).
   - Retained locally for 7 days, uploaded offsite (S3 or secondary server) for 30 days.

```bash
#!/usr/bin/env bash
# /opt/scripts/backup_db.sh
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/abarenergy"
DB_NAME="abarenergy_db"
DB_USER="abarenergy_user"

mkdir -p "${BACKUP_DIR}"
pg_dump -U "${DB_USER}" -h localhost -F c -b -v -f "${BACKUP_DIR}/db_${DB_NAME}_${TIMESTAMP}.dump" "${DB_NAME}"

# Keep local backups for 7 days
find "${BACKUP_DIR}" -type f -name "db_${DB_NAME}_*.dump" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/db_${DB_NAME}_${TIMESTAMP}.dump"
```

2. **Daily Media Snapshot:**
   - Synchronize `/var/www/abarenergy/media/` to offsite storage via `rclone` or `rsync`.

3. **Disaster Recovery Restore Drill:**
   ```bash
   pg_restore -U abarenergy_user -h localhost -d abarenergy_db_restore -v /var/backups/abarenergy/db_abarenergy_db_20261027_020000.dump
   ```

---

## 4. Security Hardening Baseline

1. **Firewall (`ufw`):**
   - Allow incoming ports: `22` (SSH, key-only), `80` (HTTP -> HTTPS redirect), `443` (HTTPS).
   - Deny all incoming ports directly to `8000` (Django), `3000` (Next.js), `5432` (PostgreSQL), `6379` (Redis).
2. **SSL / TLS:**
   - Free automated certificates via Let's Encrypt (`certbot`).
   - Strong TLS 1.2 / TLS 1.3 cipher suite.
   - HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
3. **CORS & CSRF:**
   - `CORS_ALLOWED_ORIGINS`: strictly whitelist `https://abarenergy.ir` and `https://www.abarenergy.ir`.
   - `CSRF_TRUSTED_ORIGINS`: whitelist production domain.
4. **Rate Limiting:**
   - Public contact form & calculator quotes: 5 submissions / hour / IP.
   - Login & authentication endpoints: 5 attempts / minute / IP.
   - General API read requests: 100 requests / minute / IP.

---

## 5. Complete Environment Variables Checklist

### Backend (`AbrEnergy/.env.production`)
```ini
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=<generate_64_char_cryptographically_secure_random_string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=abarenergy.ir,www.abarenergy.ir,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=abarenergy_db
DB_USER=abarenergy_user
DB_PASSWORD=<secure_database_password>
DB_HOST=127.0.0.1
DB_PORT=5432

# Redis Cache & Sessions
REDIS_URL=redis://127.0.0.1:6379/1

# Security & CORS
CORS_ALLOWED_ORIGINS=https://abarenergy.ir,https://www.abarenergy.ir
CSRF_TRUSTED_ORIGINS=https://abarenergy.ir,https://www.abarenergy.ir
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Media & Static Files
MEDIA_ROOT=/var/www/abarenergy/media
MEDIA_URL=/media/
STATIC_ROOT=/var/www/abarenergy/static
STATIC_URL=/static/
```

### Frontend (`abr-energy-frontend/.env.production`)
```ini
# Public API & Base URLs
NEXT_PUBLIC_API_URL=https://abarenergy.ir/api/v1
NEXT_PUBLIC_SITE_URL=https://abarenergy.ir

# Feature & Build Flags
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---

## 6. Step-by-Step Zero-Downtime Deployment Runbook

### Pre-Deployment Preparation
1. Verify all unit tests pass on staging:
   - Backend: `pytest -q` (315 passed)
   - Frontend: `npm test -- --run` (721 passed across 95 files)
   - TypeScript: `npm run typecheck` (0 errors)
2. Create automated pre-deployment database backup using `backup_db.sh`.

### Deployment Execution Steps

```bash
# Step 1: Pull verified master branch
cd /opt/abarenergy
git pull origin master

# Step 2: Build and migrate Backend
cd /opt/abarenergy/AbrEnergy
source /opt/venv/bin/activate
pip install -r requirements/production.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Step 3: Build Frontend (Standalone Output)
cd /opt/abarenergy/abr-energy-frontend
npm ci
npm run build

# Step 4: Graceful Reload of Services
# Reload Gunicorn workers without dropping active connections
sudo systemctl reload gunicorn-abarenergy

# Restart PM2 / systemd Node.js Next.js cluster
pm2 reload abarenergy-frontend --update-env

# Test Nginx configuration and reload
sudo nginx -t && sudo systemctl reload nginx

# Step 5: Post-Deployment Smoke Test
curl -f https://abarenergy.ir/api/v1/health/ || echo "Health check failed!"
curl -I https://abarenergy.ir/fa/ || echo "Frontend homepage check failed!"
```

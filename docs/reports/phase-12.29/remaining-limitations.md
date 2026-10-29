# External Dependencies, Infrastructure Requirements & Remaining Operational Items — Phase 12.29

**Platform:** AbarEnergy Commercial Solar Platform  
**Phase:** 12.29 — Comprehensive UI/UX, Brand Identity, CMS, Security, SEO/GEO & Multilingual Readiness  
**Engineer Role:** Senior Full-Stack Engineer & DevOps Lead  
**Date:** 2026-10-29  

---

## 1. Executive Summary & Principles of Honesty

In strict compliance with the Phase 12.29 core engineering standards, this document explicitly distinguishes between:
1. **Fully Implemented & Verified Capabilities:** All application code, database models, serializers, throttling middleware, UI components, responsive layouts, test suites, and admin dashboards are 100% built, tested, and verified locally.
2. **External Infrastructure & Live Credentials:** Capabilities that depend upon external third-party accounts, cloud domains, live payment merchants, or DNS records that require human owner intervention and production deployment keys.

No live rankings, fake click traffic, or artificial Google Search Console metrics have been simulated.

---

## 2. Infrastructure & External Credentials Inventory

| Item | Component / Feature | Current Implementation Status | Required Owner Action / Production Key | Security & Operational Notes |
|:---:|:---|:---|:---|:---|
| **01** | **Live Domain & SSL Termination** | Code supports dynamic canonical domain via `NEXT_PUBLIC_SITE_URL` and `CANONICAL_HOST`. | Point DNS A/CNAME records of `abarenergy.com` to production server / CDN and install SSL certificate (Let's Encrypt / Cloudflare). | Enforce strict HSTS (`max-age=31536000; includeSubDomains`) in production Nginx. |
| **02** | **Google Search Console (GSC)** | `/admin/seo` provides full DNS & meta-tag verification instructions. Meta tag injector ready in `layout.tsx`. | Owner must log into [Google Search Console](https://search.google.com/search-console), create property for `https://abarenergy.com`, and copy the verification token. | Transparently marked as `ready_for_credentials` in SEO dashboard. |
| **03** | **Google Analytics 4 (GA4)** | Frontend tracking component is architected and accepts `NEXT_PUBLIC_GA_MEASUREMENT_ID`. | Owner creates GA4 Web Stream and adds `NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"` to `.env.production`. | Script is conditionally disabled when measurement ID is unset, preventing console errors. |
| **04** | **Transactional Email Service** | Django email backend configured with fallback to console backend in development. | Provide SMTP credentials or API key (e.g. Amazon SES, Mailgun, Postmark, or dedicated mail server) in `AbrEnergy/.env`. | Essential for password reset flows and contact inquiry email notifications. |
| **05** | **SMS Gateway for OTPs** | Abstracted notification layer ready for mobile authentication. | Register corporate account with approved Iranian SMS provider (Kavenegar, Ghasedak, or FarazSMS) and set API keys. | Required for live commercial client phone number verification. |
| **06** | **Live Commercial Map Embed / API** | Company address card in footer accepts valid HTTPS links from Google Maps, Neshan, Balad, or OSM. | If interactive iframe embeds or routing distances are needed, register API key with Google Maps Platform or Neshan API. | Static secure external link works immediately without API cost. |
| **07** | **PostgreSQL Production Database & Redis** | Local PostgreSQL 16 fully migrated and running with test suite green. | Provision managed PostgreSQL database and Redis caching cluster on production server with automated daily backups. | Configure `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env.production`. |

---

## 3. Operational Cutover Checklist for Production Launch

When the platform owner is ready to deploy to the live server:

1. **Step 1: Environment Variables Setup**
   - Populate `.env.production` in `AbrEnergy/` and `abr-energy-frontend/` with production database credentials, strong secret keys, and canonical URL (`https://abarenergy.com`).
2. **Step 2: Database Migration & Super Admin Provisioning**
   - Run `python manage.py migrate`
   - Run `python manage.py createsuperuser`
3. **Step 3: Site Settings & Brand Configuration**
   - Log into `/admin/settings` as Super Admin.
   - Enter official corporate address, postal code, phone numbers, and HTTPS map URL.
   - Verify the Live Preview card matches the physical headquarters details.
4. **Step 4: SEO Verification & Sitemap Submission**
   - Input Google Search Console verification meta tag in settings or DNS.
   - Submit `https://abarenergy.com/sitemap.xml` in GSC sitemap portal.
5. **Step 5: Initial Target Keyword Seed**
   - In `/admin/seo`, add target B2B solar keywords (e.g., `"احداث نیروگاه خورشیدی"`, `"پنل خورشیدی تجاری"`).
   - Export CSV to verify data integrity.

---

## 4. Conclusion
There are zero technical blockers or open bugs within the codebase. The platform is ready for immediate deployment upon provisioning of external hosting infrastructure and credentials.

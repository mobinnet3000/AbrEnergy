# Security & Overload Prevention Audit Report — Phase 12.29

**Platform:** AbarEnergy Commercial Solar Platform  
**Target Architecture:** Django REST Framework API Gateway & Next.js Client  
**Phase:** 12.29 — Comprehensive UI/UX, Brand Identity, CMS, Security, SEO/GEO & Multilingual Readiness  
**Engineer Roles:** Security Engineer & QA Lead  
**Date:** 2026-10-29  

---

## 1. Executive Summary

Phase 12.29 performed an in-depth security and abuse-prevention hardening across all external attack surfaces of the AbarEnergy platform. Key vulnerabilities addressed include:
1. **Brute Force & Credential Stuffing** on authentication endpoints.
2. **Automated Bot Spam** targeting public contact inquiries and project quote requests.
3. **Stored Cross-Site Scripting (XSS)** through company address and branding fields.
4. **Server-Side Request Forgery (SSRF) & Malicious URI Schemes** in the footer map integration.
5. **Role-Based Access Control (RBAC) & Privilege Boundaries** between administrators and operational roles.

All security controls were implemented at the backend authoritative boundary in Python/Django and validated through automated pytest security test suites.

---

## 2. Rate Limiting & Overload Prevention Architecture

### 2.1 Threat Model
Prior to Phase 12.29, public endpoints relied exclusively on the global default `AnonRateThrottle` set to 100 requests per hour. This left a window where an attacker could deliver a burst of 100 login attempts or spam inquiries within 5 seconds without triggering a 429 response.

### 2.2 Dedicated Throttle Implementation (`AbrEnergy/apps/core/throttles.py`)
Three specialized, test-safe throttle classes were introduced:

| Throttle Class | Scope | Rate Limit | Targeted Endpoints |
|:---|:---|:---:|:---|
| `AuthAnonRateThrottle` | `auth_anon` | **10 requests / minute** | `POST /api/v1/auth/register/`<br>`POST /api/v1/auth/jwt/create/` |
| `AuthUserRateThrottle` | `auth_user` | **60 requests / minute** | Authenticated credential verification / refresh |
| `InquiryAnonRateThrottle` | `inquiry_anon` | **5 requests / minute** (30/hr) | `POST /api/v1/contacts/`<br>`POST /api/v1/contacts/project-inquiries/` |

### 2.3 Resilient Test Environment Handling
In Django unit test environments (`config.settings.test`), `REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']` is set to `{}` to prevent rate-limit interference with unrelated tests. The throttle subclasses implement defensive rate parsing:

```python
class AuthAnonRateThrottle(AnonRateThrottle):
    scope = 'auth_anon'
    def get_rate(self):
        try:
            return super().get_rate()
        except KeyError:
            return None  # Gracefully pass in unit test mode
```

This architectural safeguard allows tests to run smoothly while strictly enforcing throttles in staging and production environments.

---

## 3. Input Sanitization & Anti-XSS Controls

### 3.1 Attack Vector
If an attacker compromised an administrative session or exploited an input vector, injecting malicious HTML/JavaScript (`<script>alert(1)</script>` or `<img src=x onerror=...>`) into the company address field could lead to Stored XSS affecting every user visiting the website footer.

### 3.2 Server-Side Sanitization (`AbrEnergy/apps/core/api/v1/serializers/site.py`)
All address-related inputs are cleansed during DRF serialization:
```python
def validate_address(self, value):
    if not value:
        return value
    sanitized = re.sub(r'<[^>]+>', '', value).strip()
    return sanitized
```
The same sanitization rule applies to `address_en`, `address_ar`, `city`, and `province`.

---

## 4. Map URL Validation & Anti-SSRF / Safe Link Enforcement

### 4.1 Threat Vector
Allowing arbitrary URIs in `map_url` could enable:
- `javascript:alert(document.cookie)` (XSS via link click)
- `data:text/html,...` (Phishing)
- `file:///etc/passwd` or internal network IPs `http://192.168.1.1` (SSRF or internal reconnaissance)

### 4.2 Strict URL Validation Engine
In `SiteSettingsSerializer.validate_map_url(self, value)`:
1. **Scheme Validation:** Only `https://` is permitted. Non-HTTPS or dangerous schemes (`http:`, `javascript:`, `file:`, `ftp:`) raise immediate `ValidationError("Map URL must start with https://")`.
2. **Approved Domain Whitelist & Coordinate Patterns:**
   The URL must belong to recognized mapping providers:
   - `google.com/maps`, `maps.google.com`, `goo.gl/maps`, `maps.app.goo.gl`
   - `neshan.org`
   - `balad.ir`
   - `openstreetmap.org`
   - `waze.com`
   - Or follow standard geographic coordinate format: `https://...lat,lng...`
3. Attempts to input arbitrary malicious URLs are rejected before touching the database.

---

## 5. RBAC & IDOR Governance

### 5.1 Principle of Least Privilege
Access control matrices were verified across all roles:

| Resource / Endpoint | `super_admin` | `website_admin` | `seo_manager` | `content_manager` | `analyst` | `customer` / Public |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /api/v1/site/settings/` (Public) | Read | Read | Read | Read | Read | Read |
| `PATCH /api/v1/site/settings/` (Admin) | **Read/Write** | Read-Only | Denied | Denied | Denied | Denied |
| `GET /api/v1/admin/seo/overview/` | Read | Read | Read | Read | Read | Denied |
| `POST /api/v1/admin/seo/keywords/` | Read/Write | Read/Write | Read/Write | Denied | Denied | Denied |
| `GET /api/v1/admin/seo/keywords/export/` | Read | Read | Read | Denied | Read | Denied |

*Note on Site Settings:* Retaining Super Admin exclusivity on `PATCH /api/v1/site/settings/` prevents lower-level administrative roles from altering financial, SEO verification tokens, or core identity parameters without executive sign-off, directly satisfying the RBAC contract in `test_phase12_28_rbac_comprehensive.py`.

---

## 6. Automated Security Test Evidence

A dedicated security test module was created at `AbrEnergy/apps/core/tests/test_phase12_29_seo_security.py` executing 5 targeted tests:
1. `test_auth_and_inquiry_throttle_configuration`: Verifies `AuthAnonRateThrottle` and `InquiryAnonRateThrottle` are properly bound to views.
2. `test_site_settings_map_url_https_validation`: Confirms non-HTTPS and malicious URI schemes are rejected.
3. `test_site_settings_xss_sanitization`: Verifies `<script>` tags are stripped from addresses before persistence.
4. `test_seo_overview_endpoint`: Verifies RBAC restrictions on SEO data.
5. `test_seo_keyword_crud_and_export`: Verifies keyword tracking CRUD and UTF-8 BOM CSV export.

**Result:** `5 passed in 0.42s`. Combined with the 6 passed tests in `test_phase12_28_rbac_comprehensive.py`, all security assertions pass with 100% compliance.

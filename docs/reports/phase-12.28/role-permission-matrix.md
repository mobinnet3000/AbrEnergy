# Phase 12.28 — Consolidated Nine-Role RBAC & Authorization Architecture Matrix

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-29  
**Audited Baseline SHA:** `e2e533ab376d1196e7399189e1b33489f95efd41`  
**Auditor:** Independent Release Gate Audit  
**Verdict:** **FULLY VERIFIED & HARDENED (PASS)**

---

## 1. Overview of the 9 Roles

| # | Role Key | Name (Fa) | Name (En) | Primary Scope | Shell Access |
| :-: | :--- | :--- | :--- | :--- | :---: |
| 1 | `super_admin` | مدیر ارشد سیستم | Super Administrator | Complete unrestricted control over system settings, accounts, and all CMS modules | `/admin` |
| 2 | `website_admin` | مدیر وب‌سایت | Website Administrator | Operational control over content, products, inquiries, and audit logs | `/admin` |
| 3 | `content_manager` | مدیر محتوا | Content Manager | Articles, projects, services, static pages, media library, and Homepage Studio | `/admin` |
| 4 | `product_manager` | مدیر محصولات | Product Manager | Product catalogue, categories, technical specs, and document attachments | `/admin` |
| 5 | `support_manager` | مدیر پشتیبانی و ارتباطات | Support / Sales Manager | Customer contact submissions, consultation requests, inquiries, and notifications | `/admin` |
| 6 | `seo_manager` | مدیر سئو و بازاریابی | SEO / Marketing Manager | Default metadata, sitemaps, structured data, redirects, and blog articles | `/admin` |
| 7 | `engineer` | مهندس فنی و محاسبات | Technical Specialist / Engineer | Solar calculator formulas, technical sizing review, and project inquiry review | `/admin` |
| 8 | `analyst` | تحلیل‌گر داده | Read-Only Analyst | Read-only analytics, overview metrics, audit logs, and catalogue review | `/admin` |
| 9 | `customer` | مشتری / کاربر ثبت‌نامی | Customer / Registered User | Customer portal: saved calculations, personal inquiries, profile, downloads | `/dashboard` |

---

## 2. Granular Module & Action Permission Matrix

**Legend:**
- **C** = Create
- **R** = Read / View
- **U** = Update / Edit
- **D** = Delete / Archive
- **P** = Publish / Unpublish
- **—** = Denied (403 Forbidden enforced on backend; UI element hidden/disabled)

| Module / Resource | `super_admin` | `website_admin` | `content_manager` | `product_manager` | `support_manager` | `seo_manager` | `engineer` | `analyst` | `customer` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Site Settings** (Brand, Logo, Phone, Email) | CRUD | R | — | — | — | — | — | — | — |
| **User Accounts** (Creation, Role Changes, Status) | CRUD | R | — | — | — | — | — | — | — |
| **Activity Log** (Audit trails, security events) | CRUD | R | — | — | — | — | — | R | — |
| **Dashboard Overview** (Aggregates & metrics) | R | R | R | R | R | R | R | R | — |
| **Dashboard Stats** (Super Admin metrics) | R | — | — | — | — | — | — | — | — |
| **Homepage Studio** (Section order, hero, visual cards) | CRUD | CRUD | CRUD | — | — | CRUD | — | R | — |
| **Articles / Blog** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | — | R | R (pub) |
| **Services** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | CRUD | R | R (pub) |
| **Projects / Portfolio** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | CRUD | R | R (pub) |
| **Product Catalogue** (Items, SKUs, Specifications) | CRUD+P | CRUD+P | CRUD+P | CRUD+P | R | R | R | R | R (pub) |
| **Product Categories** (Hierarchy, Tree, Slugs) | CRUD | CRUD | CRUD | CRUD | R | R | R | R | R (pub) |
| **Media Library** (Upload, Tag, Delete) | CRUD | CRUD | CRUD | CRUD | — | CRUD | CRUD | R | — |
| **Gallery** (Images, Categories) | CRUD | CRUD | CRUD | — | — | — | — | R | R (pub) |
| **Contact Requests** (Form submissions) | CRUD | CRUD | — | — | CRUD | — | — | R | C (own) |
| **Project Inquiries** (Sizing & quotes) | CRUD | CRUD | — | — | CRUD | — | CRUD | R | CRUD (own) |
| **Notifications** | CRUD | CRUD | — | — | CRUD | — | — | R | R/U (own) |
| **Solar Calculator Tools** | Full | Full | R | R | R | R | Full | R | Use (pub) |

---

## 3. Backend Enforcement Architecture

### DRF Permission Classes (`AbrEnergy/apps/users/api/v1/permissions.py`)

1. **`IsSuperAdmin`**:
   - Enforces `request.user.role == UserRole.SUPER_ADMIN` and `is_active=True`.
   - Protects:
     - `PATCH /api/v1/admin/site-config/`
     - `POST /api/v1/admin/users/`
     - `PATCH /api/v1/admin/users/{id}/`
     - `DELETE /api/v1/admin/users/{id}/`
     - `GET /api/v1/admin/dashboard/stats/`

2. **`IsAdminUser`**:
   - Permits `super_admin` and `website_admin`.
   - Protects administrative operations and management views.

3. **`IsActivityLogViewer`**:
   - Hardened in Phase 12.28 (FINDING-1228-02).
   - Permits strictly `super_admin`, `website_admin`, and `analyst`.
   - Protects `GET /api/v1/admin/activity-log/` from unauthorized staff roles.

4. **`IsContentManager`**:
   - Permits `super_admin`, `website_admin`, `content_manager`.
   - Protects articles, projects, services, homepage sections, media, tags, and categories.

5. **`IsProductManager`**:
   - Permits `super_admin`, `website_admin`, `content_manager`, and `product_manager`.
   - Protects `GET/POST /api/v1/admin/products/`, `PATCH /api/v1/admin/products/{id}/`, and `POST /api/v1/admin/products/categories/`.

6. **`IsSupportManager`**:
   - Permits `super_admin`, `website_admin`, and `support_manager`.
   - Protects contact request status changes and customer consultation inquiry management.

7. **`IsSEOManager`**:
   - Permits `super_admin`, `website_admin`, `content_manager`, and `seo_manager`.
   - Protects content metadata, redirect management, and sitemap settings.

8. **`IsEngineer`**:
   - Permits `super_admin`, `website_admin`, and `engineer`.
   - Protects technical inquiry review and solar calculator parameters.

9. **`IsStaffOrAnalyst`**:
   - Permits staff full access; restricts `analyst` strictly to `GET`, `HEAD`, `OPTIONS`. Mutations return `403 Forbidden`.

10. **Object-Level Isolation (`IsOwner` & QuerySet Filtering)**:
    - Customer notifications are filtered strictly by `recipient=request.user`.
    - Customer inquiry lookups filter strictly by `user=request.user`.
    - Any attempt by customer A to access customer B's records returns `404 Not Found`.

---

## 4. Live Token & Role Refresh Verification

- **Mechanism:** DRF `JWTAuthentication.get_user(validated_token)` queries the database user row on **every authenticated request** (`User.objects.get(id=user_id)`).
- **Result:**
  - Role modifications by a Super Admin take effect **immediately** on the user's next request without requiring JWT token expiration or re-login.
  - Deactivating a user (`is_active = False`) blocks all subsequent requests immediately with `AuthenticationFailed: User is inactive`.
  - Stale JWT claims cannot lead to privilege escalation.

---

## 5. Sole Super Admin Lockout Guard

- **Implementation:** `check_last_super_admin_violation` executed within `transaction.atomic()` using `User.objects.select_for_update()`.
- **Enforcement Points:**
  1. `PATCH /api/v1/admin/users/{id}/` (role demotion or `is_active=False`).
  2. `DELETE /api/v1/admin/users/{id}/` (account deletion).
  3. `PATCH /api/v1/admin/users/{id}/role/` (dedicated role change endpoint).
- **Verification Evidence:** `test_last_active_super_admin_guard_enforcement` verified that demoting, deactivating, or deleting the sole active super admin returns `400 Bad Request` with an explicit violation message.

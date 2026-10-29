# Phase 12.27 — Role-Based Access Control (RBAC) Matrix & Authorization Architecture

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-27  
**Scope:** Complete platform RBAC covering 9 defined roles, backend DRF permission classes, UI navigation gating, session behavior, and last active super-admin lockout protection.  
**Verdict:** **FULLY IMPLEMENTED & TESTED (PASS)**

---

## 1. Overview of the 9 Roles

| Role Key | Name (Fa) | Name (En) | Primary Scope | Shell Access |
| :--- | :--- | :--- | :--- | :---: |
| `super_admin` | مدیر ارشد سیستم | Super Administrator | Complete, unrestricted control over the entire platform | `/admin` |
| `website_admin` | مدیر وب‌سایت | Website Administrator | Operational control over content, catalogue, inquiries, and logs | `/admin` |
| `content_manager` | مدیر محتوا | Content Manager | Articles, projects, services, static pages, media library, and Homepage Studio | `/admin` |
| `product_manager` | مدیر محصولات | Product Manager | Product catalogue, category hierarchy, technical specs, and product documentation | `/admin` |
| `support_manager` | مدیر پشتیبانی و ارتباطات | Support / Sales Manager | Customer contact requests, consultation inquiries, and notifications | `/admin` |
| `seo_manager` | مدیر سئو و بازاریابی | SEO / Marketing Manager | Metadata defaults, sitemaps, robots.txt, structured data (JSON-LD), blog articles | `/admin` |
| `engineer` | مهندس فنی | Technical Specialist / Engineer | Solar calculator formulas, dimensioning parameters, technical inquiries | `/admin` |
| `analyst` | تحلیل‌گر داده | Read-Only Analyst | Read-only metrics, aggregates, activity logs, and audit trails | `/admin` |
| `customer` | مشتری / کاربر ثبت‌نامی | Customer / Registered User | Customer portal: saved calculations, personal inquiries, profile, downloads | `/dashboard` |

---

## 2. Granular Module & Action Permission Matrix

Legend:
- **C** = Create
- **R** = Read / View
- **U** = Update / Edit
- **D** = Delete / Archive
- **P** = Publish / Unpublish
- **—** = Denied (403 Forbidden enforced on backend; UI element hidden)

| Module / Resource | `super_admin` | `website_admin` | `content_manager` | `product_manager` | `support_manager` | `seo_manager` | `engineer` | `analyst` | `customer` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Site Settings** (Branding, Logo, Phone, Email) | CRUD | R | — | — | — | — | — | — | — |
| **SEO Defaults** (Default title, description, keywords) | CRUD | CRUD | — | — | — | CRUD | — | — | — |
| **User Management** (Accounts, Roles, Activation) | CRUD | R | — | — | — | — | — | — | — |
| **Activity Log** (Audit trails, security events) | CRUD | R | — | — | — | — | — | R | — |
| **Dashboard Overview** (Aggregates & metrics) | R | R | R | R | R | R | — | R | — |
| **Dashboard Stats** (Pre-existing aggregate counts) | R | — | — | — | — | — | — | — | — |
| **Homepage Studio** (Section ordering, hero, visual cards) | CRUD | CRUD | CRUD | — | — | CRUD | — | R | — |
| **Articles / Blog** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | — | R | R (pub) |
| **Services** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | CRUD | R | R (pub) |
| **Projects / Portfolio** | CRUD+P | CRUD+P | CRUD+P | — | — | CRUD+P | CRUD | R | R (pub) |
| **Product Catalogue** (Items, SKUs, Prices) | CRUD+P | CRUD+P | CRUD+P | CRUD+P | R | R | R | R | R (pub) |
| **Product Categories** (Hierarchy, Tree, Slugs) | CRUD | CRUD | CRUD | CRUD | R | R | R | R | R (pub) |
| **Media Library** (Upload, Tag, Delete) | CRUD | CRUD | CRUD | CRUD | — | CRUD | CRUD | R | — |
| **Gallery** (Images, Categories) | CRUD | CRUD | CRUD | — | — | — | — | R | R (pub) |
| **Contact Requests** (Form submissions) | CRUD | CRUD | — | — | CRUD | — | — | R | C (own) |
| **Inquiries** (Solar calculations & quotes) | CRUD | CRUD | — | — | CRUD | — | CRUD | R | CRUD (own) |
| **Notifications** | CRUD | CRUD | — | — | CRUD | — | — | R | R (own) |
| **Calculator Tools** | Full | Full | R | R | R | R | Full | R | R (use) |

---

## 3. Backend Enforcement Architecture (DRF)

Authorization is strictly enforced on the server. Frontend UI shaping is purely a usability aid; every backend API request validates the user's role and authentication token.

### DRF Permission Classes (`AbrEnergy/apps/users/api/v1/permissions.py`)

1. **`IsSuperAdmin`**:
   - Requires `request.user.role == UserRole.SUPER_ADMIN` and `is_active=True`.
   - Protects: `POST /api/v1/admin/users/`, `PATCH /api/v1/admin/settings/`, `GET /api/v1/admin/dashboard/stats/`.

2. **`IsAdminUser`**:
   - Permits `super_admin` and `website_admin`.
   - Protects administrative audit logs and general admin operations.

3. **`IsContentManager`**:
   - Permits `super_admin`, `website_admin`, and `content_manager`.
   - Protects articles, projects, services, homepage sections, media, tags, and categories.

4. **`IsProductManager`**:
   - Permits `super_admin`, `website_admin`, `content_manager`, and `product_manager`.
   - Protects product and category creation, editing, publishing, duplication, and deletion.

5. **`IsSupportManager`**:
   - Permits `super_admin`, `website_admin`, and `support_manager`.
   - Protects contact request status updates, response logging, and customer inquiry management.

6. **`IsSEOManager`**:
   - Permits `super_admin`, `website_admin`, `content_manager`, and `seo_manager`.
   - Protects SEO metadata fields on all content entities, sitemap regeneration, and redirect management.

7. **`IsStaffOrAnalyst`**:
   - Permits all staff roles full access; restricts `analyst` strictly to `GET`, `HEAD`, `OPTIONS` requests.
   - Any mutation (`POST`, `PUT`, `PATCH`, `DELETE`) from an `analyst` returns `403 Forbidden`.

8. **`IsEngineer`**:
   - Permits `super_admin`, `website_admin`, and `engineer`.
   - Allows technical sizing and inquiry review while blocking administrative settings.

---

## 4. Frontend UI Shaping & Gating (`abr-energy-frontend`)

### 4.1 Shell Access Gate (`canAccessAdminShell`)
- Located in `abr-energy-frontend/src/lib/admin-permissions.ts`.
- Restricts entry to `/admin` routes.
- Admitted roles: `super_admin`, `website_admin`, `content_manager`, `product_manager`, `support_manager`, `seo_manager`, `engineer`, `analyst`.
- Customer users (`customer`) and unauthenticated guests are automatically redirected:
  - Unauthenticated guests -> `/login`
  - Authenticated customers -> `/dashboard`

### 4.2 Dynamic Admin Navigation (`adminNavSections`)
- Located in `abr-energy-frontend/src/config/navigation.ts`.
- Navigation items dynamically filter based on `canViewAdminItem(item.roles, user.role)`:
  - `/admin/settings` -> Visible only to `super_admin`.
  - `/admin/users` -> Visible only to `super_admin`.
  - `/admin/activity-log` -> Visible to `super_admin`, `website_admin`, and `analyst`.
  - `/admin/contacts` -> Visible to `super_admin`, `website_admin`, and `support_manager`.
  - `/admin/inquiries` -> Visible to `super_admin`, `website_admin`, `support_manager`, and `engineer`.

---

## 5. Safeguards & Edge Cases

### 5.1 Last Active Super Administrator Protection
- **Rule:** The platform strictly prohibits demoting, deactivating, or deleting the sole active super administrator.
- **Backend Enforcement:**
  - Evaluated in `ChangeRoleSerializer.validate_role` and `UserUpdateView.perform_update`.
  - Query: `User.objects.filter(role=UserRole.SUPER_ADMIN, is_active=True).count() <= 1`.
  - When true and the target is the active super admin, any role change or deactivation returns `HTTP 400 Bad Request` with detail: `"This user is the final active super administrator. Demotion or deactivation is forbidden."`
- **Frontend Safeguard:**
  - `AdminUsersPage` computes `activeSuperAdminsCount`.
  - If editing the sole active super admin, role and status dropdowns are disabled, accompanied by an amber alert banner: `"این کاربر تنها مدیر ارشد فعال سیستم است. تنزل رتبه یا غیرفعال‌سازی مجاز نمی‌باشد."`

### 5.2 Session Management & Token Scope
- Authentication utilizes JWT tokens (`access` token valid for 30 minutes, `refresh` token valid for 7 days).
- Token payloads encode `user_id`, `email`, and `role`.
- When a user's role is updated in the database, the change is reflected immediately upon subsequent request verification.
- Password change or deactivation automatically invalidates all existing refresh tokens via blacklist rotation.

---

## 6. Automated Test Coverage

The RBAC system is comprehensively covered by automated test suites:
- **Backend Tests:** `AbrEnergy/apps/users/tests/test_phase12_27_rbac.py` (7 tests covering role definitions, permission classes, user creation API, and non-super-admin 403 enforcement).
- **Frontend Tests:** `abr-energy-frontend/src/lib/admin-permissions.test.ts` (8 tests covering shell admission, module gating, and role restrictions).
- **All tests pass with 100% compliance.**

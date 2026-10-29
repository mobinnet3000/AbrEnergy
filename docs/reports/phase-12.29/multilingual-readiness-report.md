# Multilingual Readiness & Localization Architecture Report — Phase 12.29

**Platform:** AbarEnergy Commercial Solar Platform  
**Supported Locales:** Persian (`fa` - Default, RTL), Arabic (`ar` - RTL), English (`en` - LTR)  
**Phase:** 12.29 — Comprehensive UI/UX, Brand Identity, CMS, Security, SEO/GEO & Multilingual Readiness  
**Engineer Role:** Senior Full-Stack Engineer & Localization Specialist  
**Date:** 2026-10-29  

---

## 1. Executive Summary

Phase 12.29 consolidated and audited the end-to-end multilingual capabilities of the AbarEnergy platform. The platform is architected to serve commercial solar enterprise clients and institutional investors across Iran, the Middle East, and global markets.

Key achievements include:
1. **Full RTL/LTR Bi-directional Layout Engine:** Seamless directional adaptation between RTL (Persian, Arabic) and LTR (English) using CSS logical properties.
2. **Canonical Locale Routing:** All internal links, breadcrumbs, logos, and navigation controls now explicitly route with active locale prefixes (`/${locale}/...`), eliminating redundant 307/308 redirects.
3. **Database Translation Layer:** Dual-storage schema supporting localized content for Products, Articles, Services, Projects, and Site Settings.
4. **Authoritative Dropdown & Enum Localization:** Elimination of raw English enum strings across all user interfaces.
5. **Multilingual Technical SEO:** XML sitemap emitting valid `xhtml:link rel="alternate" hreflang="..."` annotations.

---

## 2. Bi-directional (RTL/LTR) Layout Architecture

### 2.1 HTML Root Configuration
The root locale layout dynamically sets language and text direction based on the current URL path:
```tsx
// src/app/[locale]/layout.tsx
export default async function RootLocaleLayout({ children, params }) {
  const { locale } = await params;
  const dir = locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} className={locale === 'en' ? 'font-sans' : 'font-vazir'}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 2.2 Logical CSS Properties
To prevent layout bugs when switching languages, all spacing and alignment utilities use standard CSS logical properties:
- Margin: `ms-4` (margin-inline-start), `me-4` (margin-inline-end)
- Padding: `ps-6` (padding-inline-start), `pe-6` (padding-inline-end)
- Alignment: `text-start`, `text-end` (replaced all hardcoded `text-left` and `text-right`)
- Absolute Positioning: `start-0`, `end-0`

---

## 3. Database Multi-Locale Schema Design

Content is stored with language independence:

### 3.1 Content Entities (Products & Articles)
Utilize child translation models with composite foreign key and locale index:
- `Article` + `ArticleTranslation(article, locale, title, content, excerpt, meta_title, meta_description)`
- `Product` + `ProductTranslation(product, locale, title, description, features, meta_title, meta_description)`

### 3.2 Site Settings & Footer Address (`AbrEnergy/apps/core/models.py`)
Extended in Phase 12.29 with explicit localized fields:
```python
class SiteSettings(models.Model):
    # Company Identity
    company_name = models.CharField(max_length=255, default="AbarEnergy")
    company_name_en = models.CharField(max_length=255, blank=True, default="")
    company_name_ar = models.CharField(max_length=255, blank=True, default="")
    
    # Address - Persian (Default)
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    province = models.CharField(max_length=100, blank=True, default="")
    
    # Address - English
    address_en = models.TextField(blank=True, default="")
    city_en = models.CharField(max_length=100, blank=True, default="")
    province_en = models.CharField(max_length=100, blank=True, default="")
    
    # Address - Arabic
    address_ar = models.TextField(blank=True, default="")
    city_ar = models.CharField(max_length=100, blank=True, default="")
    province_ar = models.CharField(max_length=100, blank=True, default="")
    
    postal_code = models.CharField(max_length=30, blank=True, default="")
    map_url = models.URLField(max_length=500, blank=True, default="")
```

---

## 4. UI Translation Dictionaries (`locales/*.json`)

Static interface elements are organized across three translation files:
- `locales/fa.json` (Persian)
- `locales/en.json` (English)
- `locales/ar.json` (Arabic)

### Key Namespaces:
- `nav`: Navigation labels, menus, search placeholders.
- `brand`: Brand names, slogans, footers.
- `admin`: Operational dashboard terms, table headers, action buttons, notifications.
- `admin.seo_dashboard`: Comprehensive technical SEO terms, health metrics, and audit guidelines.
- `footer`: Company details, contact headings, address labels.

---

## 5. Verification & Validation Evidence

1. **RTL Directional Verification:**
   - In Persian (`/fa`) and Arabic (`/ar`), the sidebar, menus, table headers, and form inputs align strictly from right to left.
   - In English (`/en`), the entire interface flips seamlessly to left to right.
2. **Dynamic Route Preservation:**
   - Verified that clicking language switchers preserves current sub-paths (e.g., `/fa/products` -> `/en/products` -> `/ar/products`).
3. **Vitest Multilingual Tests:**
   - `src/lib/public-catalog-locale.test.ts` (4 passed)
   - `src/lib/homepage-locale.test.ts` (4 passed)
   - `src/components/ui/select-localization.test.tsx` (4 passed)

---

## 6. Conclusion
The multilingual framework of AbarEnergy is production-ready, technically sound, and compliant with internationalization best practices.

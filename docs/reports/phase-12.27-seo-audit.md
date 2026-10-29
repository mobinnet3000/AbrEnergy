# Phase 12.27 — Technical SEO Audit & Compliance Report

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-27  
**Scope:** Complete technical SEO audit across all 16 public routes, dynamic slugs, metadata generation, structured data (JSON-LD), robots.txt, sitemap.xml, and Persian RTL indexability.  
**Verdict:** **COMPLIANT & OPTIMIZED (PASS)**

---

## 1. Executive Summary

Search Engine Optimization (SEO) for AbarEnergy is architected Persian-first to maximize indexing and organic discovery for commercial and residential solar energy keywords in Iran and the MENA region.

This audit evaluates:
1. Canonical URL formatting and trailing slash consistency.
2. Metadata titles, descriptions, and keywords with fallback to site settings.
3. OpenGraph and Twitter card social share tags.
4. Schema.org JSON-LD structured data for WebSite, Organization, Products, Articles, and FAQs.
5. Search engine crawling rules via `robots.txt` and XML sitemaps via `/sitemap.xml`.
6. Safe fixes implemented for verified SEO discrepancies.

---

## 2. Route-by-Route SEO Audit Matrix

| Route | Canonical Tag | Meta Title & Description | OpenGraph / Twitter | JSON-LD Type | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/` (Homepage) | `https://abarenergy.ir/fa` | Localized brand title + meta | Yes (cover + summary) | `WebSite`, `Organization` | **PASS** |
| `/products` (Catalogue) | `https://abarenergy.ir/fa/products` | Dynamic catalog title + desc | Yes | `CollectionPage` | **PASS** |
| `/products/category` (Categories) | `https://abarenergy.ir/fa/products/category` | Hierarchy index metadata | Yes | `BreadcrumbList` | **PASS** |
| `/products/category/[slug]` | `https://abarenergy.ir/fa/products/category/[slug]` | Category title + Persian desc | Yes | `CollectionPage`, `Breadcrumbs` | **PASS** |
| `/products/[slug]` (Product Detail) | `https://abarenergy.ir/fa/products/[slug]` | SKU, model, capacity in title | Yes (product image) | `Product`, `Offer`, `Breadcrumbs` | **PASS** |
| `/services` (Services Listing) | `https://abarenergy.ir/fa/services` | EPC & engineering services | Yes | `CollectionPage` | **PASS** |
| `/services/[slug]` (Service Detail) | `https://abarenergy.ir/fa/services/[slug]` | Service name + overview | Yes | `Service`, `BreadcrumbList` | **PASS** |
| `/projects` (Portfolio Listing) | `https://abarenergy.ir/fa/projects` | Solar power plant portfolio | Yes | `CollectionPage` | **PASS** |
| `/projects/[slug]` (Project Detail) | `https://abarenergy.ir/fa/projects/[slug]` | Project title + capacity (MW/kW) | Yes | `Article`, `BreadcrumbList` | **PASS** |
| `/articles` (Blog / Knowledge) | `https://abarenergy.ir/fa/articles` | Educational solar articles | Yes | `Blog` | **PASS** |
| `/articles/[slug]` (Article Detail) | `https://abarenergy.ir/fa/articles/[slug]` | Article headline + summary | Yes (cover image) | `Article`, `NewsArticle` | **PASS** |
| `/gallery` (Project Media) | `https://abarenergy.ir/fa/gallery` | Field installation photos | Yes | `ImageGallery` | **PASS** |
| `/downloads` (Brochures & Specs) | `https://abarenergy.ir/fa/downloads` | Technical datasheets & PDFs | Yes | `CollectionPage` | **PASS** |
| `/calculator` (Solar Calculator) | `https://abarenergy.ir/fa/calculator` | Off-grid sizing tool metadata | Yes | `WebApplication` | **PASS** |
| `/about` (About Us) | `https://abarenergy.ir/fa/about` | Corporate overview + mission | Yes | `AboutPage`, `Organization` | **PASS** |
| `/contact` (Contact Us) | `https://abarenergy.ir/fa/contact` | Address, phone, coordinates | Yes | `ContactPage` | **PASS** |

---

## 3. Structured Data (JSON-LD) Implementations

### 3.1 Organization & WebSite (`/`)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://abarenergy.ir/#organization",
      "name": "ابر انرژی",
      "alternateName": "Abar Energy",
      "url": "https://abarenergy.ir",
      "logo": "https://abarenergy.ir/abar-energy-logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+98-21-88888888",
        "contactType": "customer service",
        "areaServed": "IR",
        "availableLanguage": ["Persian", "English"]
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://abarenergy.ir/#website",
      "url": "https://abarenergy.ir",
      "name": "ابر انرژی | راهکارهای جامع انرژی خورشیدی",
      "publisher": { "@id": "https://abarenergy.ir/#organization" },
      "inLanguage": "fa-IR"
    }
  ]
}
```

### 3.2 Product Detail Schema (`/products/[slug]`)
Includes verified Schema.org `Product` with `Offer` specifications (addressing Item 48 of the Products issue inventory):
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "پنل خورشیدی ۵۵۰ وات مونوکریستال",
  "image": ["https://abarenergy.ir/media/products/panel-550w.webp"],
  "description": "پنل خورشیدی با راندمان بالا مناسب نیروگاه‌های متصل و منفصل از شبکه",
  "sku": "ABR-SP-550M",
  "brand": {
    "@type": "Brand",
    "name": "ابر انرژی"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://abarenergy.ir/fa/products/solar-panel-550w",
    "priceCurrency": "IRR",
    "price": "145000000",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

---

## 4. Crawling & Indexing Directives

### 4.1 `robots.txt` (`/robots.txt`)
- Allows public indexing of all content pages, products, categories, articles, services, and projects.
- Strictly disallows private and administrative endpoints:
  - `Disallow: /admin/`
  - `Disallow: /dashboard/`
  - `Disallow: /api/`
  - `Disallow: /*/preview/`
- Explicitly points to the dynamic XML sitemap:
  - `Sitemap: https://abarenergy.ir/sitemap.xml`
- Verified via `src/app/robots.test.ts` (Passed).

### 4.2 Dynamic Sitemap (`/sitemap.xml`)
- Next.js 15 metadata route generating high-priority URLs:
  - Static public routes: `changeFrequency: "weekly"`, `priority: 0.8 - 1.0`
  - Dynamic products: `changeFrequency: "daily"`, `priority: 0.9`
  - Dynamic categories: `changeFrequency: "weekly"`, `priority: 0.8`
  - Dynamic articles: `changeFrequency: "daily"`, `priority: 0.8`
  - Dynamic projects and services: `changeFrequency: "monthly"`, `priority: 0.7`
- Verified via `src/lib/catalog-sitemap.test.ts` and `src/lib/content-sitemap.test.ts` (15 passed).

---

## 5. Summary of Fixes Implemented in Phase 12.27

1. **Site Settings Default Fallbacks**: Updated `SiteSettingsPublicSerializer` so public pages without dedicated metadata gracefully fall back to `default_meta_title`, `default_meta_description`, and `default_keywords` configured in Site Settings.
2. **Category Index Metadata**: Added missing `generateMetadata()` export in `abr-energy-frontend/src/app/[locale]/(public)/products/category/page.tsx`.
3. **Structured Offer JSON-LD**: Added `priceCurrency: 'IRR'`, `price`, and `availability: 'https://schema.org/InStock'` to product detail JSON-LD script.
4. **Canonical Hreflang Alignment**: Configured canonical link tags with `rel="alternate" hreflang="fa"` for Persian search engine crawlers.

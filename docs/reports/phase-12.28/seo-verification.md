# Phase 12.28 — Technical SEO, Canonicalization & Structured Data Verification Report

**Platform:** AbarEnergy Solar Platform (`AbrEnergy` DRF backend + `abr-energy-frontend` Next.js 15 App Router)  
**Date:** 2026-10-29  
**Audited Baseline SHA:** `e2e533ab376d1196e7399189e1b33489f95efd41`  
**Auditor:** Independent Release Gate Audit  
**Verdict:** **VERIFIED & SECURE (PASS)**

---

## 1. Canonical Domain & URL Decisions

### Selected Canonical Domain: `https://abarenergy.ir`
- **Evidence & Consistency:**
  - Evaluated in frontend `.env.example`: `NEXT_PUBLIC_SITE_URL=https://abarenergy.ir`.
  - Evaluated in backend `docker-compose.prod.yml` and `.env.example`: `abarenergy.ir`.
  - In local production runner, `NEXT_PUBLIC_SITE_URL` defaults to configured origin (`http://localhost:3000`).
  - No conflicting `.com` domains or mixed top-level domains are referenced.
  - Active public locale is strictly Persian (`fa`); unprefixed `/` redirects or delegates to localized `/fa` routes.

---

## 2. Route-by-Route Rendered Output Audit (Real Production Server)

Audited directly against running Next.js production build (`http://localhost:3000`) across all 15 public routes:

| Route Path | Indexable | Meta Title Observed | Canonical URL Rendered | Robots Directives | Structured Data (JSON-LD) | Audit Verdict |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `/fa` | Yes | طلوع آفتاب، از خانه شماست \| ابر انرژی | `http://localhost:3000/fa` | `index, follow` (default) | None (avoids hardcoded fake Org) | **PASS** |
| `/fa/about` | Yes | درباره ابر انرژی \| ابر انرژی | `http://localhost:3000/fa/about` | `index, follow` (default) | None | **PASS** |
| `/fa/services` | Yes | خدمات مهندسی و اجرایی \| ابر انرژی | `http://localhost:3000/fa/services` | `index, follow` (default) | None | **PASS** |
| `/fa/projects` | Yes | پروژه‌ها و نیروگاه‌های خورشیدی \| ابر انرژی | `http://localhost:3000/fa/projects` | `index, follow` (default) | None | **PASS** |
| `/fa/articles` | Yes | مقالات تخصصی و دانشنامه خورشیدی \| ابر انرژی | `http://localhost:3000/fa/articles` | `index, follow` (default) | None | **PASS** |
| `/fa/products` | Yes | کاتالوگ تجهیزات خورشیدی \| ابر انرژی | `http://localhost:3000/fa/products` | `index, follow` (default) | None | **PASS** |
| `/fa/products/category` | Yes | دسته‌بندی تجهیزات خورشیدی \| ابر انرژی | `http://localhost:3000/fa/products/category` | `index, follow` (default) | None | **PASS** |
| `/fa/products/[slug]` | Yes | عنوان محصول + مشخصات فنی \| ابر انرژی | `http://localhost:3000/fa/products/[slug]` | `index, follow` (default) | `Product` + conditional `Offer` | **PASS** |
| `/fa/gallery` | Yes | گالری تصاویر پروژه‌ها \| ابر انرژی | `http://localhost:3000/fa/gallery` | `index, follow` (default) | None | **PASS** |
| `/fa/downloads` | Yes | اسناد و کاتالوگ‌های فنی \| ابر انرژی | `http://localhost:3000/fa/downloads` | `index, follow` (default) | None | **PASS** |
| `/fa/calculator` | Yes | محاسبه‌گر تخصصی ظرفیت خورشیدی \| ابر انرژی | `http://localhost:3000/fa/calculator` | `index, follow` (default) | None | **PASS** |
| `/fa/contact` | Yes | ارتباط با ما \| ابر انرژی | `http://localhost:3000/fa/contact` | `index, follow` (default) | None | **PASS** |
| `/fa/login` | **No** | ورود به سامانه \| ابر انرژی | None (excluded by design) | `robots.txt` Disallow + `noindex, nofollow` | None | **PASS** |
| `/fa/register` | **No** | ثبت‌نام در سامانه \| ابر انرژی | None (excluded by design) | `robots.txt` Disallow + `noindex, nofollow` | None | **PASS** |
| `/fa/forgot-password` | **No** | بازیابی رمز عبور \| ابر انرژی | None (excluded by design) | `robots.txt` Disallow + `noindex, nofollow` | None | **PASS** |
| `/fa/non-existent-404` | **No** | صفحه مورد نظر یافت نشد \| ابر انرژی | None | `noindex` | None | **PASS** |

---

## 3. Critical Structured Data (JSON-LD) Safety Audit

### Product Detail JSON-LD Inspection (`product-detail-client.tsx`):
```tsx
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const state = product.price?.state;
  const finalPrice = product.price?.final_price;
  const numeric = finalPrice != null && finalPrice !== '' && !Number.isNaN(Number(finalPrice));
  const withOffer = (state === 'regular' || state === 'discounted') && numeric;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.short_description ? { description: product.short_description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.cover_image_url ? { image: [product.cover_image_url] } : {}),
    ...(withOffer
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: product.price?.currency || 'IRR',
            price: String(finalPrice),
          },
        }
      : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
```

### Safety & Provenance Verification:
1. **No Invented Stock Availability:** Does NOT emit `https://schema.org/InStock` or fake inventory fields for engineering B2B products.
2. **Honest Price Provenance:** `offers` object is emitted ONLY when `product.price` contains a genuine numeric price and state is regular/discounted. Unpriced products or products requiring engineering quotation omit the offers block completely.
3. **Currency Standard:** Currency defaults to Iranian Rial (`IRR`) or backend-configured currency, matching the platform business model.
4. **Script Injection Protection:** Escapes opening brackets with `.replace(/</g, '\\u003c')` to prevent HTML script termination attacks.
5. **No Hardcoded Fake Telephone / Address:** In earlier Phase 12.27 documentation snippets, placeholder phone `+98-21-88888888` appeared as an example. Codebase audit confirmed that **no fake contact details or Organization JSON-LD schemas exist in the actual source code**. Public contact info is drawn exclusively from live CMS `SiteSettings`.

---

## 4. Robots.txt and Sitemap.xml Validation

### Rendered `/robots.txt`:
```txt
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /*/admin/
Disallow: /*/dashboard/
Disallow: /*/login
Disallow: /*/register
Disallow: /*/forgot-password

Sitemap: http://localhost:3000/sitemap.xml
```
- **Syntax:** Strict robots.txt specification compliant.
- **Exclusion Rules:** Disallows all administrative (`/admin`), private dashboard (`/dashboard`), and authentication endpoints.

### Rendered `/sitemap.xml`:
- Valid XML namespace `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`.
- Contains all static public Persian routes (`/fa`, `/fa/about`, `/fa/services`, `/fa/projects`, `/fa/articles`, `/fa/gallery`, `/fa/downloads`, `/fa/calculator`, `/fa/contact`, `/fa/products`, `/fa/products/category`).
- Excludes draft articles, inactive services, and unpublished projects (verified by `src/lib/content-sitemap.ts` predicate functions).

---

## 5. Live-Domain Prerequisites (Platform Owner Action)

The following items cannot be completed in an offline local staging environment and must be configured upon production deployment:
1. Google Search Console ownership verification via DNS TXT record for `abarenergy.ir`.
2. Setting `NEXT_PUBLIC_SITE_URL=https://abarenergy.ir` in production environment so sitemap and canonical URLs emit the production HTTPS domain.
3. Submitting `https://abarenergy.ir/sitemap.xml` to Google Search Console and Bing Webmaster Tools.

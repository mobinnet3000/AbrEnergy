import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/media-url';

// Phase 5.2 — locale-aware robots: public catalog pages stay crawlable while
// admin/dashboard/auth routes are never indexed. Admin and dashboard live
// under the locale prefix (`/fa/admin/...`), so both prefixed (`/*/admin/`)
// and unprefixed (`/admin/`) patterns are disallowed.
export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/*/admin/',
          '/*/dashboard/',
          '/*/login',
          '/*/register',
          '/*/forgot-password',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}

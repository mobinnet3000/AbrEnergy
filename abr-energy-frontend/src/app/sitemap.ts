import type { MetadataRoute } from 'next';

const locales = ['fa', 'ar', 'en'];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '', 'about', 'services', 'projects', 'articles', 'gallery', 'calculator', 'contact',
    'login', 'register', 'forgot-password',
    'dashboard', 'dashboard/profile', 'dashboard/notifications', 'dashboard/calculations',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${siteUrl}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}

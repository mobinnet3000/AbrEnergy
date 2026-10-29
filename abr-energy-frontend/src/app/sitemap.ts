import type { MetadataRoute } from 'next';
import {
  buildCatalogEntries,
  dedupeEntries,
  fetchAllPublicCategories,
  fetchAllPublicProducts,
  flattenCategories,
} from '@/lib/catalog-sitemap';
import {
  buildContentEntries,
  fetchAllPublicServices,
  fetchAllPublicProjects,
  fetchAllPublicArticles,
} from '@/lib/content-sitemap';
import { siteUrl } from '@/lib/media-url';

// Phase 12.20 & Phase 12.29 — static PUBLIC routes with multi-locale alternates.
// Auth, dashboard, and admin pages are intentionally excluded (disallowed in robots.ts).
const STATIC_PAGES: { page: string; changeFrequency: 'weekly' | 'monthly'; priority: number }[] = [
  { page: '', changeFrequency: 'weekly', priority: 1.0 },
  { page: 'about', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'services', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'projects', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'articles', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'gallery', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'downloads', changeFrequency: 'weekly', priority: 0.8 },
  { page: 'calculator', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'contact', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'products', changeFrequency: 'weekly', priority: 0.9 },
  { page: 'products/category', changeFrequency: 'weekly', priority: 0.85 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const now = new Date();

  // Multi-locale static entries with valid hreflang language alternates
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ page, changeFrequency, priority }) => {
    const pageSuffix = page ? `/${page}` : '';
    return {
      url: `${site}/fa${pageSuffix}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          fa: `${site}/fa${pageSuffix}`,
          en: `${site}/en${pageSuffix}`,
          ar: `${site}/ar${pageSuffix}`,
        },
      },
    };
  });

  let catalog: MetadataRoute.Sitemap = [];
  try {
    const [products, tree] = await Promise.all([fetchAllPublicProducts(), fetchAllPublicCategories()]);
    catalog = buildCatalogEntries({ site, products, categories: flattenCategories(tree), now });
  } catch {
    catalog = [];
  }

  let content: MetadataRoute.Sitemap = [];
  try {
    const [services, projects, articles] = await Promise.all([
      fetchAllPublicServices(),
      fetchAllPublicProjects(),
      fetchAllPublicArticles(),
    ]);
    content = buildContentEntries({ site, services, projects, articles, now });
  } catch {
    content = [];
  }

  return dedupeEntries([...staticEntries, ...catalog, ...content]);
}

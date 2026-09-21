import type { MetadataRoute } from 'next';
import {
  buildCatalogEntries,
  dedupeEntries,
  fetchAllPublicCategories,
  fetchAllPublicProducts,
  flattenCategories,
} from '@/lib/catalog-sitemap';
import { siteUrl } from '@/lib/media-url';

// Phase 5.2 — static PUBLIC fa routes that actually exist. Auth, dashboard,
// and admin pages are intentionally excluded (they must never be indexed;
// see robots.ts). Persian is the only active public locale, so no ar/en URLs
// are generated — the ar/en architecture itself is untouched.
const STATIC_FA_PAGES: { page: string; changeFrequency: 'weekly' | 'monthly'; priority: number }[] = [
  { page: '', changeFrequency: 'weekly', priority: 1.0 },
  { page: 'about', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'services', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'projects', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'articles', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'gallery', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'calculator', changeFrequency: 'monthly', priority: 0.8 },
  { page: 'contact', changeFrequency: 'monthly', priority: 0.8 },
  // Listed statically too: if the backend is unreachable at sitemap build
  // time, the catalog index URL is still present (deduped otherwise).
  { page: 'products', changeFrequency: 'weekly', priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_FA_PAGES.map(({ page, changeFrequency, priority }) => ({
    url: `${site}/fa${page ? `/${page}` : ''}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let catalog: MetadataRoute.Sitemap = [];
  try {
    const [products, tree] = await Promise.all([fetchAllPublicProducts(), fetchAllPublicCategories()]);
    catalog = buildCatalogEntries({ site, products, categories: flattenCategories(tree), now });
  } catch {
    // The sitemap must never 500 when the backend is down; static entries
    // (incl. the products index) still serve crawlers.
    catalog = [];
  }
  return dedupeEntries([...staticEntries, ...catalog]);
}

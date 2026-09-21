import type { MetadataRoute } from 'next';
import type { ProductCategory, ProductListItem } from '@/types';
import { apiBaseUrl } from './media-url';

/**
 * Phase 5.2 — dynamic catalog sitemap helpers.
 *
 * Only actually-public content is ever emitted: published + public +
 * active products, and active categories. Drafts, archived, hidden, and
 * inactive records are excluded even if the backend ever returned them
 * (defense in depth — the public endpoints already filter). Persian (`fa`)
 * is the only active public locale; the ar/en architecture stays intact but
 * no ar/en catalog URLs are generated. URLs are built from live backend
 * data — nothing is hardcoded.
 */

export const CATALOG_LOCALE = 'fa' as const;

/** Canonical public product URL for a translated slug. */
export function productUrl(site: string, slug: string): string {
  return `${site}/${CATALOG_LOCALE}/products/${slug}`;
}

/** Canonical public category URL for a category slug. */
export function productCategoryUrl(site: string, slug: string): string {
  return `${site}/${CATALOG_LOCALE}/products/category/${slug}`;
}

/** Sitemap eligibility mirrors the backend public rule (status/visibility/active). */
export function isSitemapProduct(product: ProductListItem): boolean {
  return (
    product.status === 'published' &&
    product.visibility === 'public' &&
    product.is_active === true &&
    typeof product.slug === 'string' &&
    product.slug.length > 0
  );
}

/** Sitemap eligibility for categories: active with a usable slug. */
export function isSitemapCategory(category: ProductCategory): boolean {
  return (
    category.is_active === true &&
    typeof category.slug === 'string' &&
    category.slug.length > 0
  );
}

/** Remove duplicate URLs while preserving first-seen order. */
export function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export function buildCatalogEntries(input: {
  site: string;
  products: ProductListItem[];
  categories: ProductCategory[];
  now?: Date;
}): MetadataRoute.Sitemap {
  const { site, products, categories } = input;
  const now = input.now ?? new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${site}/${CATALOG_LOCALE}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
  for (const category of categories) {
    if (!isSitemapCategory(category)) continue;
    entries.push({
      // The category tree serializer carries no updated_at, so the build
      // time is used (no invented per-category dates).
      url: productCategoryUrl(site, category.slug),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }
  for (const product of products) {
    if (!isSitemapProduct(product)) continue;
    entries.push({
      url: productUrl(site, product.slug),
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }
  return dedupeEntries(entries);
}

// ── Server-side bulk fetch (used by `src/app/sitemap.ts`) ───────────────────
// Native fetch against the public (AllowAny) endpoints — the same pattern as
// `product-metadata.ts`, no new HTTP client. The catalog paginates at
// page_size<=100 (StandardPagination.max_page_size), so pages are walked
// until a short page or a safety cap.

const SITEMAP_PAGE_SIZE = 100;
const SITEMAP_MAX_PAGES = 50;

interface Paginated<T> {
  results?: T[];
  next?: string | null;
}

async function fetchPage<T>(path: string, page: number): Promise<Paginated<T> | T[] | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}${path}?page_size=${SITEMAP_PAGE_SIZE}&page=${page}`, {
      headers: { 'Accept-Language': CATALOG_LOCALE },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Paginated<T> | T[];
  } catch {
    return null;
  }
}

async function fetchAll<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= SITEMAP_MAX_PAGES; page += 1) {
    const data = await fetchPage<T>(path, page);
    const results = Array.isArray(data) ? data : (data?.results ?? null);
    if (!results) break;
    out.push(...results);
    if (results.length < SITEMAP_PAGE_SIZE) break;
  }
  return out;
}

/** All publicly visible products (backend already filters; see predicates). */
export function fetchAllPublicProducts(): Promise<ProductListItem[]> {
  return fetchAll<ProductListItem>('/products/');
}

/** All active categories (tree; children are flattened by the caller). */
export function fetchAllPublicCategories(): Promise<ProductCategory[]> {
  return fetchAll<ProductCategory>('/product-categories/');
}

/** Flatten a nested category tree (any depth) into a plain list. */
export function flattenCategories(categories: ProductCategory[]): ProductCategory[] {
  const out: ProductCategory[] = [];
  const walk = (nodes: ProductCategory[] | undefined) => {
    for (const node of nodes ?? []) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(categories);
  return out;
}

import type { Metadata } from 'next';
import type { ProductCategoryDetail, ProductDetail, ProductListItem } from '@/types';
import { apiBaseUrl, resolveMediaUrl, siteUrl } from './media-url';

// ── Server-side SEO metadata for the public product catalog ─────────────────
// These helpers run in Server Components (`generateMetadata`). They call the
// public (AllowAny) API directly with `fetch` so crawlers receive real tags —
// the interactive pages themselves stay client-rendered via React Query.
//
// Priority: translated meta_* → object seo_* → sensible fallback.
// Only backend-supplied values are used; nothing is invented.

function apiBase(): string {
  return apiBaseUrl();
}

async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      headers: { 'Accept-Language': 'fa' },
      // Catalog metadata changes only when editors publish; revalidate lazily.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchPublicProduct(slug: string): Promise<ProductDetail | null> {
  return fetchPublic<ProductDetail>(`/products/${encodeURIComponent(slug)}/`);
}

export function fetchPublicProductCategory(slug: string): Promise<ProductCategoryDetail | null> {
  return fetchPublic<ProductCategoryDetail>(`/product-categories/${encodeURIComponent(slug)}/`);
}

export function fetchPublicProductList(): Promise<{ results: ProductListItem[] } | null> {
  return fetchPublic<{ results: ProductListItem[] }>('/products/?page_size=1');
}

/**
 * Phase 5.2 — resolve a possibly-historical public slug to its current
 * canonical slug via the backend resolve endpoints. Returns `null` for
 * unknown slugs or non-public content. Used by the server page components
 * to issue a permanent redirect for old slugs (never for canonical ones).
 */
async function resolveSlug(kind: 'products' | 'product-categories', slug: string): Promise<string | null> {
  const data = await fetchPublic<{ canonical_slug?: string }>(
    `/${kind}/resolve/?slug=${encodeURIComponent(slug)}`,
  );
  return data?.canonical_slug || null;
}

export function resolvePublicProductSlug(slug: string): Promise<string | null> {
  return resolveSlug('products', slug);
}

export function resolvePublicProductCategorySlug(slug: string): Promise<string | null> {
  return resolveSlug('product-categories', slug);
}

type RobotsKey = 'index_follow' | 'noindex_follow' | 'index_nofollow' | 'noindex_nofollow';

function mapRobots(robots?: string): { index: boolean; follow: boolean } {
  switch ((robots ?? 'index_follow') as RobotsKey) {
    case 'noindex_follow':
      return { index: false, follow: true };
    case 'index_nofollow':
      return { index: true, follow: false };
    case 'noindex_nofollow':
      return { index: false, follow: false };
    case 'index_follow':
    default:
      return { index: true, follow: true };
  }
}

const SITE_NAME = 'ابر انرژی';

export function buildCatalogMetadata(input: {
  metaTitle?: string;
  seoTitle?: string;
  fallbackTitle: string;
  metaDescription?: string;
  seoDescription?: string;
  fallbackDescription: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}): Metadata {
  const title = input.metaTitle || input.seoTitle || input.fallbackTitle;
  const description = input.metaDescription || input.seoDescription || input.fallbackDescription;
  const { index, follow } = mapRobots(input.robots);
  const images = input.ogImage ? [{ url: resolveMediaUrl(input.ogImage) || input.ogImage }] : undefined;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    robots: { index, follow },
    ...(input.canonicalUrl ? { alternates: { canonical: input.canonicalUrl } } : {}),
    openGraph: {
      // Dedicated OG fields win when editors set them; otherwise the
      // resolved page title/description is reused (no invented copy).
      title: input.ogTitle || title,
      description: input.ogDescription || description,
      type: 'website',
      siteName: SITE_NAME,
      // Persian is the only active public locale (ar/en emit no URLs).
      locale: 'fa_IR',
      ...(images ? { images } : {}),
    },
  };
}

export async function productMetadata(slug: string): Promise<Metadata> {
  const product = await fetchPublicProduct(slug);
  if (!product) {
    return { title: `محصول | ${SITE_NAME}`, description: 'کاتالوگ محصولات ابر انرژی' };
  }
  // Phase 5.2: dedicated OG image wins (public detail now exposes
  // og_image_url, mirroring categories); cover/first image stay fallback.
  const ogImage = product.og_image_url || product.cover_image_url || product.images?.[0]?.url || undefined;
  return buildCatalogMetadata({
    metaTitle: product.meta_title,
    seoTitle: product.seo_title,
    fallbackTitle: product.title || product.sku,
    metaDescription: product.meta_description,
    seoDescription: product.seo_description,
    fallbackDescription: product.short_description || product.title,
    canonicalUrl: product.canonical_url || undefined,
    robots: product.robots,
    ogTitle: product.og_title,
    ogDescription: product.og_description,
    ogImage,
  });
}

export async function productCategoryMetadata(slug: string): Promise<Metadata> {
  const category = await fetchPublicProductCategory(slug);
  if (!category) {
    return { title: `دسته‌بندی محصولات | ${SITE_NAME}`, description: 'کاتالوگ محصولات ابر انرژی' };
  }
  return buildCatalogMetadata({
    metaTitle: category.meta_title,
    seoTitle: category.seo_title,
    fallbackTitle: category.title || category.slug,
    metaDescription: category.meta_description,
    seoDescription: category.seo_description,
    fallbackDescription: category.description || category.title,
    canonicalUrl: category.canonical_url || undefined,
    robots: category.robots,
    ogTitle: category.og_title,
    ogDescription: category.og_description,
    ogImage: category.og_image_url || category.cover_image_url || undefined,
  });
}

export function productsIndexMetadata(): Metadata {
  return buildCatalogMetadata({
    fallbackTitle: 'محصولات',
    fallbackDescription: 'کاتالوگ محصولات خورشیدی ابر انرژی: پکیج‌های خورشیدی، برق اضطراری، سازه‌ها و تجهیزات.',
    // The index route is static and known; a self-referencing canonical is
    // safe here (detail pages keep backend-driven canonicals only).
    canonicalUrl: `${siteUrl()}/fa/products`,
  });
}

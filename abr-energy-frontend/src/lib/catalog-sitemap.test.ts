import { describe, it, expect } from 'vitest';
import {
  buildCatalogEntries,
  dedupeEntries,
  flattenCategories,
  isSitemapCategory,
  isSitemapProduct,
  productCategoryUrl,
  productUrl,
} from './catalog-sitemap';
import type { ProductCategory, ProductListItem } from '@/types';

const SITE = 'http://localhost:3000';

function product(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 'p-1',
    title: 'محصول',
    slug: 'panel-550',
    short_description: '',
    sku: 'SKU-1',
    category: null,
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    price: { state: 'regular', currency: 'IRR', final_price: '1' },
    created_at: '',
    updated_at: '2026-09-20T00:00:00Z',
    published_at: null,
    ...overrides,
  };
}

function category(overrides: Partial<ProductCategory> = {}): ProductCategory {
  return {
    id: 'c-1',
    title: 'دسته',
    slug: 'packages',
    slug_t: 'packages',
    parent: null,
    sort_order: 0,
    is_active: true,
    is_featured: false,
    ...overrides,
  };
}

describe('catalog URL builders', () => {
  it('builds Persian canonical catalog URLs', () => {
    expect(productUrl(SITE, 'panel-550')).toBe('http://localhost:3000/fa/products/panel-550');
    expect(productCategoryUrl(SITE, 'packages')).toBe(
      'http://localhost:3000/fa/products/category/packages',
    );
  });

  it('keeps product and category namespaces distinct', () => {
    expect(productUrl(SITE, 'x')).not.toBe(productCategoryUrl(SITE, 'x'));
  });
});

describe('sitemap eligibility predicates', () => {
  it('includes published/public/active products only', () => {
    expect(isSitemapProduct(product())).toBe(true);
    expect(isSitemapProduct(product({ status: 'draft' }))).toBe(false);
    expect(isSitemapProduct(product({ status: 'archived' }))).toBe(false);
    expect(isSitemapProduct(product({ visibility: 'hidden' }))).toBe(false);
    expect(isSitemapProduct(product({ is_active: false }))).toBe(false);
    expect(isSitemapProduct(product({ slug: '' }))).toBe(false);
  });

  it('includes active categories only', () => {
    expect(isSitemapCategory(category())).toBe(true);
    expect(isSitemapCategory(category({ is_active: false }))).toBe(false);
    expect(isSitemapCategory(category({ slug: '' }))).toBe(false);
  });
});

describe('buildCatalogEntries', () => {
  it('includes index, categories, and public products — excluding non-public records', () => {
    const entries = buildCatalogEntries({
      site: SITE,
      products: [
        product({ id: 'p-1', slug: 'panel-550' }),
        product({ id: 'p-2', slug: 'draft-1', status: 'draft' }),
        product({ id: 'p-3', slug: 'hidden-1', visibility: 'hidden' }),
        product({ id: 'p-4', slug: 'off-1', is_active: false }),
      ],
      categories: [category({ id: 'c-1', slug: 'packages' }), category({ id: 'c-2', slug: 'off', is_active: false })],
      now: new Date('2026-09-20T00:00:00Z'),
    });
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('http://localhost:3000/fa/products');
    expect(urls).toContain('http://localhost:3000/fa/products/panel-550');
    expect(urls).toContain('http://localhost:3000/fa/products/category/packages');
    expect(urls.some((u) => u.includes('draft-1'))).toBe(false);
    expect(urls.some((u) => u.includes('hidden-1'))).toBe(false);
    expect(urls.some((u) => u.includes('off-1'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/category/off'))).toBe(false);
  });

  it('emits Persian-locale URLs only (no ar/en catalog URLs)', () => {
    const entries = buildCatalogEntries({ site: SITE, products: [product()], categories: [category()] });
    for (const entry of entries) {
      expect(entry.url).toContain('/fa/');
      expect(entry.url).not.toContain('/ar/');
      expect(entry.url).not.toContain('/en/');
    }
  });

  it('removes duplicate URLs', () => {
    const entries = buildCatalogEntries({
      site: SITE,
      products: [product({ id: 'a', slug: 'dup' }), product({ id: 'b', slug: 'dup' })],
      categories: [],
    });
    const urls = entries.map((e) => e.url);
    expect(urls.filter((u) => u.endsWith('/products/dup'))).toHaveLength(1);
  });
});

describe('dedupeEntries', () => {
  it('keeps first-seen order without duplicates', () => {
    const now = new Date();
    const out = dedupeEntries([
      { url: `${SITE}/fa/a`, lastModified: now },
      { url: `${SITE}/fa/b`, lastModified: now },
      { url: `${SITE}/fa/a`, lastModified: now },
    ]);
    expect(out.map((e) => e.url)).toEqual([`${SITE}/fa/a`, `${SITE}/fa/b`]);
  });
});

describe('flattenCategories', () => {
  it('flattens nested trees of any depth', () => {
    const tree = [
      category({
        id: 'root',
        slug: 'root',
        children: [category({ id: 'child', slug: 'child', children: [category({ id: 'leaf', slug: 'leaf' })] })],
      }),
    ];
    expect(flattenCategories(tree).map((c) => c.slug)).toEqual(['root', 'child', 'leaf']);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildCatalogMetadata,
  productMetadata,
  productsIndexMetadata,
  resolvePublicProductCategorySlug,
  resolvePublicProductSlug,
} from './product-metadata';

describe('buildCatalogMetadata (translated meta → object SEO → fallback)', () => {
  it('prefers translated meta fields over object SEO fields', () => {
    const meta = buildCatalogMetadata({
      metaTitle: 'متای ترجمه‌شده',
      seoTitle: 'سئوی آبجکت',
      fallbackTitle: 'نام محصول',
      metaDescription: 'توضیح متا',
      seoDescription: 'توضیح سئو',
      fallbackDescription: 'توضیح کوتاه',
    });
    expect(meta.title).toContain('متای ترجمه‌شده');
    expect(meta.description).toBe('توضیح متا');
  });

  it('falls back to object SEO, then to sensible defaults', () => {
    const seoOnly = buildCatalogMetadata({
      seoTitle: 'سئوی آبجکت',
      fallbackTitle: 'نام محصول',
      fallbackDescription: 'توضیح کوتاه',
    });
    expect(seoOnly.title).toContain('سئوی آبجکت');

    const bare = buildCatalogMetadata({ fallbackTitle: 'نام محصول', fallbackDescription: 'd' });
    expect(bare.title).toContain('نام محصول');
  });

  it('maps backend robots values to Next.js robots', () => {
    expect(buildCatalogMetadata({ fallbackTitle: 't', fallbackDescription: 'd', robots: 'noindex_nofollow' }).robots).toEqual({
      index: false,
      follow: false,
    });
    expect(buildCatalogMetadata({ fallbackTitle: 't', fallbackDescription: 'd', robots: 'index_follow' }).robots).toEqual({
      index: true,
      follow: true,
    });
  });

  it('emits canonical and OpenGraph only from backend-supplied values', () => {
    const without = buildCatalogMetadata({ fallbackTitle: 't', fallbackDescription: 'd' });
    expect(without.alternates).toBeUndefined();

    const withAll = buildCatalogMetadata({
      fallbackTitle: 't',
      fallbackDescription: 'd',
      canonicalUrl: 'https://example.com/fa/products/x',
      ogTitle: 'og',
      ogDescription: 'ogd',
      ogImage: 'https://example.com/media/x.png',
    });
    expect(withAll.alternates).toEqual({ canonical: 'https://example.com/fa/products/x' });
    const og = withAll.openGraph as { images?: { url: string }[]; title?: string };
    expect(og.images).toEqual([{ url: 'https://example.com/media/x.png' }]);
    expect(og.title).toBe('og');
  });

  it('resolves relative OG image paths to absolute URLs and tags fa_IR locale', () => {
    const meta = buildCatalogMetadata({
      fallbackTitle: 't',
      fallbackDescription: 'd',
      ogImage: '/media/products/x.png',
    });
    const og = meta.openGraph as { images?: { url: string }[]; locale?: string };
    expect(og.images?.[0]?.url).toMatch(/^https?:\/\//);
    expect(og.images?.[0]?.url).toContain('/media/products/x.png');
    expect(og.locale).toBe('fa_IR');
  });

  it('gives the products index a self-referencing canonical', () => {
    const meta = productsIndexMetadata();
    expect(meta.alternates).toEqual({ canonical: expect.stringContaining('/fa/products') });
  });
});

describe('slug resolution helpers (Phase 5.2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(payload: unknown, ok = true) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok, json: async () => payload })),
    );
  }

  it('returns the canonical slug on a history hit', async () => {
    mockFetch({ canonical_slug: 'panel-new' });
    await expect(resolvePublicProductSlug('panel-old')).resolves.toBe('panel-new');
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/products/resolve/');
    expect(url).toContain('panel-old');
  });

  it('returns null for unknown slugs (backend 404)', async () => {
    mockFetch(null, false);
    await expect(resolvePublicProductSlug('nope')).resolves.toBeNull();
    await expect(resolvePublicProductCategorySlug('nope')).resolves.toBeNull();
  });

  it('prefers the dedicated og_image_url over cover for product OG image', async () => {
    mockFetch({
      title: 'پنل',
      sku: 'X-1',
      cover_image_url: '/media/cover.png',
      og_image_url: '/media/og.png',
      images: [],
    });
    const meta = await productMetadata('x');
    const og = meta.openGraph as { images?: { url: string }[] };
    expect(og.images?.[0]?.url).toContain('/media/og.png');
  });

  it('falls back to cover when no dedicated OG image exists', async () => {
    mockFetch({ title: 'پنل', sku: 'X-1', cover_image_url: '/media/cover.png', images: [] });
    const meta = await productMetadata('x');
    const og = meta.openGraph as { images?: { url: string }[] };
    expect(og.images?.[0]?.url).toContain('/media/cover.png');
  });
});

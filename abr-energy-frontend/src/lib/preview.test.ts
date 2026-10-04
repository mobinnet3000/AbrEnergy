import { describe, it, expect, vi } from 'vitest';
import {
  buildHomepagePreviewUrl,
  buildProductPreviewUrl,
  buildCategoryPreviewUrl,
  isPreviewUrl,
  PREVIEW_PATH_SEGMENT,
  PRODUCT_PREVIEW_PATH_SEGMENT,
  CATEGORY_PREVIEW_PATH_SEGMENT,
} from './preview';
import fa from '../../locales/fa.json';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import { previewApi } from '../api';
import axiosInstance from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('Phase 8.1 preview URL contract', () => {
  it('builds an isolated preview URL outside the public route tree', () => {
    const url = buildHomepagePreviewUrl('abc123');
    expect(url).toBe('/fa/preview/homepage?token=abc123');
    expect(url.startsWith('/fa/products')).toBe(false);
    expect(url).toContain(PREVIEW_PATH_SEGMENT);
  });

  it('encodes token characters and honors the locale', () => {
    expect(buildHomepagePreviewUrl('a+b&c', 'ar')).toBe('/ar/preview/homepage?token=a%2Bb%26c');
  });

  it('distinguishes preview URLs from public ones', () => {
    expect(isPreviewUrl('/fa/preview/homepage?token=x')).toBe(true);
    expect(isPreviewUrl('/fa')).toBe(false);
    expect(isPreviewUrl('/fa/products/whatever')).toBe(false);
  });

  it('provides the preview-failure locale key in fa/ar/en', () => {
    for (const [name, bundle] of [['fa', fa], ['ar', ar], ['en', en]] as const) {
      const admin = (bundle as Record<string, Record<string, string>>).admin;
      expect(admin['homepage_preview'], `${name}.admin.homepage_preview`).toBeTruthy();
      expect(admin['homepage_preview_failed'], `${name}.admin.homepage_preview_failed`).toBeTruthy();
    }
  });

  it('fetches the preview payload from the isolated preview endpoint with the token', async () => {
    const get = vi.mocked(axiosInstance.get);
    get.mockResolvedValueOnce({ data: { preview: true } });
    const data = await previewApi.getHomepagePreview('tok-1');
    expect(get).toHaveBeenCalledWith('/admin/homepage/preview/', { params: { token: 'tok-1' } });
    expect(data).toEqual({ preview: true });
  });

  it('issues preview tokens through the admin-only endpoint', async () => {
    const post = vi.mocked(axiosInstance.post);
    post.mockResolvedValueOnce({ data: { token: 't' } });
    await previewApi.issue({ resource_type: 'homepage', locale: 'fa' });
    expect(post).toHaveBeenCalledWith('/admin/homepage/preview-tokens/', {
      resource_type: 'homepage',
      locale: 'fa',
    });
  });
});

describe('Phase 8.2 product/category preview URL + API contract', () => {
  it('builds isolated product preview URLs (never the public detail route)', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const url = buildProductPreviewUrl('tok', id);
    expect(url).toBe(`/fa${PRODUCT_PREVIEW_PATH_SEGMENT}/${id}?token=tok`);
    expect(url.startsWith('/fa/products/')).toBe(false);
    expect(url).toContain('/preview/');
  });

  it('builds isolated category preview URLs (never the public category route)', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const url = buildCategoryPreviewUrl('tok', id);
    expect(url).toBe(`/fa${CATEGORY_PREVIEW_PATH_SEGMENT}/${id}?token=tok`);
    expect(url.startsWith('/fa/products/category/')).toBe(false);
    expect(url).toContain('/preview/');
  });

  it('encodes tokens/ids and honors the locale for product/category URLs', () => {
    expect(buildProductPreviewUrl('a+b&c', 'id-1', 'ar')).toBe(
      `/ar${PRODUCT_PREVIEW_PATH_SEGMENT}/id-1?token=a%2Bb%26c`,
    );
    expect(buildCategoryPreviewUrl('t', 'id/2', 'en')).toBe(
      `/en${CATEGORY_PREVIEW_PATH_SEGMENT}/id%2F2?token=t`,
    );
  });

  it('recognizes product/category preview URLs as preview URLs', () => {
    expect(isPreviewUrl('/fa/preview/products/abc?token=x')).toBe(true);
    expect(isPreviewUrl('/fa/preview/products/category/abc?token=x')).toBe(true);
    expect(isPreviewUrl('/fa/products/abc')).toBe(false);
    expect(isPreviewUrl('/fa/products/category/abc')).toBe(false);
  });

  it('provides the product/category preview locale keys in fa/ar/en', () => {
    for (const [name, bundle] of [['fa', fa], ['ar', ar], ['en', en]] as const) {
      const admin = (bundle as Record<string, Record<string, string>>).admin;
      expect(admin['product_preview'], `${name}.admin.product_preview`).toBeTruthy();
      expect(admin['category_preview'], `${name}.admin.category_preview`).toBeTruthy();
      expect(admin['preview_failed'], `${name}.admin.preview_failed`).toBeTruthy();
    }
  });

  it('fetches product preview from the isolated admin preview endpoint with id + token', async () => {
    const get = vi.mocked(axiosInstance.get);
    get.mockResolvedValueOnce({ data: { preview: true } });
    const data = await previewApi.getProductPreview('prod-id', 'tok-1');
    expect(get).toHaveBeenCalledWith('/admin/products/prod-id/preview/', { params: { token: 'tok-1' } });
    expect(data).toEqual({ preview: true });
  });

  it('fetches category preview from the isolated admin preview endpoint with id + token', async () => {
    const get = vi.mocked(axiosInstance.get);
    get.mockResolvedValueOnce({ data: { preview: true } });
    const data = await previewApi.getCategoryPreview('cat-id', 'tok-2');
    expect(get).toHaveBeenCalledWith('/admin/product-categories/cat-id/preview/', { params: { token: 'tok-2' } });
    expect(data).toEqual({ preview: true });
  });

  it('never generates a public-route URL carrying a preview token', () => {
    const urls = [
      buildHomepagePreviewUrl('t'),
      buildProductPreviewUrl('t', 'id-1'),
      buildCategoryPreviewUrl('t', 'id-2'),
    ];
    for (const url of urls) {
      expect(url.startsWith('/fa/products')).toBe(false);
      expect(url).toContain('/preview/');
    }
  });
});

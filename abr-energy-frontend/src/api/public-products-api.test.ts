import { describe, it, expect, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('@/api/axios', () => ({
  default: { get: (...args: unknown[]) => getMock(...args) },
}));

// Import after the axios mock is registered.
import { productsApi } from '@/api';

describe('productsApi (public catalog — no authentication required)', () => {
  it('lists products with server-side filter params', async () => {
    getMock.mockResolvedValueOnce({ data: { results: [] } });
    await productsApi.list({ search: 'پنل', category: 'uuid-1', is_featured: 'true', ordering: '-created_at', page: '2' });
    expect(getMock).toHaveBeenCalledWith('/products/', {
      params: { search: 'پنل', category: 'uuid-1', is_featured: 'true', ordering: '-created_at', page: '2' },
    });
  });

  it('fetches product detail by slug without credentials', async () => {
    getMock.mockResolvedValueOnce({ data: { id: '1' } });
    await productsApi.getBySlug('panel-550');
    expect(getMock).toHaveBeenCalledWith('/products/panel-550/');
  });

  it('fetches the public category tree and category detail', async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    await productsApi.listCategories();
    expect(getMock).toHaveBeenCalledWith('/product-categories/', { params: undefined });

    getMock.mockResolvedValueOnce({ data: { id: 'c1' } });
    await productsApi.getCategory('packages');
    expect(getMock).toHaveBeenCalledWith('/product-categories/packages/');
  });

  it('fetches featured products for rails', async () => {
    getMock.mockResolvedValueOnce({ data: { results: [] } });
    await productsApi.getFeatured();
    expect(getMock).toHaveBeenCalledWith('/products/featured/', { params: undefined });
  });
});

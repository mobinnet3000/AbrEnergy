import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductsClient } from './products-client';
import type { ProductCategory, ProductListItem } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

let currentQuery = '';
const pushMock = vi.fn();
const replaceMock = vi.fn();
const routerMock = { push: pushMock, replace: replaceMock };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(currentQuery),
  usePathname: () => '/fa/products',
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const productParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();

const MOCK_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-solar-uuid',
    title: 'پکیج‌های خورشیدی',
    slug: 'solar-packages',
    slug_t: 'solar-packages',
    parent: null,
    children: [
      {
        id: 'cat-apt-uuid',
        title: 'آپارتمان',
        slug: 'solar-apartment',
        slug_t: 'solar-apartment',
        parent: 'cat-solar-uuid',
        children: [],
        sort_order: 1,
        is_active: true,
        is_featured: false,
      },
    ],
    sort_order: 1,
    is_active: true,
    is_featured: false,
  },
];

const MOCK_PRODUCTS: ProductListItem[] = [
  {
    id: 'p-1',
    title: 'محصول نمونه ۱',
    slug: 'sample-product-1',
    short_description: 'توضیح کوتاه ۱',
    sku: 'SKU-001',
    category: 'cat-solar-uuid',
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: true,
    sort_order: 1,
    price: { state: 'regular', currency: 'IRR', final_price: '1000' },
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    published_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'p-2',
    title: 'محصول نمونه ۲',
    slug: 'sample-product-2',
    short_description: 'توضیح کوتاه ۲',
    sku: 'SKU-002',
    category: 'cat-apt-uuid',
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: false,
    sort_order: 2,
    price: { state: 'regular', currency: 'IRR', final_price: '2000' },
    created_at: '2026-09-02T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
    published_at: '2026-09-02T00:00:00Z',
  },
];

vi.mock('@/hooks/use-api', () => ({
  usePublicProductCategories: () => ({
    data: MOCK_CATEGORIES,
    isLoading: false,
    isError: false,
  }),
  usePublicProducts: (params?: Record<string, string>) => {
    productParamsCalls.push({ ...(params ?? {}) });
    return {
      data: { results: MOCK_PRODUCTS, count: 50 },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    };
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  setUrl('');
  pushMock.mockClear();
  replaceMock.mockClear();
  productParamsCalls.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ProductsClient URL synchronization (Phase 12.19)', () => {
  it('initializes search, category, featured, ordering, and page from the URL', () => {
    setUrl('search=%D8%A7%DB%8C%D9%86%D9%88%D8%B1%D8%AA%D8%B1&category=cat-solar-uuid&featured=true&ordering=-created_at&page=2');
    render(<ProductsClient />);

    const lastCall = productParamsCalls[productParamsCalls.length - 1];
    expect(lastCall.search).toBe('اینورتر');
    expect(lastCall.category).toBe('cat-solar-uuid');
    expect(lastCall.is_featured).toBe('true');
    expect(lastCall.ordering).toBe('-created_at');
    expect(lastCall.page).toBe('2');
  });

  it('resolves category slug from URL to matching category UUID', () => {
    setUrl('category=solar-packages');
    render(<ProductsClient />);

    const lastCall = productParamsCalls[productParamsCalls.length - 1];
    expect(lastCall.category).toBe('cat-solar-uuid');
  });

  it('safely handles out-of-range or malicious query parameters', () => {
    setUrl('page=-15&ordering=drop_table&featured=nonsense');
    render(<ProductsClient />);

    const lastCall = productParamsCalls[productParamsCalls.length - 1];
    expect(lastCall.page).toBe('1');
    expect(lastCall.ordering).toBeUndefined();
    expect(lastCall.is_featured).toBeUndefined();
  });

  it('updates URL with replace when typing search after debounce', () => {
    render(<ProductsClient />);

    const searchInput = screen.getByPlaceholderText('products.search_placeholder');
    fireEvent.change(searchInput, { target: { value: 'باتری خورشیدی' } });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining('search=%D8%A8%D8%A7%D8%AA%D8%B1%DB%8C+%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C'),
    );
  });

  it('replaces URL and resets page to 1 when changing category filter', () => {
    setUrl('page=3');
    render(<ProductsClient />);

    const categorySelect = screen.getByRole('combobox', { name: 'products.filter_category' });
    fireEvent.change(categorySelect, { target: { value: 'cat-apt-uuid' } });

    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining('category=cat-apt-uuid'),
    );
    // Page 1 is omitted from the clean canonical URL:
    const calledUrl = replaceMock.mock.calls[0][0];
    expect(calledUrl).not.toContain('page=');
  });

  it('pushes the new page to URL when clicking pagination next', () => {
    setUrl('page=1');
    render(<ProductsClient />);

    const nextBtn = screen.getByRole('button', { name: 'common.next' });
    fireEvent.click(nextBtn);

    expect(pushMock).toHaveBeenCalledWith('/fa/products?page=2');
  });

  it('resets URL on clear filters button click', () => {
    setUrl('search=test&category=cat-solar-uuid');
    render(<ProductsClient />);

    const clearBtn = screen.getByText('products.clear_filters');
    fireEvent.click(clearBtn);

    expect(replaceMock).toHaveBeenCalledWith('/fa/products');
  });

  it('renders a prominent link to the category index page', () => {
    render(<ProductsClient />);

    const categoryLinks = screen.getAllByRole('link', { name: new RegExp('products.view_all_categories|products.categories_label') });
    expect(categoryLinks.some((l) => l.getAttribute('href') === '/products/category')).toBe(true);
  });
});

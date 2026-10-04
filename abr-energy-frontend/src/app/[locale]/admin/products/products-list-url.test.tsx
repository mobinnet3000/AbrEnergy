/**
 * Phase 9.3-A — products admin list URL persistence.
 *
 * Covers every control this list actually renders (search + category +
 * status + visibility + active + featured + page): deep-link reconstruction
 * (minimal + full-filter), debounced search → replace, filter → replace +
 * page reset, pager → push, invalid values fail safe, back/forward
 * reconstruction, query alignment.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProductsPage from '@/app/[locale]/admin/products/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';
import type { ProductListItem, ProductCategory } from '@/types';

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
  usePathname: () => '/fa/admin/products',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const productParamsCalls: Record<string, string>[] = [];
let productListData: { results: ProductListItem[]; count: number } = { results: [], count: 0 };
let categoryListData: { results: ProductCategory[]; count: number } = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminProducts: (params?: Record<string, string>) => {
    productParamsCalls.push({ ...(params ?? {}) });
    return { data: productListData, isLoading: false, error: null, refetch: vi.fn() };
  },
  useAdminProductCategories: (params?: Record<string, string>) => ({ data: categoryListData }),
  useUpdateAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDuplicateAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
}));

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const lastParams = () => productParamsCalls[productParamsCalls.length - 1];

const productRow = {
  id: 'p1', title: 'پنل خورشیدی', slug: 'panel', short_description: '', sku: 'SKU-1',
  category: null, cover_image_url: '', status: 'draft', visibility: 'public',
  is_active: true, is_featured: false, sort_order: 0, price: null,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', published_at: null,
} as unknown as ProductListItem;

const catRow = {
  id: 'cat-1', title: 'دسته خورشیدی', slug: 'cat-1', parent: null,
  sort_order: 0, is_active: true, is_featured: false,
} as unknown as ProductCategory;

beforeEach(() => {
  vi.useFakeTimers();
  currentQuery = '';
  productParamsCalls.length = 0;
  productListData = { results: [], count: 0 };
  categoryListData = { results: [], count: 0 };
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Products list — deep-link / refresh reconstruction (Phase 9.3-A)', () => {
  it('initializes search + page from a minimal URL', () => {
    productListData = { results: [productRow], count: 45 };
    setUrl('?search=solar&page=2');
    render(<AdminProductsPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_products') as HTMLInputElement).value).toBe('solar');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(lastParams()).toMatchObject({ search: 'solar', page: '2', page_size: '20' });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('initializes every existing filter from a full URL', () => {
    productListData = { results: [productRow], count: 45 };
    setUrl('?search=solar&category=cat-1&status=published&visibility=public&active=active&featured=true&page=2');
    render(<AdminProductsPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({
      search: 'solar', category: 'cat-1', status: 'published', visibility: 'public',
      is_active: 'true', is_featured: 'true', page: '2', page_size: '20',
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('invalid values fail safely to defaults', () => {
    setUrl('?status=bogus&visibility=x&active=y&featured=1&page=abc');
    render(<AdminProductsPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ page: '1', page_size: '20' });
    for (const k of ['search', 'category', 'status', 'visibility', 'is_active', 'is_featured']) {
      expect(k in lastParams()).toBe(false);
    }
  });
});

describe('Products list — search commits debounced via replace (Phase 9.3-A)', () => {
  it('rapid typing produces one replace with the final value', () => {
    render(<AdminProductsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_products') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'S' } });
    fireEvent.change(input, { target: { value: 'SO' } });
    fireEvent.change(input, { target: { value: 'SOL' } });
    expect(input.value).toBe('SOL');
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(replaceMock).not.toHaveBeenCalled();

    advance(50);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products?search=SOL');
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('Products list — filters replace + reset page; pager pushes (Phase 9.3-A)', () => {
  it('status change replaces the URL and drops page=1', async () => {
    vi.useRealTimers();
    productListData = { results: [productRow], count: 45 };
    setUrl('?search=solar&page=2');
    const { container } = render(<AdminProductsPage />, { wrapper: wrapper() });

    // Trigger order: category, status, visibility, active, featured.
    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(5);
    fireEvent.click(triggers[1]);
    const publishedOption = await screen.findByRole('option', { name: 'admin.status_published' });
    fireEvent.pointerDown(publishedOption);
    fireEvent.click(publishedOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products?search=solar&status=published');
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('category change replaces the URL with the category id', async () => {
    vi.useRealTimers();
    productListData = { results: [productRow], count: 45 };
    categoryListData = { results: [catRow], count: 1 };
    const { container } = render(<AdminProductsPage />, { wrapper: wrapper() });

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    fireEvent.click(triggers[0]);
    const catOption = await screen.findByRole('option', { name: 'دسته خورشیدی' });
    fireEvent.pointerDown(catOption);
    fireEvent.click(catOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products?category=cat-1');
    });
  });

  it('pager pushes the URL', () => {
    productListData = { results: [productRow], count: 45 };
    render(<AdminProductsPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.previous' }));
    // Disabled on page 1 — sanity: no navigation happens.
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/fa/admin/products?page=2');
  });
});

describe('Products list — back/forward reconstructs from the URL (Phase 9.3-A)', () => {
  it('external URL change restores search + filters + page without resurrection', () => {
    productListData = { results: [productRow], count: 45 };
    setUrl('?search=solar&status=published&page=2');
    const { rerender } = render(<AdminProductsPage />, { wrapper: wrapper() });
    expect((screen.getByLabelText('admin.search_products') as HTMLInputElement).value).toBe('solar');

    setUrl('');
    rerender(<AdminProductsPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect((screen.getByLabelText('admin.search_products') as HTMLInputElement).value).toBe('');
    expect(lastParams()).toMatchObject({ page: '1' });
    expect('search' in lastParams()).toBe(false);
    expect('status' in lastParams()).toBe(false);
    expect(replaceMock).not.toHaveBeenCalled();

    setUrl('?search=solar&status=published&page=2');
    rerender(<AdminProductsPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({ search: 'solar', status: 'published', page: '2' });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

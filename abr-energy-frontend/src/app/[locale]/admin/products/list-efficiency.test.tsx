/**
 * Phase 9.1 — admin list-efficiency slice.
 *
 * Focused regression tests for the two admin list pages (products +
 * product categories), following the Phase 8.6 testing philosophy:
 *
 * - the visible input updates immediately on every keystroke
 * - rapid typing A → AB → ABC issues NO intermediate server query
 * - exactly one query with the final value fires after the shared 300 ms
 *   debounce window (params captured per render; React Query keys on the
 *   debounced value so intermediate keys are never created)
 * - clearing the search removes the query param (no stale results)
 * - search resets the product page to 1
 * - no category query ever asks for page_size=200 (backend max is 100)
 * - row/empty-state navigation uses SPA `router.push` (no full reload)
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProductsPage from '@/app/[locale]/admin/products/page';
import AdminProductCategoriesPage from '@/app/[locale]/admin/products/categories/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';
import { useAuthStore } from '@/stores/auth-store';
import type { ProductListItem, ProductCategory, User } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  // Phase 9.3-A — list pages read the URL as the source of truth. The
  // default (empty) URL keeps every pre-existing assertion on defaults.
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/fa/admin/products',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Params captured on EVERY render (the mocked hook is called per render, so
// intermediate renders are observable — exactly what the debounce must hide).
const productParamsCalls: Record<string, string>[] = [];
const categoryParamsCalls: Record<string, string>[] = [];
let productListData: { results: ProductListItem[]; count: number } = { results: [], count: 0 };
let categoryListData: { results: ProductCategory[]; count: number } = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminProducts: (params?: Record<string, string>) => {
    productParamsCalls.push({ ...(params ?? {}) });
    return { data: productListData, isLoading: false, error: null, refetch: vi.fn() };
  },
  useAdminProductCategories: (params?: Record<string, string>) => {
    categoryParamsCalls.push({ ...(params ?? {}) });
    return { data: categoryListData, isLoading: false, error: null, refetch: vi.fn() };
  },
  useUpdateAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDuplicateAdminProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDuplicateAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
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

const searchesOf = (calls: Record<string, string>[]) => calls.map((c) => c.search);

beforeEach(() => {
  vi.useFakeTimers();
  productParamsCalls.length = 0;
  categoryParamsCalls.length = 0;
  productListData = { results: [], count: 0 };
  categoryListData = { results: [], count: 0 };
  useAuthStore.setState({ user: { role: 'content_manager' } as unknown as User });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
});

const productRow = {
  id: 'p1',
  title: 'پنل خورشیدی',
  slug: 'panel',
  short_description: '',
  sku: 'SKU-1',
  category: null,
  cover_image_url: '',
  status: 'draft',
  visibility: 'public',
  is_active: true,
  is_featured: false,
  sort_order: 0,
  price: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  published_at: null,
} as unknown as ProductListItem;

const categoryRow = {
  id: 'c1',
  title: 'دسته آزمایشی',
  slug: 'cat-1',
  parent: null,
  sort_order: 0,
  is_active: true,
  is_featured: false,
} as unknown as ProductCategory;

describe('Admin products list — search debounce', () => {
  it('input is immediate; A → AB → ABC issues one final query, never intermediates', () => {
    render(<AdminProductsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_products') as HTMLInputElement;

    // Initial query has no search param.
    expect(productParamsCalls.length).toBeGreaterThan(0);
    expect(searchesOf(productParamsCalls).every((s) => s === undefined)).toBe(true);

    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    // Inside the window: intermediate values never reach the query.
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(searchesOf(productParamsCalls)).not.toContain('A');
    expect(searchesOf(productParamsCalls)).not.toContain('AB');
    expect(searchesOf(productParamsCalls).every((s) => s === undefined)).toBe(true);

    // After the window: exactly the final value.
    advance(50);
    const searches = searchesOf(productParamsCalls);
    expect(searches[searches.length - 1]).toBe('ABC');
    expect(searches).not.toContain('A');
    expect(searches).not.toContain('AB');
  });

  it('clearing the search removes the query param (no stale results)', () => {
    render(<AdminProductsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_products') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(searchesOf(productParamsCalls).at(-1)).toBe('ABC');

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const last = productParamsCalls[productParamsCalls.length - 1];
    expect('search' in last).toBe(false);
  });

  it('typing a search resets the page to 1', () => {
    productListData = { results: [productRow], count: 45 };
    render(<AdminProductsPage />, { wrapper: wrapper() });

    // Go to page 2 via the pager.
    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(productParamsCalls[productParamsCalls.length - 1].page).toBe('2');

    // Typing resets the page immediately (the debounced search follows).
    const input = screen.getByLabelText('admin.search_products') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'پنل' } });
    expect(productParamsCalls[productParamsCalls.length - 1].page).toBe('1');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const last = productParamsCalls[productParamsCalls.length - 1];
    expect(last.page).toBe('1');
    expect(last.search).toBe('پنل');
  });
});

describe('Admin product categories list — search debounce + page size', () => {
  it('input is immediate; rapid typing issues one final query, never intermediates', () => {
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(searchesOf(categoryParamsCalls).every((s) => s === undefined)).toBe(true);

    advance(50);
    const searches = searchesOf(categoryParamsCalls);
    expect(searches[searches.length - 1]).toBe('ABC');
    expect(searches).not.toContain('A');
    expect(searches).not.toContain('AB');
  });

  it('clearing the search removes the query param (no stale results)', () => {
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(searchesOf(categoryParamsCalls).at(-1)).toBe('ABC');

    fireEvent.change(input, { target: { value: '' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect('search' in categoryParamsCalls[categoryParamsCalls.length - 1]).toBe(false);
  });

  it('never requests page_size=200; uses the backend-supported max (100)', () => {
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);

    expect(categoryParamsCalls.length).toBeGreaterThan(0);
    for (const params of categoryParamsCalls) {
      expect(params.page_size).not.toBe('200');
      expect(Number(params.page_size)).toBeLessThanOrEqual(100);
    }
    expect(categoryParamsCalls[categoryParamsCalls.length - 1]).toMatchObject({
      page_size: '100',
      search: 'ABC',
    });
  });

  it('product list category prefetch also stays within the backend max', () => {
    render(<AdminProductsPage />, { wrapper: wrapper() });
    const catCalls = categoryParamsCalls.filter((c) => 'page_size' in c);
    expect(catCalls.length).toBeGreaterThan(0);
    for (const params of catCalls) {
      expect(params.page_size).not.toBe('200');
      expect(Number(params.page_size)).toBeLessThanOrEqual(100);
    }
  });
});

describe('Admin lists — SPA navigation (no full-page reload)', () => {
  it('products empty-state create action navigates via the SPA router', () => {
    render(<AdminProductsPage />, { wrapper: wrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'admin.create_first_product' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/products/new');
  });

  it('product row edit navigates via the SPA router to the edit page', async () => {
    // Base UI floating menus need real timers for positioning.
    vi.useRealTimers();
    productListData = { results: [productRow], count: 1 };
    const { container } = render(<AdminProductsPage />, { wrapper: wrapper() });
    expect(screen.getByText('پنل خورشیدی')).toBeTruthy();

    const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger!);
    await screen.findByText('admin.edit');
    fireEvent.click(screen.getByText('admin.edit'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/products/p1/edit'));
  });

  it('categories empty-state create action navigates via the SPA router', () => {
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'admin.create_first_category' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/products/categories/new');
  });

  it('category row edit and add-child navigate via the SPA router', async () => {
    // Base UI floating menus need real timers for positioning.
    vi.useRealTimers();
    categoryListData = { results: [categoryRow], count: 1 };
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    expect(screen.getByText('دسته آزمایشی')).toBeTruthy();

    const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger!);
    await screen.findByText('admin.edit');
    fireEvent.click(screen.getByText('admin.edit'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/products/categories/c1/edit'));

    pushMock.mockClear();
    fireEvent.click(trigger!);
    await screen.findByText('admin.add_child');
    fireEvent.click(screen.getByText('admin.add_child'));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/admin/products/categories/new?parent=c1'),
    );
  });
});

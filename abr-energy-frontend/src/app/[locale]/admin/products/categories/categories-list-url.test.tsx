/**
 * Phase 9.3-A — product categories list URL persistence.
 *
 * Covers the filter state that actually exists on this page (search +
 * active + featured + parent). This list is intentionally a single tree
 * fetch (`page_size=100`, no pager), so NO `page` is persisted: the suite
 * proves a stray `?page=` is ignored and no fake pagination exists.
 * Deep-link reconstruction, debounced search → replace, filter → replace,
 * invalid values fail safe, back/forward reconstruction, query alignment.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProductCategoriesPage from '@/app/[locale]/admin/products/categories/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';
import type { ProductCategory } from '@/types';

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
  usePathname: () => '/fa/admin/products/categories',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const categoryParamsCalls: Record<string, string>[] = [];
let categoryListData: { results: ProductCategory[]; count: number } = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminProductCategories: (params?: Record<string, string>) => {
    categoryParamsCalls.push({ ...(params ?? {}) });
    return { data: categoryListData, isLoading: false, error: null, refetch: vi.fn() };
  },
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

const lastParams = () => categoryParamsCalls[categoryParamsCalls.length - 1];

const parentA = {
  id: 'p1', title: 'دسته والد الف', slug: 'parent-a', parent: null,
  sort_order: 0, is_active: false, is_featured: true,
} as unknown as ProductCategory;
const parentB = {
  id: 'p2', title: 'دسته والد ب', slug: 'parent-b', parent: null,
  sort_order: 1, is_active: true, is_featured: false,
} as unknown as ProductCategory;
const childA = {
  id: 'c1', title: 'زیردسته الف', slug: 'child-a', parent: 'p1',
  sort_order: 0, is_active: true, is_featured: false,
} as unknown as ProductCategory;

beforeEach(() => {
  vi.useFakeTimers();
  currentQuery = '';
  categoryParamsCalls.length = 0;
  categoryListData = { results: [], count: 0 };
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Categories list — deep-link / refresh reconstruction (Phase 9.3-A)', () => {
  it('initializes search + active + featured + parent from the URL', () => {
    categoryListData = { results: [parentA, parentB, childA], count: 3 };
    setUrl('?search=solar&active=inactive&featured=true&parent=p1');
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('solar');
    expect(lastParams()).toMatchObject({
      search: 'solar', is_active: 'false', is_featured: 'true', parent: 'p1', page_size: '100',
    });
    expect('page' in lastParams()).toBe(false);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('ignores a stray page param — no fake pagination exists', () => {
    categoryListData = { results: [parentA], count: 1 };
    setUrl('?search=x&page=3');
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ search: 'x', page_size: '100' });
    expect('page' in lastParams()).toBe(false);
    // No pager is ever rendered for this single-fetch tree list.
    expect(screen.queryByRole('button', { name: 'common.next' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'common.previous' })).toBeNull();
  });

  it('invalid values fail safely to defaults', () => {
    setUrl('?active=bogus&featured=yes&parent=');
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ page_size: '100' });
    expect('is_active' in lastParams()).toBe(false);
    expect('is_featured' in lastParams()).toBe(false);
    expect('parent' in lastParams()).toBe(false);
  });
});

describe('Categories list — search commits debounced via replace (Phase 9.3-A)', () => {
  it('rapid typing produces one replace with the final value', () => {
    categoryListData = { results: [parentA], count: 1 };
    render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'AB' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(replaceMock).not.toHaveBeenCalled();

    advance(50);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products/categories?search=AB');
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('Categories list — filters replace the URL (Phase 9.3-A)', () => {
  it('active change replaces the URL', async () => {
    vi.useRealTimers();
    categoryListData = { results: [parentA, parentB], count: 2 };
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });

    // Trigger order: status(active), featured, parent.
    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(3);
    fireEvent.click(triggers[0]);
    const inactiveOption = await screen.findByRole('option', { name: 'admin.filter_inactive' });
    fireEvent.pointerDown(inactiveOption);
    fireEvent.click(inactiveOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products/categories?active=inactive');
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('parent change replaces the URL with the parent id', async () => {
    vi.useRealTimers();
    categoryListData = { results: [parentA, parentB, childA], count: 3 };
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    fireEvent.click(triggers[2]);
    const parentOption = await screen.findByRole('option', { name: 'دسته والد ب' });
    fireEvent.pointerDown(parentOption);
    fireEvent.click(parentOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/products/categories?parent=p2');
    });
  });
});

describe('Categories list — back/forward reconstructs from the URL (Phase 9.3-A)', () => {
  it('external URL change restores search + filters without resurrection', () => {
    categoryListData = { results: [parentA, parentB, childA], count: 3 };
    setUrl('?search=solar&active=inactive&featured=true');
    const { rerender } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('solar');

    setUrl('');
    rerender(<AdminProductCategoriesPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('');
    expect(lastParams()).toMatchObject({ page_size: '100' });
    expect('search' in lastParams()).toBe(false);
    expect('is_active' in lastParams()).toBe(false);
    expect('is_featured' in lastParams()).toBe(false);
    expect(replaceMock).not.toHaveBeenCalled();

    setUrl('?search=solar&active=inactive&featured=true');
    rerender(<AdminProductCategoriesPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({
      search: 'solar', is_active: 'false', is_featured: 'true', page_size: '100',
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

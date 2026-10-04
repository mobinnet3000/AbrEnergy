/**
 * Phase 9.4 — product category duplicate (clone) action.
 *
 * Mirrors the product duplicate suite: visibility gating, exactly-one-POST,
 * per-item pending/disabled state, success toast + navigation to the
 * RETURNED duplicate id, error mapping, no dirty dialog, URL state intact.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminProductCategoriesPage from '@/app/[locale]/admin/products/categories/page';
import { useAuthStore } from '@/stores/auth-store';
import type { ProductCategory, User } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/fa/admin/products/categories',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

let categoryListData: { results: ProductCategory[]; count: number } = { results: [], count: 0 };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let duplicateMutate: (...args: any[]) => void = () => {};

vi.mock('@/hooks/use-api', () => ({
  useAdminProductCategories: () => ({ data: categoryListData, isLoading: false, error: null, refetch: vi.fn() }),
  useUpdateAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminProductCategory: () => ({ mutate: vi.fn(), isPending: false }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDuplicateAdminProductCategory: () => ({ mutate: (...args: any[]) => duplicateMutate(...args), isPending: false }),
}));

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const categoryRow = {
  id: 'c1',
  title: 'دسته آزمایشی',
  slug: 'cat-1',
  parent: null,
  sort_order: 0,
  is_active: true,
  is_featured: false,
} as unknown as ProductCategory;

beforeEach(() => {
  categoryListData = { results: [categoryRow], count: 1 };
  duplicateMutate = vi.fn();
  useAuthStore.setState({ user: { role: 'content_manager' } as unknown as User });
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
});

async function openMenu(container: HTMLElement) {
  const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
  expect(trigger).toBeTruthy();
  fireEvent.click(trigger!);
  await screen.findByText('admin.duplicate');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastMutateOptions(): { onSuccess: (d: any) => void; onError: (e: any) => void } {
  const calls = (duplicateMutate as ReturnType<typeof vi.fn>).mock.calls;
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe('c1');
  return calls[0][1];
}

describe('Admin categories — duplicate action visibility', () => {
  it('renders Duplicate for managers', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    expect(screen.getByText('admin.duplicate')).toBeTruthy();
  });

  it('hides row actions (no Duplicate) for read-only roles', () => {
    useAuthStore.setState({ user: { role: 'customer' } as unknown as User });
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    expect(screen.getByText('دسته آزمایشی')).toBeTruthy();
    expect(container.querySelector('[data-slot="dropdown-menu-trigger"]')).toBeNull();
    expect(screen.queryByText('admin.duplicate')).toBeNull();
  });
});

describe('Admin categories — duplicate request behavior', () => {
  it('issues exactly one POST per click and blocks double-submit while pending', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    expect((duplicateMutate as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);

    await openMenu(container);
    const item = screen.getByText('admin.duplicate');
    expect(item.closest('[data-disabled]') ?? container.querySelector('.animate-spin')).toBeTruthy();
    fireEvent.click(item);
    expect((duplicateMutate as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('on success toasts and navigates to the RETURNED duplicate id', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    lastMutateOptions().onSuccess({ id: 'dup-cat-9' });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('admin.category_duplicated'));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/products/categories/dup-cat-9/edit');
    expect(pushMock.mock.calls[0][0]).not.toContain('c1');
  });

  it('does not trigger a dirty-navigation dialog and leaves URL state alone', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    lastMutateOptions().onSuccess({ id: 'dup-cat-3' });
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('admin.unsaved_changes_title')).toBeNull();
    expect(screen.queryByText('admin.unsaved_changes')).toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

describe('Admin categories — duplicate error mapping', () => {
  it('403 surfaces permission_denied with no navigation', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    lastMutateOptions().onError({
      response: { status: 403, data: { status: 403, errors: { detail: 'Forbidden' } } },
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.permission_denied'));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('network failure surfaces server_connection_failed', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    lastMutateOptions().onError({ code: 'ERR_NETWORK', message: 'Network Error', request: {} });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.server_connection_failed'));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('400 validation surfaces field context (never [object Object])', async () => {
    const { container } = render(<AdminProductCategoriesPage />, { wrapper: wrapper() });
    await openMenu(container);
    fireEvent.click(screen.getByText('admin.duplicate'));
    lastMutateOptions().onError({
      response: { status: 400, data: { status: 400, errors: { slug: ['already exists'] } } },
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
      const msg = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain('slug');
      expect(msg).not.toContain('[object Object]');
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});

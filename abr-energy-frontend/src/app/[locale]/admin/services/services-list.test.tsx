/**
 * Phase 9.2 — services admin list.
 *
 * Covers the existing `/admin/services/` capabilities as consumed by the
 * admin UI: search (immediate input, debounced server query), status +
 * featured filters, pagination, loading / empty / error (+retry) states,
 * and the new row actions (Edit + View).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminServicesPage from '@/app/[locale]/admin/services/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';

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
  usePathname: () => '/fa/admin/services',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const serviceParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };
let listLoading = false;
let listError: unknown = null;

vi.mock('@/hooks/use-api', () => ({
  useAdminServices: (params?: Record<string, string>) => {
    serviceParamsCalls.push({ ...(params ?? {}) });
    return { data: listData, isLoading: listLoading, error: listError, refetch: refetchMock };
  },
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

const activeRow = {
  id: 's1',
  title: 'نصب پنل',
  slug: 'panel-install',
  category_title: 'نصب',
  status: 'active',
  is_featured: true,
  created_at: '2026-09-01T00:00:00Z',
};

const inactiveRow = {
  id: 's2',
  title: 'تعمیرات',
  slug: 'repairs',
  category_title: '-',
  status: 'inactive',
  is_featured: false,
  created_at: '2026-09-03T00:00:00Z',
};

beforeEach(() => {
  vi.useFakeTimers();
  serviceParamsCalls.length = 0;
  listData = { results: [], count: 0 };
  listLoading = false;
  listError = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Admin services list — search debounce (Phase 9.2)', () => {
  it('initial query carries page/page_size and no search', () => {
    render(<AdminServicesPage />, { wrapper: wrapper() });
    expect(serviceParamsCalls.length).toBeGreaterThan(0);
    expect(serviceParamsCalls[0]).toMatchObject({ page: '1', page_size: '20' });
    expect('search' in serviceParamsCalls[0]).toBe(false);
  });

  it('input is immediate; rapid typing issues one final query, never intermediates', () => {
    render(<AdminServicesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(searchesOf(serviceParamsCalls).every((s) => s === undefined)).toBe(true);

    advance(50);
    const searches = searchesOf(serviceParamsCalls);
    expect(searches[searches.length - 1]).toBe('ABC');
    expect(searches).not.toContain('A');
    expect(searches).not.toContain('AB');
  });

  it('clearing the search removes the query param (no stale results)', () => {
    render(<AdminServicesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(searchesOf(serviceParamsCalls).at(-1)).toBe('ABC');

    fireEvent.change(input, { target: { value: '' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect('search' in serviceParamsCalls[serviceParamsCalls.length - 1]).toBe(false);
  });

  it('typing a search resets the page to 1', () => {
    listData = { results: [activeRow], count: 45 };
    render(<AdminServicesPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(serviceParamsCalls[serviceParamsCalls.length - 1].page).toBe('2');

    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'نصب' } });
    expect(serviceParamsCalls[serviceParamsCalls.length - 1].page).toBe('1');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const last = serviceParamsCalls[serviceParamsCalls.length - 1];
    expect(last.page).toBe('1');
    expect(last.search).toBe('نصب');
  });
});

describe('Admin services list — filters + pagination (Phase 9.2)', () => {
  it('status + featured filters are sent, reset the page, and persist across pages', async () => {
    // Base UI floating menus need real timers for positioning.
    vi.useRealTimers();
    listData = { results: [activeRow], count: 45 };
    const { container } = render(<AdminServicesPage />, { wrapper: wrapper() });

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(2);

    fireEvent.click(triggers[0]);
    // Base UI commits an item click only after pointerdown on the item.
    const activeOption = await screen.findByRole('option', { name: 'admin.active' });
    fireEvent.pointerDown(activeOption);
    fireEvent.click(activeOption);
    await waitFor(() => {
      const last = serviceParamsCalls[serviceParamsCalls.length - 1];
      expect(last.status).toBe('active');
      expect(last.page).toBe('1');
    });

    fireEvent.click(triggers[1]);
    const featuredOption = await screen.findByRole('option', { name: 'admin.filter_featured' });
    fireEvent.pointerDown(featuredOption);
    fireEvent.click(featuredOption);
    await waitFor(() => {
      const last = serviceParamsCalls[serviceParamsCalls.length - 1];
      expect(last).toMatchObject({ status: 'active', is_featured: 'true', page: '1' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    await waitFor(() => {
      const last = serviceParamsCalls[serviceParamsCalls.length - 1];
      expect(last).toMatchObject({ status: 'active', is_featured: 'true', page: '2', page_size: '20' });
    });
  });
});

describe('Admin services list — loading / empty / error (Phase 9.2)', () => {
  it('loading renders the shared TableLoading (no table yet)', () => {
    listLoading = true;
    const { container } = render(<AdminServicesPage />, { wrapper: wrapper() });
    expect(container.querySelector('table')).toBeNull();
  });

  it('empty renders EmptyState with the SPA create action', () => {
    listData = { results: [], count: 0 };
    render(<AdminServicesPage />, { wrapper: wrapper() });
    // PageHeader title + EmptyState title share the same key.
    expect(screen.getAllByText('admin.all_services').length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'admin.create_service' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/services/new');
  });

  it('error renders ErrorState with retry', () => {
    listError = { response: { status: 500 } };
    render(<AdminServicesPage />, { wrapper: wrapper() });
    expect(screen.getByText('admin.failed_load_services')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.try_again' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Admin services list — rows and actions (Phase 9.2)', () => {
  it('rows keep status semantics and expose Edit + View actions', () => {
    listData = { results: [activeRow, inactiveRow], count: 2 };
    const { container } = render(<AdminServicesPage />, { wrapper: wrapper() });
    expect(screen.getByText('نصب پنل')).toBeTruthy();
    expect(screen.getByText('تعمیرات')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByText('inactive')).toBeTruthy();

    const editLinks = container.querySelectorAll('a[aria-label="Edit"]');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].getAttribute('href')).toBe('/admin/services/s1/edit');
    const viewLinks = container.querySelectorAll('a[aria-label="View"]');
    expect(viewLinks.length).toBe(2);
    expect(viewLinks[0].getAttribute('href')).toBe('/services/panel-install');
    expect(viewLinks[0].getAttribute('target')).toBe('_blank');
  });
});

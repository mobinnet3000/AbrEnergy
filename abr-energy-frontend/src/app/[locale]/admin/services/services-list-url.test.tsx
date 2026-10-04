/**
 * Phase 9.3-A — services admin list URL persistence.
 *
 * Covers the controls this list actually renders (search + status +
 * featured + page): deep-link reconstruction, debounced search → replace,
 * no intermediate URL writes, filter → replace + page reset, pager → push,
 * invalid values fail safe, back/forward reconstruction, query alignment.
 * (Same harness contract as the articles URL suite.)
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminServicesPage from '@/app/[locale]/admin/services/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';

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
  usePathname: () => '/fa/admin/services',
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const serviceParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminServices: (params?: Record<string, string>) => {
    serviceParamsCalls.push({ ...(params ?? {}) });
    return { data: listData, isLoading: false, error: null, refetch: refetchMock };
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

const lastParams = () => serviceParamsCalls[serviceParamsCalls.length - 1];

const serviceRow = {
  id: 's1', title: 'سرویس پشتیبان', slug: 'backup', status: 'active',
  category_title: '-', is_featured: true, created_at: '2026-09-01T00:00:00Z',
};

beforeEach(() => {
  vi.useFakeTimers();
  currentQuery = '';
  serviceParamsCalls.length = 0;
  listData = { results: [], count: 0 };
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Services list — deep-link / refresh reconstruction (Phase 9.3-A)', () => {
  it('initializes search + status + featured + page from the URL', () => {
    listData = { results: [serviceRow], count: 45 };
    setUrl('?search=backup&status=active&featured=true&page=2');
    render(<AdminServicesPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('backup');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(lastParams()).toMatchObject({
      search: 'backup', status: 'active', is_featured: 'true', page: '2', page_size: '20',
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('invalid values fail safely to defaults', () => {
    setUrl('?status=bogus&featured=yes&page=-2');
    render(<AdminServicesPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ page: '1', page_size: '20' });
    expect('status' in lastParams()).toBe(false);
    expect('is_featured' in lastParams()).toBe(false);
  });
});

describe('Services list — search commits debounced via replace (Phase 9.3-A)', () => {
  it('rapid typing produces one replace with the final value (never push, never intermediates)', () => {
    render(<AdminServicesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'AB' } });
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(replaceMock).not.toHaveBeenCalled();

    advance(50);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/services?search=ABC');
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('Services list — filters replace + reset page; pager pushes (Phase 9.3-A)', () => {
  it('status + featured changes replace the URL and drop page=1', async () => {
    vi.useRealTimers();
    listData = { results: [serviceRow], count: 45 };
    setUrl('?search=backup&page=2');
    const { container } = render(<AdminServicesPage />, { wrapper: wrapper() });

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(2);
    fireEvent.click(triggers[0]);
    const activeOption = await screen.findByRole('option', { name: 'admin.active' });
    fireEvent.pointerDown(activeOption);
    fireEvent.click(activeOption);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/services?search=backup&status=active');
    });

    replaceMock.mockClear();
    fireEvent.click(triggers[1]);
    const featuredOption = await screen.findByRole('option', { name: 'admin.filter_featured' });
    fireEvent.pointerDown(featuredOption);
    fireEvent.click(featuredOption);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/fa/admin/services?search=backup&status=active&featured=true',
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(lastParams()).toMatchObject({
        search: 'backup', status: 'active', is_featured: 'true', page: '1',
      });
    });
  });

  it('pager pushes the URL', () => {
    listData = { results: [serviceRow], count: 45 };
    render(<AdminServicesPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/fa/admin/services?page=2');
  });
});

describe('Services list — back/forward reconstructs from the URL (Phase 9.3-A)', () => {
  it('external URL change restores search + status + featured + page without resurrection', () => {
    listData = { results: [serviceRow], count: 45 };
    setUrl('?search=backup&status=active&featured=true&page=2');
    const { rerender } = render(<AdminServicesPage />, { wrapper: wrapper() });
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('backup');

    setUrl('');
    rerender(<AdminServicesPage />);
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({ page: '1' });
    expect('search' in lastParams()).toBe(false);
    expect('status' in lastParams()).toBe(false);
    expect('is_featured' in lastParams()).toBe(false);
    expect(replaceMock).not.toHaveBeenCalled();

    setUrl('?search=backup&status=active&featured=true&page=2');
    rerender(<AdminServicesPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({
      search: 'backup', status: 'active', is_featured: 'true', page: '2',
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

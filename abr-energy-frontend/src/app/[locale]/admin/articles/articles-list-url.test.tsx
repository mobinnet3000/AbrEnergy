/**
 * Phase 9.3-A — articles admin list URL persistence.
 *
 * Proves the URL is the source of truth for the controls this list actually
 * renders (search + status + page):
 * - deep-link / refresh reconstruction from a non-default URL
 * - search commits to the URL after the 300 ms debounce via `replace`
 *   (never `push`, never intermediate values)
 * - filter changes replace the URL and reset the page (page=1 omitted)
 * - pagination pushes the URL (Back returns to the previous page)
 * - invalid values fail safely; back/forward reconstructs from the URL
 * - React Query params stay aligned with the URL
 *
 * Router-application is simulated explicitly: `setUrl()` mutates the mocked
 * query and `rerender()` re-reads it — the same round-trip a real
 * `router.push/replace` performs. No browser automation exists in this repo
 * (same standing as all prior phases); component-level URL-driven state is
 * the provable surface.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminArticlesPage from '@/app/[locale]/admin/articles/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

// Mutable mocked URL: tests set it via setUrl() and re-render, mirroring a
// real router applying a push/replace (or back/forward, or a fresh load).
let currentQuery = '';
const pushMock = vi.fn();
const replaceMock = vi.fn();
// Stable router identity, matching the real App Router (which returns the
// same instance across renders — the sync effects correctly depend on it).
const routerMock = { push: pushMock, replace: replaceMock };
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(currentQuery),
  usePathname: () => '/fa/admin/articles',
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const articleParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminArticles: (params?: Record<string, string>) => {
    articleParamsCalls.push({ ...(params ?? {}) });
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

const lastParams = () => articleParamsCalls[articleParamsCalls.length - 1];

const draftRow = {
  id: 'a1', title: 'مقاله پیش‌نویس', slug: 'draft-article', status: 'draft',
  category_title: '-', view_count: 3, created_at: '2026-09-01T00:00:00Z',
};

beforeEach(() => {
  vi.useFakeTimers();
  currentQuery = '';
  articleParamsCalls.length = 0;
  listData = { results: [], count: 0 };
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Articles list — deep-link / refresh reconstruction (Phase 9.3-A)', () => {
  it('initializes search + status + page from the URL and aligns the query', () => {
    listData = { results: [draftRow], count: 45 };
    setUrl('?search=panel&status=draft&page=2');
    render(<AdminArticlesPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('panel');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(lastParams()).toMatchObject({ search: 'panel', status: 'draft', page: '2', page_size: '20' });
    // Mount with a matching URL performs no navigation.
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('invalid values fail safely to defaults', () => {
    setUrl('?status=bogus&page=abc');
    render(<AdminArticlesPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('');
    expect(lastParams()).toMatchObject({ page: '1', page_size: '20' });
    expect('status' in lastParams()).toBe(false);
    expect('search' in lastParams()).toBe(false);
  });
});

describe('Articles list — search commits to the URL debounced via replace (Phase 9.3-A)', () => {
  it('input is immediate; URL updates once after 300 ms with replace (never push)', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'panel' } });
    expect(input.value).toBe('panel');
    // No URL write before the debounce settles.
    expect(replaceMock).not.toHaveBeenCalled();

    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/articles?search=panel');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('rapid typing produces no intermediate URL updates', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'AB' } });
    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(replaceMock).not.toHaveBeenCalled();

    advance(50);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/articles?search=ABC');
    const urls = replaceMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u === '/fa/admin/articles?search=A')).toBe(false);
    expect(urls.some((u) => u === '/fa/admin/articles?search=AB')).toBe(false);
  });

  it('applying the committed URL aligns the query (no stale data)', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'panel' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const url = String(replaceMock.mock.calls[0][0]);
    expect(url).toBe('/fa/admin/articles?search=panel');
    // Real router applies the URL → list re-reads it; query follows.
    setUrl(url.split('?')[1]);
    expect(lastParams()).toMatchObject({ search: 'panel', page: '1' });
  });
});

describe('Articles list — filter resets page via replace; pager pushes (Phase 9.3-A)', () => {
  it('status change replaces the URL and drops page=1', async () => {
    vi.useRealTimers();
    listData = { results: [draftRow], count: 45 };
    setUrl('?search=panel&page=2');
    const { container } = render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(screen.getByText('2 / 3')).toBeTruthy();

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    fireEvent.click(triggers[0]);
    const draftOption = await screen.findByRole('option', { name: 'admin.draft' });
    fireEvent.pointerDown(draftOption);
    fireEvent.click(draftOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/articles?search=panel&status=draft');
    });
    expect(pushMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(lastParams()).toMatchObject({ search: 'panel', status: 'draft', page: '1' });
    });
  });

  it('pager pushes the URL so Back returns to the previous page', () => {
    listData = { results: [draftRow], count: 45 };
    render(<AdminArticlesPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/fa/admin/articles?page=2');
    expect(lastParams()).toMatchObject({ page: '2' });
  });
});

describe('Articles list — back/forward reconstructs from the URL (Phase 9.3-A)', () => {
  it('external URL change restores search + status + page', () => {
    listData = { results: [draftRow], count: 45 };
    setUrl('?search=panel&status=draft&page=2');
    const { rerender } = render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('panel');

    // Browser Back to the plain list: the input restores immediately; the
    // query follows once the re-synced input settles through the debounce.
    setUrl('');
    rerender(<AdminArticlesPage />);
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({ page: '1' });
    expect('search' in lastParams()).toBe(false);
    expect('status' in lastParams()).toBe(false);
    // The stale debounced search must never resurrect itself into the URL.
    expect(replaceMock).not.toHaveBeenCalled();

    // Browser Forward restores everything.
    setUrl('?search=panel&status=draft&page=2');
    rerender(<AdminArticlesPage />);
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('panel');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({ search: 'panel', status: 'draft', page: '2' });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

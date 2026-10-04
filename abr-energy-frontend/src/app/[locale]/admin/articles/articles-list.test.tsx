/**
 * Phase 9.2 — articles admin list.
 *
 * Covers the existing `/admin/articles/` capabilities as consumed by the
 * admin UI: search (immediate input, debounced server query), status filter,
 * pagination, loading / empty / error (+retry) states, and the preserved
 * row actions + published/draft semantics.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminArticlesPage from '@/app/[locale]/admin/articles/page';
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
  usePathname: () => '/fa/admin/articles',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const articleParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };
let listLoading = false;
let listError: unknown = null;

vi.mock('@/hooks/use-api', () => ({
  useAdminArticles: (params?: Record<string, string>) => {
    articleParamsCalls.push({ ...(params ?? {}) });
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

const draftRow = {
  id: 'a1',
  title: 'مقاله پیش‌نویس',
  slug: 'draft-article',
  status: 'draft',
  category_title: 'دسته الف',
  view_count: 3,
  created_at: '2026-09-01T00:00:00Z',
};

const publishedRow = {
  id: 'a2',
  title: 'مقاله منتشرشده',
  slug: 'published-article',
  status: 'published',
  category_title: '-',
  view_count: 41,
  created_at: '2026-09-02T00:00:00Z',
};

beforeEach(() => {
  vi.useFakeTimers();
  articleParamsCalls.length = 0;
  listData = { results: [], count: 0 };
  listLoading = false;
  listError = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Admin articles list — search debounce (Phase 9.2)', () => {
  it('initial query carries page/page_size and no search', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(articleParamsCalls.length).toBeGreaterThan(0);
    expect(articleParamsCalls[0]).toMatchObject({ page: '1', page_size: '20' });
    expect('search' in articleParamsCalls[0]).toBe(false);
    expect('status' in articleParamsCalls[0]).toBe(false);
  });

  it('input is immediate; A → AB → ABC issues one final query, never intermediates', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(searchesOf(articleParamsCalls).every((s) => s === undefined)).toBe(true);

    advance(50);
    const searches = searchesOf(articleParamsCalls);
    expect(searches[searches.length - 1]).toBe('ABC');
    expect(searches).not.toContain('A');
    expect(searches).not.toContain('AB');
  });

  it('clearing the search removes the query param (no stale results)', () => {
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(searchesOf(articleParamsCalls).at(-1)).toBe('ABC');

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect('search' in articleParamsCalls[articleParamsCalls.length - 1]).toBe(false);
  });

  it('typing a search resets the page to 1', () => {
    listData = { results: [draftRow], count: 45 };
    render(<AdminArticlesPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(articleParamsCalls[articleParamsCalls.length - 1].page).toBe('2');

    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'خورشید' } });
    expect(articleParamsCalls[articleParamsCalls.length - 1].page).toBe('1');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const last = articleParamsCalls[articleParamsCalls.length - 1];
    expect(last.page).toBe('1');
    expect(last.search).toBe('خورشید');
  });
});

describe('Admin articles list — status filter + pagination (Phase 9.2)', () => {
  it('status filter is sent, resets the page, and is preserved during pagination', async () => {
    // Base UI floating menus need real timers for positioning.
    vi.useRealTimers();
    listData = { results: [draftRow], count: 45 };
    const { container } = render(<AdminArticlesPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(articleParamsCalls[articleParamsCalls.length - 1].page).toBe('2');

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(1);
    fireEvent.click(triggers[0]);
    // Base UI commits an item click only after pointerdown on the item.
    const draftOption = await screen.findByRole('option', { name: 'admin.draft' });
    fireEvent.pointerDown(draftOption);
    fireEvent.click(draftOption);
    await waitFor(() => {
      const last = articleParamsCalls[articleParamsCalls.length - 1];
      expect(last.status).toBe('draft');
      expect(last.page).toBe('1');
    });

    // Pagination preserves the selected filter.
    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    await waitFor(() => {
      const last = articleParamsCalls[articleParamsCalls.length - 1];
      expect(last).toMatchObject({ status: 'draft', page: '2', page_size: '20' });
    });
  });

  it('pager navigates pages and preserves filters', () => {
    listData = { results: [draftRow], count: 45 };
    render(<AdminArticlesPage />, { wrapper: wrapper() });

    expect(screen.getByText('1 / 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(articleParamsCalls[articleParamsCalls.length - 1]).toMatchObject({ page: '2', page_size: '20' });
  });

  it('single-page result hides the pager', () => {
    listData = { results: [draftRow], count: 1 };
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(screen.queryByRole('button', { name: 'common.next' })).toBeNull();
  });
});

describe('Admin articles list — loading / empty / error (Phase 9.2)', () => {
  it('loading renders the shared TableLoading (no table yet)', () => {
    listLoading = true;
    const { container } = render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(container.querySelector('table')).toBeNull();
  });

  it('empty renders EmptyState with the SPA create action', () => {
    listData = { results: [], count: 0 };
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(screen.getByText('admin.no_articles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.create_first_article' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/articles/new');
  });

  it('error renders ErrorState with retry', () => {
    listError = { response: { status: 500 } };
    render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(screen.getByText('admin.failed_load_articles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.try_again' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Admin articles list — rows preserve semantics (Phase 9.2)', () => {
  it('draft/published rows keep status text and row actions', () => {
    listData = { results: [draftRow, publishedRow], count: 2 };
    const { container } = render(<AdminArticlesPage />, { wrapper: wrapper() });
    expect(screen.getByText('مقاله پیش‌نویس')).toBeTruthy();
    expect(screen.getByText('مقاله منتشرشده')).toBeTruthy();
    expect(screen.getByText('draft')).toBeTruthy();
    expect(screen.getByText('published')).toBeTruthy();

    const editLinks = container.querySelectorAll('a[aria-label="Edit"]');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].getAttribute('href')).toBe('/admin/articles/a1');
    const viewLinks = container.querySelectorAll('a[aria-label="View"]');
    expect(viewLinks.length).toBe(2);
    expect(viewLinks[0].getAttribute('href')).toBe('/articles/draft-article');
    expect(viewLinks[0].getAttribute('target')).toBe('_blank');
  });
});

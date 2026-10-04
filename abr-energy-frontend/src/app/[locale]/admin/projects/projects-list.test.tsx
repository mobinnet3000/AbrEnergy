/**
 * Phase 9.2 — projects admin list.
 *
 * Covers the switch from the public `/projects/` endpoint to the EXISTING
 * `/admin/projects/` endpoint, plus the consumed capabilities: search
 * (immediate input, debounced server query), featured filter, pagination,
 * loading / empty / error (+retry) states, and the preserved edit/delete
 * behavior (incl. project status semantics and cancelled-safe delete flow).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProjectsPage from '@/app/[locale]/admin/projects/page';
import { PICKER_SEARCH_DEBOUNCE_MS } from '@/hooks/use-debounced-value';
import { toast } from 'sonner';

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
  usePathname: () => '/fa/admin/projects',
}));

// Real Next Links run prefetch observers (IntersectionObserver) that jsdom
// lacks; mock to a plain anchor (href + onClick preserved, which is all the
// row/header actions rely on here).
vi.mock('next/link', () => ({
  default: ({ href, onClick, children, ...rest }: { href: string; onClick?: (e: unknown) => void; children: React.ReactNode }) => (
    <a href={href} onClick={onClick} {...rest}>{children}</a>
  ),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const projectParamsCalls: Record<string, string>[] = [];
const publicProjectsCalls: unknown[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };
let listLoading = false;
let listError: unknown = null;

const deleteMock = vi.fn();
vi.mock('@/api/axios', () => ({
  default: { delete: (...args: unknown[]) => deleteMock(...args) },
}));

vi.mock('@/hooks/use-api', () => ({
  // The admin page must use the admin hook; the public hook records any
  // accidental use so the test below can prove it stays unused.
  useAdminProjects: (params?: Record<string, string>) => {
    projectParamsCalls.push({ ...(params ?? {}) });
    return { data: listData, isLoading: listLoading, error: listError, refetch: refetchMock };
  },
  useProjects: (params?: Record<string, string>) => {
    publicProjectsCalls.push(params);
    return { data: null, isLoading: false, error: null };
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

const projectRow = {
  id: 'p1',
  title: 'پروژه تهران',
  slug: 'tehran-project',
  project_type: 'on_grid',
  location: 'تهران',
  capacity: 50,
  status: 'completed',
};

const cancelledRow = {
  id: 'p2',
  title: 'پروژه لغوشده',
  slug: 'cancelled-project',
  project_type: 'hybrid',
  location: 'اصفهان',
  capacity: 20,
  status: 'cancelled',
};

beforeEach(() => {
  vi.useFakeTimers();
  projectParamsCalls.length = 0;
  publicProjectsCalls.length = 0;
  listData = { results: [], count: 0 };
  listLoading = false;
  listError = null;
  deleteMock.mockReset();
  deleteMock.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Admin projects list — admin endpoint (Phase 9.2)', () => {
  it('uses the admin hook and never the public projects hook', () => {
    listData = { results: [projectRow], count: 1 };
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(projectParamsCalls.length).toBeGreaterThan(0);
    expect(publicProjectsCalls.length).toBe(0);
    expect(screen.getByText('پروژه تهران')).toBeTruthy();
  });

  it('initial query carries page/page_size and no search', () => {
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(projectParamsCalls[0]).toMatchObject({ page: '1', page_size: '20' });
    expect('search' in projectParamsCalls[0]).toBe(false);
  });
});

describe('Admin projects list — search debounce (Phase 9.2)', () => {
  it('input is immediate; rapid typing issues one final query, never intermediates', () => {
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    fireEvent.change(input, { target: { value: 'AB' } });
    expect(input.value).toBe('AB');
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(input.value).toBe('ABC');

    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(searchesOf(projectParamsCalls).every((s) => s === undefined)).toBe(true);

    advance(50);
    const searches = searchesOf(projectParamsCalls);
    expect(searches[searches.length - 1]).toBe('ABC');
    expect(searches).not.toContain('A');
    expect(searches).not.toContain('AB');
  });

  it('clearing the search removes the query param (no stale results)', () => {
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'ABC' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(searchesOf(projectParamsCalls).at(-1)).toBe('ABC');

    fireEvent.change(input, { target: { value: '' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect('search' in projectParamsCalls[projectParamsCalls.length - 1]).toBe(false);
  });

  it('typing a search resets the page to 1', () => {
    listData = { results: [projectRow], count: 45 };
    render(<AdminProjectsPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(projectParamsCalls[projectParamsCalls.length - 1].page).toBe('2');

    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'تهران' } });
    expect(projectParamsCalls[projectParamsCalls.length - 1].page).toBe('1');
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    const last = projectParamsCalls[projectParamsCalls.length - 1];
    expect(last.page).toBe('1');
    expect(last.search).toBe('تهران');
  });
});

describe('Admin projects list — featured filter + pagination (Phase 9.2)', () => {
  it('featured filter is sent, resets the page, and persists across pages', async () => {
    // Base UI floating menus need real timers for positioning.
    vi.useRealTimers();
    listData = { results: [projectRow], count: 45 };
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(1);

    fireEvent.click(triggers[0]);
    // Base UI commits an item click only after pointerdown on the item.
    const featuredOption = await screen.findByRole('option', { name: 'admin.filter_featured' });
    fireEvent.pointerDown(featuredOption);
    fireEvent.click(featuredOption);
    await waitFor(() => {
      const last = projectParamsCalls[projectParamsCalls.length - 1];
      expect(last).toMatchObject({ is_featured: 'true', page: '1' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    await waitFor(() => {
      const last = projectParamsCalls[projectParamsCalls.length - 1];
      expect(last).toMatchObject({ is_featured: 'true', page: '2', page_size: '20' });
    });
  });
});

describe('Admin projects list — loading / empty / error (Phase 9.2)', () => {
  it('loading renders the shared TableLoading (no table yet)', () => {
    listLoading = true;
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(container.querySelector('table')).toBeNull();
  });

  it('empty renders EmptyState with the SPA create action', () => {
    listData = { results: [], count: 0 };
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(screen.getByText('admin.no_projects')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.create_first_project' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/admin/projects/new');
  });

  it('error renders ErrorState with retry', () => {
    listError = { response: { status: 500 } };
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(screen.getByText('admin.failed_load_projects')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'admin.try_again' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Admin projects list — rows preserve semantics (Phase 9.2)', () => {
  it('rows keep type/status semantics incl. cancelled, plus edit action', () => {
    listData = { results: [projectRow, cancelledRow], count: 2 };
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(screen.getByText('پروژه تهران')).toBeTruthy();
    expect(screen.getByText('پروژه لغوشده')).toBeTruthy();
    expect(screen.getByText('completed')).toBeTruthy();
    expect(screen.getByText('cancelled')).toBeTruthy();

    const editLinks = container.querySelectorAll('a[aria-label="Edit"]');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].getAttribute('href')).toBe('/admin/projects/p1/edit');
  });

  it('delete uses the admin endpoint and confirms before deleting', async () => {
    vi.useRealTimers();
    vi.stubGlobal('confirm', vi.fn(() => true));
    listData = { results: [projectRow], count: 1 };
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });

    const deleteBtn = container.querySelector('button[aria-label="Delete"]');
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn!);
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('/admin/projects/p1/'));
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
  });

  it('delete cancellation performs no request', () => {
    vi.useRealTimers();
    vi.stubGlobal('confirm', vi.fn(() => false));
    listData = { results: [projectRow], count: 1 };
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });

    fireEvent.click(container.querySelector('button[aria-label="Delete"]')!);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

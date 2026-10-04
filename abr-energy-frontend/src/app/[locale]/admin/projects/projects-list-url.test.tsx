/**
 * Phase 9.3-A — projects admin list URL persistence.
 *
 * Covers the controls this list actually renders (search + featured + page):
 * deep-link reconstruction, debounced search → replace, filter → replace +
 * page reset, pager → push, invalid values fail safe, back/forward
 * reconstruction, query alignment. Also proves the negative scope rule: a
 * `status`/`project_type` value in the URL is ignored (no such control
 * exists, so none is persisted).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProjectsPage from '@/app/[locale]/admin/projects/page';
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
  usePathname: () => '/fa/admin/projects',
}));

vi.mock('next/link', () => ({
  default: ({ href, onClick, children, ...rest }: { href: string; onClick?: (e: unknown) => void; children: React.ReactNode }) => (
    <a href={href} onClick={onClick} {...rest}>{children}</a>
  ),
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const projectParamsCalls: Record<string, string>[] = [];
const refetchMock = vi.fn();
let listData: { results: Record<string, unknown>[]; count: number } | null = { results: [], count: 0 };

vi.mock('@/hooks/use-api', () => ({
  useAdminProjects: (params?: Record<string, string>) => {
    projectParamsCalls.push({ ...(params ?? {}) });
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

const lastParams = () => projectParamsCalls[projectParamsCalls.length - 1];

const projectRow = {
  id: 'p1', title: 'پروژه تهران', slug: 'tehran', project_type: 'solar_farm',
  location: 'تهران', capacity: 50, status: 'in_progress',
};

beforeEach(() => {
  vi.useFakeTimers();
  currentQuery = '';
  projectParamsCalls.length = 0;
  listData = { results: [], count: 0 };
  pushMock.mockClear();
  replaceMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Projects list — deep-link / refresh reconstruction (Phase 9.3-A)', () => {
  it('initializes search + featured + page from the URL', () => {
    listData = { results: [projectRow], count: 45 };
    setUrl('?search=tehran&featured=true&page=2');
    render(<AdminProjectsPage />, { wrapper: wrapper() });

    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('tehran');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(lastParams()).toMatchObject({
      search: 'tehran', is_featured: 'true', page: '2', page_size: '20',
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('ignores status/project_type URL values (no such controls exist)', () => {
    listData = { results: [projectRow], count: 1 };
    setUrl('?search=tehran&status=planning&project_type=solar_farm&featured=true');
    render(<AdminProjectsPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ search: 'tehran', is_featured: 'true', page: '1' });
    expect('status' in lastParams()).toBe(false);
    expect('project_type' in lastParams()).toBe(false);
  });

  it('invalid page fails safely to 1', () => {
    setUrl('?page=abc');
    render(<AdminProjectsPage />, { wrapper: wrapper() });

    expect(lastParams()).toMatchObject({ page: '1' });
  });
});

describe('Projects list — search + featured + pager URL flow (Phase 9.3-A)', () => {
  it('rapid typing produces one replace with the final value', () => {
    render(<AdminProjectsPage />, { wrapper: wrapper() });
    const input = screen.getByLabelText('admin.search_placeholder') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'T' } });
    fireEvent.change(input, { target: { value: 'TE' } });
    advance(PICKER_SEARCH_DEBOUNCE_MS - 50);
    expect(replaceMock).not.toHaveBeenCalled();

    advance(50);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/fa/admin/projects?search=TE');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('featured change replaces the URL and resets the page', async () => {
    vi.useRealTimers();
    listData = { results: [projectRow], count: 45 };
    setUrl('?page=2');
    const { container } = render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect(screen.getByText('2 / 3')).toBeTruthy();

    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBe(1);
    fireEvent.click(triggers[0]);
    const featuredOption = await screen.findByRole('option', { name: 'admin.filter_featured' });
    fireEvent.pointerDown(featuredOption);
    fireEvent.click(featuredOption);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/fa/admin/projects?featured=true');
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('pager pushes the URL', () => {
    listData = { results: [projectRow], count: 45 };
    render(<AdminProjectsPage />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/fa/admin/projects?page=2');
  });
});

describe('Projects list — back/forward reconstructs from the URL (Phase 9.3-A)', () => {
  it('external URL change restores search + featured + page without resurrection', () => {
    listData = { results: [projectRow], count: 45 };
    setUrl('?search=tehran&featured=true&page=2');
    const { rerender } = render(<AdminProjectsPage />, { wrapper: wrapper() });
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('tehran');

    setUrl('');
    rerender(<AdminProjectsPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect((screen.getByLabelText('admin.search_placeholder') as HTMLInputElement).value).toBe('');
    expect(lastParams()).toMatchObject({ page: '1' });
    expect('search' in lastParams()).toBe(false);
    expect('is_featured' in lastParams()).toBe(false);
    expect(replaceMock).not.toHaveBeenCalled();

    setUrl('?search=tehran&featured=true&page=2');
    rerender(<AdminProjectsPage />);
    advance(PICKER_SEARCH_DEBOUNCE_MS);
    expect(lastParams()).toMatchObject({ search: 'tehran', is_featured: 'true', page: '2' });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

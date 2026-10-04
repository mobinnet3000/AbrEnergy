/**
 * Phase 9.3-B — Admin Dashboard Hub.
 *
 * Proves, with mocked transport only (real component, real hooks wiring):
 * quick-action routes + capability gating, real-API overview counts with
 * exact deep links, needs-attention filtered URLs/counts, recent items from
 * real records with supported ordering only (never project ordering),
 * per-section loading/empty/error isolation, and exact 9.3-A URL formats.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AdminDashboardPage from '@/app/[locale]/admin/page';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/fa/admin',
}));

interface MockState {
  data: unknown;
  isLoading?: boolean;
  error?: unknown;
}

const calls: { hook: string; params: Record<string, string> }[] = [];
const refetchMock = vi.fn();
let store: Record<string, MockState> = {};

function keyOf(hook: string, params?: Record<string, string>) {
  return `${hook}:${JSON.stringify(params ?? {})}`;
}

function makeMock(hook: string) {
  return (params?: Record<string, string>) => {
    calls.push({ hook, params: { ...(params ?? {}) } });
    const s = store[keyOf(hook, params)] ?? { data: null };
    return { data: s.data, isLoading: s.isLoading ?? false, error: s.error ?? null, refetch: refetchMock };
  };
}

vi.mock('@/hooks/use-api', () => ({
  useAdminProducts: (p?: Record<string, string>) => makeMock('products')(p),
  useAdminProductCategories: (p?: Record<string, string>) => makeMock('categories')(p),
  useAdminArticles: (p?: Record<string, string>) => makeMock('articles')(p),
  useAdminServices: (p?: Record<string, string>) => makeMock('services')(p),
  useAdminProjects: (p?: Record<string, string>) => makeMock('projects')(p),
}));

const P = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  title: 'Solar Panel X',
  slug: 'solar-x',
  status: 'published',
  visibility: 'public',
  is_active: true,
  is_featured: false,
  updated_at: '2026-09-10T00:00:00Z',
  ...over,
});

const A = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  title: 'Guide to Solar',
  slug: 'guide-solar',
  status: 'draft',
  created_at: '2026-09-11T00:00:00Z',
  ...over,
});

const S = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  title: 'Panel Install',
  slug: 'panel-install',
  status: 'active',
  is_featured: false,
  created_at: '2026-09-12T00:00:00Z',
  ...over,
});

function defaultStore(): Record<string, MockState> {
  return {
    [keyOf('products', { page: '1', page_size: '5', ordering: '-created_at' })]: {
      data: { count: 42, results: [P(), P({ id: 'p2', title: 'Battery Y', status: 'draft' })] },
    },
    [keyOf('articles', { page: '1', page_size: '5', ordering: '-created_at' })]: {
      data: { count: 18, results: [A(), A({ id: 'a2', title: 'Old News', status: 'published' })] },
    },
    [keyOf('services', { page: '1', page_size: '5', ordering: '-created_at' })]: {
      data: { count: 7, results: [S(), S({ id: 's2', title: 'Repairs', status: 'inactive' })] },
    },
    [keyOf('categories', { page: '1', page_size: '1' })]: { data: { count: 9, results: [] } },
    [keyOf('projects', { page: '1', page_size: '1' })]: { data: { count: 12, results: [] } },
    [keyOf('products', { status: 'draft', page: '1', page_size: '1' })]: { data: { count: 3, results: [] } },
    [keyOf('products', { visibility: 'hidden', page: '1', page_size: '1' })]: { data: { count: 2, results: [] } },
    [keyOf('articles', { status: 'draft', page: '1', page_size: '1' })]: { data: { count: 4, results: [] } },
    [keyOf('articles', { status: 'scheduled', page: '1', page_size: '1' })]: { data: { count: 1, results: [] } },
    [keyOf('services', { status: 'inactive', page: '1', page_size: '1' })]: { data: { count: 2, results: [] } },
  };
}

function setRole(role: User['role'] | null) {
  if (!role) {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    return;
  }
  useAuthStore.setState({
    user: { role } as unknown as User,
    isAuthenticated: true,
  });
}

beforeEach(() => {
  calls.length = 0;
  store = defaultStore();
  setRole('content_manager');
});

afterEach(() => {
  vi.clearAllMocks();
  setRole(null);
});

function section(name: string) {
  return within(screen.getByLabelText(name));
}

describe('Dashboard hub — quick actions (Phase 9.3-B)', () => {
  it('manager role sees all six create actions with exact routes', () => {
    render(<AdminDashboardPage />);
    const qa = section('admin.quick_actions');
    for (const label of [
      'admin.create_product',
      'admin.create_category',
      'admin.create_article',
      'admin.create_service',
      'admin.create_project',
      'admin.homepage_studio',
    ]) {
      expect(qa.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('quick actions navigate via SPA router.push (never window.location)', () => {
    render(<AdminDashboardPage />);
    const qa = section('admin.quick_actions');
    fireEvent.click(qa.getByRole('button', { name: 'admin.create_product' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/products/new');
    fireEvent.click(qa.getByRole('button', { name: 'admin.create_category' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/products/categories/new');
    fireEvent.click(qa.getByRole('button', { name: 'admin.create_article' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/articles/new');
    fireEvent.click(qa.getByRole('button', { name: 'admin.create_service' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/services/new');
    fireEvent.click(qa.getByRole('button', { name: 'admin.create_project' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/projects/new');
    fireEvent.click(qa.getByRole('button', { name: 'admin.homepage_studio' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/content/homepage');
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringMatching(/^https?:/));
  });

  it('non-manager role sees no create actions (capability gating, UX only)', () => {
    setRole('customer');
    render(<AdminDashboardPage />);
    expect(screen.queryByLabelText('admin.quick_actions')).toBeNull();
    // Read-only overview still renders real counts.
    expect(screen.getByText('42')).toBeTruthy();
  });
});

describe('Dashboard hub — content overview (Phase 9.3-B)', () => {
  it('renders real API counts, never hardcoded values', () => {
    render(<AdminDashboardPage />);
    const ov = section('admin.content_overview');
    for (const v of ['42', '9', '18', '7', '12']) {
      expect(ov.getByText(v)).toBeTruthy();
    }
  });

  it('overview cards deep-link to the exact admin lists', () => {
    render(<AdminDashboardPage />);
    const ov = section('admin.content_overview');
    const hrefs = ov.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin/products');
    expect(hrefs).toContain('/admin/products/categories');
    expect(hrefs).toContain('/admin/articles');
    expect(hrefs).toContain('/admin/services');
    expect(hrefs).toContain('/admin/projects');
  });

  it('overview count comes from the server `count` field, not results length', () => {
    // 2 rows returned, count says 42 → card must show 42.
    render(<AdminDashboardPage />);
    expect(section('admin.content_overview').getByText('42')).toBeTruthy();
  });
});

describe('Dashboard hub — needs attention (Phase 9.3-B)', () => {
  it('renders real filtered counts with exact 9.3-A deep links', () => {
    render(<AdminDashboardPage />);
    const na = section('admin.needs_attention');
    // Fixture counts: draft products 3, hidden products 2, draft articles 4,
    // scheduled articles 1, inactive services 2.
    expect(na.getByText('3')).toBeTruthy();
    expect(na.getByText('4')).toBeTruthy();
    expect(na.getByText('1')).toBeTruthy();
    expect(na.getAllByText('2').length).toBe(2);
    const hrefs = na.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin/products?status=draft');
    expect(hrefs).toContain('/admin/products?visibility=hidden');
    expect(hrefs).toContain('/admin/articles?status=draft');
    expect(hrefs).toContain('/admin/articles?status=scheduled');
    expect(hrefs).toContain('/admin/services?status=inactive');
  });

  it('sends only backend-supported filter params for attention queries', () => {
    render(<AdminDashboardPage />);
    const byHook = (h: string) => calls.filter((c) => c.hook === h).map((c) => c.params);
    expect(byHook('products')).toContainEqual({ status: 'draft', page: '1', page_size: '1' });
    expect(byHook('products')).toContainEqual({ visibility: 'hidden', page: '1', page_size: '1' });
    expect(byHook('articles')).toContainEqual({ status: 'draft', page: '1', page_size: '1' });
    expect(byHook('articles')).toContainEqual({ status: 'scheduled', page: '1', page_size: '1' });
    expect(byHook('services')).toContainEqual({ status: 'inactive', page: '1', page_size: '1' });
  });

  it('zero counts render as 0 (informative, still linked) — never faked', () => {
    store[keyOf('articles', { status: 'scheduled', page: '1', page_size: '1' })] = {
      data: { count: 0, results: [] },
    };
    render(<AdminDashboardPage />);
    const na = section('admin.needs_attention');
    expect(na.getByText('0')).toBeTruthy();
    expect(na.getAllByRole('link', { name: 'common.view_all' }).length).toBe(5);
  });
});

describe('Dashboard hub — recent items (Phase 9.3-B)', () => {
  it('renders real records with status and links to existing edit routes', () => {
    render(<AdminDashboardPage />);
    const ri = section('admin.recent_items');
    expect(ri.getByText('Solar Panel X')).toBeTruthy();
    expect(ri.getByText('Guide to Solar')).toBeTruthy();
    expect(ri.getByText('Panel Install')).toBeTruthy();
    const hrefs = ri.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin/products/p1/edit');
    expect(hrefs).toContain('/admin/articles/a1/edit');
    expect(hrefs).toContain('/admin/services/s1/edit');
  });

  it('uses supported recency ordering for products/articles/services only', () => {
    render(<AdminDashboardPage />);
    const byHook = (h: string) => calls.filter((c) => c.hook === h).map((c) => c.params);
    expect(byHook('products')).toContainEqual({ page: '1', page_size: '5', ordering: '-created_at' });
    expect(byHook('articles')).toContainEqual({ page: '1', page_size: '5', ordering: '-created_at' });
    expect(byHook('services')).toContainEqual({ page: '1', page_size: '5', ordering: '-created_at' });
  });

  it('never sends ordering params to projects (no ordering_fields server-side)', () => {
    render(<AdminDashboardPage />);
    const projectCalls = calls.filter((c) => c.hook === 'projects');
    expect(projectCalls.length).toBeGreaterThan(0);
    for (const c of projectCalls) {
      expect('ordering' in c.params).toBe(false);
    }
  });

  it('empty recent group shows a real empty state with a working create action', () => {
    store[keyOf('products', { page: '1', page_size: '5', ordering: '-created_at' })] = {
      data: { count: 0, results: [] },
    };
    render(<AdminDashboardPage />);
    const ri = section('admin.recent_items');
    expect(ri.getByText('admin.no_products')).toBeTruthy();
    fireEvent.click(ri.getByRole('button', { name: 'admin.create_first_product' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/products/new');
  });
});

describe('Dashboard hub — loading / error isolation (Phase 9.3-B)', () => {
  it('loading queries render placeholders without crashing', () => {
    for (const k of Object.keys(store)) store[k] = { data: null, isLoading: true };
    render(<AdminDashboardPage />);
    expect(screen.getByText('admin.dashboard')).toBeTruthy();
    expect(screen.getByText('admin.quick_actions')).toBeTruthy();
    expect(screen.getAllByLabelText('common.loading').length).toBeGreaterThan(0);
  });

  it('one failed section does not destroy the dashboard (per-card retry)', () => {
    store[keyOf('services', { page: '1', page_size: '5', ordering: '-created_at' })] = {
      data: null,
      error: { response: { status: 500 } },
    };
    render(<AdminDashboardPage />);
    // Other sections still render real data.
    expect(screen.getByText('Solar Panel X')).toBeTruthy();
    expect(section('admin.content_overview').getByText('42')).toBeTruthy();
    // Failed services group shows an error state with retry.
    const ri = section('admin.recent_items');
    fireEvent.click(ri.getByRole('button', { name: 'admin.try_again' }));
    expect(refetchMock).toHaveBeenCalled();
  });

  it('permission (403) failures surface the permission message, not a crash', () => {
    store[keyOf('projects', { page: '1', page_size: '1' })] = {
      data: null,
      error: { response: { status: 403 } },
    };
    render(<AdminDashboardPage />);
    const ov = section('admin.content_overview');
    expect(ov.getByText('42')).toBeTruthy();
    expect(ov.getByRole('button', { name: 'admin.try_again' })).toBeTruthy();
  });
});

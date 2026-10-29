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
let overviewStore: MockState = { data: null };
let overviewRequests = 0;

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
  useAdminDashboardOverview: () => {
    overviewRequests += 1;
    return {
      data: overviewStore.data,
      isLoading: overviewStore.isLoading ?? false,
      error: overviewStore.error ?? null,
      refetch: refetchMock,
    };
  },
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

// Phase 12.15 aggregate fixture. It is now the single source for every
// count; `products.total` etc. match the legacy list-count assertions so the
// 9.3-B behavioural tests keep their meaning.
function defaultOverview(): Record<string, unknown> {
  return {
    products: {
      total: 42,
      published: 37,
      draft: 3,
      archived: 2,
      hidden: 2,
      featured: 5,
      without_image: 3,
      without_document: 2,
      without_seo_title: 4,
    },
    product_categories: { total: 9, active: 7, inactive: 2 },
    articles: { total: 18, published: 13, draft: 4, scheduled: 1, without_cover: 1 },
    services: { total: 7, active: 5, inactive: 2 },
    projects: { total: 12, featured: 4 },
    gallery: { images: 8, images_active: 6, categories: 3 },
    media: { total: 21, images: 15, documents: 6 },
    documents: { total: 6 },
    generated_at: '2026-10-19T00:00:00Z',
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
  overviewStore = { data: defaultOverview() };
  overviewRequests = 0;
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
  it('manager role sees all create actions plus media library', () => {
    render(<AdminDashboardPage />);
    const qa = section('admin.quick_actions');
    for (const label of [
      'admin.create_product',
      'admin.create_category',
      'admin.create_article',
      'admin.create_service',
      'admin.create_project',
      'admin.homepage_studio',
      'admin.media',
    ]) {
      expect(qa.getByRole('button', { name: label })).toBeTruthy();
    }
    // Site settings are super-admin only; a content manager must not see it.
    expect(qa.queryByRole('button', { name: 'admin.site_settings' })).toBeNull();
  });

  it('super admin additionally sees the site-settings action', () => {
    setRole('super_admin');
    render(<AdminDashboardPage />);
    expect(section('admin.quick_actions').getByRole('button', { name: 'admin.site_settings' })).toBeTruthy();
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
    fireEvent.click(qa.getByRole('button', { name: 'admin.media' }));
    expect(pushMock).toHaveBeenCalledWith('/admin/media');
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
  it('renders real counts from the aggregate, never hardcoded values', () => {
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

  it('overview counts come from the server aggregate, not page results length', () => {
    // 2 recent rows returned; the aggregate says 42 → the card must show 42.
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

  it('does not issue per-card filtered count requests (single aggregate)', () => {
    render(<AdminDashboardPage />);
    // Only the three recent lists may call the list hooks.
    const listHooks = new Set(calls.map((c) => c.hook));
    expect([...listHooks].sort()).toEqual(['articles', 'products', 'services']);
    for (const c of calls) {
      expect(c.params).toMatchObject({ page_size: '5' });
    }
  });

  it('zero counts render as 0 (informative, still linked) — never faked', () => {
    overviewStore.data = {
      ...(defaultOverview() as Record<string, unknown>),
      articles: { total: 18, published: 17, draft: 4, scheduled: 0, without_cover: 1 },
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

  it('never list-fetches projects (no ordering support; aggregate only)', () => {
    render(<AdminDashboardPage />);
    const projectCalls = calls.filter((c) => c.hook === 'projects');
    expect(projectCalls.length).toBe(0);
    // The project count still renders from the aggregate.
    expect(section('admin.content_overview').getByText('12')).toBeTruthy();
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
    overviewStore = { data: null, isLoading: true };
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
    overviewStore = { data: null, error: { response: { status: 403 } } };
    render(<AdminDashboardPage />);
    const ov = section('admin.content_overview');
    expect(ov.getAllByRole('button', { name: 'admin.try_again' }).length).toBe(5);
    // Recent lists still render real records.
    expect(section('admin.recent_items').getByText('Solar Panel X')).toBeTruthy();
  });
});

describe('Dashboard hub — Phase 12.15 aggregate sections', () => {
  it('content quality renders real incomplete-content counts with exact links', () => {
    render(<AdminDashboardPage />);
    const cq = section('admin.content_quality');
    // Fixture: without_image 3, without_document 2, without_seo_title 4,
    // articles without cover 1.
    for (const v of ['3', '2', '4', '1']) expect(cq.getByText(v)).toBeTruthy();
    const hrefs = cq.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin/products');
    expect(hrefs).toContain('/admin/articles');
  });

  it('media & documents inventory renders real counts and deep links', () => {
    render(<AdminDashboardPage />);
    const md = section('admin.media_documents');
    for (const v of ['21', '15', '8']) expect(md.getByText(v)).toBeTruthy();
    // documents (media) 6 + product documents 6 → two honest cards, same count.
    expect(md.getAllByText('6').length).toBe(2);
    const hrefs = md.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/admin/media');
    expect(hrefs).toContain('/admin/gallery');
    expect(hrefs).toContain('/admin/products');
  });

  it('publication status bars reflect exact server counts', () => {
    render(<AdminDashboardPage />);
    const ps = section('admin.publication_status');
    // products published 37 / draft 3 / archived 2; articles published 13 /
    // draft 4 / scheduled 1 — all distinct in this section.
    for (const v of ['37', '13', '3', '4', '2', '1']) expect(ps.getByText(v)).toBeTruthy();
    expect(ps.getByRole('img', { name: 'admin.products' })).toBeTruthy();
    expect(ps.getByRole('img', { name: 'admin.articles' })).toBeTruthy();
    expect(ps.getAllByText('admin.status_published').length).toBe(2);
  });

  it('issues exactly one aggregate request for all three sections', () => {
    render(<AdminDashboardPage />);
    expect(overviewRequests).toBe(1);
  });

  it('error state isolates to the aggregate sections and retries in place', () => {
    overviewStore = { data: null, error: { response: { status: 500 } } };
    render(<AdminDashboardPage />);
    // List-backed Recent Items are untouched by the aggregate failure.
    expect(section('admin.recent_items').getByText('Solar Panel X')).toBeTruthy();
    fireEvent.click(section('admin.content_quality').getAllByRole('button', { name: 'admin.try_again' })[0]);
    expect(refetchMock).toHaveBeenCalled();
  });

  it('403 on the aggregate surfaces the permission message', () => {
    overviewStore = { data: null, error: { response: { status: 403 } } };
    render(<AdminDashboardPage />);
    expect(section('admin.publication_status').getAllByText('admin.permission_denied').length).toBeGreaterThan(0);
  });

  it('empty content shows an honest empty status, not a fabricated bar', () => {
    overviewStore = {
      data: {
        products: { total: 0, published: 0, draft: 0, archived: 0, hidden: 0, featured: 0, without_image: 0, without_document: 0, without_seo_title: 0 },
        product_categories: { total: 0, active: 0, inactive: 0 },
        articles: { total: 0, published: 0, draft: 0, scheduled: 0, without_cover: 0 },
        services: { total: 0, active: 0, inactive: 0 },
        projects: { total: 0, featured: 0 },
        gallery: { images: 0, images_active: 0, categories: 0 },
        media: { total: 0, images: 0, documents: 0 },
        documents: { total: 0 },
        generated_at: '2026-10-19T00:00:00Z',
      },
    };
    render(<AdminDashboardPage />);
    const ps = section('admin.publication_status');
    expect(ps.getAllByText('admin.show_none').length).toBe(2);
    expect(ps.queryByRole('img')).toBeNull();
  });

  it('never renders hardcoded marketing statistics', () => {
    render(<AdminDashboardPage />);
    for (const fake of ['25 MW+', '150+', '98%']) {
      expect(screen.queryByText(fake)).toBeNull();
    }
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { CategoryClient } from './category-client';
import type { ProductCategory, ProductCategoryDetail, ProductListItem } from '@/types';

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
  usePathname: () => '/fa/products/category/solar-villa',
}));

function setUrl(q: string) {
  currentQuery = q.startsWith('?') ? q.slice(1) : q;
}

const mockApi = vi.hoisted(() => ({
  category: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    error: null as unknown,
    refetch: vi.fn(),
  },
  tree: {
    data: null as unknown,
  },
  products: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicProductCategory: () => mockApi.category,
  usePublicProductCategories: () => mockApi.tree,
  usePublicProducts: () => mockApi.products,
}));

const MOCK_TREE: ProductCategory[] = [
  {
    id: 'solar-root',
    title: 'پکیج‌های خورشیدی',
    slug: 'solar-packages',
    slug_t: 'solar-packages',
    parent: null,
    children: [
      {
        id: 'solar-villa',
        title: 'ویلا',
        slug: 'solar-villa',
        slug_t: 'solar-villa',
        parent: 'solar-root',
        children: [],
        sort_order: 1,
        is_active: true,
        is_featured: false,
      },
    ],
    sort_order: 1,
    is_active: true,
    is_featured: false,
  },
];

const MOCK_CATEGORY_DETAIL: ProductCategoryDetail = {
  id: 'solar-villa',
  title: 'پکیج‌های خورشیدی ویلا',
  slug: 'solar-villa',
  slug_t: 'solar-villa',
  parent: 'solar-root',
  description: 'راهکارهای تأمین برق خورشیدی ویلا و باغ',
  content: '<p>توضیحات تکمیلی پکیج‌های ویلایی</p>',
  meta_title: 'خرید پکیج خورشیدی ویلا',
  meta_description: 'توضیحات متای ویلا',
  cover: 'cover-id',
  cover_image_url: '/media/categories/villa.jpg',
  og_image: null,
  og_image_url: '',
  sort_order: 1,
  is_active: true,
  is_featured: true,
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: 'index_follow',
  og_title: '',
  og_description: '',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const MOCK_PRODUCTS: ProductListItem[] = [
  {
    id: 'prod-villa-1',
    title: 'پکیج خورشیدی ۵ کیلووات ویلا',
    slug: 'villa-5kw',
    short_description: 'مناسب ویلاهای دارای یخچال و پمپ',
    sku: 'PV-5000',
    category: 'solar-villa',
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: true,
    sort_order: 1,
    price: { state: 'regular', currency: 'IRR', final_price: '85000000' },
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    published_at: '2026-09-01T00:00:00Z',
  },
];

beforeEach(() => {
  setUrl('');
  pushMock.mockClear();
  replaceMock.mockClear();
  mockApi.category = {
    data: MOCK_CATEGORY_DETAIL,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
  mockApi.tree = {
    data: MOCK_TREE,
  };
  mockApi.products = {
    data: { results: MOCK_PRODUCTS, count: 40 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
  vi.restoreAllMocks();
});

describe('CategoryClient detail & journey flow (Phase 12.19)', () => {
  it('renders breadcrumb trail linking Home -> Products -> Categories -> Parent -> Current Category', () => {
    render(<CategoryClient slug="solar-villa" />);

    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeTruthy();

    const home = within(nav).getByRole('link', { name: 'products.home_crumb' });
    expect(home.getAttribute('href')).toBe('/');

    const products = within(nav).getByRole('link', { name: 'products.title' });
    expect(products.getAttribute('href')).toBe('/products');

    const catIndex = within(nav).getByRole('link', { name: 'products.categories_crumb' });
    expect(catIndex.getAttribute('href')).toBe('/products/category');

    const parentCat = within(nav).getByRole('link', { name: 'پکیج‌های خورشیدی' });
    expect(parentCat.getAttribute('href')).toBe('/products/category/solar-packages');

    const currentLeaf = within(nav).getByText('پکیج‌های خورشیدی ویلا');
    expect(currentLeaf.getAttribute('aria-current')).toBe('page');
  });

  it('renders category content, cover image, and product cards with valid links', () => {
    render(<CategoryClient slug="solar-villa" />);

    expect(screen.getByRole('heading', { level: 1, name: 'پکیج‌های خورشیدی ویلا' })).toBeTruthy();
    expect(screen.getByText('راهکارهای تأمین برق خورشیدی ویلا و باغ')).toBeTruthy();

    const productLinks = screen.getAllByRole('link', { name: new RegExp('پکیج خورشیدی ۵ کیلووات ویلا') });
    expect(productLinks[0].getAttribute('href')).toBe('/products/villa-5kw');
  });

  it('updates page query in URL when clicking pagination next', () => {
    setUrl('page=1');
    render(<CategoryClient slug="solar-villa" />);

    const nextBtn = screen.getByRole('button', { name: 'common.next' });
    fireEvent.click(nextBtn);

    expect(pushMock).toHaveBeenCalledWith('/fa/products/category/solar-villa?page=2');
  });

  it('renders NotFoundState with clear recovery links on unknown category 404', () => {
    mockApi.category = {
      data: null,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
      refetch: vi.fn(),
    };
    render(<CategoryClient slug="non-existent" />);

    expect(screen.getByText('products.category_not_found')).toBeTruthy();
    const catIndexLink = screen.getByRole('link', { name: 'products.categories_label' });
    expect(catIndexLink.getAttribute('href')).toBe('/products/category');
    const catalogLink = screen.getByRole('link', { name: 'products.back_to_products' });
    expect(catalogLink.getAttribute('href')).toBe('/products');
  });
});

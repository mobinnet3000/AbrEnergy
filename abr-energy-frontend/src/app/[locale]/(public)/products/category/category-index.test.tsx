import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../../../../locales/fa.json';
import { CategoryIndexClient } from './category-index-client';
import type { ProductCategory } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let cur: unknown = fa;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return key;
        }
      }
      return typeof cur === 'string' ? cur : key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

const mockApi = vi.hoisted(() => ({
  categories: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicProductCategories: () => mockApi.categories,
}));

function makeCategory(overrides: Partial<ProductCategory> = {}): ProductCategory {
  return {
    id: `cat-${Math.random()}`,
    title: 'دسته‌بندی نمونه',
    slug: 'sample-cat',
    parent: null,
    children: [],
    sort_order: 0,
    is_active: true,
    is_featured: false,
    ...overrides,
  };
}

const SAMPLE_TAXONOMY: ProductCategory[] = [
  makeCategory({
    id: 'solar',
    title: 'پکیج‌های خورشیدی',
    slug: 'solar-packages',
    sort_order: 1,
    children: [
      makeCategory({ id: 'solar-apt', title: 'آپارتمان', slug: 'solar-apartment', parent: 'solar', sort_order: 1 }),
      makeCategory({ id: 'solar-villa', title: 'ویلا', slug: 'solar-villa', parent: 'solar', sort_order: 2 }),
      makeCategory({ id: 'solar-pharmacy', title: 'داروخانه', slug: 'solar-pharmacy', parent: 'solar', sort_order: 3 }),
    ],
  }),
  makeCategory({
    id: 'backup',
    title: 'پکیج‌های برق اضطراری',
    slug: 'backup-power',
    sort_order: 2,
    children: [
      makeCategory({ id: 'backup-apt', title: 'آپارتمان اضطراری', slug: 'backup-apartment', parent: 'backup', sort_order: 1 }),
    ],
  }),
  makeCategory({
    id: 'structure',
    title: 'سازه خورشیدی',
    slug: 'solar-structure',
    sort_order: 3,
    children: [],
  }),
];

beforeEach(() => {
  mockApi.categories = {
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
  vi.restoreAllMocks();
});

describe('CategoryIndexClient (Phase 12.19)', () => {
  it('renders loading state when categories are fetching', () => {
    mockApi.categories.isLoading = true;
    render(<CategoryIndexClient />);
    expect(screen.getByTestId('category-index-loading')).toBeTruthy();
  });

  it('renders error state when categories request fails', () => {
    mockApi.categories.isError = true;
    render(<CategoryIndexClient />);
    expect(screen.getByText(fa.common.error)).toBeTruthy();
    expect(screen.getByText(fa.products.load_failed)).toBeTruthy();
  });

  it('renders empty state when no categories are returned', () => {
    mockApi.categories.data = [];
    render(<CategoryIndexClient />);
    expect(screen.getByText(fa.products.not_found)).toBeTruthy();
  });

  it('renders the CMS category hierarchy and distinguishes top-level from subcategories', () => {
    mockApi.categories.data = SAMPLE_TAXONOMY;
    render(<CategoryIndexClient />);

    // Breadcrumbs check
    expect(screen.getByText(fa.products.home_crumb)).toBeTruthy();
    expect(screen.getByText(fa.products.title)).toBeTruthy();
    expect(screen.getByText(fa.products.categories_crumb)).toBeTruthy();

    // Link back to all products
    const backLink = screen.getByRole('link', { name: new RegExp(fa.products.all_products) });
    expect(backLink.getAttribute('href')).toBe('/products');

    // Root headings
    expect(screen.getByRole('heading', { level: 2, name: 'پکیج‌های خورشیدی' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'پکیج‌های برق اضطراری' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'سازه خورشیدی' })).toBeTruthy();

    // Subcategory headings
    expect(screen.getByRole('heading', { level: 3, name: 'آپارتمان' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'ویلا' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'داروخانه' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'آپارتمان اضطراری' })).toBeTruthy();

    // Valid route links
    const solarMainLinks = screen.getAllByRole('link', { name: new RegExp('پکیج‌های خورشیدی') });
    expect(solarMainLinks.some((l) => l.getAttribute('href') === '/products/category/solar-packages')).toBe(true);

    const aptLink = screen.getByRole('link', { name: /^آپارتمان\s+مشاهده دسته$/ });
    expect(aptLink.getAttribute('href')).toBe('/products/category/solar-apartment');
  });

  it('prevents duplicate category cards when backend returns flat list with nested children', () => {
    // DRF may return all categories flat where roots ALSO carry `children`.
    const flatWithChildren: ProductCategory[] = [
      SAMPLE_TAXONOMY[0],
      SAMPLE_TAXONOMY[1],
      // Children also appearing in the array with parent set:
      SAMPLE_TAXONOMY[0].children![0],
      SAMPLE_TAXONOMY[0].children![1],
    ];

    mockApi.categories.data = flatWithChildren;
    render(<CategoryIndexClient />);

    // Headings for root categories must appear exactly once at level 2:
    const level2Headings = screen.getAllByRole('heading', { level: 2 });
    const titles = level2Headings.map((h) => h.textContent?.trim());
    expect(titles.filter((t) => t?.includes('پکیج‌های خورشیدی')).length).toBe(1);
    expect(titles.filter((t) => t?.includes('پکیج‌های برق اضطراری')).length).toBe(1);
    // Children should NOT be level 2 headings:
    expect(titles.some((t) => t?.includes('آپارتمان'))).toBe(false);
  });

  it('renders categories without optional fields (images, descriptions) safely without crashing', () => {
    mockApi.categories.data = [
      makeCategory({
        id: 'bare',
        title: 'دسته بدون فیلدهای اختیاری',
        slug: 'bare-cat',
        children: [
          makeCategory({ id: 'bare-child', title: 'زیردسته ساده', slug: 'bare-child', parent: 'bare' }),
        ],
      }),
    ];

    render(<CategoryIndexClient />);
    expect(screen.getByRole('heading', { level: 2, name: 'دسته بدون فیلدهای اختیاری' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'زیردسته ساده' })).toBeTruthy();
  });
});

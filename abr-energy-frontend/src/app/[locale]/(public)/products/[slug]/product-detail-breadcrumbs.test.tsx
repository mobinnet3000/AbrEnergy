import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProductDetailClient } from './product-detail-client';
import type { ProductCategory, ProductDetail } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

const mockApi = vi.hoisted(() => ({
  product: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    error: null as unknown,
    refetch: vi.fn(),
  },
  categories: {
    data: null as unknown,
  },
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicProduct: () => mockApi.product,
  usePublicProductCategories: () => mockApi.categories,
}));

const MOCK_TAXONOMY: ProductCategory[] = [
  {
    id: 'parent-solar',
    title: 'پکیج‌های خورشیدی',
    slug: 'solar-packages',
    slug_t: 'solar-packages',
    parent: null,
    children: [
      {
        id: 'child-villa',
        title: 'ویلا',
        slug: 'solar-villa',
        slug_t: 'solar-villa',
        parent: 'parent-solar',
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

const MOCK_PRODUCT: ProductDetail = {
  id: 'prod-100',
  title: 'پکیج خورشیدی ۳ کیلووات ویلایی',
  slug: 'solar-villa-3kw',
  short_description: 'توضیحات پکیج ویلایی',
  description: 'توضیحات کامل',
  sku: 'PV-3000',
  category: 'child-villa',
  cover_image_url: '',
  features: '',
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: 'index_follow',
  og_title: '',
  og_description: '',
  og_image: null,
  meta_title: '',
  meta_description: '',
  images: [],
  specifications: [],
  attribute_values: [],
  documents: [],
  related: [],
  status: 'published',
  visibility: 'public',
  is_active: true,
  is_featured: false,
  sort_order: 1,
  price: { state: 'regular', currency: 'IRR', final_price: '50000000' },
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  published_at: '2026-09-01T00:00:00Z',
};

beforeEach(() => {
  mockApi.product = {
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
  mockApi.categories = {
    data: MOCK_TAXONOMY,
  };
  vi.restoreAllMocks();
});

describe('ProductDetailClient breadcrumbs & category journey (Phase 12.19)', () => {
  it('renders complete hierarchy in breadcrumbs from root category to subcategory', () => {
    mockApi.product.data = MOCK_PRODUCT;
    render(<ProductDetailClient slug="solar-villa-3kw" />);

    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeTruthy();

    // Home link
    const homeLink = screen.getByRole('link', { name: 'products.home_crumb' });
    expect(homeLink.getAttribute('href')).toBe('/');

    // Catalog link
    const productsLink = screen.getByRole('link', { name: 'products.title' });
    expect(productsLink.getAttribute('href')).toBe('/products');

    // Categories index link
    const categoriesLink = screen.getByRole('link', { name: 'products.categories_crumb' });
    expect(categoriesLink.getAttribute('href')).toBe('/products/category');

    // Root category link
    const rootCatLink = screen.getByRole('link', { name: 'پکیج‌های خورشیدی' });
    expect(rootCatLink.getAttribute('href')).toBe('/products/category/solar-packages');

    // Subcategory link
    const subCatLinks = screen.getAllByRole('link', { name: 'ویلا' });
    expect(subCatLinks.some((l) => l.getAttribute('href') === '/products/category/solar-villa')).toBe(true);

    // Current product leaf
    const currentLeaf = within(nav).getByText('پکیج خورشیدی ۳ کیلووات ویلایی');
    expect(currentLeaf.getAttribute('aria-current')).toBe('page');
  });

  it('renders recovery links to both category index and catalog on 404', () => {
    mockApi.product.isError = true;
    mockApi.product.error = { response: { status: 404 } };
    render(<ProductDetailClient slug="unknown-product" />);

    expect(screen.getByText('products.product_not_found')).toBeTruthy();
    const catIndexLink = screen.getByRole('link', { name: 'products.categories_label' });
    expect(catIndexLink.getAttribute('href')).toBe('/products/category');
    const catalogLink = screen.getByRole('link', { name: 'products.back_to_products' });
    expect(catalogLink.getAttribute('href')).toBe('/products');
  });

  it('renders ErrorState (not 404) when product fetch is throttled with 429', () => {
    mockApi.product.isError = true;
    mockApi.product.error = { response: { status: 429 } };
    render(<ProductDetailClient slug="throttled-product" />);

    expect(screen.queryByText('products.product_not_found')).toBeNull();
    expect(screen.getByText('common.rate_limit_title')).toBeTruthy();
    expect(screen.getByText('products.retry')).toBeTruthy();
  });

  it('renders ErrorState (not 404) on server error 500', () => {
    mockApi.product.isError = true;
    mockApi.product.error = { response: { status: 500 } };
    render(<ProductDetailClient slug="server-error-product" />);

    expect(screen.queryByText('products.product_not_found')).toBeNull();
    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('products.retry')).toBeTruthy();
  });
});

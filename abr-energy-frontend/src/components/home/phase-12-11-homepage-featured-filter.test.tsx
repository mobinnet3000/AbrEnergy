import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { ProductRailSection } from './ProductRailSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';

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

const mocks = vi.hoisted(() => ({
  featured: { data: null as unknown, isLoading: false },
  categories: { data: null as unknown, isLoading: false },
}));

vi.mock('@/hooks/use-api', () => ({
  useFeaturedPublicProducts: () => mocks.featured,
  usePublicProductCategories: () => mocks.categories,
}));

function stubDom() {
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {} }),
    configurable: true,
    writable: true,
  });
  if (!Element.prototype.scrollBy) {
    Object.defineProperty(Element.prototype, 'scrollBy', { value: () => {}, configurable: true, writable: true });
  }
  if (!Element.prototype.scrollIntoView) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: () => {}, configurable: true, writable: true });
  }
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1', title: 'پنل خورشیدی ۵۵۰ وات', slug: 'panel-550',
    short_description: 'توضیح کوتاه', sku: 'PNL-550', category: 'cat-1',
    cover_image_url: '', status: 'published', visibility: 'public',
    is_active: true, is_featured: true, sort_order: 0,
    price: { state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' },
    created_at: '', updated_at: '', published_at: null,
    ...overrides,
  };
}

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1', title: 'پکیج‌های خورشیدی', slug: 'solar-packages',
    parent: null, children: [], sort_order: 0,
    is_active: true, is_featured: false,
    ...overrides,
  };
}

const CATEGORIES = [
  category(),
  category({ id: 'cat-2', title: 'سازه خورشیدی', slug: 'solar-structure', sort_order: 1 }),
];

const PRODUCTS = [
  product(),
  product({ id: 'p-2', title: 'سازه نگه‌دارنده پنل', slug: 'mount-structure', category: 'cat-2' }),
];

beforeEach(() => {
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  vi.restoreAllMocks();
});

describe('Phase 12.11 — homepage category display & featured filter', () => {
  it('1. category section renders the category links without a duplicate pill navigation row', () => {
    mocks.categories = { data: CATEGORIES, isLoading: false };
    render(<ProductRailSection />);
    const rail = screen.getByTestId('product-rail');
    // One pill strip (quick access) only — the navigation's own pill row is suppressed.
    expect(within(rail).queryByRole('navigation')).toBeNull();
    // Real root categories are still reachable.
    const hrefs = within(rail).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/category/solar-packages');
    expect(hrefs).toContain('/products/category/solar-structure');
  });

  it('2. featured rail exposes an "all" filter plus a pill per real product category', () => {
    mocks.featured = { data: { results: PRODUCTS }, isLoading: false };
    mocks.categories = { data: CATEGORIES, isLoading: false };
    render(<FeaturedProductsSection />);
    const filter = screen.getByRole('group', { name: fa.products.filter_category });
    expect(within(filter).getByText(fa.home.featured_filter_all)).toBeTruthy();
    expect(within(filter).getByText('پکیج‌های خورشیدی')).toBeTruthy();
    expect(within(filter).getByText('سازه خورشیدی')).toBeTruthy();
  });

  it('3. selecting a category filters the rail; "all" restores every featured product', () => {
    mocks.featured = { data: { results: PRODUCTS }, isLoading: false };
    mocks.categories = { data: CATEGORIES, isLoading: false };
    render(<FeaturedProductsSection />);
    const filter = screen.getByRole('group', { name: fa.products.filter_category });
    const railCount = () => screen.getByTestId('featured-rail').querySelectorAll(':scope > div').length;
    expect(railCount()).toBe(2);
    fireEvent.click(within(filter).getByText('سازه خورشیدی'));
    expect(railCount()).toBe(1);
    fireEvent.click(within(filter).getByText(fa.home.featured_filter_all));
    expect(railCount()).toBe(2);
  });

  it('4. no filter pills when a single category has no featured products competing for it', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    mocks.categories = { data: CATEGORIES, isLoading: false };
    render(<FeaturedProductsSection />);
    expect(screen.queryByRole('group', { name: fa.products.filter_category })).toBeNull();
  });
});

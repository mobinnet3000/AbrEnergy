import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductGrid } from './ProductGrid';
import { ProductBreadcrumbs } from './ProductBreadcrumbs';
import { ProductEmptyState } from './ProductEmptyState';
import { RelatedProducts } from './RelatedProducts';
import {
  ProductCategoryNavigation,
  flattenCategoryTree,
} from './ProductCategoryNavigation';
import type { ProductCategory, ProductListItem, ProductRelatedItem } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

function item(id: string, title: string): ProductListItem {
  return {
    id,
    title,
    slug: `slug-${id}`,
    short_description: '',
    sku: `SKU-${id}`,
    category: 'cat-1',
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    price: { state: 'regular', currency: 'IRR', regular_price: '1', final_price: '1' },
    created_at: '',
    updated_at: '',
    published_at: null,
  };
}

function cat(overrides: Partial<ProductCategory> = {}): ProductCategory {
  return {
    id: `c-${Math.random()}`, title: 'دسته', slug: 'cat', parent: null,
    children: [], sort_order: 0, is_active: true, is_featured: false, ...overrides,
  };
}

describe('ProductGrid', () => {
  it('renders one card per product with resolved category titles', () => {
    render(
      <ProductGrid
        products={[item('1', 'محصول یک'), item('2', 'محصول دو')]}
        categoryTitles={new Map([['cat-1', 'پنل‌ها']])}
      />,
    );
    expect(screen.getByText('محصول یک')).toBeTruthy();
    expect(screen.getByText('محصول دو')).toBeTruthy();
    expect(screen.getAllByText('پنل‌ها').length).toBe(2);
  });
});

describe('ProductBreadcrumbs', () => {
  it('renders an accessible trail with the current page marked', () => {
    render(
      <ProductBreadcrumbs
        trail={[
          { label: 'خانه', href: '/' },
          { label: 'محصولات', href: '/products' },
          { label: 'پنل خورشیدی' },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeTruthy();
    const current = screen.getByText('پنل خورشیدی');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('محصولات').closest('a')?.getAttribute('href')).toBe('/products');
  });
});

describe('ProductEmptyState', () => {
  it('shows the Persian empty state for zero results', () => {
    render(<ProductEmptyState />);
    expect(screen.getByText('products.not_found')).toBeTruthy();
    expect(screen.getByText('products.not_found_hint')).toBeTruthy();
  });

  it('supports a recovery action (e.g. clear filters)', () => {
    let clicked = 0;
    render(<ProductEmptyState action={{ label: 'products.clear_filters', onClick: () => { clicked += 1; } }} />);
    screen.getByText('products.clear_filters').click();
    expect(clicked).toBe(1);
  });
});

describe('RelatedProducts', () => {
  const items: ProductRelatedItem[] = [
    { id: 'r-1', slug: 'related-one', title: 'محصول مرتبط', relation_type: 'related' },
    { id: 'r-2', slug: 'acc-one', title: 'وسیله جانبی', relation_type: 'accessory' },
  ];

  it('links related products by their backend slug', () => {
    render(<RelatedProducts items={items} />);
    expect(screen.getByText('products.related_title')).toBeTruthy();
    expect(screen.getByText('محصول مرتبط').closest('a')?.getAttribute('href')).toBe('/products/related-one');
    expect(screen.getByText('admin.relation_accessory')).toBeTruthy();
  });

  it('renders nothing when the backend supplies no related products', () => {
    const { container } = render(<RelatedProducts items={[]} />);
    expect(container.textContent).toBe('');
  });
});

describe('ProductCategoryNavigation', () => {
  const tree = [
    cat({
      id: 'p1', title: 'پکیج‌های خورشیدی', slug: 'packages', is_featured: true, sort_order: 0,
      children: [
        cat({ id: 'c1', title: 'آپارتمان', slug: 'apartment', parent: 'p1', sort_order: 0 }),
        cat({ id: 'c2', title: 'ویلا', slug: 'villa', parent: 'p1', sort_order: 1 }),
      ],
    }),
    cat({ id: 'p2', title: 'برق اضطراری', slug: 'backup', sort_order: 1 }),
  ];

  it('flattens the tree deterministically with depth info', () => {
    const flat = flattenCategoryTree(tree);
    expect(flat.map((f) => f.category.title)).toEqual(['پکیج‌های خورشیدی', 'آپارتمان', 'ویلا', 'برق اضطراری']);
    expect(flat.map((f) => f.depth)).toEqual([0, 1, 1, 0]);
  });

  it('renders a quick-access rail plus data-driven category cards', () => {
    render(<ProductCategoryNavigation categories={tree} />);
    // Rail pills
    expect(screen.getByText('products.all_products')).toBeTruthy();
    // Root title appears in both the rail pill and its card.
    expect(screen.getAllByText('پکیج‌های خورشیدی').length).toBe(2);
    // Cards with child preview pills
    expect(screen.getByText('آپارتمان')).toBeTruthy();
    expect(screen.getByText('ویلا')).toBeTruthy();
    expect(screen.getAllByText('products.view_category').length).toBe(2);
  });

  it('marks the active category pill without hardcoding names', () => {
    render(<ProductCategoryNavigation categories={tree} activeSlug="backup" />);
    const pill = screen.getByRole('link', { name: 'برق اضطراری' });
    expect(pill.getAttribute('aria-current')).toBe('page');
  });

  it('renders nothing for an empty catalog tree', () => {
    const { container } = render(<ProductCategoryNavigation categories={[]} />);
    expect(container.textContent).toBe('');
  });
});

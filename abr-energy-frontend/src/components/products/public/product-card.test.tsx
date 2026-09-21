import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { ProductListItem } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

function item(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 'p-1',
    title: 'پنل خورشیدی ۵۵۰ وات',
    slug: 'panel-550',
    short_description: 'توضیح کوتاه محصول',
    sku: 'PNL-550',
    category: 'cat-1',
    cover_image_url: 'http://localhost:8000/media/p.png',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    price: { state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' },
    created_at: '',
    updated_at: '',
    published_at: null,
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('renders regular-price products with title, category, cover and CTA link', () => {
    render(<ProductCard product={item()} categoryTitle="پنل‌ها" />);
    expect(screen.getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    expect(screen.getByText('پنل‌ها')).toBeTruthy();
    const img = screen.getByAltText('پنل خورشیدی ۵۵۰ وات');
    // Phase 5.2: cover renders through next/image (optimized loader URL),
    // so assert the backend URL survives encoding rather than exact equality.
    expect(img.getAttribute('src')).toContain(encodeURIComponent('http://localhost:8000/media/p.png'));
    const cta = screen.getByText('products.view_details');
    expect(cta.closest('a')?.getAttribute('href')).toBe('/products/panel-550');
    expect(screen.getByText((10000000).toLocaleString('fa-IR'), { exact: false })).toBeTruthy();
  });

  it('shows the featured indicator for featured products', () => {
    render(<ProductCard product={item({ is_featured: true })} />);
    expect(screen.getByText('products.featured_badge')).toBeTruthy();
  });

  it('renders discounted products with original + final backend prices', () => {
    const { container } = render(
      <ProductCard
        product={item({
          price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' },
        })}
      />,
    );
    expect(screen.getAllByText('products.discount_badge').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.line-through')).toBeTruthy();
    expect(screen.getByText((15000000).toLocaleString('fa-IR'), { exact: false })).toBeTruthy();
  });

  it('renders contact-price products without numbers', () => {
    const { container } = render(
      <ProductCard product={item({ price: { state: 'contact_for_price', currency: 'IRR' } })} />,
    );
    expect(screen.getByText('products.price_contact')).toBeTruthy();
    expect(container.textContent).not.toMatch((10000000).toLocaleString('fa-IR'));
  });

  it('renders no price block for hidden pricing state', () => {
    const { container } = render(
      <ProductCard product={item({ price: { state: 'hidden', currency: 'IRR' } })} />,
    );
    expect(container.textContent).not.toContain('products.currency_toman');
    expect(container.textContent).not.toContain('products.price_contact');
  });

  it('keeps a consistent aspect ratio and accessible focus target', () => {
    const { container } = render(<ProductCard product={item()} />);
    expect(container.querySelector('.aspect-\\[4\\/3\\]')).toBeTruthy();
    expect(container.querySelector('article')).toBeTruthy();
  });
});

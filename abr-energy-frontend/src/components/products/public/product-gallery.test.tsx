import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery, sortGalleryImages } from './ProductGallery';
import type { ProductImageItem } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

function img(overrides: Partial<ProductImageItem> = {}): ProductImageItem {
  return {
    id: `img-${Math.random()}`,
    url: 'http://localhost:8000/media/a.png',
    media_file: 'm-1',
    is_cover: false,
    sort_order: 0,
    alt_text: '',
    caption: '',
    ...overrides,
  };
}

const two = [
  img({ id: 'i-1', url: 'http://x/one.png', is_cover: true, alt_text: 'تصویر اول' }),
  img({ id: 'i-2', url: 'http://x/two.png', sort_order: 1, alt_text: 'تصویر دوم' }),
];

describe('sortGalleryImages', () => {
  it('orders cover first, then by sort_order', () => {
    const shuffled = [two[1], two[0]];
    expect(sortGalleryImages(shuffled).map((i) => i.id)).toEqual(['i-1', 'i-2']);
  });
});

describe('ProductGallery', () => {
  it('shows the cover image first with thumbnails and a counter', () => {
    const { container } = render(<ProductGallery images={[two[1], two[0]]} productTitle="محصول" />);
    const main = container.querySelector('[role="region"] img');
    // Phase 5.2: hero renders through next/image (optimized loader URL).
    expect(main?.getAttribute('src')).toContain(encodeURIComponent('http://x/one.png'));
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('navigates with next/previous buttons', () => {
    render(<ProductGallery images={two} productTitle="محصول" />);
    fireEvent.click(screen.getByLabelText('products.next_image'));
    expect(screen.getByText('2 / 2')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('products.prev_image'));
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('navigates with thumbnail selection', () => {
    render(<ProductGallery images={two} productTitle="محصول" />);
    fireEvent.click(screen.getByLabelText('محصول — 2'));
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('supports keyboard navigation (RTL-aware arrow keys)', () => {
    const { container } = render(<ProductGallery images={two} productTitle="محصول" />);
    const region = container.querySelector('[role="region"]')!;
    // In RTL, ArrowLeft moves forward.
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(screen.getByText('2 / 2')).toBeTruthy();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('renders a placeholder when the product has no images', () => {
    const { container } = render(<ProductGallery images={[]} productTitle="بدون تصویر" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('بدون تصویر', { selector: '.sr-only' })).toBeTruthy();
  });

  it('uses alt text from the backend when available', () => {
    const { container } = render(<ProductGallery images={two} productTitle="محصول" />);
    expect(container.querySelector('[role="region"] img')?.getAttribute('alt')).toBe('تصویر اول');
  });
});

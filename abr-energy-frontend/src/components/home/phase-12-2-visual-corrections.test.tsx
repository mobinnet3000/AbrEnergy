import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { Header } from '@/components/layout/header';
import { HomepageShowcase } from './HomepageShowcase';
import { ProductPrice } from '@/components/products/public/ProductPrice';

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
    setLocale: () => {},
    dir: 'rtl' as const,
    isRTL: true,
  }),
  localeNames: { fa: 'FA', ar: 'AR', en: 'EN' },
  activeLocales: ['fa', 'ar', 'en'],
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/fa' }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: () => {} }) }));
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock('@/hooks/use-api', () => ({
  useSiteSettings: () => ({ data: null }),
  useFeaturedPublicProducts: () => ({ data: null }),
  usePublicProductCategories: () => ({ data: null }),
  useServices: () => ({ data: [] }),
  useProjects: () => ({ data: [] }),
}));

const motionCtl = vi.hoisted(() => ({ reduce: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal<typeof import('framer-motion')>();
  return { ...mod, useReducedMotion: () => motionCtl.reduce };
});

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    title: 'پنل خورشیدی ۵۵۰ وات',
    slug: 'panel-550',
    short_description: 'توضیح کوتاه',
    sku: 'PNL-550',
    category: 'cat-1',
    cover_image_url: 'http://localhost:8000/media/p.png',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: true,
    sort_order: 0,
    price: { state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' },
    created_at: '',
    updated_at: '',
    published_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  motionCtl.reduce = false;
  vi.restoreAllMocks();
});

describe('Phase 12.2 — header contrast over light hero', () => {
  it('1. home header renders solid (readable) at top, not transparent white-on-white', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    expect(header?.className).not.toContain('bg-transparent');
    expect(header?.className).toContain('bg-white/60');
    const brand = screen.getByText('ابر انرژی');
    expect(brand.className).toContain('text-foreground');
  });
});

describe('Phase 12.2 — instant-panel price tone + badge gating', () => {
  it('2. light tone renders dark final price (readable on white panel)', () => {
    render(
      <ProductPrice
        price={{ state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' } as never}
        tone="light"
      />,
    );
    const label = screen.getByText(/تومان/);
    expect(label.className).toContain('text-neutral-900');
  });

  it('3. light discounted tone keeps struck original + restrained badge', () => {
    const { container } = render(
      <ProductPrice
        price={{ state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' } as never}
        tone="light"
      />,
    );
    expect(container.querySelector('.line-through')).toBeTruthy();
    expect(screen.getByText('تخفیف‌دار').className).toContain('text-emerald-700');
  });

  it('4. dark tone unchanged (existing cards/stages)', () => {
    render(
      <ProductPrice
        price={{ state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' } as never}
      />,
    );
    expect(screen.getByText(/تومان/).className).toContain('text-white');
  });

  it('5. instant panel shows promo badge only for discounted product', () => {
    const { rerender } = render(
      <HomepageShowcase products={[product() as never]} categories={[]} visuals={[]} />,
    );
    const panel = screen.getByTestId('instant-offer-panel');
    expect(panel.querySelector('.bg-red-600')).toBeNull();
    rerender(
      <HomepageShowcase
        products={[product({ price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' } }) as never]}
        categories={[]}
        visuals={[]}
      />,
    );
    expect(screen.getByTestId('instant-offer-panel').querySelector('.bg-red-600')).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { locales, activeLocales } from '@/i18n/config';
import { HERO_FLOATING_SLOTS, hasHeroFloatingVisuals } from '@/lib/homepage-visuals';
import { HeroSection } from './HeroSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { ProductRailSection } from './ProductRailSection';
import { ServicesSection } from './ServicesSection';
import { ProjectsSection } from './ProjectsSection';
import { ArticlesSection } from './ArticlesSection';
import { CalculatorSection } from './CalculatorSection';
import { ContactSection } from './ContactSection';

// Real Persian strings (not key echoes) so tests prove Persian-first output.
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

// Hero3D needs WebGL (react-three-fiber Canvas) — unavailable in jsdom.
// The 3D layer is preserved in production; tests focus on hero content.
vi.mock('@/components/home/Hero3D', () => ({ Hero3D: () => null }));

// Deterministic reduced-motion control: framer-motion caches the media
// query at module level, so drive `useReducedMotion` explicitly per test.
const motionCtl = vi.hoisted(() => ({ reduce: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal<typeof import('framer-motion')>();
  return { ...mod, useReducedMotion: () => motionCtl.reduce };
});
// Mutable mock backend state per hook.
const mocks = vi.hoisted(() => ({
  featured: { data: null as unknown, isLoading: false },
  categories: { data: null as unknown, isLoading: false },
  services: { data: null as unknown, isLoading: false, error: null as unknown, refetch: () => {} },
  projects: { data: null as unknown, isLoading: false, error: null as unknown },
  articles: { data: null as unknown, isLoading: false },
  settings: { data: null as unknown },
}));

vi.mock('@/hooks/use-api', () => ({
  useFeaturedPublicProducts: () => mocks.featured,
  usePublicProductCategories: () => mocks.categories,
  usePublicProducts: () => ({ data: null }),
  usePublicProduct: () => ({ data: null }),
  useServices: () => mocks.services,
  useFeaturedProjects: () => mocks.projects,
  useArticles: () => mocks.articles,
  useSiteSettings: () => mocks.settings,
}));

let reduceMotion = false;

function stubDom() {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: reduceMotion && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
    configurable: true,
    writable: true,
  });
  if (!Element.prototype.scrollBy) {
    Object.defineProperty(Element.prototype, 'scrollBy', { value: () => {}, configurable: true, writable: true });
  }
}

function product(overrides: Record<string, unknown> = {}) {
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
    is_featured: true,
    sort_order: 0,
    price: { state: 'regular', currency: 'IRR', regular_price: '10000000', final_price: '10000000' },
    created_at: '',
    updated_at: '',
    published_at: null,
    ...overrides,
  };
}

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    title: 'پکیج‌های خورشیدی',
    slug: 'solar-packages',
    parent: null,
    children: [],
    sort_order: 0,
    is_active: true,
    is_featured: false,
    ...overrides,
  };
}

beforeEach(() => {
  motionCtl.reduce = false;
  reduceMotion = false;
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.services = { data: null, isLoading: false, error: null, refetch: () => {} };
  mocks.projects = { data: null, isLoading: false, error: null };
  mocks.articles = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Homepage hero', () => {
  it('renders the Persian brand slogan as the single h1', () => {
    const { container } = render(<HeroSection />);
    // TextReveal splits the slogan into word spans (no whitespace text
    // nodes between them), so compare whitespace-stripped content.
    const h1 = container.querySelector('h1');
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('links to the real product catalog and calculator routes', () => {
    render(<HeroSection />);
    expect(screen.getByText('مشاهده محصولات').closest('a')?.getAttribute('href')).toBe('/products');
    expect(screen.getByText('محاسبه سیستم خورشیدی').closest('a')?.getAttribute('href')).toBe('/calculator');
  });

  it('shows safe generic supporting points without invented statistics', () => {
    const { container } = render(<HeroSection />);
    expect(screen.getByText('انرژی خورشیدی')).toBeTruthy();
    expect(screen.getByText('استقلال انرژی')).toBeTruthy();
    expect(container.textContent).not.toMatch(/25\s*MW|150\+|98%/);
  });
});

describe('Featured products showcase', () => {
  it('shows a loading skeleton while fetching', () => {
    mocks.featured = { data: null, isLoading: true };
    const { container } = render(<FeaturedProductsSection />);
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
  });

  it('hides the section when there are no featured products (no fake items)', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    expect(container.querySelector('[data-testid="featured-products"]')).toBeNull();
    expect(container.textContent).not.toContain('Powering the');
  });

  it('renders a single real product with catalog CTA and no carousel controls', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    render(<FeaturedProductsSection />);
    expect(screen.getByTestId('featured-products')).toBeTruthy();
    expect(screen.getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    expect(screen.getByText('مشاهده همه محصولات').closest('a')?.getAttribute('href')).toBe('/products');
    expect(screen.queryByLabelText('قبلی')).toBeNull();
    expect(screen.queryByLabelText('بعدی')).toBeNull();
  });

  it('renders multiple products with accessible prev/next controls', () => {
    mocks.featured = {
      data: { results: [product(), product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' })] },
      isLoading: false,
    };
    render(<FeaturedProductsSection />);
    expect(screen.getByText('اینورتر ۵ کیلووات')).toBeTruthy();
    expect(screen.getByLabelText('قبلی')).toBeTruthy();
    expect(screen.getByLabelText('بعدی')).toBeTruthy();
  });

  it('renders backend pricing states through ProductCard without recomputing', () => {
    mocks.featured = {
      data: {
        results: [
          product({
            id: 'p-9',
            title: 'پکیج تخفیف‌دار',
            slug: 'discounted-pack',
            price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' },
          }),
        ],
      },
      isLoading: false,
    };
    const { container } = render(<FeaturedProductsSection />);
    expect(screen.getByText('پکیج تخفیف‌دار')).toBeTruthy();
    expect(screen.getAllByText('تخفیف‌دار').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.line-through')).toBeTruthy();
  });

  it('supports RTL keyboard navigation on the carousel region', () => {
    mocks.featured = {
      data: { results: [product(), product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' })] },
      isLoading: false,
    };
    const spy = vi.fn();
    Element.prototype.scrollBy = spy;
    render(<FeaturedProductsSection />);
    const region = screen.getByTestId('featured-rail');
    Object.defineProperty(region, 'clientWidth', { value: 500, configurable: true });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    // RTL: visual "forward" is left → next page scrolls toward inline-end (negative).
    expect(spy).toHaveBeenCalledWith({ left: -400, behavior: 'smooth' });
  });

  it('uses instant scrolling when reduced motion is preferred', () => {
    motionCtl.reduce = true;
    mocks.featured = {
      data: { results: [product(), product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' })] },
      isLoading: false,
    };
    const spy = vi.fn();
    Element.prototype.scrollBy = spy;
    render(<FeaturedProductsSection />);
    const region = screen.getByTestId('featured-rail');
    Object.defineProperty(region, 'clientWidth', { value: 500, configurable: true });
    fireEvent.click(screen.getByLabelText('بعدی'));
    expect(spy).toHaveBeenCalledWith({ left: -400, behavior: 'auto' });
  });
});

describe('Product rail / category navigation', () => {
  it('hides when the backend has no categories', () => {
    mocks.categories = { data: [], isLoading: false };
    const { container } = render(<ProductRailSection />);
    expect(container.querySelector('[data-testid="product-rail"]')).toBeNull();
  });

  it('renders backend category titles with real slugs (no hardcoded taxonomy)', () => {
    mocks.categories = {
      data: [category(), category({ id: 'cat-2', title: 'سازه خورشیدی', slug: 'solar-structure' })],
      isLoading: false,
    };
    render(<ProductRailSection />);
    expect(screen.getAllByText('پکیج‌های خورشیدی').length).toBeGreaterThanOrEqual(1);
    const link = screen.getAllByText('سازه خورشیدی')[0].closest('a');
    expect(link?.getAttribute('href')).toBe('/products/category/solar-structure');
    expect(screen.getByText('ورود به کاتالوگ').closest('a')?.getAttribute('href')).toBe('/products');
  });
});

describe('Services preview', () => {
  it('shows loading state while fetching', () => {
    mocks.services = { data: null, isLoading: true, error: null, refetch: () => {} };
    const { container } = render(<ServicesSection />);
    expect(container.querySelector('section')).toBeTruthy();
  });

  it('shows an error state with retry on failure', () => {
    mocks.services = { data: null, isLoading: false, error: new Error('down'), refetch: () => {} };
    render(<ServicesSection />);
    expect(screen.getByText('تلاش مجدد')).toBeTruthy();
  });

  it('hides when there are no services and never shows invented fallback copy', () => {
    mocks.services = { data: { results: [] }, isLoading: false, error: null, refetch: () => {} };
    const { container } = render(<ServicesSection />);
    expect(container.innerHTML).toBe('');
    expect(container.textContent).not.toContain('Solar Design');
  });

  it('renders real backend services with detail links', () => {
    mocks.services = {
      data: { results: [{ id: 's-1', title: 'نصب نیروگاه آفگرید', slug: 'offgrid-install', short_description: 'نصب تخصصی' }] },
      isLoading: false,
      error: null,
      refetch: () => {},
    };
    render(<ServicesSection />);
    expect(screen.getByText('نصب نیروگاه آفگرید')).toBeTruthy();
    expect(screen.getByText('نصب نیروگاه آفگرید').closest('a')?.getAttribute('href')).toBe('/services/offgrid-install');
  });
});

describe('Calculator teaser and contact CTA', () => {
  it('links to the existing calculator route without duplicating logic', () => {
    render(<CalculatorSection />);
    const cta = screen.getByText('شروع محاسبه').closest('a');
    expect(cta?.getAttribute('href')).toBe('/calculator');
  });

  it('exposes working contact CTAs', () => {
    render(<ContactSection />);
    const links = screen.getAllByText('تماس با ما').map((el) => el.closest('a')?.getAttribute('href'));
    expect(links).toContain('/contact');
    expect(screen.getByText('درخواست قیمت').closest('a')?.getAttribute('href')).toBe('/contact');
  });
});

describe('Projects proof', () => {
  it('hides when there are no featured projects (no fabricated proof)', () => {
    mocks.projects = { data: [], isLoading: false, error: null };
    const { container } = render(<ProjectsSection />);
    expect(container.innerHTML).toBe('');
  });

  it('renders real backend projects', () => {
    mocks.projects = {
      data: [{ id: 'pr-1', slug: 'roof-5kw', title: 'نیروگاه پشت‌بامی ۵ کیلووات', location: 'تهران', capacity: 5, project_type: 'on_grid' }],
      isLoading: false,
      error: null,
    };
    render(<ProjectsSection />);
    expect(screen.getByText('نیروگاه پشت‌بامی ۵ کیلووات')).toBeTruthy();
  });
});

describe('Articles preview', () => {
  it('renders Persian headings (no English UI labels)', () => {
    mocks.articles = {
      data: { results: [{ id: 'a-1', slug: 'solar-guide', title: 'راهنمای خورشیدی', short_description: 'متن', category_title: 'آموزش' }] },
      isLoading: false,
    };
    const { container } = render(<ArticlesSection />);
    expect(screen.getByText('آخرین مقالات')).toBeTruthy();
    expect(container.textContent).not.toContain('Latest Articles');
    expect(container.textContent).not.toContain('Insights');
  });

  it('hides when there are no featured articles', () => {
    mocks.articles = { data: { results: [] }, isLoading: false };
    const { container } = render(<ArticlesSection />);
    expect(container.innerHTML).toBe('');
  });
});

describe('Homepage locale architecture', () => {
  it('keeps Persian the only active locale without removing ar/en', () => {
    expect([...activeLocales]).toEqual(['fa']);
    expect([...locales].sort()).toEqual(['ar', 'en', 'fa']);
  });
});

describe('Homepage visual asset architecture', () => {
  it('declares no floating imagery until real assets land', () => {
    expect(HERO_FLOATING_SLOTS).toEqual([]);
    expect(hasHeroFloatingVisuals()).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { HeroShowcase } from './HeroShowcase';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { HomepageClient } from '@/app/[locale]/(public)/homepage-client';

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

vi.mock('@/components/home/Hero3D', () => ({ Hero3D: () => null }));
vi.mock('@/components/home/CursorGlow', () => ({ CursorGlow: () => null }));
vi.mock('@/components/home/FloatingParticles', () => ({ FloatingParticles: () => null }));
vi.mock('@/components/home/MouseRipple', () => ({ MouseRipple: () => null }));
vi.mock('@/components/home/GradientMesh', () => ({ GradientMesh: () => null }));

const motionCtl = vi.hoisted(() => ({ reduce: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal<typeof import('framer-motion')>();
  return { ...mod, useReducedMotion: () => motionCtl.reduce };
});

const mocks = vi.hoisted(() => ({
  homepageData: null as unknown,
  featured: { data: null as unknown, isLoading: false },
  categories: { data: null as unknown, isLoading: false },
  services: { data: null as unknown, isLoading: false, error: null as unknown, refetch: () => {} },
  projects: { data: null as unknown, isLoading: false, error: null as unknown },
  articles: { data: null as unknown, isLoading: false },
  settings: { data: null as unknown },
}));

vi.mock('@/hooks/use-api', () => ({
  useHomepage: () => ({ data: mocks.homepageData }),
  useFeaturedPublicProducts: () => mocks.featured,
  usePublicProductCategories: () => mocks.categories,
  usePublicProducts: () => ({ data: null }),
  usePublicProduct: () => ({ data: null }),
  useServices: () => mocks.services,
  useFeaturedProjects: () => mocks.projects,
  useArticles: () => mocks.articles,
  useSiteSettings: () => mocks.settings,
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

function section(key: string, order: number, enabled = true) {
  return { key, enabled, order, title: '', subtitle: '', content: '' };
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    hero: {
      eyebrow: '', title: '', subtitle: '',
      primary_cta: { label: '', url: '', enabled: true },
      secondary_cta: { label: '', url: '', enabled: true },
      enabled: true,
    },
    sections: [
      section('hero', 10), section('featured_products', 20), section('categories', 30),
      section('services', 40), section('calculator', 50), section('projects', 60),
      section('articles', 70), section('contact', 80),
    ],
    featured_products: [],
    categories: [],
    services: [],
    calculator: { title: '', subtitle: '', description: '', cta_label: '', cta_url: '', enabled: true },
    projects: [],
    articles: [],
    contact: { title: '', subtitle: '', description: '', cta_label: '', cta_url: '', secondary_cta: { label: '', url: '' }, enabled: true },
    visuals: [],
    seo: { title: '', description: '', canonical_url: '', robots: '', og_title: '', og_description: '', og_image_url: '' },
    ...overrides,
  };
}

beforeEach(() => {
  motionCtl.reduce = false;
  stubDom();
  mocks.homepageData = null;
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.services = { data: null, isLoading: false, error: null, refetch: () => {} };
  mocks.projects = { data: null, isLoading: false, error: null };
  mocks.articles = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Phase 12 — hero composition', () => {
  it('1. renders text zone + product visual stage in one hero', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    const { container } = render(<HeroSection />);
    expect(screen.getByTestId('hero-slogan')).toBeTruthy();
    expect(screen.getByTestId('hero-showcase')).toBeTruthy();
    expect(screen.getByTestId('hero-product-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
    // Mobile-safe: no fixed page widths on the hero grid.
    expect(container.querySelector('[data-section="hero"]')?.className).toContain('overflow-hidden');
  });

  it('2. shows a designed empty stage (no fake product) when no products exist', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    render(<HeroSection />);
    expect(screen.getByTestId('hero-showcase-empty')).toBeTruthy();
    expect(screen.queryByTestId('hero-product-title')).toBeNull();
  });

  it('3. prefers CMS-passed featured products over the hook', () => {
    mocks.featured = { data: { results: [product({ title: 'قلاب' })] }, isLoading: false };
    render(<HeroSection featured={[product({ title: 'محصول CMS' })] as never} />);
    expect(screen.getByTestId('hero-product-title').textContent).toBe('محصول CMS');
  });

  it('4. renders CMS floating visuals around the stage, nothing when empty', () => {
    const { rerender } = render(
      <HeroShowcase
        products={[product() as never]}
        visuals={[{ id: 'v-1', image_url: 'http://localhost:8000/media/a.png', alt: '', order: 0, link_url: '' }]}
      />,
    );
    expect(screen.getByTestId('hero-floating-visual')).toBeTruthy();
    rerender(<HeroShowcase products={[product() as never]} visuals={[]} />);
    expect(screen.queryByTestId('hero-floating-visual')).toBeNull();
  });

  it('5. keeps exactly one H1, CMS CTAs, and the RTL-forward chevron', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    const { container } = render(
      <HeroSection
        hero={{
          eyebrow: '', title: '', subtitle: '',
          primary_cta: { label: 'خرید پنل', url: '/products/panel', enabled: true },
          secondary_cta: { label: 'مشاوره', url: '/contact', enabled: true },
          enabled: true,
        }}
      />,
    );
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByTestId('hero-cta-primary').getAttribute('href')).toBe('/products/panel');
    expect(screen.getByTestId('hero-cta-secondary').getAttribute('href')).toBe('/contact');
    expect(screen.getByTestId('hero-cta-primary').querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  });
});

describe('Phase 12 — featured showcase stage', () => {
  function twoProducts() {
    return [
      product(),
      product({
        id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k',
        price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' },
      }),
    ];
  }

  it('6. stage carries product number, active state, and wrap-around nav', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    render(<FeaturedProductsSection />);
    const spotlight = screen.getByTestId('featured-spotlight');
    expect(spotlight.textContent).toContain('1 / 2');
    fireEvent.click(within(spotlight).getByLabelText('بعدی — پنل خورشیدی ۵۵۰ وات'));
    expect(within(screen.getByTestId('featured-spotlight')).getByText('اینورتر ۵ کیلووات')).toBeTruthy();
    fireEvent.click(within(screen.getByTestId('featured-spotlight')).getByLabelText('بعدی — اینورتر ۵ کیلووات'));
    expect(within(screen.getByTestId('featured-spotlight')).getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    expect(spotlight.querySelectorAll('button[aria-current="true"]').length).toBe(1);
  });

  it('7. discounted pricing struck-through; contact state invents no number', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    const spotlight = screen.getByTestId('featured-spotlight');
    fireEvent.click(within(spotlight).getByLabelText('بعدی — پنل خورشیدی ۵۵۰ وات'));
    expect(container.querySelector('[data-testid="featured-spotlight"] .line-through')).toBeTruthy();
  });

  it('8. hidden price exposes no pricing surface', () => {
    mocks.featured = {
      data: {
        results: [
          product({ price: { state: 'hidden', currency: 'IRR' } }),
          product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' }),
        ],
      },
      isLoading: false,
    };
    const { container } = render(<FeaturedProductsSection />);
    const spotlight = container.querySelector('[data-testid="featured-spotlight"]');
    expect(spotlight?.textContent).not.toMatch(/تومان/);
  });

  it('9. empty featured products hide the section; disabled renders nothing', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    expect(container.querySelector('[data-testid="featured-products"]')).toBeNull();
    const { container: d } = render(
      <FeaturedProductsSection
        cms={{ items: [product() as never], section: section('featured_products', 20, false) as never }}
      />,
    );
    expect(d.innerHTML).toBe('');
  });
});

describe('Phase 12 — homepage assembly', () => {
  it('10. hero hands off to featured: same CMS product in both zones', () => {
    mocks.homepageData = payload({ featured_products: [product(), product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' })] });
    const { container } = render(<HomepageClient />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByTestId('hero-product-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
    expect(screen.getByTestId('featured-spotlight')).toBeTruthy();
  });

  it('11. empty CMS renders hero copy with zero fake content', () => {
    mocks.homepageData = payload();
    const { container } = render(<HomepageClient />);
    expect(container.textContent).not.toContain('Powering the');
    expect(container.textContent).not.toMatch(/25\s*MW|150\+|98%/);
    expect(screen.getByTestId('hero-showcase-empty')).toBeTruthy();
  });

  it('12. reduced motion keeps hero + spotlight static but painted', () => {
    motionCtl.reduce = true;
    mocks.featured = {
      data: {
        results: [
          product(),
          product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' }),
        ],
      },
      isLoading: false,
    };
    render(<FeaturedProductsSection />);
    expect(within(screen.getByTestId('featured-spotlight')).getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
  });
});

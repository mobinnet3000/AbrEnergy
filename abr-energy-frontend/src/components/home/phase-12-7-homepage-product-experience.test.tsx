import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { HomepageShowcase } from './HomepageShowcase';
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
  useHomepage: () => ({ data: mocks.homepageData, error: null }),
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
      section('hero', 10), section('categories', 20), section('featured_products', 30),
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

function twoCategories() {
  return [
    category(),
    category({ id: 'cat-2', title: 'سازه خورشیدی', slug: 'solar-structure', sort_order: 1 }),
  ];
}

function twoProducts() {
  return [
    product(),
    product({ id: 'p-2', title: 'سازه نگه‌دارنده پنل', slug: 'mount-structure', category: 'cat-2' }),
  ];
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

describe('Phase 12.7 — homepage product experience hierarchy', () => {
  it('1. hero → featured → categories order holds even when CMS orders differently', () => {
    mocks.homepageData = payload({
      sections: [
        section('featured_products', 5),
        section('categories', 6),
        section('hero', 7),
        section('services', 40),
        section('contact', 80),
      ],
      featured_products: twoProducts(),
      categories: twoCategories(),
    });
    const { container } = render(<HomepageClient />);
    const order = Array.from(container.querySelectorAll('[data-section]')).map((el) =>
      el.getAttribute('data-section'),
    );
    // Phase 12.11 — featured products now come before the solutions/categories section.
    expect(order.slice(0, 3)).toEqual(['hero', 'featured', 'categories']);
  });

  it('2. showcase has no inner category strip; dedicated section carries navigation', () => {
    const { container } = render(
      <HomepageShowcase products={twoProducts() as never} categories={twoCategories() as never} visuals={[]} />,
    );
    expect(container.querySelector('[data-testid="showcase-category-rail"]')).toBeNull();
    expect(container.querySelector('[data-testid="hero-showcase"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="instant-offer-panel"]')).toBeTruthy();
  });

  it('3. dedicated category rail links to real category routes (no invented ids)', () => {
    mocks.homepageData = payload({ featured_products: twoProducts(), categories: twoCategories() });
    render(<HomepageClient />);
    const rail = screen.getByTestId('product-rail');
    const hrefs = within(rail).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/category/solar-packages');
    expect(hrefs).toContain('/products/category/solar-structure');
  });

  it('4. slogan H1 prominent fluid type, single H1, showcase dominant grid', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    const { container } = render(<HeroSection />);
    const h1 = container.querySelector('h1');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(h1?.className).toContain('hero-slogan-display');
    expect(container.querySelector('[data-testid="homepage-showcase"] > div')?.className).toContain(
      'lg:grid-cols-[2.1fr_0.9fr]',
    );
  });

  it('5. rail cards premium width with consistent heights', () => {
    mocks.homepageData = payload({ featured_products: twoProducts(), categories: twoCategories() });
    render(<HomepageClient />);
    const cards = screen.getByTestId('featured-rail').querySelectorAll(':scope > div');
    expect(cards.length).toBe(2);
    for (const c of Array.from(cards)) {
      expect((c as HTMLElement).className).toContain('w-[240px]');
    }
  });
});

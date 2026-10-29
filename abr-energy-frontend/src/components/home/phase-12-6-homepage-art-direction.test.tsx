import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { HomepageShowcase } from './HomepageShowcase';
import { ArticlesSection } from './ArticlesSection';
import { ProjectsSection } from './ProjectsSection';
import { ContactSection } from './ContactSection';

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

const mocks = vi.hoisted(() => ({
  featured: { data: null as unknown, isLoading: false },
  categories: { data: null as unknown, isLoading: false },
  projects: { data: null as unknown, isLoading: false, error: null as unknown },
  articles: { data: null as unknown, isLoading: false },
  settings: { data: null as unknown },
}));

vi.mock('@/hooks/use-api', () => ({
  useHomepage: () => ({ data: null, error: null }),
  useFeaturedPublicProducts: () => mocks.featured,
  usePublicProductCategories: () => mocks.categories,
  usePublicProducts: () => ({ data: null }),
  usePublicProduct: () => ({ data: null }),
  useServices: () => ({ data: null, isLoading: false, error: null, refetch: () => {} }),
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
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1', title: 'پنل خورشیدی ۵۵۰ وات', slug: 'panel-550',
    short_description: '', sku: 'PNL-550', category: 'cat-1',
    cover_image_url: '', status: 'published', visibility: 'public',
    is_active: true, is_featured: true, sort_order: 0,
    price: { state: 'discounted', currency: 'IRR', regular_price: '42000000', sale_price: null, final_price: '36500000' },
    created_at: '', updated_at: '', published_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.projects = { data: null, isLoading: false, error: null };
  mocks.articles = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Phase 12.6 — desktop-first art direction', () => {
  it('1. brand masthead centered above showcase with dominant H1', () => {
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    const bar = hero?.querySelector('[data-testid="brand-slogan-bar"]');
    expect(bar?.className).toContain('text-center');
    expect(bar?.className).toContain('max-w-5xl');
    const h1 = hero?.querySelector('h1');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(h1?.className).toContain('hero-slogan-display');
    expect(h1?.className).toContain('xl:text-6xl');
    const stage = hero?.querySelector('[data-testid="homepage-showcase"]');
    expect(stage).toBeTruthy();
    expect(bar!.compareDocumentPosition(stage!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('2. showcase stage dominates instant panel', () => {
    const { container } = render(
      <HomepageShowcase products={[product() as never]} categories={[]} visuals={[]} />,
    );
    const grid = container.querySelector('[data-testid="homepage-showcase"] > div');
    expect(grid?.className).toContain('lg:grid-cols-[2.1fr_0.9fr]');
    expect(container.querySelector('[data-testid="hero-product-title"]')?.className).toContain('lg:text-2xl');
  });

  it('3. lower sections share one dark surface', () => {
    mocks.projects = { data: [{ id: 'p-1', title: 'پروژه', slug: 's', location: 'تهران', capacity: 1, project_type: 'x' }], isLoading: false, error: null };
    mocks.articles = { data: [{ id: 'a-1', title: 'راهنما', slug: 's', short_description: 'م' }], isLoading: false };
    const { container } = render(<><ProjectsSection /><ArticlesSection /><ContactSection /></>);
    for (const id of ['projects-showcase', 'articles-editorial', 'contact-panel']) {
      const cls = container.querySelector(`[data-testid="${id}"]`)?.className ?? '';
      expect(cls).toContain('dark:bg-neutral-950');
      expect(cls.split(' ').some((c) => c === 'dark:bg-black')).toBe(false);
    }
  });

  it('4. discounted price hierarchy intact in showcase', () => {
    const { container } = render(
      <HomepageShowcase products={[product() as never]} categories={[]} visuals={[]} />,
    );
    expect(container.querySelector('[data-testid="hero-showcase-fallback"]')).toBeTruthy();
    expect(container.textContent).toContain('۳۶٬۵۰۰٬۰۰۰');
  });
});

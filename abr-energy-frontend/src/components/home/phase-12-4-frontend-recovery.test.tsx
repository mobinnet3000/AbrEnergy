import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { HomepageShowcase } from './HomepageShowcase';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { ProductRailSection } from './ProductRailSection';

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
  featured: { data: null as unknown, isLoading: false },
  categories: { data: null as unknown, isLoading: false },
  settings: { data: null as unknown },
}));

vi.mock('@/hooks/use-api', () => ({
  useHomepage: () => ({ data: null, error: null }),
  useFeaturedPublicProducts: () => mocks.featured,
  usePublicProductCategories: () => mocks.categories,
  usePublicProducts: () => ({ data: null }),
  usePublicProduct: () => ({ data: null }),
  useServices: () => ({ data: null, isLoading: false, error: null, refetch: () => {} }),
  useFeaturedProjects: () => ({ data: null, isLoading: false, error: null }),
  useArticles: () => ({ data: null, isLoading: false }),
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

beforeEach(() => {
  motionCtl.reduce = false;
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Phase 12.4 — first-viewport composition (slogan/nav/showcase/rails)', () => {
  it('1. single H1 slogan renders plain text on first paint (SSR-readable)', () => {
    const { container } = render(<HeroSection />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent?.replace(/\s+/g, '')).toContain('طلوعآفتاب');
  });

  it('2. slogan + showcase share one compact section (nav in global header only)', () => {
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    expect(hero).toBeTruthy();
    expect(hero?.className).not.toContain('min-h-screen');
    const slogan = hero?.querySelector('[data-testid="hero-slogan"]');
    const stage = hero?.querySelector('[data-testid="homepage-showcase"]');
    expect(slogan && stage).toBeTruthy();
    expect(hero?.querySelector('[data-testid="showcase-nav"]')).toBeNull();
    expect(slogan!.compareDocumentPosition(stage!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('3. empty CMS renders designed empty states (no blank collapse)', () => {
    render(<HeroSection />);
    expect(screen.getByTestId('hero-showcase-empty')).toBeTruthy();
    expect(screen.getByTestId('instant-offer-panel')).toBeTruthy();
  });

  it('4. showcase without covers renders designed fallbacks, not blank frames', () => {
    const noCover = (id: string, state: string) => ({
      id, title: `کالای ${id}`, slug: `item-${id}`, short_description: '',
      sku: id, category: 'cat-1', cover_image_url: '', status: 'published',
      visibility: 'public', is_active: true, is_featured: true, sort_order: 0,
      price: { state, currency: 'IRR', regular_price: '100', final_price: '100' },
      created_at: '', updated_at: '', published_at: null,
    });
    render(
      <HomepageShowcase
        products={[noCover('a', 'regular'), noCover('b', 'discounted')] as never}
        categories={[]}
        visuals={[]}
      />,
    );
    expect(screen.getByTestId('hero-showcase-fallback')).toBeTruthy();
    expect(screen.getByTestId('instant-offer-panel')).toBeTruthy();
  });

  it('5. empty featured/categories sections hide (nothing fabricated)', () => {
    const { container } = render(
      <>
        <FeaturedProductsSection />
        <ProductRailSection />
      </>,
    );
    expect(container.querySelector('[data-testid="featured-products"]')).toBeNull();
    expect(container.querySelector('[data-testid="product-rail"]')).toBeNull();
  });

  it('6. lead paragraph wraps (no truncate clipping)', () => {
    const { container } = render(<HeroSection />);
    const lead = container.querySelector('[data-testid="brand-slogan-bar"] p');
    expect(lead?.className).not.toContain('truncate');
  });
});

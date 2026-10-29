import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { ProductRailSection } from './ProductRailSection';
import { ProductCard } from '@/components/products/public/ProductCard';

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
  useHomepage: () => ({ data: null }),
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
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Phase 12.3 — slogan is brand identity, not showcase caption', () => {
  it('1. slogan H1 is prominent display type (Phase 12.5: art-directed focal point)', () => {
    const { container } = render(<HeroSection />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(h1?.className).toContain('hero-slogan-display');
  });

  it('2. hero stays light + compact (no min-h-screen, tight padding)', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    mocks.categories = { data: [category()], isLoading: false };
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    expect(hero?.className).toContain('showcase-light');
    expect(hero?.className).not.toContain('min-h-screen');
    expect(hero?.className).not.toContain('bg-black');
    // Phase 12.5 — art-directed grid needs fixed-header clearance (pt-24) + breathing room.
    expect(hero?.querySelector('.container-page')?.className).toContain('pt-24');
  });

  it('3. brand zone + showcase share ONE upper section (slogan first, nav in global header only)', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    mocks.categories = { data: [category()], isLoading: false };
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]') as HTMLElement;
    expect(hero).toBeTruthy();
    const slogan = hero.querySelector('[data-testid="hero-slogan"]');
    const stage = hero.querySelector('[data-testid="hero-showcase"]');
    expect(slogan).toBeTruthy();
    expect(stage).toBeTruthy();
    // Phase 12.5 — no duplicate nav strip inside the hero.
    expect(hero.querySelector('[data-testid="showcase-nav"]')).toBeNull();
    // DOM order: slogan (brand) → showcase. TextReveal splits the
    // slogan into word spans, so compare position, not innerHTML strings.
    expect(slogan!.compareDocumentPosition(stage!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('4. Hero3D stays mounted but subordinate (faint, behind content)', () => {
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    expect(hero?.className).toContain('showcase-light');
    expect(hero?.className).toContain('relative');
  });
});

describe('Phase 12.3 — light editorial continuation', () => {
  it('5. featured section is light + compact with light-tone rail cards', () => {
    mocks.featured = {
      data: { results: [product(), product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' })] },
      isLoading: false,
    };
    const { container } = render(<FeaturedProductsSection />);
    const section = container.querySelector('[data-section="featured"]');
    expect(section?.className).toContain('bg-white');
    expect(section?.className).not.toContain('bg-black');
    expect(section?.className).toContain('py-12');
    const rail = screen.getByTestId('featured-rail');
    const cards = rail.querySelectorAll(':scope > div');
    expect(cards.length).toBe(2);
    expect((cards[0] as HTMLElement).className).toContain('w-[240px]');
  });

  it('6. categories section is light + premium (directly below showcase)', () => {
    mocks.categories = { data: [category()], isLoading: false };
    const { container } = render(<ProductRailSection />);
    const section = container.querySelector('[data-section="categories"]');
    expect(section?.className).toContain('bg-white');
    expect(section?.className).not.toContain('bg-black');
    expect(section?.className).toContain('py-14');
  });

  it('7. ProductCard light tone renders light surfaces; dark default unchanged', () => {
    const { container, rerender } = render(
      <ProductCard product={product() as never} tone="light" />,
    );
    expect(container.querySelector('article')?.className).toContain('bg-white');
    rerender(<ProductCard product={product() as never} />);
    expect(container.querySelector('article')?.className).toContain('bg-white/[0.02]');
  });

  it('8. exactly one H1 across hero + featured + categories', () => {
    mocks.featured = { data: { results: [product()] }, isLoading: false };
    mocks.categories = { data: [category()], isLoading: false };
    const { container } = render(
      <>
        <HeroSection />
        <FeaturedProductsSection />
        <ProductRailSection />
      </>,
    );
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });
});

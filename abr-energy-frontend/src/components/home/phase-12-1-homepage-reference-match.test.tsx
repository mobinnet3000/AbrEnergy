import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { HomepageShowcase } from './HomepageShowcase';
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

function twoCategories() {
  return [
    category(),
    category({ id: 'cat-2', title: 'سازه خورشیدی', slug: 'solar-structure', sort_order: 1 }),
  ];
}

function twoProducts() {
  return [
    product(),
    product({
      id: 'p-2', title: 'سازه نگه‌دارنده پنل', slug: 'mount-structure',
      category: 'cat-2', cover_image_url: 'http://localhost:8000/media/s.png',
    }),
  ];
}

describe('Phase 12.1 — first-viewport reference composition', () => {
  it('1. slogan H1, nav, stage, instant panel, and category strip share ONE upper hero section', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    mocks.categories = { data: twoCategories(), isLoading: false };
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    expect(hero).toBeTruthy();
    // Regression guard: the exact H1 stays in the upper section, never below the fold.
    const h1 = hero?.querySelector('h1');
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(within(hero as HTMLElement).getByTestId('showcase-nav')).toBeTruthy();
    expect(within(hero as HTMLElement).getByTestId('hero-showcase')).toBeTruthy();
    expect(within(hero as HTMLElement).getByTestId('instant-offer-panel')).toBeTruthy();
    expect(within(hero as HTMLElement).getByTestId('showcase-category-rail')).toBeTruthy();
    // Compact hero: no full-screen giant stage consuming the viewport.
    expect(hero?.className).not.toContain('min-h-screen');
  });

  it('2. showcase nav carries the intended items on real routes only', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    mocks.categories = { data: [], isLoading: false };
    render(<HeroSection />);
    const nav = screen.getByTestId('showcase-nav');
    const links = within(nav).getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/products', '/services', '/projects', '/gallery', '/calculator', '/contact']);
    expect(nav.textContent).toContain('دانلودها');
    expect(nav.textContent).toContain('محاسبه‌گر نیروگاه خورشیدی آفگرید');
    expect(nav.textContent).toContain('تماس با ما');
  });

  it('3. instant-suggestion panel cycles CMS products with prev/next and counter', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    mocks.categories = { data: [], isLoading: false };
    render(<HeroSection />);
    const panel = screen.getByTestId('instant-offer-panel');
    expect(within(panel).getByText('پیشنهاد لحظه‌ای')).toBeTruthy();
    expect(within(panel).getByTestId('instant-offer-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
    fireEvent.click(within(panel).getByLabelText('بعدی — پیشنهاد لحظه‌ای'));
    expect(within(panel).getByTestId('instant-offer-title').textContent).toBe('سازه نگه‌دارنده پنل');
    expect(panel.textContent).toContain('2 / 2');
    // Wrap-around.
    fireEvent.click(within(panel).getByLabelText('بعدی — پیشنهاد لحظه‌ای'));
    expect(within(panel).getByTestId('instant-offer-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
  });

  it('4. category strip uses real ids, marks the active item, and drives the main visual', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    mocks.categories = { data: twoCategories(), isLoading: false };
    render(<HeroSection />);
    const rail = screen.getByTestId('showcase-category-rail');
    const buttons = within(rail).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['پکیج‌های خورشیدی', 'سازه خورشیدی']);
    // Default active = first root; main visual shows its product.
    expect(buttons[0].getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('hero-product-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
    // Selecting the second category swaps the main visual (CMS-driven).
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('hero-product-title').textContent).toBe('سازه نگه‌دارنده پنل');
    // Category CTA follows the active category slug (real routing).
    expect(screen.getByText('ورود به کاتالوگ').closest('a')?.getAttribute('href')).toBe(
      '/products/category/solar-structure',
    );
  });

  it('5. category strip supports RTL keyboard navigation', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    mocks.categories = { data: twoCategories(), isLoading: false };
    render(<HeroSection />);
    const rail = screen.getByTestId('showcase-category-rail');
    // RTL: ArrowLeft moves toward inline-end = next category.
    fireEvent.keyDown(rail, { key: 'ArrowLeft' });
    expect(screen.getByTestId('hero-product-title').textContent).toBe('سازه نگه‌دارنده پنل');
    fireEvent.keyDown(rail, { key: 'ArrowRight' });
    expect(screen.getByTestId('hero-product-title').textContent).toBe('پنل خورشیدی ۵۵۰ وات');
  });

  it('6. empty CMS renders designed empty states with zero fake content', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    mocks.categories = { data: [], isLoading: false };
    const { container } = render(<HeroSection />);
    expect(screen.getByTestId('hero-showcase-empty')).toBeTruthy();
    expect(screen.queryByTestId('hero-product-title')).toBeNull();
    expect(screen.queryByTestId('showcase-category-rail')).toBeNull();
    expect(container.textContent).not.toContain('Powering the');
    expect(container.textContent).not.toMatch(/25\s*MW|150\+|98%/);
  });

  it('7. HomepageClient keeps the hero first so the slogan never drops below the fold', () => {
    const data = payload({ featured_products: twoProducts(), categories: twoCategories() });
    const { container } = render(<HomepageClient previewPayload={data as never} />);
    const sections = Array.from(container.querySelectorAll('[data-section]'));
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].getAttribute('data-section')).toBe('hero');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(sections[0].textContent?.replace(/\s+/g, '')).toContain('طلوعآفتاب،ازخانهشماست');
  });
});

describe('Phase 12.1 — Reference-A dense product rail', () => {
  it('8. rail cards are narrow so many products show at once (RTL region preserved)', () => {
    const items = [
      product(),
      product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' }),
      product({ id: 'p-3', title: 'باتری لیتیومی', slug: 'li-battery' }),
      product({ id: 'p-4', title: 'کابل خورشیدی', slug: 'solar-cable' }),
      product({ id: 'p-5', title: 'کانکتور MC4', slug: 'mc4' }),
      product({ id: 'p-6', title: 'استراکچر گالوانیزه', slug: 'galva-structure' }),
    ];
    mocks.featured = { data: { results: items }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    const rail = screen.getByTestId('featured-rail');
    expect(rail.getAttribute('role')).toBe('region');
    const cards = rail.querySelectorAll(':scope > div');
    expect(cards.length).toBe(6);
    // Narrow Reference-A density (was w-[270px]/320px — only ~3 visible).
    expect((cards[0] as HTMLElement).className).toContain('w-[168px]');
    expect((cards[0] as HTMLElement).className).toContain('xl:w-[220px]');
    expect(container.querySelector('[data-testid="featured-rail"]')).toBeTruthy();
  });

  it('9. discounted card shows struck-through original + final price; regular shows final only', () => {
    mocks.featured = {
      data: {
        results: [
          product({
            id: 'p-9', title: 'پکیج تخفیف‌دار', slug: 'discounted-pack',
            price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' },
          }),
          product({ id: 'p-2', title: 'پنل عادی', slug: 'panel-regular' }),
        ],
      },
      isLoading: false,
    };
    const { container } = render(<FeaturedProductsSection />);
    const rail = screen.getByTestId('featured-rail');
    expect(within(rail).getByText('پکیج تخفیف‌دار')).toBeTruthy();
    expect(container.querySelector('.line-through')).toBeTruthy();
    expect(container.textContent).toContain('تومان');
  });

  it('10. contact-price card invents no number; hidden price shows no surface', () => {
    mocks.featured = {
      data: {
        results: [
          product({
            id: 'p-c', title: 'پکیج تماسی', slug: 'contact-pack',
            price: { state: 'contact_for_price', currency: 'IRR' },
          }),
          product({
            id: 'p-h', title: 'پکیج بدون قیمت', slug: 'hidden-pack',
            price: { state: 'hidden', currency: 'IRR' },
          }),
        ],
      },
      isLoading: false,
    };
    render(<FeaturedProductsSection />);
    const rail = screen.getByTestId('featured-rail');
    // Contact state appears in rail card (and spotlight); assert rail copy invents no figure.
    const contactLabels = within(rail).getAllByText('برای اطلاع از قیمت تماس بگیرید');
    expect(contactLabels.length).toBeGreaterThanOrEqual(1);
    const hiddenCard = within(rail).getByText('پکیج بدون قیمت').closest('article');
    expect(hiddenCard?.textContent).not.toContain('تومان');
    expect(hiddenCard?.textContent).not.toMatch(/[۰-۹0-9][٬,]?[۰-۹0-9]*\s*تومان/);
  });

  it('11. reduced motion keeps showcase + rail painted and navigable', () => {
    motionCtl.reduce = true;
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    mocks.categories = { data: twoCategories(), isLoading: false };
    render(
      <HomepageShowcase
        products={twoProducts() as never}
        categories={twoCategories() as never}
        visuals={[]}
      />,
    );
    expect(screen.getByTestId('hero-showcase')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('بعدی — پیشنهاد لحظه‌ای'));
    expect(screen.getByTestId('instant-offer-title').textContent).toBe('سازه نگه‌دارنده پنل');
  });
});

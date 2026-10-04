import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { FloatingVisuals } from './FloatingVisuals';
import { ProductRailSection } from './ProductRailSection';
import { ServicesSection } from './ServicesSection';
import { ProjectsSection } from './ProjectsSection';
import { ArticlesSection } from './ArticlesSection';
import { CalculatorSection } from './CalculatorSection';
import { HomepageClient } from '@/app/[locale]/(public)/homepage-client';

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

// Hero3D needs WebGL — unavailable in jsdom. Preserved in production.
vi.mock('@/components/home/Hero3D', () => ({ Hero3D: () => null }));
// Page-level atmosphere overlays: not under test here (covered by prior
// phases); stubbed so HomepageClient assembly tests focus on sections.
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

describe('Phase 11 — hero visual experience', () => {
  it('1. keeps the exact Persian slogan as the single h1 with display treatment', () => {
    const { container } = render(<HeroSection />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(h1?.className).toContain('hero-slogan-display');
    expect(screen.getByTestId('hero-slogan')).toBeTruthy();
  });

  it('2. renders CMS hero CTA labels and URLs instead of hardcoded copy', () => {
    render(
      <HeroSection
        hero={{
          eyebrow: 'متن ابرو', title: '', subtitle: '',
          primary_cta: { label: 'خرید پنل', url: '/products/panel', enabled: true },
          secondary_cta: { label: 'مشاوره', url: '/contact', enabled: true },
          enabled: true,
        }}
      />,
    );
    expect(screen.getByTestId('hero-cta-primary').getAttribute('href')).toBe('/products/panel');
    expect(screen.getByText('خرید پنل')).toBeTruthy();
    expect(screen.getByTestId('hero-cta-secondary').getAttribute('href')).toBe('/contact');
    expect(screen.getByText('مشاوره')).toBeTruthy();
  });

  it('18. keeps the RTL-forward chevron on the primary CTA', () => {
    render(<HeroSection />);
    const cta = screen.getByTestId('hero-cta-primary');
    // RTL-forward chevron (ArrowLeft) rendered as a decorative icon.
    expect(cta.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  });
});

describe('Phase 11 — product showcase', () => {
  function twoProducts() {
    return [
      product(),
      product({
        id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k',
        price: { state: 'discounted', currency: 'IRR', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' },
      }),
    ];
  }

  it('3. renders the active spotlight with title, detail CTA, and rail', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    render(<FeaturedProductsSection />);
    const spotlight = screen.getByTestId('featured-spotlight');
    expect(within(spotlight).getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    expect(
      spotlight.querySelector('a[href="/products/panel-550"]'),
    ).toBeTruthy();
    expect(screen.getByTestId('featured-rail')).toBeTruthy();
  });

  it('4. shows discounted pricing struck-through with the backend badge', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    const spotlight = screen.getByTestId('featured-spotlight');
    // Second product is discounted: navigate the spotlight to it.
    fireEvent.click(within(spotlight).getByLabelText('بعدی — پنل خورشیدی ۵۵۰ وات'));
    expect(within(spotlight).getByText('اینورتر ۵ کیلووات')).toBeTruthy();
    expect(container.querySelector('[data-testid="featured-spotlight"] .line-through')).toBeTruthy();
  });

  it('5. shows the contact price note without inventing a number', () => {
    mocks.featured = {
      data: {
        results: [
          product({ price: { state: 'contact_for_price', currency: 'IRR' } }),
          product({ id: 'p-2', title: 'اینورتر ۵ کیلووات', slug: 'inverter-5k' }),
        ],
      },
      isLoading: false,
    };
    const { container } = render(<FeaturedProductsSection />);
    const spotlight = container.querySelector('[data-testid="featured-spotlight"]');
    expect(within(spotlight as HTMLElement).getByText('برای اطلاع از قیمت تماس بگیرید')).toBeTruthy();
    expect(spotlight?.textContent).not.toMatch(/تومان/);
  });

  it('6. exposes no pricing at all for hidden prices', () => {
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
    expect(spotlight?.querySelector('.line-through')).toBeNull();
  });

  it('7. navigates next/previous through the spotlight with wrap-around', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    render(<FeaturedProductsSection />);
    const spotlight = screen.getByTestId('featured-spotlight');
    fireEvent.click(within(spotlight).getByLabelText('بعدی — پنل خورشیدی ۵۵۰ وات'));
    expect(within(screen.getByTestId('featured-spotlight')).getByText('اینورتر ۵ کیلووات')).toBeTruthy();
    fireEvent.click(within(screen.getByTestId('featured-spotlight')).getByLabelText('بعدی — اینورتر ۵ کیلووات'));
    // Wraps back to the first product.
    expect(within(screen.getByTestId('featured-spotlight')).getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    fireEvent.click(within(screen.getByTestId('featured-spotlight')).getByLabelText('قبلی — پنل خورشیدی ۵۵۰ وات'));
    expect(within(screen.getByTestId('featured-spotlight')).getByText('اینورتر ۵ کیلووات')).toBeTruthy();
  });

  it('8. hides the showcase when there are no featured products', () => {
    mocks.featured = { data: { results: [] }, isLoading: false };
    const { container } = render(<FeaturedProductsSection />);
    expect(container.querySelector('[data-testid="featured-products"]')).toBeNull();
    expect(container.querySelector('[data-testid="featured-spotlight"]')).toBeNull();
  });

  it('9. renders nothing when the CMS disables the section', () => {
    const { container } = render(
      <FeaturedProductsSection
        cms={{ items: [product() as never], section: section('featured_products', 20, false) as never }}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('19. exposes carousel semantics, labelled controls, and active state', () => {
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    render(<FeaturedProductsSection />);
    const rail = screen.getByTestId('featured-rail');
    expect(rail.getAttribute('role')).toBe('region');
    expect(rail.getAttribute('aria-roledescription')).toBe('carousel');
    const spotlight = screen.getByTestId('featured-spotlight');
    expect(within(spotlight).getByLabelText('بعدی — پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
    // Active dot carries aria-current; counter is a live region.
    const dots = spotlight.querySelectorAll('button[aria-current="true"]');
    expect(dots.length).toBe(1);
    expect(spotlight.querySelector('[aria-live="polite"]')?.textContent).toContain('1 / 2');
  });

  it('20. scrolls instantly on the rail when reduced motion is preferred', () => {
    motionCtl.reduce = true;
    mocks.featured = { data: { results: twoProducts() }, isLoading: false };
    const spy = vi.fn();
    Element.prototype.scrollBy = spy;
    render(<FeaturedProductsSection />);
    const region = screen.getByTestId('featured-rail');
    Object.defineProperty(region, 'clientWidth', { value: 500, configurable: true });
    fireEvent.click(screen.getByLabelText('بعدی'));
    expect(spy).toHaveBeenCalledWith({ left: -400, behavior: 'auto' });
    // Spotlight still paints the active product without motion.
    expect(within(screen.getByTestId('featured-spotlight')).getByText('پنل خورشیدی ۵۵۰ وات')).toBeTruthy();
  });
});

describe('Phase 11 — floating visuals', () => {
  it('11. renders CMS-driven floating visuals', () => {
    const { container } = render(
      <FloatingVisuals
        visuals={[
          { id: 'v-1', image_url: 'http://localhost:8000/media/a.png', alt: 'پنل', order: 0, link_url: '' },
          { id: 'v-2', image_url: 'http://localhost:8000/media/b.png', alt: 'اینورتر', order: 1, link_url: '' },
        ]}
      />,
    );
    expect(screen.getByTestId('floating-visuals')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="floating-visual"]').length).toBe(2);
  });

  it('12. renders nothing when visual slots carry no media', () => {
    const { container } = render(
      <FloatingVisuals
        visuals={[{ id: 'v-1', image_url: '  ', alt: '', order: 0, link_url: '' }]}
      />,
    );
    expect(container.innerHTML).toBe('');
    const { container: empty } = render(<FloatingVisuals visuals={[]} />);
    expect(empty.innerHTML).toBe('');
  });
});

describe('Phase 11 — remaining homepage sections', () => {
  it('13. renders real categories with detail slugs', () => {
    mocks.categories = {
      data: [{ id: 'cat-1', title: 'پکیج‌های خورشیدی', slug: 'solar-packages', parent: null, children: [], sort_order: 0, is_active: true, is_featured: false }],
      isLoading: false,
    };
    render(<ProductRailSection />);
    expect(screen.getAllByText('پکیج‌های خورشیدی').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ورود به کاتالوگ').closest('a')?.getAttribute('href')).toBe('/products');
  });

  it('14. renders real services with detail links', () => {
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

  it('15. renders real projects without invented statistics', () => {
    mocks.projects = {
      data: [{ id: 'pr-1', slug: 'roof-5kw', title: 'نیروگاه پشت‌بامی ۵ کیلووات', location: 'تهران', capacity: 5, project_type: 'on_grid' }],
      isLoading: false,
      error: null,
    };
    const { container } = render(<ProjectsSection />);
    expect(screen.getByText('نیروگاه پشت‌بامی ۵ کیلووات')).toBeTruthy();
    expect(screen.getByTestId('projects-showcase')).toBeTruthy();
    expect(container.textContent).not.toMatch(/25\s*MW|150\+|98%/);
  });

  it('16. respects the CMS article list as given', () => {
    const { container } = render(
      <ArticlesSection
        cms={{
          items: [
            { id: 'a-1', slug: 'solar-guide', title: 'راهنمای خورشیدی', short_description: 'متن', category_title: 'آموزش' },
            { id: 'a-2', slug: 'panel-care', title: 'نگهداری پنل', short_description: 'متن', category_title: 'آموزش' },
          ] as never,
          section: section('articles', 70) as never,
        }}
      />,
    );
    expect(screen.getByTestId('articles-editorial')).toBeTruthy();
    expect(screen.getByText('راهنمای خورشیدی')).toBeTruthy();
    expect(screen.getByText('نگهداری پنل')).toBeTruthy();
    expect(container.textContent).not.toContain('Latest Articles');
  });

  it('17. links the calculator teaser to the real tool route', () => {
    render(<CalculatorSection />);
    expect(screen.getByTestId('calculator-teaser')).toBeTruthy();
    expect(screen.getByText('شروع محاسبه').closest('a')?.getAttribute('href')).toBe('/calculator');
    // Tool framing steps render from locale copy (no invented numbers).
    expect(screen.getByText('مصرف برق خود را وارد کنید')).toBeTruthy();
  });
});

describe('Phase 11 — homepage assembly', () => {
  it('10. follows CMS section ordering instead of a hardcoded order', () => {
    mocks.homepageData = payload({
      sections: [
        section('contact', 5),
        section('featured_products', 10),
        section('hero', 90),
        section('categories', 30),
        section('services', 40),
        section('calculator', 50),
        section('projects', 60),
        section('articles', 70),
      ],
      featured_products: [product()],
    });
    const { container } = render(<HomepageClient />);
    const order = Array.from(container.querySelectorAll('[data-section]')).map((el) =>
      el.getAttribute('data-section'),
    );
    expect(order[0]).toBe('contact');
    expect(order.indexOf('featured')).toBeGreaterThan(0);
    expect(order[order.length - 1]).toBe('hero');
  });

  it('21. never renders fake fallback content when the CMS is empty', () => {
    mocks.homepageData = payload();
    const { container } = render(<HomepageClient />);
    expect(container.textContent).not.toContain('Powering the');
    expect(container.textContent).not.toMatch(/25\s*MW|150\+|98%/);
    expect(container.querySelector('[data-testid="featured-products"]')).toBeNull();
  });

  it('22. renders exactly one h1 across the assembled homepage', () => {
    mocks.homepageData = payload({ featured_products: [product()] });
    const { container } = render(<HomepageClient />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });
});

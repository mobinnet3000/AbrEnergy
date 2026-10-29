import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { ProjectsSection } from './ProjectsSection';
import { ArticlesSection } from './ArticlesSection';
import { CalculatorSection } from './CalculatorSection';
import { ContactSection } from './ContactSection';
import { navigationConfig } from '@/config/navigation';

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
  services: { data: null as unknown, isLoading: false, error: null as unknown, refetch: () => {} },
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

function service(overrides: Record<string, unknown> = {}) {
  return { id: 's-1', title: 'نصب نیروگاه', slug: 'install', short_description: 'توضیح', ...overrides };
}

function project(overrides: Record<string, unknown> = {}) {
  return { id: 'p-1', title: 'پروژه باغی', slug: 'garden', location: 'تهران', capacity: 10, project_type: 'آفگرید', ...overrides };
}

function article(overrides: Record<string, unknown> = {}) {
  return { id: 'a-1', title: 'راهنمای پنل', slug: 'panel-guide', short_description: 'متن', ...overrides };
}

beforeEach(() => {
  motionCtl.reduce = false;
  stubDom();
  mocks.featured = { data: null, isLoading: false };
  mocks.categories = { data: null, isLoading: false };
  mocks.services = { data: null, isLoading: false, error: null, refetch: () => {} };
  mocks.projects = { data: null, isLoading: false, error: null };
  mocks.articles = { data: null, isLoading: false };
  mocks.settings = { data: null };
  vi.restoreAllMocks();
});

describe('Phase 12.5 — one global navigation, no homepage duplicate', () => {
  it('1. navigationConfig provides clean IA: separate gallery and downloads', () => {
    expect(navigationConfig.map((n) => n.href)).toEqual([
      '/', '/products', '/services', '/projects', '/articles', '/gallery', '/downloads', '/calculator', '/contact',
    ]);
    expect(navigationConfig.find((n) => n.href === '/gallery')?.labelKey).toBe('nav.gallery');
    expect(navigationConfig.find((n) => n.href === '/downloads')?.labelKey).toBe('nav.downloads');
    expect(navigationConfig.find((n) => n.href === '/calculator')?.labelKey).toBe('nav.calculator_offgrid');
  });

  it('2. hero renders no duplicate nav strip; slogan H1 stays prominent', () => {
    const { container } = render(<HeroSection />);
    const hero = container.querySelector('[data-section="hero"]');
    expect(hero?.querySelector('[data-testid="showcase-nav"]')).toBeNull();
    const h1 = hero?.querySelector('h1');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(h1?.textContent?.replace(/\s+/g, '')).toBe('طلوعآفتاب،ازخانهشماست');
    expect(h1?.className).toContain('hero-slogan-display');
    expect(screen.getByTestId('brand-slogan-bar')).toBeTruthy();
    expect(screen.getByTestId('homepage-showcase')).toBeTruthy();
  });
});

describe('Phase 12.5 — every section adapts to light + dark themes', () => {
  it('3. about/services/projects/articles/calculator/contact sections carry dark: surfaces', () => {
    mocks.services = { data: [service()], isLoading: false, error: null, refetch: () => {} };
    mocks.projects = { data: [project()], isLoading: false, error: null };
    mocks.articles = { data: [article()], isLoading: false };
    const { container } = render(
      <>
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <ArticlesSection />
        <CalculatorSection />
        <ContactSection />
      </>,
    );
    for (const testid of [
      'about-section', 'services-section', 'projects-showcase',
      'articles-editorial', 'calculator-teaser', 'contact-panel',
    ]) {
      const el = container.querySelector(`[data-testid="${testid}"]`);
      expect(el).toBeTruthy();
      expect(el?.className).toContain('dark:');
    }
    // No forced-black sections remain in light mode (dark: tokens are
    // the adaptive dark theme, not a forced surface).
    for (const testid of ['about-section', 'services-section', 'articles-editorial', 'contact-panel']) {
      const cls = container.querySelector(`[data-testid="${testid}"]`)?.className ?? '';
      expect(cls.split(' ').some((c) => c === 'bg-black')).toBe(false);
    }
  });

  it('4. exactly one H1 across the full homepage assembly', () => {
    mocks.services = { data: [service()], isLoading: false, error: null, refetch: () => {} };
    mocks.projects = { data: [project()], isLoading: false, error: null };
    mocks.articles = { data: [article()], isLoading: false };
    const { container } = render(
      <>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <ArticlesSection />
        <CalculatorSection />
        <ContactSection />
      </>,
    );
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });
});

describe('Phase 12.5 — reduced motion keeps content painted', () => {
  it('5. calculator teaser renders static content under reduced motion', () => {
    motionCtl.reduce = true;
    render(<CalculatorSection />);
    expect(screen.getByTestId('calculator-teaser')).toBeTruthy();
    expect(screen.getByTestId('calculator-teaser').querySelector('h2')).toBeTruthy();
  });
});

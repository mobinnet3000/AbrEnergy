import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import { ServicesSection } from './ServicesSection';
import { ProjectsSection } from './ProjectsSection';
import { ArticlesSection } from './ArticlesSection';
import { ProductRailSection } from './ProductRailSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';

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

const calls = vi.hoisted(() => ({
  services: [] as unknown[],
  featuredProjects: [] as unknown[],
  articles: [] as unknown[],
  categories: [] as unknown[],
  featuredProducts: [] as unknown[],
}));

vi.mock('@/hooks/use-api', () => ({
  useServices: (o?: unknown) => {
    calls.services.push(o);
    return { data: null, isLoading: false, error: null, refetch: () => {} };
  },
  useFeaturedProjects: (o?: unknown) => {
    calls.featuredProjects.push(o);
    return { data: null, isLoading: false, error: null };
  },
  useArticles: (_p?: unknown, o?: unknown) => {
    calls.articles.push(o);
    return { data: null, isLoading: false };
  },
  usePublicProductCategories: (o?: unknown) => {
    calls.categories.push(o);
    return { data: null, isLoading: false };
  },
  useFeaturedPublicProducts: (_p?: unknown, o?: unknown) => {
    calls.featuredProducts.push(o);
    return { data: null, isLoading: false };
  },
}));

const last = (arr: unknown[]) => arr[arr.length - 1];

beforeEach(() => {
  for (const k of Object.keys(calls) as (keyof typeof calls)[]) calls[k].length = 0;
});

describe('Phase 12.14 — homepage sections skip duplicate fallback fetches when CMS supplies items', () => {
  it('ServicesSection: fallback disabled with CMS items, enabled without', () => {
    render(<ServicesSection cms={{ items: [{ slug: 'grid-tied' }], section: null }} />);
    expect(last(calls.services)).toEqual({ enabled: false });
    calls.services.length = 0;
    render(<ServicesSection />);
    expect(last(calls.services)).toEqual({ enabled: true });
  });

  it('ProjectsSection: fallback disabled with CMS items, enabled without', () => {
    render(<ProjectsSection cms={{ items: [{ slug: 'tehran-1' }], section: null }} />);
    expect(last(calls.featuredProjects)).toEqual({ enabled: false });
    calls.featuredProjects.length = 0;
    render(<ProjectsSection />);
    expect(last(calls.featuredProjects)).toEqual({ enabled: true });
  });

  it('ArticlesSection: fallback disabled with CMS items, enabled without', () => {
    render(<ArticlesSection cms={{ items: [{ slug: 'solar-guide' }], section: null }} />);
    expect(last(calls.articles)).toEqual({ enabled: false });
    calls.articles.length = 0;
    render(<ArticlesSection />);
    expect(last(calls.articles)).toEqual({ enabled: true });
  });

  it('ProductRailSection: fallback tree disabled with CMS items, enabled without', () => {
    render(
      <ProductRailSection
        cms={{ items: [{ id: 'c1', slug: 'solar', title: 'Solar', children: [] }], section: null } as never}
      />,
    );
    expect(last(calls.categories)).toEqual({ enabled: false });
    calls.categories.length = 0;
    render(<ProductRailSection />);
    expect(last(calls.categories)).toEqual({ enabled: true });
  });

  it('FeaturedProductsSection: product fallback disabled with CMS items but category tree still fetched', () => {
    render(<FeaturedProductsSection cms={{ items: [{ slug: 'demo-1' }], section: null } as never} />);
    expect(last(calls.featuredProducts)).toEqual({ enabled: false });
    expect(last(calls.categories)).toBeUndefined();
    calls.featuredProducts.length = 0;
    render(<FeaturedProductsSection />);
    expect(last(calls.featuredProducts)).toEqual({ enabled: true });
  });
});

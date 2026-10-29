import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { shouldRetryQuery, queryClient } from '@/providers';
import { normalizeApiError } from '@/lib/api-errors';
import { fetchPublicWithStatus } from '@/lib/product-metadata';
import { ServicesSection } from '@/components/home/ServicesSection';
import { ProjectsSection } from '@/components/home/ProjectsSection';
import { ArticlesSection } from '@/components/home/ArticlesSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { ProductRailSection } from '@/components/home/ProductRailSection';
import fa from '../../locales/fa.json';

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string, fallback?: string) => {
      const parts = key.split('.');
      let cur: unknown = fa;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return fallback || key;
        }
      }
      return typeof cur === 'string' ? cur : (fallback || key);
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

const mockCalls = vi.hoisted(() => ({
  services: [] as unknown[],
  featuredProjects: [] as unknown[],
  articles: [] as unknown[],
  categories: [] as unknown[],
  featuredProducts: [] as unknown[],
}));

vi.mock('@/hooks/use-api', () => ({
  useServices: (o?: unknown) => {
    mockCalls.services.push(o);
    return { data: null, isLoading: false, error: null, refetch: () => {} };
  },
  useFeaturedProjects: (o?: unknown) => {
    mockCalls.featuredProjects.push(o);
    return { data: null, isLoading: false, error: null };
  },
  useArticles: (_p?: unknown, o?: unknown) => {
    mockCalls.articles.push(o);
    return { data: null, isLoading: false };
  },
  usePublicProductCategories: (o?: unknown) => {
    mockCalls.categories.push(o);
    return { data: null, isLoading: false };
  },
  useFeaturedPublicProducts: (_p?: unknown, o?: unknown) => {
    mockCalls.featuredProducts.push(o);
    return { data: null, isLoading: false };
  },
}));

beforeEach(() => {
  for (const k of Object.keys(mockCalls) as (keyof typeof mockCalls)[]) {
    mockCalls[k].length = 0;
  }
});

describe('Phase 12.25 — Query & Mutation Retry Boundaries', () => {
  it('1. shouldRetryQuery never retries 429 Too Many Requests', () => {
    const err429 = { response: { status: 429, data: { detail: 'Throttled' } } };
    expect(shouldRetryQuery(0, err429)).toBe(false);
    expect(shouldRetryQuery(1, err429)).toBe(false);
  });

  it('2. shouldRetryQuery never retries 4xx client errors (400, 401, 403, 404)', () => {
    for (const code of [400, 401, 403, 404, 422]) {
      const err = { response: { status: code } };
      expect(shouldRetryQuery(0, err)).toBe(false);
    }
  });

  it('3. shouldRetryQuery allows bounded retry for transient 5xx server errors', () => {
    const err500 = { response: { status: 500 } };
    const err503 = { response: { status: 503 } };
    // First attempt allows 1 retry
    expect(shouldRetryQuery(0, err500)).toBe(true);
    expect(shouldRetryQuery(0, err503)).toBe(true);
    // Second attempt is blocked (failureCount >= 1)
    expect(shouldRetryQuery(1, err500)).toBe(false);
    expect(shouldRetryQuery(2, err503)).toBe(false);
  });

  it('4. shouldRetryQuery allows bounded retry for network failures', () => {
    const networkErr = new Error('Network Error');
    expect(shouldRetryQuery(0, networkErr)).toBe(true);
    expect(shouldRetryQuery(1, networkErr)).toBe(false);
  });

  it('5. queryClient defaults enforce mutation retry = false to prevent duplicate submissions', () => {
    const defaultMutationOptions = queryClient.getDefaultOptions().mutations;
    expect(defaultMutationOptions?.retry).toBe(false);
  });
});

describe('Phase 12.25 — API Error Normalization for 429 & Server Errors', () => {
  it('1. classifies HTTP 429 as kind: rate_limit with Persian guidance', () => {
    const err429 = {
      response: {
        status: 429,
        data: { detail: 'تعداد درخواست‌ها بیش از حد مجاز است.' },
      },
    };
    const norm = normalizeApiError(err429);
    expect(norm.kind).toBe('rate_limit');
    expect(norm.status).toBe(429);
    expect(norm.detailMessages).toContain('تعداد درخواست‌ها بیش از حد مجاز است.');
  });

  it('2. provides honest fallback rate limit message when 429 body is empty', () => {
    const err429 = { response: { status: 429, data: {} } };
    const norm = normalizeApiError(err429);
    expect(norm.kind).toBe('rate_limit');
    expect(norm.status).toBe(429);
    expect(norm.detailMessages.length).toBeGreaterThan(0);
    expect(norm.detailMessages[0]).toContain('درخواست');
  });

  it('3. classifies HTTP 500 as kind: server without leaking server internals', () => {
    const err500 = {
      response: {
        status: 500,
        data: { traceback: 'Secret database details /etc/passwd' },
      },
    };
    const norm = normalizeApiError(err500);
    expect(norm.kind).toBe('server');
    expect(norm.status).toBe(500);
    expect(norm.fieldErrors).toEqual([]);
    expect(norm.detailMessages).toEqual([]);
  });
});

describe('Phase 12.25 — Homepage Concurrency Hardening (Skip fallback fetches during pending CMS)', () => {
  it('1. ServicesSection skips fallback fetch when CMS is pending', () => {
    render(<ServicesSection cms={{ items: null, pending: true, section: null }} />);
    expect(mockCalls.services[mockCalls.services.length - 1]).toEqual({ enabled: false });
  });

  it('2. ProjectsSection skips fallback fetch when CMS is pending', () => {
    render(<ProjectsSection cms={{ items: null, pending: true, section: null }} />);
    expect(mockCalls.featuredProjects[mockCalls.featuredProjects.length - 1]).toEqual({ enabled: false });
  });

  it('3. ArticlesSection skips fallback fetch when CMS is pending', () => {
    render(<ArticlesSection cms={{ items: null, pending: true, section: null }} />);
    expect(mockCalls.articles[mockCalls.articles.length - 1]).toEqual({ enabled: false });
  });

  it('4. FeaturedProductsSection skips fallback fetch when CMS is pending', () => {
    render(<FeaturedProductsSection cms={{ items: null, pending: true, section: null }} />);
    expect(mockCalls.featuredProducts[mockCalls.featuredProducts.length - 1]).toEqual({ enabled: false });
  });

  it('5. ProductRailSection skips fallback fetch when CMS is pending', () => {
    render(<ProductRailSection cms={{ items: null, pending: true, section: null }} />);
    expect(mockCalls.categories[mockCalls.categories.length - 1]).toEqual({ enabled: false });
  });
});

describe('Phase 12.25 — SSR Status Awareness (Never call resolve on 429)', () => {
  it('1. fetchPublicWithStatus returns both data and numeric HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'p1', title: 'Solar Panel' }),
      })),
    );

    const result = await fetchPublicWithStatus('/products/sample/');
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ id: 'p1', title: 'Solar Panel' });
    vi.unstubAllGlobals();
  });

  it('2. fetchPublicWithStatus reports status 429 without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Throttled' }),
      })),
    );

    const result = await fetchPublicWithStatus('/products/sample/');
    expect(result.status).toBe(429);
    expect(result.data).toBeNull();
    vi.unstubAllGlobals();
  });

  it('3. fetchPublicWithStatus gracefully handles network drops as status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    const result = await fetchPublicWithStatus('/products/sample/');
    expect(result.status).toBe(0);
    expect(result.data).toBeNull();
    vi.unstubAllGlobals();
  });
});

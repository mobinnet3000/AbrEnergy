import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminSeoDashboardPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocaleContext } from '@/i18n/locale-context';

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/admin/seo/overview/') {
        return Promise.resolve({
          data: {
            overview: {
              total_public_pages: 58,
              total_indexable_pages: 58,
              pages_missing_metadata: 2,
              articles_missing_metadata: 1,
              products_missing_metadata: 1,
              sitemap_status: 'active',
              sitemap_url: '/sitemap.xml',
              robots_status: 'active',
              robots_url: '/robots.txt',
              structured_data_types: ['Organization', 'WebSite', 'BreadcrumbList', 'Article', 'Product', 'Service'],
              last_audited_at: '2026-10-29T12:00:00Z',
            },
            health_score: {
              score: 96,
              max_score: 100,
              grade: 'A',
              deductions: [],
            },
            gsc_integration: {
              is_connected: false,
              status: 'ready_for_credentials',
              provider: 'Google Search Console API v3',
              message: 'Google Search Console API credentials not provided in production environment.',
              required_scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
              setup_guide_url: '/admin/seo#gsc-setup',
            },
            ga4_integration: {
              is_connected: false,
              status: 'ready_for_credentials',
              provider: 'Google Analytics 4 Data API',
              message: 'GA4 Property ID not configured.',
              required_scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
            },
            geo_ai_readiness: {
              structured_data_compliant: true,
              organization_schema_present: true,
              author_transparency: true,
              canonical_urls_enforced: true,
              hreflang_alternates_present: true,
              ai_crawler_accessible: true,
              citations_check: 'Valid specs and address.',
            },
          },
        });
      }
      if (url.startsWith('/admin/seo/keywords/')) {
        return Promise.resolve({
          data: {
            results: [
              {
                id: 'kw-1',
                keyword: 'پنل خورشیدی تجاری',
                locale: 'fa',
                target_country: 'IR',
                target_page: '/products',
                search_intent: 'commercial',
                priority: 'high',
                current_rank: 3,
                average_position: 3.2,
                clicks: 120,
                impressions: 1500,
                ctr: 8.0,
              },
            ],
            count: 1,
          },
        });
      }
      return Promise.reject(new Error('Unknown url'));
    }),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderSeoDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider
        value={{
          locale: 'fa',
          setLocale: vi.fn(),
          t: (k: string) => k,
          dir: 'rtl',
          isRTL: true,
        }}
      >
        <AdminSeoDashboardPage />
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

describe('Admin SEO & GEO Dashboard (Phase 12.29)', () => {
  it('renders overview metrics and health score banner', async () => {
    renderSeoDashboard();
    expect(await screen.findByText(/داشبورد سئو و هوش مصنوعی/)).toBeInTheDocument();
    expect(await screen.findByText('96')).toBeInTheDocument();
    expect(await screen.findByText('سطح A')).toBeInTheDocument();
    expect(await screen.findByText('58')).toBeInTheDocument();
  });
});

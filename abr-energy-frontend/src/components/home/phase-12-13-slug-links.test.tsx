import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fa from '../../../locales/fa.json';
import ServicesPage from '@/app/[locale]/(public)/services/page';
import ProjectsPage from '@/app/[locale]/(public)/projects/page';
import ArticlesPage from '@/app/[locale]/(public)/articles/page';
import { ServicesSection } from './ServicesSection';
import { ProjectsSection } from './ProjectsSection';
import { ArticlesSection } from './ArticlesSection';

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

const mocks = vi.hoisted(() => ({
  services: { data: null as unknown, isLoading: false },
  projects: { data: null as unknown, isLoading: false },
  articles: { data: null as unknown, isLoading: false },
  featuredProjects: { data: null as unknown, isLoading: false, error: null },
}));

vi.mock('@/hooks/use-api', () => ({
  useServices: () => mocks.services,
  useProjects: () => mocks.projects,
  useArticles: () => mocks.articles,
  useFeaturedProjects: () => mocks.featuredProjects,
}));

const EMPTY = '';
const BLANK = '   ';

const SERVICE_VALID = { id: 's1', title: 'خدمت معتبر', short_description: 'د', slug: 'grid-tied' };
const SERVICE_EMPTY = { id: 's2', title: '', short_description: '', slug: EMPTY };
const SERVICE_BLANK = { id: 's3', title: 'bl', short_description: '', slug: BLANK };

const PROJECT_VALID = { id: 'p1', title: 'پروژه معتبر', slug: 'tehran-1', capacity: 10, project_type: 'roof', location: 'تهران', cover_image: '' };
const PROJECT_EMPTY = { id: 'p2', title: '', slug: EMPTY, capacity: 0, project_type: '', location: '', cover_image: '' };

const ARTICLE_VALID = { id: 'a1', title: 'مقاله معتبر', slug: 'solar-guide', short_description: 'د', category_title: '', cover_image_url: '', created_at: '2024-01-01' };
const ARTICLE_EMPTY = { id: 'a2', title: '', slug: EMPTY, short_description: '', category_title: '', cover_image_url: '', created_at: '' };

function hrefs(): (string | null)[] {
  return screen.queryAllByRole('link').map((a) => a.getAttribute('href'));
}

describe('Phase 12.13 — listing pages never link empty/blank slugs', () => {
  it('services list renders only slug-bearing services and links to the real detail route', () => {
    mocks.services = { data: { results: [SERVICE_VALID, SERVICE_EMPTY, SERVICE_BLANK] }, isLoading: false };
    render(<ServicesPage />);
    const list = hrefs();
    expect(list).toContain('/services/grid-tied');
    expect(list).not.toContain('/services/');
    expect(list).not.toContain('/services');
    expect(screen.queryByText('bl')).toBeNull();
  });

  it('projects list skips slug-less projects', () => {
    mocks.projects = { data: { results: [PROJECT_VALID, PROJECT_EMPTY] }, isLoading: false };
    render(<ProjectsPage />);
    expect(hrefs()).toContain('/projects/tehran-1');
    expect(hrefs()).not.toContain('/projects/');
  });

  it('articles list skips slug-less articles', () => {
    mocks.articles = { data: { results: [ARTICLE_VALID, ARTICLE_EMPTY] }, isLoading: false };
    render(<ArticlesPage />);
    expect(hrefs()).toContain('/articles/solar-guide');
    expect(hrefs()).not.toContain('/articles/');
  });
});

describe('Phase 12.13 — homepage sections never link empty/blank slugs', () => {
  it('services section filters invalid slugs', () => {
    mocks.services = { data: { results: [SERVICE_VALID, SERVICE_EMPTY, SERVICE_BLANK] }, isLoading: false };
    const { container } = render(<ServicesSection />);
    expect(container.querySelectorAll('a[href^="/services/"]').length).toBe(1);
    expect(container.querySelector('a[href="/services/"]')).toBeNull();
  });

  it('projects section filters invalid slugs', () => {
    mocks.featuredProjects = { data: { results: [PROJECT_VALID, PROJECT_EMPTY] }, isLoading: false, error: null };
    const { container } = render(<ProjectsSection />);
    expect(container.querySelectorAll('a[href^="/projects/"]').length).toBe(1);
    expect(container.querySelector('a[href="/projects/"]')).toBeNull();
  });

  it('articles section filters invalid slugs', () => {
    mocks.articles = { data: { results: [ARTICLE_VALID, ARTICLE_EMPTY] }, isLoading: false };
    const { container } = render(<ArticlesSection />);
    expect(container.querySelectorAll('a[href^="/articles/"]').length).toBe(1);
    expect(container.querySelector('a[href="/articles/"]')).toBeNull();
  });
});

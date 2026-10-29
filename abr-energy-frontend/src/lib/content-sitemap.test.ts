import { describe, it, expect } from 'vitest';
import {
  serviceUrl,
  projectUrl,
  articleUrl,
  isSitemapService,
  isSitemapProject,
  isSitemapArticle,
  buildContentEntries,
} from './content-sitemap';

const SITE = 'http://localhost:3000';

describe('content sitemap URL builders', () => {
  it('builds canonical Persian detail URLs', () => {
    expect(serviceUrl(SITE, 'solar-epc')).toBe('http://localhost:3000/fa/services/solar-epc');
    expect(projectUrl(SITE, 'isfahan-5mw')).toBe('http://localhost:3000/fa/projects/isfahan-5mw');
    expect(articleUrl(SITE, 'solar-energy-guide')).toBe('http://localhost:3000/fa/articles/solar-energy-guide');
  });

  it('keeps service, project, and article namespaces distinct', () => {
    const s = serviceUrl(SITE, 'test');
    const p = projectUrl(SITE, 'test');
    const a = articleUrl(SITE, 'test');
    expect(s).not.toBe(p);
    expect(p).not.toBe(a);
    expect(s).not.toBe(a);
  });
});

describe('content sitemap eligibility predicates', () => {
  it('validates services correctly', () => {
    expect(isSitemapService({ id: '1', slug: 'solar-epc', status: 'active' })).toBe(true);
    expect(isSitemapService({ id: '2', slug: 'draft-service', status: 'inactive' })).toBe(false);
    expect(isSitemapService({ id: '3', slug: '', status: 'active' })).toBe(false);
  });

  it('validates projects correctly', () => {
    expect(isSitemapProject({ id: '1', slug: 'isfahan-5mw', status: 'published' })).toBe(true);
    expect(isSitemapProject({ id: '2', slug: 'tabriz-1mw', status: 'completed' })).toBe(true);
    expect(isSitemapProject({ id: '3', slug: '', status: 'published' })).toBe(false);
  });

  it('validates articles correctly', () => {
    expect(isSitemapArticle({ id: '1', slug: 'solar-guide', status: 'published' })).toBe(true);
    expect(isSitemapArticle({ id: '2', slug: 'draft-post', status: 'draft' })).toBe(false);
    expect(isSitemapArticle({ id: '3', slug: 'archived-post', status: 'archived' })).toBe(false);
    expect(isSitemapArticle({ id: '4', slug: '', status: 'published' })).toBe(false);
  });
});

describe('buildContentEntries', () => {
  it('generates entries only for valid active items and excludes draft/slugless', () => {
    const entries = buildContentEntries({
      site: SITE,
      services: [
        { id: 's1', slug: 'active-service', status: 'active' },
        { id: 's2', slug: 'inactive-service', status: 'inactive' },
        { id: 's3', slug: '', status: 'active' },
      ],
      projects: [
        { id: 'p1', slug: 'active-project', status: 'published' },
        { id: 'p2', slug: '', status: 'published' },
      ],
      articles: [
        { id: 'a1', slug: 'published-article', status: 'published' },
        { id: 'a2', slug: 'draft-article', status: 'draft' },
      ],
      now: new Date('2026-10-26T00:00:00Z'),
    });

    const urls = entries.map((e) => e.url);
    expect(urls).toHaveLength(3);
    expect(urls).toContain('http://localhost:3000/fa/services/active-service');
    expect(urls).toContain('http://localhost:3000/fa/projects/active-project');
    expect(urls).toContain('http://localhost:3000/fa/articles/published-article');

    expect(urls.some((u) => u.includes('inactive'))).toBe(false);
    expect(urls.some((u) => u.includes('draft'))).toBe(false);
  });
});

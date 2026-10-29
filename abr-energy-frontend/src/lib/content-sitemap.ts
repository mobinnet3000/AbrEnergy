import type { MetadataRoute } from 'next';
import { apiBaseUrl } from './media-url';

/**
 * Phase 12.20 — dynamic content sitemap helpers for Services, Projects, and Articles.
 *
 * Only actually-public, active/published records with non-empty slugs are emitted.
 * Drafts, inactive records, and slugless records are excluded.
 * Persian (`fa`) is the active public locale.
 */

export const CONTENT_LOCALE = 'fa' as const;

export interface SitemapServiceItem {
  id: string;
  title?: string;
  slug: string;
  status?: string;
  updated_at?: string;
}

export interface SitemapProjectItem {
  id: string;
  title?: string;
  slug: string;
  status?: string;
  updated_at?: string;
}

export interface SitemapArticleItem {
  id: string;
  title?: string;
  slug: string;
  status?: string;
  updated_at?: string;
  published_at?: string | null;
}

/** Canonical public service URL. */
export function serviceUrl(site: string, slug: string): string {
  return `${site}/${CONTENT_LOCALE}/services/${slug}`;
}

/** Canonical public project URL. */
export function projectUrl(site: string, slug: string): string {
  return `${site}/${CONTENT_LOCALE}/projects/${slug}`;
}

/** Canonical public article URL. */
export function articleUrl(site: string, slug: string): string {
  return `${site}/${CONTENT_LOCALE}/articles/${slug}`;
}

/** Predicate for service eligibility (active status and non-empty slug). */
export function isSitemapService(service: SitemapServiceItem): boolean {
  return (
    (service.status === undefined || service.status === 'active') &&
    typeof service.slug === 'string' &&
    service.slug.trim().length > 0
  );
}

/** Predicate for project eligibility (published/active and non-empty slug). */
export function isSitemapProject(project: SitemapProjectItem): boolean {
  return (
    (project.status === undefined ||
      project.status === 'published' ||
      project.status === 'completed' ||
      project.status === 'in_progress') &&
    typeof project.slug === 'string' &&
    project.slug.trim().length > 0
  );
}

/** Predicate for article eligibility (published status and non-empty slug). */
export function isSitemapArticle(article: SitemapArticleItem): boolean {
  return (
    article.status === 'published' &&
    typeof article.slug === 'string' &&
    article.slug.trim().length > 0
  );
}

export function buildContentEntries(input: {
  site: string;
  services: SitemapServiceItem[];
  projects: SitemapProjectItem[];
  articles: SitemapArticleItem[];
  now?: Date;
}): MetadataRoute.Sitemap {
  const { site, services, projects, articles } = input;
  const now = input.now ?? new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const service of services) {
    if (!isSitemapService(service)) continue;
    entries.push({
      url: serviceUrl(site, service.slug),
      lastModified: service.updated_at ? new Date(service.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  for (const project of projects) {
    if (!isSitemapProject(project)) continue;
    entries.push({
      url: projectUrl(site, project.slug),
      lastModified: project.updated_at ? new Date(project.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  for (const article of articles) {
    if (!isSitemapArticle(article)) continue;
    entries.push({
      url: articleUrl(site, article.slug),
      lastModified: article.updated_at
        ? new Date(article.updated_at)
        : article.published_at
          ? new Date(article.published_at)
          : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}

// ── Server-side bulk fetch helpers ──────────────────────────────────────────

const SITEMAP_PAGE_SIZE = 100;
const SITEMAP_MAX_PAGES = 10;

interface Paginated<T> {
  results?: T[];
  next?: string | null;
}

async function fetchAllContent<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  try {
    for (let page = 1; page <= SITEMAP_MAX_PAGES; page += 1) {
      const res = await fetch(`${apiBaseUrl()}${path}?page_size=${SITEMAP_PAGE_SIZE}&page=${page}`, {
        headers: { 'Accept-Language': CONTENT_LOCALE },
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = (await res.json()) as Paginated<T> | T[];
      const results = Array.isArray(data) ? data : (data?.results ?? null);
      if (!results || results.length === 0) break;
      out.push(...results);
      if (results.length < SITEMAP_PAGE_SIZE) break;
    }
  } catch {
    // If backend is unreachable, gracefully return whatever was collected
  }
  return out;
}

export function fetchAllPublicServices(): Promise<SitemapServiceItem[]> {
  return fetchAllContent<SitemapServiceItem>('/services/');
}

export function fetchAllPublicProjects(): Promise<SitemapProjectItem[]> {
  return fetchAllContent<SitemapProjectItem>('/projects/');
}

export function fetchAllPublicArticles(): Promise<SitemapArticleItem[]> {
  return fetchAllContent<SitemapArticleItem>('/articles/');
}

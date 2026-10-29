/**
 * Phase 12.19 — Catalog URL query state helpers.
 *
 * Encapsulates bidirectional synchronization between public catalog filter controls
 * and the browser URL query string. Parameter names:
 *  - search: debounced search keyword
 *  - category: category UUID or slug
 *  - featured: 'true' when active
 *  - ordering: '-created_at' | 'created_at'
 *  - page: integer >= 2 (page 1 is omitted for clean canonical URLs)
 */

const ALLOWED_ORDERINGS = new Set(['-created_at', 'created_at']);

export function parseCatalogPage(raw: string | null | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function parseCatalogSearch(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim();
}

export function parseCatalogCategory(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim();
}

export function parseCatalogFeatured(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const lower = raw.trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

export function parseCatalogOrdering(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  return ALLOWED_ORDERINGS.has(trimmed) ? trimmed : '';
}

export interface CatalogQueryParams {
  search?: string;
  category?: string;
  featured?: boolean;
  ordering?: string;
  page?: number;
}

export function buildCatalogQuery(params: CatalogQueryParams): string {
  const sp = new URLSearchParams();
  if (params.search && params.search.trim()) {
    sp.set('search', params.search.trim());
  }
  if (params.category && params.category.trim()) {
    sp.set('category', params.category.trim());
  }
  if (params.featured) {
    sp.set('featured', 'true');
  }
  if (params.ordering && ALLOWED_ORDERINGS.has(params.ordering)) {
    sp.set('ordering', params.ordering);
  }
  if (params.page && params.page > 1) {
    sp.set('page', String(params.page));
  }
  return sp.toString();
}

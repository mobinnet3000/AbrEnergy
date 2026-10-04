/**
 * Phase 9.3-A — URL-persisted admin list state (shared primitives).
 *
 * The list URL is the source of truth for list view state (search / filters /
 * page). These are pure, dependency-free helpers shared by the five CMS lists
 * in scope (products, product categories, articles, services, projects):
 *
 * - `parse*Param` read one raw query value and fail safely to a default
 *   (invalid page → 1, unsupported enum → null, malformed boolean → false).
 * - `buildListQuery` serializes a normalized state back to a query string,
 *   omitting every default (page=1, empty search, "all", featured=false) in
 *   one stable key order so `a !== b` string comparison is a reliable
 *   change detector for the router sync effects.
 *
 * Encoding is left to the URL API (`URLSearchParams`): callers pass raw
 * strings and never pre-encode. No whitelist knowledge lives here — each
 * list page passes only the enum set its UI actually renders (unwired
 * backend filters are never invented by this module).
 */

/** Minimal read surface — satisfied by `URLSearchParams` and by
 *  Next.js App Router's `useSearchParams()` return value (both expose
 *  `get`). Tests pass `new URLSearchParams(...)` directly. */
export interface ListQueryReader {
  get(name: string): string | null;
}

/** Backend-supported status values for the lists that render a status
 *  filter today. Projects intentionally has none (no status control exists). */
export const PRODUCT_LIST_STATUSES = ['draft', 'published', 'archived'] as const;
export const ARTICLE_LIST_STATUSES = ['draft', 'published', 'scheduled'] as const;
export const SERVICE_LIST_STATUSES = ['active', 'inactive'] as const;
export const PRODUCT_LIST_VISIBILITY = ['public', 'hidden'] as const;
/** Shared active/inactive selector (products `active`, categories status). */
export const ACTIVE_FILTER_VALUES = ['active', 'inactive'] as const;

/** `page=abc`, `page=0`, `page=-3`, `page=2.5` → 1. Only integers ≥ 1 survive. */
export function parsePageParam(raw: string | null): number {
  if (raw === null) return 1;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 1;
  const n = parseInt(trimmed, 10);
  return n >= 1 ? n : 1;
}

/** Trimmed search text, or `''` when missing/blank. Never null. */
export function parseSearchParam(raw: string | null): string {
  return (raw ?? '').trim();
}

/**
 * Returns the raw value when it is an allowed option, otherwise null
 * (caller falls back to its `all` default). `"all"` itself maps to null so
 * stale `?status=all` links canonicalize to the omitted default.
 */
export function parseEnumParam(raw: string | null, allowed: readonly string[]): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'all') return null;
  return (allowed as readonly string[]).includes(trimmed) ? trimmed : null;
}

/** Only the exact string `"true"` enables the flag (`featured=true`).
 *  Everything else — missing, `"false"`, `"1"`, malformed — means false. */
export function parseFeaturedParam(raw: string | null): boolean {
  return raw !== null && raw.trim() === 'true';
}

/**
 * Identifier filter (`category`, `parent`): trimmed non-empty value passes
 * through (valid ids are server-known; the client cannot validate them),
 * missing/blank/`all` maps to null. Garbage therefore degrades to the
 * default list rather than a broken state.
 */
export function parseIdParam(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'all') return null;
  return trimmed;
}

export interface AdminListUrlState {
  search?: string | null;
  category?: string | null;
  status?: string | null;
  visibility?: string | null;
  active?: string | null;
  featured?: boolean | null;
  parent?: string | null;
  page?: number | null;
}

/**
 * Serialize normalized list state to a query string (without `?`).
 * Defaults are always omitted: blank search, null/`all`/blank enums,
 * `featured=false`, `page<2`. Key order is stable —
 * search, category, status, visibility, active, featured, parent, page —
 * so serialized output doubles as a canonical form for change detection.
 * Values are encoded by `URLSearchParams` (no manual encode/decode).
 */
export function buildListQuery(state: AdminListUrlState): string {
  const sp = new URLSearchParams();
  const search = (state.search ?? '').trim();
  if (search !== '') sp.set('search', search);
  const put = (key: string, value: string | null | undefined) => {
    if (value === null || value === undefined) return;
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'all') return;
    sp.set(key, trimmed);
  };
  put('category', state.category);
  put('status', state.status);
  put('visibility', state.visibility);
  put('active', state.active);
  if (state.featured === true) sp.set('featured', 'true');
  put('parent', state.parent);
  if (typeof state.page === 'number' && Number.isInteger(state.page) && state.page >= 2) {
    sp.set('page', String(state.page));
  }
  return sp.toString();
}

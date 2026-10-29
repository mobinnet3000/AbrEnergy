/**
 * Phase 12.13 — public detail-link guard.
 *
 * Listing pages build detail URLs from a backend `slug`. Entities without an
 * active-locale translation expose an empty slug, which would otherwise link
 * to the section index (or a blank card). A detail link must only ever be
 * built from a non-empty, non-whitespace slug.
 */

/** True when `slug` is a usable (non-empty) string for a detail URL. */
export function hasValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.trim() !== '';
}

/** Detail href `base/slug`, or `null` when the slug cannot be opened. */
export function detailHref(base: string, slug: unknown): string | null {
  return hasValidSlug(slug) ? `${base}/${slug.trim()}` : null;
}

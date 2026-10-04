/**
 * Phase 8.1 — preview URL helpers (saved-state preview only).
 *
 * The preview route lives outside the public route tree
 * (`/[locale]/preview/homepage?token=...`), is `noindex`, and is never
 * listed in the static sitemap. The token itself is the credential.
 */
export const PREVIEW_PATH_SEGMENT = '/preview/homepage';
export const PRODUCT_PREVIEW_PATH_SEGMENT = '/preview/products';
export const CATEGORY_PREVIEW_PATH_SEGMENT = '/preview/products/category';

export function buildHomepagePreviewUrl(token: string, locale = 'fa'): string {
  return `/${locale}${PREVIEW_PATH_SEGMENT}?token=${encodeURIComponent(token)}`;
}

export function buildProductPreviewUrl(token: string, productId: string, locale = 'fa'): string {
  return `/${locale}${PRODUCT_PREVIEW_PATH_SEGMENT}/${encodeURIComponent(productId)}?token=${encodeURIComponent(token)}`;
}

export function buildCategoryPreviewUrl(token: string, categoryId: string, locale = 'fa'): string {
  return `/${locale}${CATEGORY_PREVIEW_PATH_SEGMENT}/${encodeURIComponent(categoryId)}?token=${encodeURIComponent(token)}`;
}

export function isPreviewUrl(pathname: string): boolean {
  return pathname.includes('/preview/');
}

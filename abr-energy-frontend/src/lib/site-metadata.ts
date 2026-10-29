import type { Metadata } from 'next';
import type { SiteSettings } from '@/types';
import { apiBaseUrl, resolveMediaUrl } from './media-url';

// ── Phase 12.11 — dynamic brand favicon ─────────────────────────────────
// The admin panel uploads a favicon into SiteSettings (exposed by
// `/site-config/`). Server-side `generateMetadata` reads it and injects the
// matching `<link rel="icon">` so public pages advertise the CMS value.
// When unset (or an unusable type) no icons are emitted, leaving the
// version-controlled `src/app/favicon.ico` file convention as the fallback.

/** Server-side fetch of site settings for metadata. Never throws. */
export async function fetchSiteConfig(locale = 'fa'): Promise<SiteSettings | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/site-config/`, {
      headers: { 'Accept-Language': locale },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteSettings;
  } catch {
    return null;
  }
}

// Image formats a browser can use as a favicon. Anything else is treated as
// unusable and skipped so a bad upload can never break the fallback.
const USABLE_ICON = /\.(ico|png|svg|jpe?g|webp|gif)(\?.*)?$/i;

/** Absolute, browser-usable favicon URL, or `""` when unset/unusable. */
export function faviconHref(settings: SiteSettings | null | undefined): string {
  const raw = (settings?.favicon ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) && !USABLE_ICON.test(raw)) return '';
  if (!/^https?:\/\//i.test(raw) && !USABLE_ICON.test(raw)) return '';
  return resolveMediaUrl(raw);
}

/** `metadata.icons` for the CMS favicon, or `undefined` to keep the fallback. */
export function buildIconsMetadata(
  settings: SiteSettings | null | undefined,
): Metadata['icons'] | undefined {
  const href = faviconHref(settings);
  if (!href) return undefined;
  return {
    icon: [{ url: href }],
    shortcut: [{ url: href }],
    apple: [{ url: href }],
  };
}

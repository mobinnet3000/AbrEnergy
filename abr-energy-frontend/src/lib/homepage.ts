import type { Metadata } from 'next';
import type { HomepagePayload, HomepageSection, HomepageSectionKey } from '@/types';
import { apiBaseUrl, resolveMediaUrl, siteUrl } from './media-url';

// ── Homepage CMS helpers (Phase 7) ──────────────────────────────────────
// Client sections consume the public `useHomepage()` payload through these
// helpers; the server `generateMetadata` consumes `fetchHomepage()`.
// Every helper degrades gracefully when the CMS payload is absent so the
// pre-CMS data sources (site settings / locale strings / list endpoints)
// keep working untouched.

export function homepageSection(
  payload: HomepagePayload | undefined | null,
  key: HomepageSectionKey,
): HomepageSection | undefined {
  return payload?.sections?.find((s) => s.key === key);
}

/** CMS-disabled sections must not render. `undefined` = no CMS opinion. */
export function homepageSectionEnabled(
  payload: HomepagePayload | undefined | null,
  key: HomepageSectionKey,
): boolean | undefined {
  const section = homepageSection(payload, key);
  if (!section) return undefined;
  return section.enabled;
}

/** CMS copy wins when non-empty, otherwise the provided fallback. */
export function homepageCopy(cmsValue: string | undefined | null, fallback: string): string {
  const v = (cmsValue ?? '').trim();
  return v !== '' ? (cmsValue as string) : fallback;
}

/** Server-side fetch of the public homepage (for `generateMetadata`). */
export async function fetchHomepage(): Promise<HomepagePayload | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/homepage/`, {
      headers: { 'Accept-Language': 'fa' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as HomepagePayload;
  } catch {
    return null;
  }
}

type RobotsKey = 'index_follow' | 'noindex_follow' | 'index_nofollow' | 'noindex_nofollow';

function mapRobots(robots?: string): { index: boolean; follow: boolean } {
  switch ((robots ?? 'index_follow') as RobotsKey) {
    case 'noindex_follow':
      return { index: false, follow: true };
    case 'index_nofollow':
      return { index: true, follow: false };
    case 'noindex_nofollow':
      return { index: false, follow: false };
    default:
      return { index: true, follow: true };
  }
}

/** Homepage metadata: CMS SEO wins, static Persian copy is the fallback. */
export function buildHomepageMetadata(homepage: HomepagePayload | null): Metadata {
  const base = siteUrl();
  const fallbackTitle = 'طلوع آفتاب، از خانه شماست | ابر انرژی';
  const fallbackDescription =
    'راهکارهای حرفه‌ای انرژی خورشیدی؛ از طراحی و نصب نیروگاه تا استقلال انرژی خانه و کسب‌وکار شما';
  const seo = homepage?.seo;
  const title = seo?.title?.trim() ? seo.title : fallbackTitle;
  const description = seo?.description?.trim() ? seo.description : fallbackDescription;
  const ogTitle = seo?.og_title?.trim() ? seo.og_title : title;
  const ogDescription = seo?.og_description?.trim() ? seo.og_description : description;
  const images = seo?.og_image_url?.trim() ? [resolveMediaUrl(seo.og_image_url)] : undefined;
  const canonical = seo?.canonical_url?.trim() ? seo.canonical_url : `${base}/fa`;
  const robots = mapRobots(seo?.robots);
  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      siteName: 'ابر انرژی',
      locale: 'fa_IR',
      ...(images ? { images } : {}),
    },
  };
}

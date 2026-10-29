import type { Metadata } from 'next';
import { t } from '@/i18n/translations';
import type { Locale } from '@/i18n/config';
import { apiBaseUrl, resolveMediaUrl, siteUrl } from './media-url';
import { hasValidSlug } from './slug';

// ── Phase 12.13 — route-level SEO metadata for content that has no
//    backend-supplied SEO object (services / projects / articles / gallery /
//    contact). Titles and descriptions come from the existing locale
//    dictionaries (`locales/{fa,en,ar}.json`); detail pages prefer the
//    entity's own locale translation + `meta_*` fields. Nothing is invented:
//    when a locale translation is genuinely absent the honest localized
//    section copy is used instead of leaking another language.

const LOCALES = ['fa', 'ar', 'en'] as const;

const SITE_NAME: Record<Locale, string> = {
  fa: 'ابر انرژی',
  ar: 'أبر إنيرجي',
  en: 'AbarEnergy',
};

const OG_LOCALE: Record<Locale, string> = {
  fa: 'fa_IR',
  ar: 'ar_IR',
  en: 'en_US',
};

/** Coerce an arbitrary `[locale]` segment to a supported locale (`fa` default). */
export function normalizeLocale(locale?: string): Locale {
  return (LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : 'fa';
}

function plainText(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface ListMetadataInput {
  locale?: string;
  /** Site-relative path without the locale prefix, e.g. `/services`. */
  path: string;
  titleKey: string;
  descriptionKey: string;
}

/** Localized metadata for a public list page (canonical from the site origin). */
export function listMetadata({ locale, path, titleKey, descriptionKey }: ListMetadataInput): Metadata {
  const loc = normalizeLocale(locale);
  const site = SITE_NAME[loc];
  const title = t(loc, titleKey);
  const description = t(loc, descriptionKey);
  const fullTitle = `${title} | ${site}`;
  const canonical = `${siteUrl()}/${loc}${path}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      siteName: site,
      locale: OG_LOCALE[loc],
      url: canonical,
    },
  };
}

interface DetailEntity {
  title?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  short_description?: string;
  description?: string;
  cover_image_url?: string;
  og_image_url?: string;
  images?: { image_url?: string }[];
}

interface DetailMetadataInput {
  locale?: string;
  /** Site-relative path without the locale prefix, e.g. `/services/grid-tied`. */
  path: string;
  entity: DetailEntity | null;
  titleKey: string;
  descriptionKey: string;
}

/**
 * Localized metadata for a public detail page.
 *
 * A missing locale translation is detected by the backend's per-locale slug
 * being empty; in that case the locale section copy is used (never another
 * language's entity copy). `meta_title`/`meta_description` win when editors
 * set them.
 */
export function detailMetadata({ locale, path, entity, titleKey, descriptionKey }: DetailMetadataInput): Metadata {
  const loc = normalizeLocale(locale);
  const site = SITE_NAME[loc];
  const canonical = `${siteUrl()}/${loc}${path}`;
  const fallbackTitle = t(loc, titleKey);
  const fallbackDescription = t(loc, descriptionKey);

  const hasLocaleTranslation = !!entity && hasValidSlug(entity.slug);
  const title = hasLocaleTranslation
    ? (entity?.meta_title?.trim() || entity?.title?.trim() || fallbackTitle)
    : fallbackTitle;
  const description = hasLocaleTranslation
    ? (entity?.meta_description?.trim() ||
        entity?.short_description?.trim() ||
        plainText(entity?.description) ||
        fallbackDescription)
    : fallbackDescription;
  const fullTitle = `${title} | ${site}`;
  const ogImage = hasLocaleTranslation
    ? (entity?.og_image_url || entity?.cover_image_url || entity?.images?.[0]?.image_url || undefined)
    : undefined;

  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: site,
      locale: OG_LOCALE[loc],
      url: canonical,
      ...(ogImage ? { images: [{ url: resolveMediaUrl(ogImage) || ogImage }] } : {}),
    },
  };
}

async function fetchPublicEntity<T>(path: string, locale: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      headers: { 'Accept-Language': locale },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchPublicService(slug: string, locale = 'fa'): Promise<DetailEntity | null> {
  return fetchPublicEntity<DetailEntity>(`/services/${encodeURIComponent(slug)}/`, locale);
}

export function fetchPublicProject(slug: string, locale = 'fa'): Promise<DetailEntity | null> {
  return fetchPublicEntity<DetailEntity>(`/projects/${encodeURIComponent(slug)}/`, locale);
}

export function fetchPublicArticle(slug: string, locale = 'fa'): Promise<DetailEntity | null> {
  return fetchPublicEntity<DetailEntity>(`/articles/${encodeURIComponent(slug)}/`, locale);
}

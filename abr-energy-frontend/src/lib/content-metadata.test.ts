import { describe, it, expect, afterEach } from 'vitest';
import { detailMetadata, listMetadata, normalizeLocale } from './content-metadata';

const ORIGINAL_SITE = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE;
});

describe('normalizeLocale', () => {
  it('accepts supported locales and defaults unknown ones to fa', () => {
    expect(normalizeLocale('fa')).toBe('fa');
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('ar')).toBe('ar');
    expect(normalizeLocale('fr')).toBe('fa');
    expect(normalizeLocale(undefined)).toBe('fa');
  });
});

describe('Phase 12.13 — localized list metadata', () => {
  it('uses the locale dictionary copy, not an English default, on a Persian page', () => {
    const faMeta = listMetadata({ locale: 'fa', path: '/services', titleKey: 'services.title', descriptionKey: 'services.subtitle' });
    expect(faMeta.title).toContain('خدمات');
    expect(faMeta.title).toContain('ابر انرژی');
    expect(faMeta.description).toBe('راهکارهای جامع انرژی خورشیدی متناسب با نیاز شما');
  });

  it('uses the English dictionary copy on an English page', () => {
    const enMeta = listMetadata({ locale: 'en', path: '/services', titleKey: 'services.title', descriptionKey: 'services.subtitle' });
    expect(enMeta.title).toContain('Services');
    expect(enMeta.description).toBe('Comprehensive solar energy solutions tailored to your needs');
  });

  it('builds a self-referencing canonical from the configured origin (per locale)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://abrenergy.example';
    const meta = listMetadata({ locale: 'en', path: '/projects', titleKey: 'projects.title', descriptionKey: 'projects.subtitle' });
    expect(meta.alternates).toEqual({ canonical: 'https://abrenergy.example/en/projects' });
    const og = meta.openGraph as { url?: string; locale?: string };
    expect(og.url).toBe('https://abrenergy.example/en/projects');
    expect(og.locale).toBe('en_US');
  });

  it('never hardcodes localhost as the origin when NEXT_PUBLIC_SITE_URL is set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://abrenergy.example/';
    const meta = listMetadata({ locale: 'fa', path: '/contact', titleKey: 'contact.title', descriptionKey: 'contact.subtitle' });
    const canonical = (meta.alternates as { canonical: string }).canonical;
    expect(canonical.startsWith('https://abrenergy.example/')).toBe(true);
    expect(canonical).not.toContain('localhost');
  });
});

describe('Phase 12.13 — localized detail metadata', () => {
  const base = { path: '/services/grid-tied', titleKey: 'services.title', descriptionKey: 'services.subtitle' };

  it('prefers editor meta fields for a translated entity', () => {
    const meta = detailMetadata({
      locale: 'fa',
      ...base,
      entity: { title: 'نیروگاه متصل به شبکه', slug: 'grid-tied', meta_title: 'متای سفارشی', meta_description: 'توضیح متا' },
    });
    expect(meta.title).toContain('متای سفارشی');
    expect(meta.description).toBe('توضیح متا');
  });

  it('falls back to the entity title/short description when meta is absent', () => {
    const meta = detailMetadata({
      locale: 'fa',
      ...base,
      entity: { title: 'نیروگاه متصل به شبکه', slug: 'grid-tied', short_description: 'توضیح کوتاه' },
    });
    expect(meta.title).toContain('نیروگاه متصل به شبکه');
    expect(meta.description).toBe('توضیح کوتاه');
  });

  it('uses honest localized fallback when the locale translation is absent (empty slug)', () => {
    const meta = detailMetadata({
      locale: 'fa',
      ...base,
      entity: { title: 'Grid-tied service', slug: '', short_description: 'English copy' },
    });
    expect(meta.title).toContain('خدمات');
    expect(meta.title).not.toContain('Grid-tied');
    expect(meta.description).toBe('راهکارهای جامع انرژی خورشیدی متناسب با نیاز شما');
  });

  it('falls back to localized copy when the entity is missing (404-safe)', () => {
    const meta = detailMetadata({ locale: 'en', ...base, entity: null });
    expect(meta.title).toContain('Services');
    expect(meta.description).toBe('Comprehensive solar energy solutions tailored to your needs');
  });

  it('emits an OpenGraph image only for a translated entity with media', () => {
    const withImage = detailMetadata({
      locale: 'fa',
      ...base,
      entity: { title: 'خدمت', slug: 'grid-tied', cover_image_url: '/media/services/x.png' },
    });
    const images = (withImage.openGraph as { images?: { url: string }[] }).images;
    expect(images?.[0]?.url).toContain('/media/services/x.png');

    const noImage = detailMetadata({ locale: 'fa', ...base, entity: { title: 'خدمت', slug: 'grid-tied' } });
    expect((noImage.openGraph as { images?: unknown }).images).toBeUndefined();
  });
});

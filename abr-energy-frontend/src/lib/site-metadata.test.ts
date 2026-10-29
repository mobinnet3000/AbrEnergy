import { describe, it, expect } from 'vitest';
import { buildIconsMetadata, faviconHref } from './site-metadata';
import type { SiteSettings } from '@/types';

function settings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    company_name: '', company_name_en: '', logo: null, favicon: null,
    phone_number: '', phone_number_2: '', email: '', address: '',
    instagram: '', telegram: '', linkedin: '', whatsapp: '', youtube: '',
    hero_title: '', hero_subtitle: '', hero_background_image: null,
    about_us: '', about_us_en: '', default_meta_title: '', default_meta_description: '',
    footer_text: '', site_url: '',
    ...overrides,
  };
}

describe('Phase 12.11 — dynamic favicon metadata', () => {
  it('returns no href when favicon is unset', () => {
    expect(faviconHref(null)).toBe('');
    expect(faviconHref(settings({ favicon: '' }))).toBe('');
    expect(faviconHref(settings({ favicon: '   ' }))).toBe('');
  });

  it('resolves a relative CMS favicon path to an absolute URL', () => {
    const href = faviconHref(settings({ favicon: '/media/general/icon.png' }));
    expect(href).toBe('http://localhost:8000/media/general/icon.png');
  });

  it('passes through absolute http(s) favicon URLs', () => {
    const href = faviconHref(settings({ favicon: 'https://cdn.example.com/icon.ico' }));
    expect(href).toBe('https://cdn.example.com/icon.ico');
  });

  it('rejects an unusable favicon type and keeps the fallback', () => {
    expect(faviconHref(settings({ favicon: '/media/docs/catalog.pdf' }))).toBe('');
  });

  it('emits icon links only when a usable favicon exists', () => {
    expect(buildIconsMetadata(null)).toBeUndefined();
    expect(buildIconsMetadata(settings({ favicon: '' }))).toBeUndefined();
    const icons = buildIconsMetadata(settings({ favicon: '/media/general/icon.png' })) as {
      icon: { url: string }[];
    };
    expect(icons).toBeTruthy();
    expect(icons.icon[0].url).toBe('http://localhost:8000/media/general/icon.png');
  });
});

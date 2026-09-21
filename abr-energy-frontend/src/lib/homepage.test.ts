import { describe, it, expect } from 'vitest';
import {
  buildHomepageMetadata,
  homepageCopy,
  homepageSection,
  homepageSectionEnabled,
} from './homepage';
import type { HomepagePayload } from '@/types';

function payload(over: Partial<HomepagePayload> = {}): HomepagePayload {
  return {
    hero: {
      eyebrow: '',
      title: 'طلوع آفتاب، از خانه شماست',
      subtitle: '',
      primary_cta: { label: 'مشاهده محصولات', url: '/products', enabled: true },
      secondary_cta: { label: 'محاسبه سیستم خورشیدی', url: '/calculator', enabled: true },
      enabled: true,
    },
    sections: [
      { key: 'hero', enabled: true, order: 10, title: 'طلوع آفتاب، از خانه شماست', subtitle: '', content: '' },
      { key: 'projects', enabled: false, order: 60, title: 'پروژه‌ها', subtitle: '', content: '' },
    ],
    featured_products: [],
    categories: [],
    services: [],
    calculator: { title: '', subtitle: '', description: '', cta_label: '', cta_url: '', enabled: true },
    projects: [],
    articles: [],
    contact: { title: '', subtitle: '', description: '', cta_label: '', cta_url: '', secondary_cta: { label: '', url: '' }, enabled: true },
    visuals: [],
    seo: { title: '', description: '', canonical_url: '', robots: 'index_follow', og_title: '', og_description: '', og_image_url: '' },
    ...over,
  } as HomepagePayload;
}

describe('homepage CMS helpers', () => {
  it('finds sections by key', () => {
    const p = payload();
    expect(homepageSection(p, 'hero')?.title).toBe('طلوع آفتاب، از خانه شماست');
    expect(homepageSection(p, 'contact')).toBeUndefined();
  });

  it('reports enabled, disabled, and unknown sections distinctly', () => {
    const p = payload();
    expect(homepageSectionEnabled(p, 'hero')).toBe(true);
    expect(homepageSectionEnabled(p, 'projects')).toBe(false);
    expect(homepageSectionEnabled(p, 'contact')).toBeUndefined();
    expect(homepageSectionEnabled(null, 'hero')).toBeUndefined();
  });

  it('prefers CMS copy only when non-empty', () => {
    expect(homepageCopy('متن CMS', 'fallback')).toBe('متن CMS');
    expect(homepageCopy('  ', 'fallback')).toBe('fallback');
    expect(homepageCopy('', 'fallback')).toBe('fallback');
    expect(homepageCopy(null, 'fallback')).toBe('fallback');
    expect(homepageCopy(undefined, 'fallback')).toBe('fallback');
  });
});

describe('buildHomepageMetadata', () => {
  it('falls back to the static Persian copy without CMS data', () => {
    const meta = buildHomepageMetadata(null);
    expect(meta.title).toBe('طلوع آفتاب، از خانه شماست | ابر انرژی');
    expect(meta.description).toContain('انرژی خورشیدی');
    expect((meta.alternates as { canonical: string }).canonical).toContain('/fa');
    expect(meta.openGraph?.locale).toBe('fa_IR');
  });

  it('prefers CMS SEO with absolute OG image and canonical', () => {
    const meta = buildHomepageMetadata(
      payload({
        seo: {
          title: 'عنوان CMS',
          description: 'توضیح CMS',
          canonical_url: 'https://abrenv.com/fa',
          robots: 'noindex_follow',
          og_title: 'OG',
          og_description: 'OG desc',
          og_image_url: '/media/x.png',
        },
      }),
    );
    expect(meta.title).toBe('عنوان CMS');
    expect(meta.description).toBe('توضیح CMS');
    expect((meta.alternates as { canonical: string }).canonical).toBe('https://abrenv.com/fa');
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.openGraph?.title).toBe('OG');
    expect(meta.openGraph?.images).toHaveLength(1);
    expect(String((meta.openGraph?.images as string[])[0])).toContain('/media/x.png');
  });

  it('maps all four robots states', () => {
    for (const [robots, expected] of [
      ['index_follow', { index: true, follow: true }],
      ['noindex_follow', { index: false, follow: true }],
      ['index_nofollow', { index: true, follow: false }],
      ['noindex_nofollow', { index: false, follow: false }],
    ] as const) {
      const meta = buildHomepageMetadata(payload({ seo: { title: '', description: '', canonical_url: '', robots, og_title: '', og_description: '', og_image_url: '' } }));
      expect(meta.robots, robots).toEqual(expected);
    }
  });

  it('omits OG images when the CMS has none', () => {
    const meta = buildHomepageMetadata(payload());
    expect(meta.openGraph?.images).toBeUndefined();
  });
});

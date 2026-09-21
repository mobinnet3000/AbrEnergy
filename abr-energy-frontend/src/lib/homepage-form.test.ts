import { describe, it, expect } from 'vitest';
import {
  buildHomepagePayload,
  homepageToForm,
  mapHomepageErrors,
  reorderItems,
} from './homepage-form';
import type { HomepageAdminPayload } from '@/types';

function admin(over: Partial<HomepageAdminPayload> = {}): HomepageAdminPayload {
  return {
    hero_eyebrow: '',
    hero_primary_cta_label: 'مشاهده محصولات',
    hero_primary_cta_url: '/products',
    hero_primary_cta_enabled: true,
    hero_secondary_cta_label: '',
    hero_secondary_cta_url: '',
    hero_secondary_cta_enabled: true,
    calculator_cta_label: '',
    calculator_cta_url: '',
    contact_cta_label: '',
    contact_cta_url: '',
    contact_secondary_cta_label: '',
    contact_secondary_cta_url: '',
    articles_count: 3,
    seo_title: '',
    seo_description: '',
    canonical_url: '',
    robots: 'index_follow',
    og_title: '',
    og_description: '',
    og_image: null,
    og_image_url: '',
    updated_at: '',
    sections: [
      { key: 'hero', enabled: true, order: 10, title: 'طلوع آفتاب، از خانه شماست', subtitle: '', content: '' },
    ],
    featured_products: [{ product: 'p1', title: 'یک', order: 0, enabled: true }],
    categories: [],
    services: [],
    projects: [],
    articles: [],
    visuals: [],
    ...over,
  } as HomepageAdminPayload;
}

describe('homepageToForm', () => {
  it('hydrates scalars, sections, relations, and SEO', () => {
    const form = homepageToForm(admin());
    expect(form.hero_primary_cta_url).toBe('/products');
    expect(form.sections).toHaveLength(1);
    expect(form.sections[0].title).toBe('طلوع آفتاب، از خانه شماست');
    expect(form.featured_products).toHaveLength(1);
    expect(form.featured_products[0].id).toBe('p1');
    expect(form.featured_products[0].key).toBeTruthy();
    expect(form.articles_count).toBe(3);
    expect(form.robots).toBe('index_follow');
  });

  it('normalizes missing titles and disabled flags', () => {
    const form = homepageToForm(admin({ featured_products: [{ product: 'p9', order: 0, enabled: false }] as never }));
    expect(form.featured_products[0].title).toBe('');
    expect(form.featured_products[0].enabled).toBe(false);
  });
});

describe('buildHomepagePayload', () => {
  it('emits the admin write shape with renumbered order', () => {
    const form = homepageToForm(admin());
    form.featured_products.push({ key: 'k2', id: 'p2', title: 'دو', order: 5, enabled: true });
    const out = buildHomepagePayload(form);
    expect(out.featured_products_data).toEqual([
      { product: 'p1', order: 0, enabled: true },
      { product: 'p2', order: 1, enabled: true },
    ]);
    expect(out.sections_data).toHaveLength(1);
    expect(out.sections_data?.[0]).toMatchObject({ key: 'hero', title: 'طلوع آفتاب، از خانه شماست' });
    expect(out.og_image).toBeNull();
  });

  it('drops empty relation rows and empty visuals', () => {
    const form = homepageToForm(admin());
    form.featured_products.push({ key: 'k9', id: '  ', title: '', order: 1, enabled: true });
    form.visuals.push({ key: 'v9', image: '', image_url: '', alt: '', order: 0, enabled: true, link_url: '' });
    const out = buildHomepagePayload(form);
    expect(out.featured_products_data).toHaveLength(1);
    expect(out.visuals_data).toHaveLength(0);
  });

  it('normalizes articles_count and keeps CTA urls verbatim', () => {
    const form = homepageToForm(admin({ articles_count: 5 }));
    const out = buildHomepagePayload(form);
    expect(out.articles_count).toBe(5);
    expect(out.hero_primary_cta_url).toBe('/products');
  });
});

describe('reorderItems', () => {
  const items = [
    { key: 'a', order: 0 },
    { key: 'b', order: 1 },
    { key: 'c', order: 2 },
  ];
  it('moves items and renumbers', () => {
    expect(reorderItems(items, 'a', 1).map((r) => r.key)).toEqual(['b', 'a', 'c']);
    expect(reorderItems(items, 'a', 1).map((r) => r.order)).toEqual([0, 1, 2]);
  });
  it('refuses out-of-range moves', () => {
    expect(reorderItems(items, 'a', -1)).toEqual(items);
    expect(reorderItems(items, 'c', 1)).toEqual(items);
    expect(reorderItems(items, 'zzz', 1)).toEqual(items);
  });
});

describe('mapHomepageErrors', () => {
  it('flattens DRF field errors', () => {
    const err = { response: { data: { hero_primary_cta_url: ['Bad URL.'], robots: 'Invalid.' } } };
    const out = mapHomepageErrors(err);
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('hero_primary_cta_url');
  });
  it('returns empty for unknown shapes', () => {
    expect(mapHomepageErrors(new Error('x'))).toEqual([]);
    expect(mapHomepageErrors(null)).toEqual([]);
  });
});

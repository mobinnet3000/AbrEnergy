import { describe, it, expect } from 'vitest';
import fa from '../../locales/fa.json';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import { adminNavSections } from '../config/navigation';
import { canManageHomepage } from './admin-permissions';

// Every admin.homepage_* key referenced by the Homepage Studio and its cards.
const REQUIRED_HOMEPAGE_KEYS = [
  'homepage', 'homepage_studio', 'homepage_studio_desc', 'homepage_preview',
  'homepage_saved', 'homepage_save_failed',
  'homepage_hero', 'homepage_hero_hint', 'homepage_eyebrow',
  'homepage_cta_label', 'homepage_cta_url', 'homepage_cta_enabled',
  'homepage_cta_primary', 'homepage_cta_secondary',
  'homepage_sections', 'homepage_sections_hint',
  'homepage_section_hero', 'homepage_section_featured_products', 'homepage_section_categories',
  'homepage_section_services', 'homepage_section_calculator', 'homepage_section_projects',
  'homepage_section_articles', 'homepage_section_contact',
  'homepage_order', 'homepage_title', 'homepage_subtitle', 'homepage_description',
  'homepage_visuals', 'homepage_visuals_hint', 'homepage_visuals_empty', 'homepage_visuals_add',
  'homepage_visual_image', 'homepage_visual_alt', 'homepage_visual_link',
  'homepage_featured', 'homepage_featured_hint', 'homepage_featured_add', 'homepage_featured_empty',
  'homepage_categories', 'homepage_categories_hint', 'homepage_categories_add', 'homepage_categories_empty',
  'homepage_services', 'homepage_services_hint', 'homepage_services_add', 'homepage_services_empty',
  'homepage_projects', 'homepage_projects_hint', 'homepage_projects_add', 'homepage_projects_empty',
  'homepage_articles', 'homepage_articles_hint', 'homepage_articles_add', 'homepage_articles_empty',
  'homepage_articles_count', 'homepage_articles_count_hint',
  'homepage_calculator', 'homepage_calculator_hint',
  'homepage_contact', 'homepage_contact_hint', 'homepage_contact_secondary',
  'homepage_picker_search', 'homepage_picker_no_results',
  'homepage_duplicate_item', 'homepage_seo_hint',
];

describe('Homepage Studio locale contract', () => {
  it('provides every Studio key in Persian', () => {
    const admin = (fa as Record<string, Record<string, string>>).admin;
    for (const key of REQUIRED_HOMEPAGE_KEYS) {
      expect(admin[key], `fa.admin.${key}`).toBeTruthy();
    }
  });

  it('keeps ar/en structural parity for future phases', () => {
    for (const [name, bundle] of [['ar', ar], ['en', en]] as const) {
      const admin = (bundle as Record<string, Record<string, string>>).admin;
      for (const key of REQUIRED_HOMEPAGE_KEYS) {
        expect(admin[key], `${name}.admin.${key}`).toBeTruthy();
      }
    }
  });
});

describe('Homepage Studio navigation + permissions', () => {
  it('links the live Homepage Studio route under content', () => {
    const items = adminNavSections.flatMap((s) => s.items);
    const entry = items.find((i) => i.href === '/admin/content/homepage');
    expect(entry).toBeDefined();
    expect(entry?.disabled).not.toBe(true);
    const content = adminNavSections.find((s) => s.titleKey === 'admin.nav_content');
    expect(content?.items.map((i) => i.href)).toContain('/admin/content/homepage');
  });

  it('gates Studio writes behind the content-manager roles (UI only; backend authoritative)', () => {
    expect(canManageHomepage('super_admin')).toBe(true);
    expect(canManageHomepage('website_admin')).toBe(true);
    expect(canManageHomepage('content_manager')).toBe(true);
    expect(canManageHomepage('engineer')).toBe(false);
    expect(canManageHomepage('customer')).toBe(false);
    expect(canManageHomepage(null)).toBe(false);
    expect(canManageHomepage(undefined)).toBe(false);
  });
});

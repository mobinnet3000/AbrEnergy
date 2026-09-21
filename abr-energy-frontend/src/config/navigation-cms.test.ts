import { describe, it, expect } from 'vitest';
import { locales, activeLocales, localeNames, localeDirections } from '@/i18n/config';
import { adminNavSections } from '@/config/navigation';

describe('Persian-only CMS locale gating', () => {
  it('exposes only fa in the language switcher', () => {
    expect([...activeLocales]).toEqual(['fa']);
  });

  it('preserves the full i18n architecture (en/ar not deleted)', () => {
    expect([...locales].sort()).toEqual(['ar', 'en', 'fa']);
    expect(localeNames.en).toBeTruthy();
    expect(localeNames.ar).toBeTruthy();
    expect(localeDirections.fa).toBe('rtl');
  });
});

describe('CMS navigation (adminNavSections)', () => {
  it('links the live product-category route', () => {
    const all = adminNavSections.flatMap((s) => s.items);
    const cat = all.find((i) => i.href === '/admin/products/categories');
    expect(cat).toBeDefined();
    expect(cat?.disabled).not.toBe(true);
  });

  it('links the live product list route (Phase 4)', () => {
    const all = adminNavSections.flatMap((s) => s.items);
    expect(all.find((i) => i.href === '/admin/products')?.disabled).not.toBe(true);
  });

  it('marks future attribute routes disabled instead of fake pages', () => {
    const all = adminNavSections.flatMap((s) => s.items);
    expect(all.find((i) => i.href === '/admin/products/attributes')?.disabled).toBe(true);
  });

  it('links the live Homepage Studio route (Phase 7)', () => {
    const all = adminNavSections.flatMap((s) => s.items);
    expect(all.find((i) => i.href === '/admin/content/homepage')?.disabled).not.toBe(true);
  });

  it('keeps all existing admin routes reachable', () => {
    const all = adminNavSections.flatMap((s) => s.items).map((i) => i.href);
    for (const href of [
      '/admin', '/admin/articles', '/admin/services', '/admin/projects',
      '/admin/contacts', '/admin/gallery', '/admin/media', '/admin/categories',
      '/admin/tags', '/admin/users', '/admin/activity-log', '/admin/settings',
    ]) {
      expect(all).toContain(href);
    }
  });
});

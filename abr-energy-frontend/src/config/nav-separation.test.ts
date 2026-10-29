import { describe, it, expect } from 'vitest';
import { navigationConfig, adminNavSections } from '@/config/navigation';

describe('Phase 12.20 — Navigation Information Architecture', () => {
  it('strictly separates Gallery and Downloads in main navigation', () => {
    const galleryItem = navigationConfig.find((i) => i.href === '/gallery');
    const downloadsItem = navigationConfig.find((i) => i.href === '/downloads');

    expect(galleryItem).toBeDefined();
    expect(galleryItem?.labelKey).toBe('nav.gallery');
    expect(galleryItem?.href).toBe('/gallery');

    expect(downloadsItem).toBeDefined();
    expect(downloadsItem?.labelKey).toBe('nav.downloads');
    expect(downloadsItem?.href).toBe('/downloads');

    // Downloads and Gallery must have different routes and labels
    expect(galleryItem?.href).not.toBe(downloadsItem?.href);
    expect(galleryItem?.labelKey).not.toBe(downloadsItem?.labelKey);
  });

  it('provides intended catalog categories under Downloads navigation', () => {
    const downloadsItem = navigationConfig.find((i) => i.href === '/downloads');
    expect(downloadsItem?.children).toBeDefined();
    expect(downloadsItem?.children?.length).toBeGreaterThanOrEqual(2);

    const solarChild = downloadsItem?.children?.find((c) =>
      c.href.includes('solar-packages'),
    );
    const modularChild = downloadsItem?.children?.find((c) =>
      c.href.includes('modular-supports'),
    );

    expect(solarChild).toBeDefined();
    expect(modularChild).toBeDefined();
  });

  it('includes public content routes in navigation', () => {
    const hrefs = navigationConfig.map((i) => i.href);
    expect(hrefs).toContain('/services');
    expect(hrefs).toContain('/projects');
    expect(hrefs).toContain('/articles');
    expect(hrefs).toContain('/gallery');
    expect(hrefs).toContain('/downloads');
  });

  it('keeps admin gallery and media management routes active', () => {
    const adminHrefs = adminNavSections.flatMap((s) => s.items).map((i) => i.href);
    expect(adminHrefs).toContain('/admin/gallery');
    expect(adminHrefs).toContain('/admin/media');
  });
});

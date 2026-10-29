import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('homepage preview fixtures — dev-only isolation', () => {
  const OLD_FLAG = process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (OLD_FLAG === undefined) delete process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW;
    else process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW = OLD_FLAG;
    vi.resetModules();
  });

  it('disabled by default (no flag)', async () => {
    delete process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW;
    const m = await import('./homepage-preview');
    expect(m.isHomepagePreviewEnabled()).toBe(false);
  });

  it('opt-in via NEXT_PUBLIC_HOMEPAGE_PREVIEW=1 outside production', async () => {
    process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW = '1';
    const m = await import('./homepage-preview');
    // Test env NODE_ENV=test (not production) → enabled.
    expect(m.isHomepagePreviewEnabled()).toBe(true);
  });

  it('NEVER active in production, even when the flag is set', async () => {
    process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW = '1';
    vi.stubEnv('NODE_ENV', 'production');
    const m = await import('./homepage-preview');
    expect(m.isHomepagePreviewEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('fixtures cover categories + price states and are clearly labelled', async () => {
    const m = await import('./homepage-preview');
    expect(m.previewCategories.length).toBeGreaterThanOrEqual(2);
    expect(m.previewProducts.length).toBeGreaterThanOrEqual(5);
    const states = new Set(m.previewProducts.map((p) => p.price.state));
    expect(states.has('regular')).toBe(true);
    expect(states.has('discounted')).toBe(true);
    expect(states.has('contact_for_price')).toBe(true);
    for (const p of m.previewProducts) {
      expect(p.title).toContain(m.PREVIEW_MARKER);
      expect(p.slug.startsWith('preview-')).toBe(true);
    }
    // No invented image paths: covers stay empty (Sun/gradient fallback renders).
    for (const p of m.previewProducts) {
      expect(p.cover_image_url).toBe('');
    }
  });
});

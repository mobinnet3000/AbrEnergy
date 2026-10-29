import { describe, it, expect } from 'vitest';
import { detailHref, hasValidSlug } from './slug';

describe('Phase 12.13 — public slug guard', () => {
  it('accepts a normal slug', () => {
    expect(hasValidSlug('panel-550')).toBe(true);
    expect(hasValidSlug('آپارتمانی')).toBe(true);
  });

  it('rejects empty and whitespace-only slugs', () => {
    expect(hasValidSlug('')).toBe(false);
    expect(hasValidSlug('   ')).toBe(false);
    expect(hasValidSlug('\t\n')).toBe(false);
  });

  it('rejects missing (null/undefined) and non-string slugs', () => {
    expect(hasValidSlug(null)).toBe(false);
    expect(hasValidSlug(undefined)).toBe(false);
    expect(hasValidSlug(42)).toBe(false);
    expect(hasValidSlug({})).toBe(false);
  });

  it('builds a detail href only for a usable slug', () => {
    expect(detailHref('/services', 'grid-tied')).toBe('/services/grid-tied');
    expect(detailHref('/services', '  grid-tied  ')).toBe('/services/grid-tied');
    expect(detailHref('/services', '')).toBeNull();
    expect(detailHref('/services', '   ')).toBeNull();
    expect(detailHref('/services', undefined)).toBeNull();
  });
});

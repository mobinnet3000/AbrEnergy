import { describe, it, expect } from 'vitest';
import robots from './robots';

describe('robots (Phase 5.2)', () => {
  it('allows the public catalog while blocking admin/dashboard/auth routes', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallow = rules.flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]));
    // Locale-prefixed admin/dashboard (the real paths) plus unprefixed safety nets.
    for (const pattern of ['/admin/', '/dashboard/', '/*/admin/', '/*/dashboard/']) {
      expect(disallow).toContain(pattern);
    }
    // Auth routes must never be indexed.
    for (const pattern of ['/*/login', '/*/register', '/*/forgot-password']) {
      expect(disallow).toContain(pattern);
    }
    // No blanket block of the public site.
    expect(rules[0].allow).toBe('/');
  });

  it('references the sitemap with the configured site URL', () => {
    const config = robots();
    const sitemap = Array.isArray(config.sitemap) ? config.sitemap[0] : config.sitemap;
    expect(typeof sitemap).toBe('string');
    expect(String(sitemap)).toMatch(/^https?:\/\//);
    expect(String(sitemap).endsWith('/sitemap.xml')).toBe(true);
  });
});

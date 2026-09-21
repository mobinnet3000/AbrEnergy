import { describe, it, expect } from 'vitest';
import { resolveMediaUrl, siteUrl } from './media-url';

describe('resolveMediaUrl', () => {
  it('resolves relative backend media paths against the API origin', () => {
    const out = resolveMediaUrl('/media/products/x.png');
    expect(out).toContain('/media/products/x.png');
    expect(out).toMatch(/^https?:\/\//);
  });

  it('passes absolute URLs through untouched', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveMediaUrl('http://localhost:8000/media/a.png')).toBe('http://localhost:8000/media/a.png');
  });

  it('passes data/blob URIs through untouched', () => {
    expect(resolveMediaUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(resolveMediaUrl('blob:http://localhost:3000/1')).toBe('blob:http://localhost:3000/1');
  });

  it('returns empty string for empty input', () => {
    expect(resolveMediaUrl('')).toBe('');
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
  });
});

describe('siteUrl', () => {
  it('returns a configured-or-fallback URL without trailing slash', () => {
    const url = siteUrl();
    expect(url).toMatch(/^https?:\/\//);
    expect(url.endsWith('/')).toBe(false);
  });
});

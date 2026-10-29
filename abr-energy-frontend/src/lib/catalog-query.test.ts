import { describe, it, expect } from 'vitest';
import {
  parseCatalogPage,
  parseCatalogSearch,
  parseCatalogCategory,
  parseCatalogFeatured,
  parseCatalogOrdering,
  buildCatalogQuery,
} from './catalog-query';

describe('catalog-query parameter parsers', () => {
  it('parses page correctly, defaulting safely to 1', () => {
    expect(parseCatalogPage(null)).toBe(1);
    expect(parseCatalogPage('')).toBe(1);
    expect(parseCatalogPage('abc')).toBe(1);
    expect(parseCatalogPage('-5')).toBe(1);
    expect(parseCatalogPage('0')).toBe(1);
    expect(parseCatalogPage('1')).toBe(1);
    expect(parseCatalogPage('4')).toBe(4);
    expect(parseCatalogPage('  12  ')).toBe(12);
  });

  it('parses and trims search query', () => {
    expect(parseCatalogSearch(null)).toBe('');
    expect(parseCatalogSearch('  ')).toBe('');
    expect(parseCatalogSearch('  پنل خورشیدی  ')).toBe('پنل خورشیدی');
  });

  it('parses category id or slug', () => {
    expect(parseCatalogCategory(null)).toBe('');
    expect(parseCatalogCategory('')).toBe('');
    expect(parseCatalogCategory('solar-packages')).toBe('solar-packages');
    expect(parseCatalogCategory('  cat-123  ')).toBe('cat-123');
  });

  it('parses featured flag', () => {
    expect(parseCatalogFeatured(null)).toBe(false);
    expect(parseCatalogFeatured('')).toBe(false);
    expect(parseCatalogFeatured('false')).toBe(false);
    expect(parseCatalogFeatured('true')).toBe(true);
    expect(parseCatalogFeatured('1')).toBe(true);
    expect(parseCatalogFeatured('yes')).toBe(true);
    expect(parseCatalogFeatured('TRUE')).toBe(true);
  });

  it('parses ordering and rejects unsupported orders', () => {
    expect(parseCatalogOrdering(null)).toBe('');
    expect(parseCatalogOrdering('')).toBe('');
    expect(parseCatalogOrdering('-created_at')).toBe('-created_at');
    expect(parseCatalogOrdering('created_at')).toBe('created_at');
    expect(parseCatalogOrdering('price')).toBe('');
    expect(parseCatalogOrdering('drop_table')).toBe('');
  });
});

describe('buildCatalogQuery', () => {
  it('returns an empty query string when all parameters are default', () => {
    expect(buildCatalogQuery({})).toBe('');
    expect(
      buildCatalogQuery({
        search: '',
        category: '',
        featured: false,
        ordering: '',
        page: 1,
      }),
    ).toBe('');
  });

  it('serializes single parameters cleanly', () => {
    expect(buildCatalogQuery({ search: 'پنل' })).toBe('search=%D9%BE%D9%86%D9%84');
    expect(buildCatalogQuery({ category: 'packages' })).toBe('category=packages');
    expect(buildCatalogQuery({ featured: true })).toBe('featured=true');
    expect(buildCatalogQuery({ ordering: '-created_at' })).toBe('ordering=-created_at');
    expect(buildCatalogQuery({ page: 2 })).toBe('page=2');
  });

  it('omits page when page is 1', () => {
    expect(buildCatalogQuery({ search: 'اینورتر', page: 1 })).toBe('search=%D8%A7%DB%8C%D9%86%D9%88%D8%B1%D8%AA%D8%B1');
  });

  it('serializes multiple combined parameters and ignores invalid orderings', () => {
    const query = buildCatalogQuery({
      search: 'باتری',
      category: 'cat-uuid-1',
      featured: true,
      ordering: 'invalid-field',
      page: 3,
    });
    const sp = new URLSearchParams(query);
    expect(sp.get('search')).toBe('باتری');
    expect(sp.get('category')).toBe('cat-uuid-1');
    expect(sp.get('featured')).toBe('true');
    expect(sp.get('ordering')).toBeNull();
    expect(sp.get('page')).toBe('3');
  });
});

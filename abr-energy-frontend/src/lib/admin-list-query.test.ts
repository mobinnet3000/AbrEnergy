/**
 * Phase 9.3-A — URL list-state helper tests (parsing §15.A + serialization §15.B).
 *
 * Pure unit tests over `src/lib/admin-list-query.ts`: defaults, valid/invalid
 * pages, empty search, supported/unsupported status, featured true/omitted,
 * defaults omission, natural URL-API encoding, stable ordering.
 */
import { describe, it, expect } from 'vitest';
import {
  parsePageParam,
  parseSearchParam,
  parseEnumParam,
  parseFeaturedParam,
  parseIdParam,
  buildListQuery,
  ARTICLE_LIST_STATUSES,
  PRODUCT_LIST_STATUSES,
  SERVICE_LIST_STATUSES,
} from '@/lib/admin-list-query';

describe('parsePageParam (URL → page)', () => {
  it('defaults to 1 when missing', () => {
    expect(parsePageParam(null)).toBe(1);
  });

  it('accepts valid pages', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('12')).toBe(12);
  });

  it('fails safely to 1 on invalid values', () => {
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam('')).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-3')).toBe(1);
    expect(parsePageParam('2.5')).toBe(1);
    expect(parsePageParam('2x')).toBe(1);
    expect(parsePageParam('  ')).toBe(1);
  });
});

describe('parseSearchParam (URL → search)', () => {
  it('returns the trimmed value', () => {
    expect(parseSearchParam('solar')).toBe('solar');
    expect(parseSearchParam('  solar panel  ')).toBe('solar panel');
  });

  it('maps missing/blank to empty', () => {
    expect(parseSearchParam(null)).toBe('');
    expect(parseSearchParam('')).toBe('');
    expect(parseSearchParam('   ')).toBe('');
  });
});

describe('parseEnumParam (URL → status/visibility/active)', () => {
  it('accepts supported status values per list', () => {
    expect(parseEnumParam('draft', ARTICLE_LIST_STATUSES)).toBe('draft');
    expect(parseEnumParam('scheduled', ARTICLE_LIST_STATUSES)).toBe('scheduled');
    expect(parseEnumParam('archived', PRODUCT_LIST_STATUSES)).toBe('archived');
    expect(parseEnumParam('active', SERVICE_LIST_STATUSES)).toBe('active');
    expect(parseEnumParam('inactive', SERVICE_LIST_STATUSES)).toBe('inactive');
  });

  it('rejects values from another list plus garbage', () => {
    // `archived` is a product status, not an article status.
    expect(parseEnumParam('archived', ARTICLE_LIST_STATUSES)).toBeNull();
    // `draft` is not a service status.
    expect(parseEnumParam('draft', SERVICE_LIST_STATUSES)).toBeNull();
    expect(parseEnumParam('bogus', ARTICLE_LIST_STATUSES)).toBeNull();
    expect(parseEnumParam('', ARTICLE_LIST_STATUSES)).toBeNull();
    expect(parseEnumParam(null, ARTICLE_LIST_STATUSES)).toBeNull();
  });

  it('maps "all" to the omitted default', () => {
    expect(parseEnumParam('all', ARTICLE_LIST_STATUSES)).toBeNull();
  });
});

describe('parseFeaturedParam (URL → featured)', () => {
  it('is true only for the exact string "true"', () => {
    expect(parseFeaturedParam('true')).toBe(true);
  });

  it('is false for missing/malformed values', () => {
    expect(parseFeaturedParam(null)).toBe(false);
    expect(parseFeaturedParam('false')).toBe(false);
    expect(parseFeaturedParam('1')).toBe(false);
    expect(parseFeaturedParam('yes')).toBe(false);
    expect(parseFeaturedParam('')).toBe(false);
  });
});

describe('parseIdParam (URL → category/parent)', () => {
  it('passes non-empty ids through trimmed', () => {
    expect(parseIdParam('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(parseIdParam('  abc  ')).toBe('abc');
  });

  it('maps missing/blank/all to null', () => {
    expect(parseIdParam(null)).toBeNull();
    expect(parseIdParam('')).toBeNull();
    expect(parseIdParam('all')).toBeNull();
  });
});

describe('buildListQuery (state → URL)', () => {
  it('omits every default (empty state serializes to "")', () => {
    expect(buildListQuery({})).toBe('');
    expect(
      buildListQuery({ search: '', status: null, featured: false, page: 1 }),
    ).toBe('');
    expect(
      buildListQuery({ search: '  ', status: 'all', featured: null, page: 0 }),
    ).toBe('');
  });

  it('serializes search + page', () => {
    expect(buildListQuery({ search: 'solar', page: 2 })).toBe('search=solar&page=2');
  });

  it('omits page=1 while keeping other values', () => {
    expect(buildListQuery({ search: 'solar', status: 'published', page: 1 })).toBe(
      'search=solar&status=published',
    );
  });

  it('serializes status + featured=true', () => {
    expect(
      buildListQuery({ search: 'backup', status: 'active', featured: true, page: 2 }),
    ).toBe('search=backup&status=active&featured=true&page=2');
  });

  it('uses stable key ordering (search, category, status, visibility, active, featured, parent, page)', () => {
    expect(
      buildListQuery({
        page: 3,
        parent: 'p1',
        featured: true,
        active: 'active',
        visibility: 'public',
        status: 'published',
        category: 'c1',
        search: 's',
      }),
    ).toBe(
      'search=s&category=c1&status=published&visibility=public&active=active&featured=true&parent=p1&page=3',
    );
  });

  it('encodes values naturally via the URL API (no manual encode/decode)', () => {
    const out = buildListQuery({ search: 'انرژی خورشیدی + solar' });
    // Round-trips through the same API the pages use to read it back.
    expect(new URLSearchParams(out).get('search')).toBe('انرژی خورشیدی + solar');
    expect(out).not.toContain(' ');
  });

  it('round-trips: parse(build(state)) is stable', () => {
    const first = buildListQuery({ search: 'panel', status: 'draft', page: 2 });
    const sp = new URLSearchParams(first);
    const second = buildListQuery({
      search: parseSearchParam(sp.get('search')),
      status: parseEnumParam(sp.get('status'), ARTICLE_LIST_STATUSES),
      page: parsePageParam(sp.get('page')),
    });
    expect(second).toBe(first);
  });
});

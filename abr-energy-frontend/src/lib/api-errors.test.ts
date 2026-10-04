import { describe, it, expect } from 'vitest';
import {
  flattenNormalizedError,
  mapCategoryErrors,
  normalizeApiError,
  summarizeNormalizedError,
} from '@/lib/api-errors';

const axiosErr = (data: unknown, status = 400) => ({
  response: { status, data },
  message: 'Request failed with status code 400',
});

describe('normalizeApiError — shape coverage', () => {
  it('1. handles a simple string error', () => {
    const n = normalizeApiError('Invalid value');
    expect(n.detailMessages).toEqual(['Invalid value']);
    expect(n.kind).toBe('validation');
  });

  it('2. handles an array error', () => {
    const n = normalizeApiError(['Error A', 'Error B']);
    expect(n.detailMessages).toEqual(['Error A', 'Error B']);
  });

  it('3. handles a field-array error', () => {
    const n = normalizeApiError(axiosErr({ title: ['Title is required'] }));
    expect(n.fieldErrors).toEqual([{ path: 'title', message: 'Title is required' }]);
  });

  it('4. handles a nested object error', () => {
    const n = normalizeApiError(
      axiosErr({ product: { title: ['Title is required'] } }),
    );
    expect(n.fieldErrors).toEqual([{ path: 'product.title', message: 'Title is required' }]);
  });

  it('5. handles nested array/object combinations with index paths', () => {
    const n = normalizeApiError(
      axiosErr({
        translations: { fa: { title: ['Title is required'] } },
        images_data: [{ media_file: ['Missing file'] }, ['Bad row']],
        price_data: { regular_price: ['Must be positive'] },
      }),
    );
    const paths = n.fieldErrors.map((f) => f.path);
    expect(paths).toContain('translations.fa.title');
    expect(paths).toContain('images_data.0.media_file');
    expect(paths).toContain('images_data.1');
    expect(paths).toContain('price_data.regular_price');
  });

  it('6. keeps multiple fields side by side', () => {
    const n = normalizeApiError(
      axiosErr({ title: ['Required'], slug: ['Taken'], sku: 'Bad format' }),
    );
    expect(n.fieldErrors).toHaveLength(3);
    expect(n.fieldErrors.map((f) => f.path).sort()).toEqual(['sku', 'slug', 'title']);
  });

  it('7. tolerates empty/null/undefined', () => {
    for (const input of [null, undefined, '', {}, [], { errors: null }, { response: { data: null } }]) {
      const n = normalizeApiError(input);
      expect(n.fieldErrors).toEqual([]);
      expect(n.detailMessages).toEqual([]);
    }
  });

  it('8. reduces unknown objects to a safe generic (no crash, no leak)', () => {
    const n = normalizeApiError({ response: { status: 418, data: { weird: 42 } } });
    expect(n.fieldErrors).toEqual([{ path: 'weird', message: '42' }]);
    const empty = normalizeApiError({ response: { status: 500, data: { ok: 1 } } });
    expect(empty.kind).toBe('server');
    expect(empty.fieldErrors).toEqual([]);
  });

  it('9. classifies axios/network errors without leaking internals', () => {
    const net = normalizeApiError({
      code: 'ERR_NETWORK',
      message: 'Network Error',
      request: {},
      config: { headers: { Authorization: 'Bearer secret-token' } },
    });
    expect(net.kind).toBe('network');
    expect(net.fieldErrors).toEqual([]);
    expect(net.detailMessages).toEqual([]);
    // The bearer token must never appear anywhere in the output.
    expect(JSON.stringify(net)).not.toContain('secret-token');
  });

  it('13. preserves dotted field paths', () => {
    const n = normalizeApiError(
      axiosErr({ errors: { 'seo.title': ['Too long'], attributes: { '0': { value: ['Bad'] } } }, status: 400 }),
    );
    expect(n.fieldErrors.map((f) => f.path)).toContain('seo.title');
    expect(n.fieldErrors.map((f) => f.path)).toContain('attributes.0.value');
  });
});

describe('normalizeApiError — safety', () => {
  it('10. never emits [object Object]', () => {
    const n = normalizeApiError(
      axiosErr({ a: { b: { c: { d: ['deep'] } } }, arr: [[['x']]] }),
    );
    expect(JSON.stringify(n)).not.toContain('[object Object]');
    expect(n.fieldErrors.length).toBeGreaterThan(0);
  });

  it('11. never leaks stack traces, HTML, or credential-looking values', () => {
    const n = normalizeApiError(
      axiosErr({
        detail: '<html><body>Server blew up</body></html>',
        token: ['eyJhbGciOiJIUzI1NiJ9.payload.sig'],
        password: ['way too short'],
      }),
    );
    const text = JSON.stringify(n);
    expect(text).not.toContain('<html>');
    expect(text).not.toContain('eyJhbGciOi');
    expect(text).not.toContain('Error:');
    expect(text).not.toContain(' at ');
    // The unsafe entries are dropped; the shape itself stays usable.
    expect(n.fieldErrors.map((f) => f.path)).not.toContain('token');
  });

  it('never throws on hostile input', () => {
    const evil = { get message(): string { throw new Error('getter bomb'); } };
    expect(() => normalizeApiError([evil, Symbol('s'), BigInt(10), () => 1])).not.toThrow();
    expect(() => normalizeApiError(new Error('boom'))).not.toThrow();
  });

  it('14. is cyclic-safe', () => {
    const cyclic: Record<string, unknown> = { title: ['Required'] };
    cyclic.self = cyclic;
    cyclic.nested = { parent: cyclic };
    const n = normalizeApiError(axiosErr({ errors: cyclic, status: 400 }));
    expect(n.fieldErrors).toEqual([{ path: 'title', message: 'Required' }]);
  });

  it('12. is deterministic', () => {
    const input = () =>
      axiosErr({
        errors: {
          title: ['Required'],
          translations: { fa: { title: ['Bad'], slug: ['Taken'] } },
          images_data: [{ media_file: ['Missing'] }],
        },
        status: 400,
      });
    expect(normalizeApiError(input())).toEqual(normalizeApiError(input()));
    expect(flattenNormalizedError(normalizeApiError(input()))).toEqual(
      flattenNormalizedError(normalizeApiError(input())),
    );
  });

  it('treats permission statuses as permission kind (never field-mapped as validation)', () => {
    for (const status of [401, 403]) {
      const n = normalizeApiError({
        response: { status, data: { detail: 'You do not have permission.' } },
        message: 'Request failed with status code 403',
      });
      expect(n.kind).toBe('permission');
      expect(n.status).toBe(status);
      // Axios' own default message is never surfaced; backend detail is kept.
      expect(n.detailMessages).toEqual(['You do not have permission.']);
    }
  });

  it('treats 5xx as server kind with no parsed content', () => {
    const n = normalizeApiError({ response: { status: 503, data: '<html>down</html>' } });
    expect(n.kind).toBe('server');
    expect(n.fieldErrors).toEqual([]);
    expect(n.detailMessages).toEqual([]);
  });
});

describe('toast summary + category wrapper', () => {
  it('summarizes field errors concisely with field context', () => {
    const summary = summarizeNormalizedError(
      normalizeApiError(axiosErr({ title: ['Required'], slug: ['Taken'] })),
    );
    expect(summary).toContain('title: Required');
    expect(summary).toContain('slug: Taken');
  });

  it('returns null when nothing safe can be shown (callers use generic locale toast)', () => {
    expect(summarizeNormalizedError(normalizeApiError(null))).toBeNull();
    expect(
      summarizeNormalizedError(normalizeApiError({ code: 'ERR_NETWORK', message: 'Network Error', request: {} })),
    ).toBeNull();
  });

  it('mapCategoryErrors shares the same normalization (no duplicated parsing)', () => {
    const out = mapCategoryErrors(
      axiosErr({ errors: { translations: { fa: { title: ['Required'] } } }, status: 400 }),
    );
    expect(out).toContain('translations.fa.title: Required');
    expect(mapCategoryErrors(null)).toEqual([]);
  });
});

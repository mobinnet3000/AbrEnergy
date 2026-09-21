import { describe, it, expect } from 'vitest';
import {
  attachAttributeDefinitions,
  buildProductPayload,
  emptyProductForm,
  formatPrice,
  groupSpecsBySection,
  mapProductErrors,
  priceStateLabelKey,
  productToForm,
  toLocalInput,
} from '@/lib/product-form';
import type { ProductDetail } from '@/types';

const detail = (over: Partial<ProductDetail> = {}): ProductDetail => ({
  id: 'p1',
  title: 'پکیج خورشیدی',
  slug: 'solar-pack',
  short_description: 'کوتاه',
  sku: 'SKU-1',
  category: 'cat-1',
  cover_image_url: '',
  status: 'draft',
  visibility: 'public',
  is_active: true,
  is_featured: false,
  sort_order: 0,
  price: { state: 'contact_for_price', currency: 'IRR' },
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
  published_at: null,
  description: 'd',
  features: 'f',
  images: [],
  documents: [],
  specifications: [],
  attribute_values: [],
  related: [],
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: 'index_follow',
  og_title: '',
  og_description: '',
  og_image: null,
  meta_title: '',
  meta_description: '',
  ...over,
});

describe('price presentation helpers', () => {
  it('maps all six backend states to Persian label keys', () => {
    expect(priceStateLabelKey('contact_for_price')).toBe('admin.price_state_contact');
    expect(priceStateLabelKey('regular')).toBe('admin.price_state_regular');
    expect(priceStateLabelKey('discounted')).toBe('admin.price_state_discounted');
    expect(priceStateLabelKey('scheduled')).toBe('admin.price_state_scheduled');
    expect(priceStateLabelKey('expired')).toBe('admin.price_state_expired');
    expect(priceStateLabelKey('hidden')).toBe('admin.price_state_hidden');
  });

  it('falls back to contact_for_price for unknown states', () => {
    expect(priceStateLabelKey('bogus')).toBe('admin.price_state_contact');
  });

  it('formats prices without floating-point math', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice('1000000')).toContain('٬');
  });

  it('converts ISO datetimes to datetime-local inputs', () => {
    expect(toLocalInput(null)).toBeNull();
    expect(toLocalInput('bogus')).toBeNull();
    expect(toLocalInput('2026-03-01T10:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('buildProductPayload', () => {
  it('emits Persian-only translations and trims identity fields', () => {
    const form = { ...emptyProductForm(), title: '  تست  ', sku: ' A-1 ' };
    const payload = buildProductPayload(form);
    expect(Object.keys(payload.translations)).toEqual(['fa']);
    expect(payload.translations.fa.title).toBe('تست');
    expect(payload.sku).toBe('A-1');
    expect(payload.category).toBeNull();
    expect(payload.og_image).toBeNull();
  });

  it('guarantees exactly one cover image when a gallery exists', () => {
    const form = {
      ...emptyProductForm(),
      title: 't',
      sku: 's',
      images: [
        { key: 'a', media_file: 'm1', url: 'u1', sort_order: 0, is_cover: false, alt_text: '', caption: '' },
        { key: 'b', media_file: 'm2', url: 'u2', sort_order: 1, is_cover: false, alt_text: '', caption: '' },
      ],
    };
    const payload = buildProductPayload(form);
    expect(payload.images_data?.filter((i) => i.is_cover)).toHaveLength(1);
  });

  it('drops empty spec rows and maps nested collections', () => {
    const form = {
      ...emptyProductForm(),
      title: 't',
      sku: 's',
      specs: [
        { key: 'a', section: 'فنی', label: 'توان', value: '5', unit: 'kW', sort_order: 0 },
        { key: 'b', section: '', label: '', value: '', unit: '', sort_order: 1 },
      ],
      attributes: [{ definition: 'd1', value_text: '', value_number: '5', value_boolean: null }],
      relations: [{ key: 'r', to_product: 'p2', title: 'دیگر', relation_type: 'accessory', sort_order: 0, is_active: true }],
    };
    const payload = buildProductPayload(form);
    expect(payload.specs_data).toHaveLength(1);
    expect(payload.attributes_data).toEqual([{ definition: 'd1', value_number: '5' }]);
    expect(payload.relations_data?.[0]?.relation_type).toBe('accessory');
  });

  it('normalizes empty price strings to null', () => {
    const form = { ...emptyProductForm(), title: 't', sku: 's' };
    const payload = buildProductPayload(form);
    expect(payload.price_data?.regular_price).toBeNull();
    expect(payload.price_data?.display_mode).toBe('contact');
  });
});

describe('mapProductErrors', () => {
  it('maps field errors near the relevant editor section', () => {
    const mapped = mapProductErrors({ price_data: ['bad price'], images_data: ['bad image'], sku: ['taken'] });
    expect(mapped.price).toEqual(['bad price']);
    expect(mapped.media).toEqual(['bad image']);
    expect(mapped.identity).toEqual(['taken']);
  });

  it('unwraps the DRF error envelope', () => {
    const mapped = mapProductErrors({ status: 400, errors: { specs_data: ['bad spec'] } });
    expect(mapped.specs).toEqual(['bad spec']);
  });

  it('falls back to a detail message for string errors', () => {
    expect(mapProductErrors('boom').detail).toEqual(['boom']);
  });
});

describe('productToForm', () => {
  it('hydrates price inputs, relations and og image from admin detail', () => {
    const form = productToForm(detail({
      price_display_mode: 'discounted',
      price_is_active: true,
      price_regular: '100',
      price_sale: '80',
      price_discount_type: 'none',
      price_discount_value: '0',
      og_image: 'og-1',
      og_image_url: 'http://x/og.png',
      relations_admin: [
        { id: 'r1', to_product: 'p2', title: 'دیگر', relation_type: 'similar', sort_order: 0, is_active: true },
      ],
    }));
    expect(form.price.display_mode).toBe('discounted');
    expect(form.price.sale_price).toBe('80');
    expect(form.og_image_id).toBe('og-1');
    expect(form.relations).toHaveLength(1);
    expect(form.relations[0].relation_type).toBe('similar');
  });

  it('sorts cover images first', () => {
    const form = productToForm(detail({
      images: [
        { id: 'i1', url: 'u1', media_file: 'm1', is_cover: false, sort_order: 0, alt_text: '', caption: '' },
        { id: 'i2', url: 'u2', media_file: 'm2', is_cover: true, sort_order: 1, alt_text: '', caption: '' },
      ],
    }));
    expect(form.images[0].media_file).toBe('m2');
  });

  it('attaches definition ids to attribute rows by code', () => {
    const values = [
      { id: 'v1', code: 'power', name: 'توان', data_type: 'number' as const, unit: 'kW', value_text: '', value_number: '5', value_boolean: null, display: '5 kW' },
    ];
    const form = productToForm(detail({ attribute_values: values }));
    const attached = attachAttributeDefinitions(
      form.attributes,
      values,
      [{ id: 'def-1', code: 'power', name: 'توان', data_type: 'number', unit: 'kW', category: null, sort_order: 0, is_active: true }],
    );
    expect(attached[0].definition).toBe('def-1');
    expect(attached[0].value_number).toBe('5');
  });
});

describe('groupSpecsBySection', () => {
  it('groups rows preserving first-seen section order', () => {
    const groups = groupSpecsBySection([
      { key: 'a', section: 'باتری', label: 'ظرفیت', value: '10', unit: 'kWh', sort_order: 0 },
      { key: 'b', section: 'فنی', label: 'توان', value: '5', unit: 'kW', sort_order: 1 },
      { key: 'c', section: 'باتری', label: 'ولتاژ', value: '48', unit: 'V', sort_order: 2 },
    ]);
    expect(groups.map((g) => g.section)).toEqual(['باتری', 'فنی']);
    expect(groups[0].rows).toHaveLength(2);
  });
});

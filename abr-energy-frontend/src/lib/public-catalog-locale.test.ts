import { describe, it, expect } from 'vitest';
import fa from '../../locales/fa.json';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import { activeLocales, locales } from '../i18n/config';

// Every products.* key referenced by the public catalog components/pages.
const REQUIRED_PRODUCT_KEYS = [
  'label', 'title', 'subtitle', 'search_placeholder', 'filter_category', 'all_categories',
  'featured_only', 'ordering_label', 'ordering_default', 'ordering_newest', 'ordering_oldest',
  'clear_filters', 'results_count', 'not_found', 'not_found_hint', 'load_failed', 'retry',
  'view_details', 'featured_badge', 'discount_badge', 'price_contact', 'price_soon',
  'price_expired_note', 'currency_toman', 'original_price', 'sku_label', 'category_label',
  'description_title', 'features_title', 'specs_title', 'attributes_title', 'documents_title',
  'document_download', 'related_title', 'children_title', 'products_in_category', 'view_category',
  'all_products', 'back_to_products', 'category_not_found', 'product_not_found', 'product_gone_hint',
  'gallery_label', 'prev_image', 'next_image', 'cta_consult', 'cta_contact', 'cta_title', 'cta_desc',
  'home_crumb', 'page_of', 'boolean_yes', 'boolean_no',
];

describe('Persian-only public catalog locale contract', () => {
  it('keeps the public catalog Persian-only without removing ar/en architecture', () => {
    expect(activeLocales).toEqual(['fa']);
    expect(locales).toContain('ar');
    expect(locales).toContain('en');
  });

  it('provides every catalog key in Persian', () => {
    const products = (fa as Record<string, Record<string, string>>).products;
    expect(products).toBeTruthy();
    for (const key of REQUIRED_PRODUCT_KEYS) {
      expect(products[key], `fa.products.${key}`).toBeTruthy();
    }
  });

  it('keeps ar/en structural parity for future phases', () => {
    for (const [name, bundle] of [['ar', ar], ['en', en]] as const) {
      const products = (bundle as Record<string, Record<string, string>>).products;
      expect(products, `${name}.products`).toBeTruthy();
      for (const key of REQUIRED_PRODUCT_KEYS) {
        expect(products[key], `${name}.products.${key}`).toBeTruthy();
      }
    }
  });

  it('exposes the products entry in the public navigation', () => {
    expect((fa as Record<string, Record<string, string>>).nav.products).toBeTruthy();
  });
});

/**
 * Phase 12.4 — development-only homepage preview fixtures.
 *
 * The CMS is empty in local dev, so the homepage renders empty states and
 * the owner cannot judge the showcase/rails. These in-memory fixtures let
 * the homepage be visually reviewed WITHOUT touching Django, SQLite,
 * PostgreSQL, migrations, media storage, or the real CMS.
 *
 * Safety rules:
 * - Opt-in: `NEXT_PUBLIC_HOMEPAGE_PREVIEW=1` in `.env.local`.
 * - Disabled by default; NEVER active in production (`NODE_ENV` guard).
 * - Frontend-only: never written to any store, never fed to sitemap/SEO
 *   metadata/public APIs (those consume the backend directly).
 * - Clearly labelled: every title carries a preview marker and every slug
 *   is prefixed `preview-`, so fixtures can never be confused with inventory.
 * - No image files invented: covers are empty (the existing Sun fallback
 *   renders) because `public/` holds no product photography. The showcase
 *   renders a designed gradient panel for cover-less products (12.4).
 */

import type { HomepageVisual, ProductCategory, ProductListItem } from '@/types';

export const PREVIEW_MARKER = 'پیش‌نمایش';

export function isHomepagePreviewEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_HOMEPAGE_PREVIEW === '1';
}

type PriceState = ProductListItem['price'];

function price(state: PriceState['state'], regular: string | null, final: string | null): PriceState {
  return { state, currency: 'IRR', regular_price: regular, sale_price: null, final_price: final };
}

function item(overrides: Partial<ProductListItem> & { id: string }): ProductListItem {
  return {
    title: `${PREVIEW_MARKER} ${overrides.id}`,
    slug: `preview-${overrides.id}`,
    short_description: 'داده نمایشی توسعه — موجودی واقعی نیست',
    sku: `PREVIEW-${overrides.id.toUpperCase()}`,
    category: null,
    cover_image_url: '',
    status: 'published',
    visibility: 'public',
    is_active: true,
    is_featured: true,
    sort_order: 0,
    price: price('regular', '10000000', '10000000'),
    created_at: '',
    updated_at: '',
    published_at: null,
    ...overrides,
  } as ProductListItem;
}

export const previewCategories: ProductCategory[] = [
  { id: 'preview-cat-1', title: `${PREVIEW_MARKER} پکیج‌های خورشیدی`, slug: 'preview-solar-packages', parent: null, children: [], sort_order: 0, is_active: true, is_featured: true },
  { id: 'preview-cat-2', title: `${PREVIEW_MARKER} پکیج‌های برق اضطراری`, slug: 'preview-emergency-power', parent: null, children: [], sort_order: 1, is_active: true, is_featured: false },
  { id: 'preview-cat-3', title: `${PREVIEW_MARKER} سازه خورشیدی`, slug: 'preview-solar-structure', parent: null, children: [], sort_order: 2, is_active: true, is_featured: false },
  { id: 'preview-cat-4', title: `${PREVIEW_MARKER} ساپورت مدولار تأسیساتی`, slug: 'preview-modular-support', parent: null, children: [], sort_order: 3, is_active: true, is_featured: false },
  { id: 'preview-cat-5', title: `${PREVIEW_MARKER} بست لوله`, slug: 'preview-pipe-clamp', parent: null, children: [], sort_order: 4, is_active: true, is_featured: false },
  { id: 'preview-cat-6', title: `${PREVIEW_MARKER} پروفیل`, slug: 'preview-profile', parent: null, children: [], sort_order: 5, is_active: true, is_featured: false },
  { id: 'preview-cat-7', title: `${PREVIEW_MARKER} سینی کابل`, slug: 'preview-cable-tray', parent: null, children: [], sort_order: 6, is_active: true, is_featured: false },
  { id: 'preview-cat-8', title: `${PREVIEW_MARKER} اتصالات و متعلقات`, slug: 'preview-fittings', parent: null, children: [], sort_order: 7, is_active: true, is_featured: false },
];

export const previewProducts: ProductListItem[] = [
  item({ id: 'panel-550', title: `${PREVIEW_MARKER} پنل خورشیدی ۵۵۰ وات`, slug: 'preview-panel-550', category: 'preview-cat-1', price: price('regular', '18500000', '18500000') }),
  item({ id: 'inverter-5k', title: `${PREVIEW_MARKER} اینورتر ۵ کیلووات`, slug: 'preview-inverter-5k', category: 'preview-cat-2', price: price('discounted', '42000000', '36500000') }),
  item({ id: 'structure-roof', title: `${PREVIEW_MARKER} استراکچر پشت‌بامی`, slug: 'preview-structure-roof', category: 'preview-cat-3', price: price('scheduled', '7400000', '7400000') }),
  item({ id: 'support-modular', title: `${PREVIEW_MARKER} ساپورت مدولار گالوانیزه`, slug: 'preview-support-modular', category: 'preview-cat-4', price: price('regular', '3200000', '3200000') }),
  item({ id: 'clamp-2in', title: `${PREVIEW_MARKER} بست لوله ۲ اینچ`, slug: 'preview-clamp-2in', category: 'preview-cat-5', price: price('discounted', '180000', '145000') }),
  item({ id: 'profile-c41', title: `${PREVIEW_MARKER} پروفیل C41 گالوانیزه`, slug: 'preview-profile-c41', category: 'preview-cat-6', price: price('regular', '890000', '890000') }),
  item({ id: 'tray-200', title: `${PREVIEW_MARKER} سینی کابل ۲۰ سانتی`, slug: 'preview-tray-200', category: 'preview-cat-7', price: price('contact_for_price', null, null) }),
  item({ id: 'package-offgrid', title: `${PREVIEW_MARKER} پکیج آفگرید باغی`, slug: 'preview-package-offgrid', category: 'preview-cat-1', price: price('regular', '98000000', '98000000') }),
  item({ id: 'charge-60', title: `${PREVIEW_MARKER} شارژکنترلر ۶۰ آمپر`, slug: 'preview-charge-60', category: 'preview-cat-2', price: price('discounted', '12500000', '9900000') }),
  item({ id: 'fitting-set', title: `${PREVIEW_MARKER} ست اتصالات نصب`, slug: 'preview-fitting-set', category: 'preview-cat-8', price: price('regular', '1450000', '1450000') }),
];

export const previewVisuals: HomepageVisual[] = [];

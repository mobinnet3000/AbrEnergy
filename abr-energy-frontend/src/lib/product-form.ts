import type {
  PriceState,
  ProductAttributeDefinition,
  ProductDetail,
  ProductPriceInput,
  ProductStatus,
  ProductVisibility,
  ProductWritePayload,
} from '@/types';

// ── Form state ──────────────────────────────────────────────────────────────
// Persian-only editing surface. Translation tabs for additional locales can be
// added later by extending `translations` — the payload builder already emits
// the generic `translations: Record<lang, fields>` shape the API expects.

export interface ProductImageFormItem {
  key: string;
  media_file: string;
  url: string;
  sort_order: number;
  is_cover: boolean;
  alt_text: string;
  caption: string;
}

export interface ProductDocumentFormItem {
  key: string;
  media_file: string;
  url: string;
  title: string;
  doc_type: string;
  sort_order: number;
  is_active: boolean;
  description: string;
  file_name: string;
}

export interface ProductSpecFormItem {
  key: string;
  section: string;
  label: string;
  value: string;
  unit: string;
  sort_order: number;
}

export interface ProductAttributeFormItem {
  definition: string;
  value_text: string;
  value_number: string;
  value_boolean: boolean | null;
}

export interface ProductRelationFormItem {
  key: string;
  to_product: string;
  title: string;
  relation_type: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductFormState {
  title: string;
  slug: string;
  sku: string;
  category: string;
  short_description: string;
  description: string;
  features: string;
  meta_title: string;
  meta_description: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image_id: string;
  og_image_url: string;
  price: ProductPriceInput;
  images: ProductImageFormItem[];
  documents: ProductDocumentFormItem[];
  specs: ProductSpecFormItem[];
  attributes: ProductAttributeFormItem[];
  relations: ProductRelationFormItem[];
}

export const ROBOT_OPTIONS = ['index_follow', 'noindex_follow', 'index_nofollow', 'noindex_nofollow'];

export const STATUS_OPTIONS: ProductStatus[] = ['draft', 'published', 'archived'];
export const VISIBILITY_OPTIONS: ProductVisibility[] = ['public', 'hidden'];

export const DOC_TYPE_OPTIONS = ['catalog', 'datasheet', 'installation', 'spec', 'other'];
export const RELATION_TYPE_OPTIONS = ['related', 'similar', 'accessory', 'recommended'];

let keyCounter = 0;
export function formKey(prefix = 'k'): string {
  keyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${keyCounter}`;
}

/** Convert an ISO datetime from the API to a `datetime-local` input value. */
export function toLocalInput(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyPrice(): ProductPriceInput {
  return {
    display_mode: 'contact',
    regular_price: null,
    sale_price: null,
    currency: 'IRR',
    discount_type: 'none',
    discount_value: '0',
    starts_at: null,
    ends_at: null,
    is_active: true,
  };
}

export function emptyProductForm(): ProductFormState {
  return {
    title: '',
    slug: '',
    sku: '',
    category: '',
    short_description: '',
    description: '',
    features: '',
    meta_title: '',
    meta_description: '',
    status: 'draft',
    visibility: 'public',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    seo_title: '',
    seo_description: '',
    canonical_url: '',
    robots: 'index_follow',
    og_title: '',
    og_description: '',
    og_image_id: '',
    og_image_url: '',
    price: emptyPrice(),
    images: [],
    documents: [],
    specs: [],
    attributes: [],
    relations: [],
  };
}

/** Map an admin product detail response onto the editor form state. */
export function productToForm(d: ProductDetail): ProductFormState {
  const images = [...(d.images ?? [])]
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((im, i) => ({
      key: formKey('img'),
      media_file: String(im.media_file ?? ''),
      url: im.url ?? '',
      sort_order: im.sort_order ?? i,
      is_cover: !!im.is_cover,
      alt_text: im.alt_text ?? '',
      caption: im.caption ?? '',
    }));
  return {
    title: d.title ?? '',
    slug: d.slug ?? '',
    sku: d.sku ?? '',
    category: d.category ?? '',
    short_description: d.short_description ?? '',
    description: d.description ?? '',
    features: d.features ?? '',
    meta_title: d.meta_title ?? '',
    meta_description: d.meta_description ?? '',
    status: d.status ?? 'draft',
    visibility: d.visibility ?? 'public',
    is_active: d.is_active ?? true,
    is_featured: !!d.is_featured,
    sort_order: d.sort_order ?? 0,
    seo_title: d.seo_title ?? '',
    seo_description: d.seo_description ?? '',
    canonical_url: d.canonical_url ?? '',
    robots: d.robots ?? 'index_follow',
    og_title: d.og_title ?? '',
    og_description: d.og_description ?? '',
    og_image_id: d.og_image ? String(d.og_image) : '',
    og_image_url: d.og_image_url ?? '',
    price: {
      display_mode: d.price_display_mode ?? 'contact',
      regular_price: d.price_regular ?? null,
      sale_price: d.price_sale ?? null,
      currency: 'IRR',
      discount_type: d.price_discount_type ?? 'none',
      discount_value: d.price_discount_value != null ? String(d.price_discount_value) : '0',
      starts_at: toLocalInput(d.price_starts_at),
      ends_at: toLocalInput(d.price_ends_at),
      is_active: d.price_is_active ?? true,
    },
    images,
    documents: [...(d.documents ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((doc) => ({
        key: formKey('doc'),
        media_file: String(doc.media_file ?? ''),
        url: doc.url ?? '',
        title: doc.title ?? '',
        doc_type: doc.doc_type ?? 'other',
        sort_order: doc.sort_order ?? 0,
        is_active: doc.is_active ?? true,
        description: doc.description ?? '',
        file_name: '',
      })),
    specs: [...(d.specifications ?? [])]
      .sort((a, b) => (a.section || '').localeCompare(b.section || '') || a.sort_order - b.sort_order)
      .map((s) => ({
        key: formKey('spec'),
        section: s.section ?? '',
        label: s.label ?? '',
        value: s.value ?? '',
        unit: s.unit ?? '',
        sort_order: s.sort_order ?? 0,
      })),
    attributes: [...(d.attribute_values ?? [])].map((v) => ({
      definition: '',
      value_text: v.value_text ?? '',
      value_number: v.value_number == null ? '' : String(v.value_number),
      value_boolean: v.value_boolean ?? null,
    })),
    relations: [...(d.relations_admin ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({
        key: formKey('rel'),
        to_product: r.to_product,
        title: r.title ?? '',
        relation_type: r.relation_type ?? 'related',
        sort_order: r.sort_order ?? 0,
        is_active: r.is_active ?? true,
      })),
  };
}

/** Attach definition ids to attribute rows loaded from a detail response
 *  (the read serializer exposes values keyed by code, not definition id). */
export function attachAttributeDefinitions(
  rows: ProductAttributeFormItem[],
  values: ProductDetail['attribute_values'],
  definitions: ProductAttributeDefinition[],
): ProductAttributeFormItem[] {
  const byCode = new Map(definitions.map((d) => [d.code, d.id]));
  return rows.map((row, i) => ({ ...row, definition: byCode.get(values[i]?.code ?? '') ?? row.definition }));
}

/** Build the admin write payload from editor state (fa-only translations). */
export function buildProductPayload(form: ProductFormState): ProductWritePayload {
  const images_data = form.images
    .filter((im) => im.media_file)
    .map((im, i) => ({
      media_file: im.media_file,
      sort_order: im.sort_order ?? i,
      is_cover: !!im.is_cover,
      alt_text: im.alt_text ?? '',
      caption: im.caption ?? '',
    }));
  // Guarantee exactly one cover when images exist (backend keeps a single cover).
  if (images_data.length > 0 && !images_data.some((im) => im.is_cover)) {
    images_data[0].is_cover = true;
  }
  return {
    translations: {
      fa: {
        title: form.title.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
        short_description: form.short_description,
        description: form.description,
        features: form.features,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
      },
    },
    category: form.category || null,
    sku: form.sku.trim(),
    status: form.status,
    visibility: form.visibility,
    is_featured: form.is_featured,
    is_active: form.is_active,
    sort_order: Number(form.sort_order) || 0,
    seo_title: form.seo_title,
    seo_description: form.seo_description,
    canonical_url: form.canonical_url,
    robots: form.robots,
    og_title: form.og_title,
    og_description: form.og_description,
    og_image: form.og_image_id || null,
    price_data: {
      ...form.price,
      regular_price: form.price.regular_price || null,
      sale_price: form.price.sale_price || null,
    },
    images_data,
    documents_data: form.documents
      .filter((d) => d.media_file)
      .map((d, i) => ({
        media_file: d.media_file,
        title: d.title.trim() || d.file_name || 'سند',
        doc_type: d.doc_type || 'other',
        sort_order: d.sort_order ?? i,
        is_active: d.is_active,
        description: d.description ?? '',
      })),
    specs_data: form.specs
      .filter((s) => s.label.trim() && s.value.trim())
      .map((s, i) => ({
        section: s.section ?? '',
        label: s.label.trim(),
        value: s.value.trim(),
        unit: s.unit ?? '',
        sort_order: s.sort_order ?? i,
      })),
    attributes_data: form.attributes
      .filter((a) => a.definition)
      .map((a) => {
        const row: { definition: string; value_text?: string; value_number?: string | null; value_boolean?: boolean | null } = {
          definition: a.definition,
        };
        if (a.value_text !== '') row.value_text = a.value_text;
        if (a.value_number !== '') row.value_number = a.value_number;
        if (a.value_boolean !== null) row.value_boolean = a.value_boolean;
        return row;
      }),
    relations_data: form.relations
      .filter((r) => r.to_product)
      .map((r, i) => ({
        to_product: r.to_product,
        relation_type: r.relation_type || 'related',
        sort_order: r.sort_order ?? i,
        is_active: r.is_active,
      })),
  };
}

// ── Price presentation (backend `get_effective()` is authoritative) ─────────

export const PRICE_STATE_LABEL_KEY: Record<PriceState, string> = {
  contact_for_price: 'admin.price_state_contact',
  regular: 'admin.price_state_regular',
  discounted: 'admin.price_state_discounted',
  scheduled: 'admin.price_state_scheduled',
  expired: 'admin.price_state_expired',
  hidden: 'admin.price_state_hidden',
};

export function priceStateLabelKey(state?: string): string {
  return PRICE_STATE_LABEL_KEY[(state as PriceState) ?? 'contact_for_price'] ?? PRICE_STATE_LABEL_KEY.contact_for_price;
}

export function formatPrice(value?: string | number | null): string {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  try {
    return num.toLocaleString('fa-IR');
  } catch {
    return String(value);
  }
}

// ── Error mapping ───────────────────────────────────────────────────────────
// DRF may return `{field: [messages]}` at top level or nested under
// `price_data` / `images_data` / ... keys (see backend `_save_row`).
// Flatten to a section-keyed map the editor can render near each card.

export type ProductErrorMap = Partial<Record<string, string[]>>;

const SECTION_FOR_FIELD: Record<string, string> = {
  translations: 'identity',
  title: 'identity',
  slug: 'identity',
  sku: 'identity',
  category: 'identity',
  price_data: 'price',
  regular_price: 'price',
  sale_price: 'price',
  images_data: 'media',
  documents_data: 'documents',
  specs_data: 'specs',
  attributes_data: 'attributes',
  relations_data: 'relations',
  detail: 'detail',
};

function pushError(map: ProductErrorMap, section: string, messages: unknown): void {
  const list = Array.isArray(messages) ? messages.map(String) : [String(messages ?? '')];
  map[section] = [...(map[section] ?? []), ...list.filter(Boolean)];
}

export function mapProductErrors(payload: unknown): ProductErrorMap {
  const map: ProductErrorMap = {};
  if (payload == null) return map;
  if (typeof payload === 'string') {
    pushError(map, 'detail', [payload]);
    return map;
  }
  if (Array.isArray(payload)) {
    pushError(map, 'detail', payload);
    return map;
  }
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    // DRF error envelope from custom_exception_handler: {status, errors}
    const errors = record.errors ?? record;
    if (typeof errors === 'string' || Array.isArray(errors)) {
      pushError(map, 'detail', errors);
      return map;
    }
    if (typeof errors === 'object' && errors !== null) {
      for (const [field, messages] of Object.entries(errors as Record<string, unknown>)) {
        if (field === 'non_field_errors' || field === 'detail') {
          pushError(map, 'detail', messages);
          continue;
        }
        const section = SECTION_FOR_FIELD[field] ?? 'identity';
        if (messages != null && typeof messages === 'object' && !Array.isArray(messages)) {
          for (const [sub, subMessages] of Object.entries(messages as Record<string, unknown>)) {
            pushError(map, section, typeof subMessages === 'string' ? `${sub}: ${subMessages}` : subMessages);
          }
        } else {
          pushError(map, section, messages);
        }
      }
      return map;
    }
  }
  pushError(map, 'detail', ['خطا']);
  return map;
}

/** Group specification rows by section for display, preserving first-seen order. */
export function groupSpecsBySection(specs: ProductSpecFormItem[]): { section: string; rows: ProductSpecFormItem[] }[] {
  const groups = new Map<string, ProductSpecFormItem[]>();
  for (const s of specs) {
    const key = (s.section || '').trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return [...groups.entries()].map(([section, rows]) => ({ section, rows }));
}

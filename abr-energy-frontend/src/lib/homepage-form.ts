import type {
  HomepageAdminPayload,
  HomepageSection,
  HomepageWritePayload,
} from '@/types';

// ── Homepage Studio form state (Phase 7) ────────────────────────────────
// Same `initial + edits` pattern as the Product/Category studios: the page
// hydrates once via `homepageToForm`, edits accumulate locally, and
// `buildHomepagePayload` emits the admin write shape on save.

let keyCounter = 0;

export function homepageFormKey(prefix = 'hp'): string {
  keyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${keyCounter}`;
}

export interface HomepageRelationItem {
  key: string;
  id: string;
  title: string;
  order: number;
  enabled: boolean;
}

export interface HomepageVisualItem {
  key: string;
  image: string;
  image_url: string;
  alt: string;
  order: number;
  enabled: boolean;
  link_url: string;
}

export interface HomepageFormState {
  hero_eyebrow: string;
  hero_primary_cta_label: string;
  hero_primary_cta_url: string;
  hero_primary_cta_enabled: boolean;
  hero_secondary_cta_label: string;
  hero_secondary_cta_url: string;
  hero_secondary_cta_enabled: boolean;
  sections: HomepageSection[];
  featured_products: HomepageRelationItem[];
  categories: HomepageRelationItem[];
  services: HomepageRelationItem[];
  projects: HomepageRelationItem[];
  articles: HomepageRelationItem[];
  calculator_cta_label: string;
  calculator_cta_url: string;
  contact_cta_label: string;
  contact_cta_url: string;
  contact_secondary_cta_label: string;
  contact_secondary_cta_url: string;
  articles_count: number;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image_id: string;
  og_image_url: string;
  visuals: HomepageVisualItem[];
}

function mapRelations(rows: unknown[], fk: string): HomepageRelationItem[] {
  return (rows as Array<Record<string, unknown>>).map((r, i) => ({
    key: homepageFormKey('rel'),
    id: String(r[fk] ?? ''),
    title: String(r.title ?? ''),
    order: typeof r.order === 'number' ? r.order : i,
    enabled: r.enabled !== false,
  }));
}

export function homepageToForm(d: HomepageAdminPayload): HomepageFormState {
  return {
    hero_eyebrow: d.hero_eyebrow || '',
    hero_primary_cta_label: d.hero_primary_cta_label || '',
    hero_primary_cta_url: d.hero_primary_cta_url || '',
    hero_primary_cta_enabled: d.hero_primary_cta_enabled !== false,
    hero_secondary_cta_label: d.hero_secondary_cta_label || '',
    hero_secondary_cta_url: d.hero_secondary_cta_url || '',
    hero_secondary_cta_enabled: d.hero_secondary_cta_enabled !== false,
    sections: [...(d.sections || [])].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key)),
    featured_products: mapRelations(d.featured_products || [], 'product'),
    categories: mapRelations(d.categories || [], 'category'),
    services: mapRelations(d.services || [], 'service'),
    projects: mapRelations(d.projects || [], 'project'),
    articles: mapRelations(d.articles || [], 'article'),
    calculator_cta_label: d.calculator_cta_label || '',
    calculator_cta_url: d.calculator_cta_url || '',
    contact_cta_label: d.contact_cta_label || '',
    contact_cta_url: d.contact_cta_url || '',
    contact_secondary_cta_label: d.contact_secondary_cta_label || '',
    contact_secondary_cta_url: d.contact_secondary_cta_url || '',
    articles_count: d.articles_count ?? 3,
    seo_title: d.seo_title || '',
    seo_description: d.seo_description || '',
    canonical_url: d.canonical_url || '',
    robots: d.robots || 'index_follow',
    og_title: d.og_title || '',
    og_description: d.og_description || '',
    og_image_id: d.og_image || '',
    og_image_url: d.og_image_url || '',
    visuals: (d.visuals || []).map((v, i) => ({
      key: homepageFormKey('vis'),
      image: v.image || '',
      image_url: v.image_url || '',
      alt: v.alt || '',
      order: typeof v.order === 'number' ? v.order : i,
      enabled: v.enabled !== false,
      link_url: v.link_url || '',
    })),
  };
}

export function buildHomepagePayload(form: HomepageFormState): HomepageWritePayload {
  const pickBy = <K extends string>(items: HomepageRelationItem[], fk: K) =>
    items
      .filter((r) => r.id.trim() !== '')
      .map((r, i) => ({ [fk]: r.id, order: i, enabled: r.enabled }) as { [P in K]: string } & {
        order: number;
        enabled: boolean;
      });
  return {
    hero_eyebrow: form.hero_eyebrow,
    hero_primary_cta_label: form.hero_primary_cta_label,
    hero_primary_cta_url: form.hero_primary_cta_url,
    hero_primary_cta_enabled: form.hero_primary_cta_enabled,
    hero_secondary_cta_label: form.hero_secondary_cta_label,
    hero_secondary_cta_url: form.hero_secondary_cta_url,
    hero_secondary_cta_enabled: form.hero_secondary_cta_enabled,
    calculator_cta_label: form.calculator_cta_label,
    calculator_cta_url: form.calculator_cta_url,
    contact_cta_label: form.contact_cta_label,
    contact_cta_url: form.contact_cta_url,
    contact_secondary_cta_label: form.contact_secondary_cta_label,
    contact_secondary_cta_url: form.contact_secondary_cta_url,
    articles_count: Number(form.articles_count) || 0,
    seo_title: form.seo_title,
    seo_description: form.seo_description,
    canonical_url: form.canonical_url,
    robots: form.robots,
    og_title: form.og_title,
    og_description: form.og_description,
    og_image: form.og_image_id || null,
    sections_data: form.sections.map((s) => ({
      key: s.key,
      enabled: s.enabled,
      order: s.order,
      title: s.title,
      subtitle: s.subtitle,
      content: s.content,
    })),
    featured_products_data: pickBy(form.featured_products, 'product'),
    categories_data: pickBy(form.categories, 'category'),
    services_data: pickBy(form.services, 'service'),
    projects_data: pickBy(form.projects, 'project'),
    articles_data: pickBy(form.articles, 'article'),
    visuals_data: form.visuals
      .filter((v) => v.image.trim() !== '')
      .map((v, i) => ({
        image: v.image,
        alt: v.alt,
        order: i,
        enabled: v.enabled,
        link_url: v.link_url,
      })),
  };
}

export function reorderItems<T extends { key: string; order: number }>(items: T[], key: string, dir: -1 | 1): T[] {
  const idx = items.findIndex((r) => r.key === key);
  const next = idx + dir;
  if (idx < 0 || next < 0 || next >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(idx, 1);
  copy.splice(next, 0, item);
  return copy.map((r, i) => ({ ...r, order: i }));
}

/** DRF error shape → flat list of messages (best-effort, toast fallback). */
export function mapHomepageErrors(err: unknown): string[] {
  const out: string[] = [];
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return out;
  for (const [field, messages] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(messages)) {
      for (const m of messages) out.push(`${field}: ${String(m)}`);
    } else if (typeof messages === 'string') {
      out.push(`${field}: ${messages}`);
    }
  }
  return out.slice(0, 8);
}

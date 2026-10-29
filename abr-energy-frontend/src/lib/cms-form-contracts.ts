export const CONTENT_LOCALES = ['fa', 'ar', 'en'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export type TranslationValues = Record<string, string>;
export type TranslationMap = Record<ContentLocale, TranslationValues>;

export const ARTICLE_TRANSLATION_FIELDS = [
  'title',
  'slug',
  'short_description',
  'content',
  'meta_title',
  'meta_description',
] as const;

export const SERVICE_TRANSLATION_FIELDS = [
  'title',
  'slug',
  'short_description',
  'description',
  'meta_title',
  'meta_description',
] as const;

export const PROJECT_TRANSLATION_FIELDS = [
  'title',
  'slug',
  'description',
  'meta_title',
  'meta_description',
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

export function createTranslationMap(fields: readonly string[]): TranslationMap {
  const map = {} as TranslationMap;
  for (const locale of CONTENT_LOCALES) {
    const values: TranslationValues = {};
    for (const field of fields) values[field] = '';
    map[locale] = values;
  }
  return map;
}

export function contentTranslationsFromDetail(
  detail: unknown,
  fields: readonly string[],
): TranslationMap {
  const source = asRecord(detail);
  const stored = asRecord(source.translations);
  const result = createTranslationMap(fields);
  let hasStoredValues = false;

  for (const locale of CONTENT_LOCALES) {
    const values = asRecord(stored[locale]);
    for (const field of fields) {
      const value = asString(values[field]);
      if (value !== '') hasStoredValues = true;
      result[locale][field] = value;
    }
  }

  // Backwards-compatible fallback for a detail response that predates the
  // read-only `translations` map: the language-specific top-level fields are
  // still the active locale's values.
  if (!hasStoredValues) {
    for (const field of fields) {
      result.fa[field] = asString(source[field]);
    }
  }

  return result;
}

export function translationLocalesFromDetail(detail: unknown): ContentLocale[] {
  const stored = asRecord(asRecord(detail).translations);
  const locales = CONTENT_LOCALES.filter((locale) => {
    const values = asRecord(stored[locale]);
    return Object.keys(values).length > 0;
  });
  return locales.length > 0 ? locales : ['fa'];
}

export function buildTranslationPayload(
  translations: TranslationMap,
  fields: readonly string[],
  existingLocales: readonly string[] = [],
): Record<string, Record<string, string>> {
  const payload: Record<string, Record<string, string>> = {};

  for (const locale of CONTENT_LOCALES) {
    const source = asRecord(translations[locale]);
    const values: Record<string, string> = {};
    let hasValue = false;

    for (const field of fields) {
      const value = asString(source[field]);
      if (value !== '') hasValue = true;
      values[field] = value;
    }

    // Only send locales the editor actually filled in, plus locales that
    // already existed (so clearing an existing locale still persists).
    if (hasValue || existingLocales.includes(locale)) {
      payload[locale] = values;
    }
  }

  return payload;
}

export function normalizeCommaList(value: string | null | undefined): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)));
}

export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

export function numberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function integerOrZero(value: string | number | null | undefined): number {
  const parsed = numberOrNull(value);
  return parsed === null ? 0 : Math.trunc(parsed);
}

export function relationId(value: unknown): string {
  if (typeof value === 'string') return value;
  return asString(asRecord(value).id);
}

export const PROJECT_STATUSES = [
  'planning',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled',
] as const;

export function normalizeProjectStatus(value: unknown): string {
  const status = asString(value);
  if (status === 'planned') return 'planning';
  return (PROJECT_STATUSES as readonly string[]).includes(status) ? status : 'planning';
}

export interface ArticleFormValues {
  status: string;
  category: string;
  tags: string;
  publish_date: string;
  cover_image: string;
  is_featured: boolean;
  translations: TranslationMap;
}

export function buildArticlePayload(
  form: ArticleFormValues,
  existingLocales: readonly string[] = [],
) {
  return {
    translations: buildTranslationPayload(
      form.translations,
      ARTICLE_TRANSLATION_FIELDS,
      existingLocales,
    ),
    tags: normalizeCommaList(form.tags),
    category: blankToNull(form.category),
    cover_image: blankToNull(form.cover_image),
    status: form.status,
    publish_date: blankToNull(form.publish_date),
    is_featured: form.is_featured,
  };
}

export interface ServiceFormValues {
  icon: string;
  category: string;
  order: number | string;
  status: string;
  is_featured: boolean;
  features: string;
  translations: TranslationMap;
}

export function buildServicePayload(
  form: ServiceFormValues,
  existingLocales: readonly string[] = [],
) {
  return {
    translations: buildTranslationPayload(
      form.translations,
      SERVICE_TRANSLATION_FIELDS,
      existingLocales,
    ),
    icon: form.icon,
    category: blankToNull(form.category),
    features: normalizeCommaList(form.features),
    order: integerOrZero(form.order),
    is_featured: form.is_featured,
    status: form.status,
  };
}

export interface ProjectFormValues {
  project_type: string;
  capacity: number | string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  service_category: string;
  is_featured: boolean;
  completion_percentage: number | string;
  translations: TranslationMap;
}

export function buildProjectPayload(
  form: ProjectFormValues,
  existingLocales: readonly string[] = [],
) {
  return {
    translations: buildTranslationPayload(
      form.translations,
      PROJECT_TRANSLATION_FIELDS,
      existingLocales,
    ),
    project_type: form.project_type,
    capacity: numberOrNull(form.capacity),
    location: form.location,
    status: normalizeProjectStatus(form.status),
    start_date: blankToNull(form.start_date),
    end_date: blankToNull(form.end_date),
    service_category: blankToNull(form.service_category),
    is_featured: form.is_featured,
    completion_percentage: integerOrZero(form.completion_percentage),
  };
}

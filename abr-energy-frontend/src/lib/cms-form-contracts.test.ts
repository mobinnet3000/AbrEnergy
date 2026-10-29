import { describe, expect, it } from 'vitest';
import {
  ARTICLE_TRANSLATION_FIELDS,
  PROJECT_TRANSLATION_FIELDS,
  SERVICE_TRANSLATION_FIELDS,
  buildArticlePayload,
  buildProjectPayload,
  buildServicePayload,
  buildTranslationPayload,
  contentTranslationsFromDetail,
  createTranslationMap,
  normalizeProjectStatus,
  relationId,
  translationLocalesFromDetail,
} from './cms-form-contracts';

describe('CMS write contracts', () => {
  it('builds the article translations map and tag list expected by the API', () => {
    const translations = createTranslationMap(ARTICLE_TRANSLATION_FIELDS);
    translations.fa.title = 'عنوان';
    translations.fa.slug = 'article';
    translations.fa.short_description = 'خلاصه';
    translations.fa.content = '<p>متن</p>';

    const payload = buildArticlePayload({
      translations,
      status: 'draft',
      category: '',
      tags: ' solar, energy, solar ,, ',
      publish_date: '',
      cover_image: '',
      is_featured: false,
    });

    expect(payload.translations).toEqual({
      fa: {
        title: 'عنوان',
        slug: 'article',
        short_description: 'خلاصه',
        content: '<p>متن</p>',
        meta_title: '',
        meta_description: '',
      },
    });
    expect(payload.tags).toEqual(['solar', 'energy']);
    expect(payload.category).toBeNull();
    expect(payload.cover_image).toBeNull();
    expect(payload.publish_date).toBeNull();
    expect(payload).not.toHaveProperty('cover_image_url');
  });

  it('builds service features as a list and a nullable category', () => {
    const translations = createTranslationMap(SERVICE_TRANSLATION_FIELDS);
    translations.fa.title = 'خدمت';
    translations.fa.slug = 'service';

    const payload = buildServicePayload({
      translations,
      icon: 'solar',
      category: '',
      order: 4,
      status: 'active',
      is_featured: false,
      features: 'warranty, support, warranty',
    });

    expect(payload.features).toEqual(['warranty', 'support']);
    expect(payload.category).toBeNull();
    expect(payload.order).toBe(4);
    expect(typeof payload.features).toBe('object');
  });

  it('uses the backend project status vocabulary and nulls blank dates/capacity', () => {
    const translations = createTranslationMap(PROJECT_TRANSLATION_FIELDS);
    translations.fa.title = 'پروژه';
    translations.fa.slug = 'project';

    const payload = buildProjectPayload({
      translations,
      project_type: 'hybrid',
      capacity: '',
      location: 'تهران',
      status: 'planned',
      start_date: '',
      end_date: '',
      service_category: '',
      is_featured: true,
      completion_percentage: '40',
    });

    expect(payload.status).toBe('planning');
    expect(payload.capacity).toBeNull();
    expect(payload.start_date).toBeNull();
    expect(payload.end_date).toBeNull();
    expect(payload.service_category).toBeNull();
    expect(payload.completion_percentage).toBe(40);
    expect(normalizeProjectStatus('cancelled')).toBe('cancelled');
    expect(normalizeProjectStatus('unknown')).toBe('planning');
  });

  it('preserves existing locales when an editor clears their values', () => {
    const translations = createTranslationMap(ARTICLE_TRANSLATION_FIELDS);
    translations.fa.title = '';
    translations.en.title = 'English title';

    const payload = buildTranslationPayload(translations, ARTICLE_TRANSLATION_FIELDS, ['fa']);

    expect(Object.keys(payload).sort()).toEqual(['en', 'fa']);
    expect(payload.fa.title).toBe('');
    expect(payload.en.title).toBe('English title');
  });

  it('reads all stored translations and falls back to current-language fields', () => {
    const withTranslations = contentTranslationsFromDetail({
      title: 'legacy',
      translations: {
        fa: { title: 'فارسی', slug: 'fa', short_description: 's', content: 'c' },
        en: { title: 'English', slug: 'en' },
      },
    }, ARTICLE_TRANSLATION_FIELDS);

    expect(withTranslations.fa.title).toBe('فارسی');
    expect(withTranslations.en.title).toBe('English');
    expect(withTranslations.ar.title).toBe('');
    expect(translationLocalesFromDetail({
      translations: { fa: { title: 'x' }, en: { title: 'y' } },
    })).toEqual(['fa', 'en']);
    expect(translationLocalesFromDetail({ translations: {} })).toEqual(['fa']);

    const fallback = contentTranslationsFromDetail({
      title: 'legacy title',
      slug: 'legacy-slug',
      short_description: 'legacy short',
      content: 'legacy content',
    }, ARTICLE_TRANSLATION_FIELDS);
    expect(fallback.fa).toEqual(expect.objectContaining({
      title: 'legacy title',
      slug: 'legacy-slug',
      short_description: 'legacy short',
      content: 'legacy content',
    }));
  });

  it('extracts ids from nested relation objects', () => {
    expect(relationId({ id: 'category-1', title: 'x' })).toBe('category-1');
    expect(relationId('category-2')).toBe('category-2');
    expect(relationId(null)).toBe('');
  });
});

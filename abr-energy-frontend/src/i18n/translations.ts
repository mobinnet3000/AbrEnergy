import fa from '../../locales/fa.json';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import type { Locale } from './config';

type TranslationValue = string | Record<string, unknown>;

const translations: Record<Locale, Record<string, unknown>> = { fa, ar, en };

function getNestedValue(obj: Record<string, unknown>, path: string[]): TranslationValue {
  let current: unknown = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path[path.length - 1]; // fallback: return the last key
    }
  }
  return current as TranslationValue;
}

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  const value = getNestedValue(translations[locale], keys);
  if (typeof value === 'string') return value;
  // Fallback to English
  const enValue = getNestedValue(translations['en'], keys);
  if (typeof enValue === 'string') return enValue;
  return key;
}

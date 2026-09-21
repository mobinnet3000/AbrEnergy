export const locales = ['fa', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fa';

// Phase 2: Persian-only public/admin language. Full `locales` + translation
// architecture preserved for future ar/en; switcher gating deferred to the
// dedicated Persian-only UX phase to avoid a broad locale refactor here.
export const activeLocales = ['fa'] as const;
export type ActiveLocale = (typeof activeLocales)[number];

export const localeNames: Record<Locale, string> = {
  fa: 'فارسی',
  ar: 'العربية',
  en: 'English',
};

export const localeDirections: Record<Locale, 'rtl' | 'ltr'> = {
  fa: 'rtl',
  ar: 'rtl',
  en: 'ltr',
};

export function isRTL(locale: Locale): boolean {
  return localeDirections[locale] === 'rtl';
}

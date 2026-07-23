export const locales = ['fa', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fa';

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

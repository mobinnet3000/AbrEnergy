'use client';
import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from './config';
import { locales, localeDirections } from './config';
import { t as translate } from './translations';
import { LocaleContext } from './locale-context';

export function LocaleProvider({ children, locale: currentLocale }: { children: React.ReactNode; locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  // Sync HTML lang/dir with locale
  useEffect(() => {
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = localeDirections[currentLocale];
    localStorage.setItem('locale', currentLocale);
  }, [currentLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    router.push('/' + segments.join('/'));
  }, [pathname, router]);

  const value = useMemo(() => ({
    locale: currentLocale,
    setLocale,
    t: (key: string) => translate(currentLocale, key),
    dir: localeDirections[currentLocale],
    isRTL: localeDirections[currentLocale] === 'rtl',
  }), [currentLocale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

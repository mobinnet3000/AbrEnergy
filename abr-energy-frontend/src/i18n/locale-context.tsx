'use client';
import { createContext, useContext } from 'react';
import type { Locale } from './config';
import { defaultLocale } from './config';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string) => key,
  dir: 'rtl',
  isRTL: true,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export { LocaleContext };

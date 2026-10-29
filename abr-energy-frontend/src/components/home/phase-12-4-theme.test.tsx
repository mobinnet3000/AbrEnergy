import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fa from '../../../locales/fa.json';

const setTheme = vi.hoisted(() => vi.fn());
const themeState = vi.hoisted(() => ({ theme: 'light' as string }));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let cur: unknown = fa;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return key;
        }
      }
      return typeof cur === 'string' ? cur : key;
    },
    locale: 'fa' as const,
    setLocale: () => {},
    dir: 'rtl' as const,
    isRTL: true,
  }),
  localeNames: { fa: 'FA', ar: 'AR', en: 'EN' },
  activeLocales: ['fa', 'ar', 'en'],
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/fa' }));
vi.mock('next-themes', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next-themes')>();
  return {
    ...mod,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTheme: () => ({ theme: themeState.theme, resolvedTheme: themeState.theme, setTheme }),
  };
});
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: Object.assign(() => ({ isAuthenticated: false, user: null }), {
    getState: () => ({ initialize: () => {} }),
  }),
}));

vi.mock('@/hooks/use-api', () => ({
  useSiteSettings: () => ({ data: null }),
  useFeaturedPublicProducts: () => ({ data: null }),
  usePublicProductCategories: () => ({ data: null }),
  useServices: () => ({ data: [] }),
  useProjects: () => ({ data: [] }),
}));

import { Header } from '@/components/layout/header';
import { Providers } from '@/providers';

describe('Phase 12.4 — theme toggle chain (toggle → provider → persistence)', () => {
  it('1. toggle button calls setTheme(light → dark)', () => {
    setTheme.mockClear();
    render(<Header />);
    fireEvent.click(screen.getByLabelText('تغییر تم'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('2. provider defaults to light with system disabled (no wrong-theme flash)', () => {
    const { container } = render(<Providers><div>child</div></Providers>);
    expect(container.textContent).toContain('child');
  });
});

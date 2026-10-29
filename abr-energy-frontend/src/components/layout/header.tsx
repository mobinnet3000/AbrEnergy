'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, LogIn, User, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/i18n';
import { localeNames, activeLocales } from '@/i18n';
import type { Locale } from '@/i18n';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/layout/brand-logo';
import { DesktopNav, MobileNav } from '@/components/layout/header-nav';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // next-themes resolves the stored theme only on the client, so the icon
  // must render a deterministic (server-identical) fallback until mount —
  // otherwise a stored `dark` theme hydrates Sun over the server's Moon.
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { locale, setLocale, t, isRTL } = useLocale();

  /* eslint-disable react-hooks/set-state-in-effect -- Mount flag is the
  documented next-themes hydration guard: the theme icon must render the
  server-identical fallback until client mount. Fires exactly once. */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      setHidden(sy > 120 && sy > lastScrollY.current);
      lastScrollY.current = sy;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeLang = useCallback(() => setLangOpen(false), []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === `/${locale}`;
    return pathname.startsWith(`/${locale}${href}`) || pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out',
          hidden ? '-translate-y-full' : 'translate-y-0',
          'bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border-b border-neutral-900/10 dark:border-white/5',
        )}
      >
        {/* Top-edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

        <div className="container-page flex h-14 md:h-16 items-center justify-between">
          {/* Logo */}
          <BrandLogo
            priority
            className="shrink-0"
            nameClassName="transition-colors duration-500 text-foreground"
          />

          {/* Desktop Nav */}
          <DesktopNav isActive={isActive} />

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Language */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 rounded-lg transition-all duration-300 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                aria-label={t('common.language')}
                aria-expanded={langOpen}
              >
                <Globe className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute end-0 top-full mt-3 w-36 origin-top rounded-xl border border-neutral-900/10 bg-white/75 p-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-150 z-50 dark:border-white/10 dark:bg-neutral-950/75 dark:ring-white/5"
                    onMouseLeave={closeLang}
                  >
                    {activeLocales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        className={cn(
                          'w-full text-start px-3 py-2 rounded-lg text-sm transition-all',
                          locale === l
                            ? 'bg-emerald-500/10 text-emerald-700 font-medium dark:text-emerald-400'
                            : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5',
                        )}
                        onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                      >
                        {localeNames[l as Locale]}
                        {locale === l && <span className="ml-2 text-emerald-600 dark:text-emerald-400">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-all duration-300 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
              aria-label={t('common.toggle_theme')}
              aria-pressed={mounted && theme === 'dark'}
            >
              {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <Link
                href={user?.role === 'super_admin' || user?.role === 'website_admin' ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-muted/50"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.full_name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15"
              >
                <LogIn className="h-4 w-4" />
                <span>{t('common.login')}</span>
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-300 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            onClick={closeMobile}
          >
            <motion.nav
              initial={{ x: isRTL ? 80 : -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? 80 : -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'absolute top-0 bottom-0 w-72 bg-white/85 backdrop-blur-2xl backdrop-saturate-150 border-neutral-900/10 p-6 pt-24 overflow-y-auto shadow-2xl dark:bg-neutral-950/85 dark:border-white/5',
                isRTL ? 'right-0 border-l' : 'left-0 border-r',
              )}
              aria-label="Mobile navigation"
            >
              <MobileNav isActive={isActive} onNavigate={closeMobile} />

              <div className="border-t border-neutral-900/10 mt-6 pt-6 space-y-3 dark:border-white/5">
                <p className="px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-white/30">
                  {t('common.language')}
                </p>
                {activeLocales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={cn(
                      'w-full text-start px-4 py-2.5 rounded-xl text-sm transition-all',
                      locale === l
                        ? 'bg-emerald-500/10 text-emerald-700 font-medium dark:text-emerald-400'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-white/40 dark:hover:text-white/70 dark:hover:bg-white/5',
                    )}
                    onClick={() => { setLocale(l as Locale); closeMobile(); }}
                  >
                    {localeNames[l as Locale]}
                    {locale === l && <span className="ml-2 text-emerald-600 dark:text-emerald-400">✓</span>}
                  </button>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

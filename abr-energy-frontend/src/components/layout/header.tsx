'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, LogIn, User, Globe, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';
import { cn } from '@/lib/utils';
import { navigationConfig } from '@/config/navigation';
import { NavLinkDesktop, NavLinkMobile } from '@/components/shared/NavLink';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { locale, setLocale, t, isRTL } = useLocale();

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      setScrolled(sy > 40);
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
          scrolled
            ? 'bg-white/50 dark:bg-gray-950/50 backdrop-blur-2xl border-b border-white/10 dark:border-white/5'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        {/* Top-edge highlight */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent transition-opacity duration-700',
          scrolled ? 'opacity-100' : 'opacity-0',
        )} />

        <div className="container-page flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative group flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="font-heading font-bold text-xl tracking-tight">
              <span className={cn('transition-colors duration-500', scrolled ? 'text-foreground' : 'text-white')}>{t('common.site_name')}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navigationConfig.map((item) => (
              <NavLinkDesktop
                key={item.href}
                href={item.href}
                isActive={isActive(item.href)}
                scrolled={scrolled}
              >
                {t(item.labelKey)}
              </NavLinkDesktop>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Language */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-300',
                  scrolled
                    ? 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                )}
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
                    className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-white/10 bg-black/80 backdrop-blur-2xl p-1.5 shadow-2xl z-50"
                    onMouseLeave={closeLang}
                  >
                    {locales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        className={cn(
                          'w-full text-start px-3 py-2 rounded-lg text-sm transition-all',
                          locale === l
                            ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                            : 'text-white/50 hover:text-white hover:bg-white/5',
                        )}
                        onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                      >
                        {localeNames[l as Locale]}
                        {locale === l && <span className="ml-2 text-emerald-400">✓</span>}
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
              className={cn(
                'p-2 rounded-lg transition-all duration-300',
                scrolled
                  ? 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <Link
                href={user?.role === 'super_admin' || user?.role === 'website_admin' ? '/admin' : '/dashboard'}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                  scrolled
                    ? 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                )}
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
              className={cn(
                'md:hidden p-2 rounded-lg transition-all duration-300',
                scrolled
                  ? 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              )}
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
                'absolute top-0 bottom-0 w-72 bg-black/90 backdrop-blur-2xl border-r border-white/5 p-6 pt-24 overflow-y-auto',
                isRTL ? 'right-0 border-l' : 'left-0 border-r',
              )}
              aria-label="Mobile navigation"
            >
              <div className="space-y-1">
                {navigationConfig.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <NavLinkMobile
                      href={item.href}
                      isActive={isActive(item.href)}
                      onClick={closeMobile}
                    >
                      {t(item.labelKey)}
                    </NavLinkMobile>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-white/5 mt-6 pt-6 space-y-3">
                <p className="px-4 text-xs font-medium text-white/30 uppercase tracking-wider">
                  {t('common.language')}
                </p>
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={cn(
                      'w-full text-start px-4 py-2.5 rounded-xl text-sm transition-all',
                      locale === l
                        ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                    )}
                    onClick={() => { setLocale(l as Locale); closeMobile(); }}
                  >
                    {localeNames[l as Locale]}
                    {locale === l && <span className="ml-2 text-emerald-400">✓</span>}
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

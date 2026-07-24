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

  // Scroll tracking — hide on scroll down, show on scroll up
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

  // Body scroll lock for mobile menu
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === `/${locale}`;
    return pathname.startsWith(`/${locale}${href}`) || pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          hidden ? '-translate-y-full' : 'translate-y-0',
          scrolled
            ? 'bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-white/10 dark:border-white/5 shadow-lg shadow-black/5'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <div className="container-page flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative group flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl bg-emerald-500/20 blur-md"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="font-heading font-bold text-xl tracking-tight">
              <span className={scrolled ? 'text-foreground' : 'text-white'}>Abr</span>
              <span className={scrolled ? 'text-foreground' : 'text-white/70'}>Energy</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
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
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 text-sm',
                  scrolled
                    ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                )}
                aria-label={t('common.language')}
                aria-expanded={langOpen}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium uppercase">{locale}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-40 rounded-xl border bg-popover/80 backdrop-blur-xl p-1.5 shadow-xl z-50"
                  >
                    {locales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        className={cn(
                          'w-full text-start px-3 py-2.5 rounded-lg text-sm transition-all',
                          locale === l
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                        onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{l === 'fa' ? '🇮🇷' : l === 'ar' ? '🇸🇦' : '🇬🇧'}</span>
                          <span>{localeNames[l as Locale]}</span>
                          {locale === l && <span className="ml-auto text-xs">✓</span>}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'p-2 rounded-lg transition-all duration-300',
                scrolled
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
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
                  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                  scrolled
                    ? 'text-foreground hover:bg-muted'
                    : 'text-white/80 hover:text-white hover:bg-white/5',
                )}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.full_name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                <LogIn className="h-4 w-4" />
                <span>{t('common.login')}</span>
              </Link>
            )}

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'md:hidden p-2 rounded-lg transition-all duration-300',
                scrolled
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md md:hidden"
            onClick={closeMobile}
          >
            <motion.nav
              initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? 100 : -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'absolute top-0 bottom-0 w-72 bg-background/95 backdrop-blur-2xl border-r border-white/10 p-6 pt-24 overflow-y-auto',
                isRTL ? 'right-0 border-l' : 'left-0 border-r',
              )}
              aria-label="Mobile navigation"
            >
              <div className="space-y-1">
                {navigationConfig.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
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

              <div className="border-t border-border/50 mt-6 pt-6 space-y-3">
                <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('common.language')}
                </p>
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={cn(
                      'w-full text-start px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3',
                      locale === l
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                    onClick={() => { setLocale(l as Locale); closeMobile(); }}
                  >
                    <span className="text-base">{l === 'fa' ? '🇮🇷' : l === 'ar' ? '🇸🇦' : '🇬🇧'}</span>
                    <span>{localeNames[l as Locale]}</span>
                    {locale === l && <span className="ml-auto">✓</span>}
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

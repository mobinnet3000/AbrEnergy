'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Sun, Moon, LogIn, User, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';

export function Header() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { locale, setLocale, t } = useLocale();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/services', label: t('nav.services') },
    { href: '/projects', label: t('nav.projects') },
    { href: '/articles', label: t('nav.articles') },
    { href: '/calculator', label: t('nav.calculator') },
    { href: '/gallery', label: t('nav.gallery') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur dark:bg-gray-950/95">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <span className="text-primary">Abr</span>
          <span>Energy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 text-sm"
              aria-label={t('common.language')}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{localeNames[locale]}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-popover p-1 shadow-lg z-50">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      locale === l ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                    }`}
                    onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                  >
                    {localeNames[l as Locale]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {isAuthenticated ? (
            <Link
              href={user?.role === 'super_admin' || user?.role === 'website_admin' ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.full_name?.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('common.login')}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background animate-fade-in">
          <div className="container-page py-4 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t pt-2 mt-2">
              <p className="px-3 py-1 text-xs text-muted-foreground">{t('common.language')}</p>
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    locale === l ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => { setLocale(l as Locale); setOpen(false); }}
                >
                  {localeNames[l as Locale]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

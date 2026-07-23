'use client';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';

export function Footer() {
  const { locale, setLocale, t } = useLocale();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="font-heading font-bold text-xl">
              <span className="text-primary">Abr</span>Energy
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {t('common.site_slogan')}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">{t('nav.about')}</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.about')}</Link></li>
              <li><Link href="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.services')}</Link></li>
              <li><Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.projects')}</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">{t('nav.services')}</h4>
            <ul className="space-y-2">
              <li><Link href="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.services')}</Link></li>
              <li><Link href="/calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.calculator')}</Link></li>
              <li><Link href="/gallery" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.gallery')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">{t('common.language')}</h4>
            <ul className="space-y-2">
              {locales.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    className={`text-sm transition-colors ${
                      locale === l ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setLocale(l as Locale)}
                  >
                    {localeNames[l as Locale]}
                    {locale === l ? ' ✓' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AbrEnergy. {t('common.site_name')}</p>
          <div className="flex items-center gap-4">
            <a href="mailto:info@abrenv.com" className="hover:text-foreground transition-colors">info@abrenv.com</a>
            <span className="hidden sm:inline">|</span>
            <a href="tel:+982112345678" className="hover:text-foreground transition-colors">+98 21 1234 5678</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

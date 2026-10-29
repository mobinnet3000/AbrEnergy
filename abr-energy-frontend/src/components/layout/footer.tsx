'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { useLocale } from '@/i18n';
import { localeNames, activeLocales } from '@/i18n';
import type { Locale } from '@/i18n';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { BrandLogo } from '@/components/layout/brand-logo';
import { useSiteSettings } from '@/hooks/use-api';

function SolarGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.025]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="foot-pv" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="none" stroke="#10B981" strokeWidth="0.15" />
          <path d="M0 5h10M5 0v10" stroke="#10B981" strokeWidth="0.06" opacity="0.4" />
          <circle cx="5" cy="5" r="0.3" fill="#10B981" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#foot-pv)" />
    </svg>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-heading font-semibold text-xs text-emerald-700/80 mb-5 uppercase tracking-[0.2em] dark:text-emerald-400/60">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-sm text-neutral-600 hover:text-emerald-700 transition-all duration-500 hover:translate-x-0.5 inline-block dark:text-neutral-300 dark:hover:text-emerald-300">
        {label}
      </Link>
    </li>
  );
}

export function Footer() {
  const { locale, setLocale, t } = useLocale();
  const { data: settings } = useSiteSettings();
  const year = new Date().getFullYear();

  // Localized address components
  const displayAddress = locale === 'en'
    ? (settings?.address_en || settings?.address)
    : locale === 'ar'
      ? (settings?.address_ar || settings?.address)
      : settings?.address;

  const displayCity = locale === 'en'
    ? (settings?.city_en || settings?.city)
    : locale === 'ar'
      ? (settings?.city_ar || settings?.city)
      : settings?.city;

  const displayProvince = locale === 'en'
    ? (settings?.province_en || settings?.province)
    : locale === 'ar'
      ? (settings?.province_ar || settings?.province)
      : settings?.province;

  const displayCityProvince = [displayCity, displayProvince].filter(Boolean).join(locale === 'en' ? ', ' : '، ');

  const hasContactDetails = Boolean(
    settings?.email || settings?.phone_number || displayAddress || settings?.address,
  );

  const isValidMapUrl = Boolean(
    settings?.map_url && settings.map_url.startsWith('https://'),
  );

  return (
    <footer data-section="footer" data-testid="site-footer" className="relative overflow-hidden bg-neutral-100 border-t border-neutral-200 text-neutral-700 dark:bg-black dark:border-white/[0.03] dark:text-neutral-300">
      {/* Animated top light border */}
      <div className="relative h-px overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      </div>

      <SolarGrid />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px] dark:bg-emerald-500/3" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/3" />
      </div>

      <div className="container-page relative z-10 pt-20 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6">
          {/* Brand */}
          <ScrollReveal variant="fade" className="lg:col-span-3">
            <div className="lg:pr-6">
              <BrandLogo className="mb-5 group" nameClassName="text-neutral-900 dark:text-white" />
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-xs dark:text-neutral-300">
                {settings?.footer_text || t('common.site_slogan')}
              </p>
            </div>
          </ScrollReveal>

          {/* Quick links */}
          <ScrollReveal variant="fade" delay={0.1} className="lg:col-span-2">
            <FooterColumn title={t('footer.company')}>
              {['about', 'services', 'projects', 'articles', 'contact'].map((p) => (
                <FooterLink key={p} href={`/${locale}/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          <ScrollReveal variant="fade" delay={0.15} className="lg:col-span-2">
            <FooterColumn title={t('services.title')}>
              {['services', 'calculator', 'gallery', 'downloads'].map((p) => (
                <FooterLink key={p} href={`/${locale}/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          {/* Contact & Structured Company Address */}
          <ScrollReveal variant="fade" delay={0.2} className="lg:col-span-3">
            <FooterColumn title={t('contact.title')}>
              {settings?.email && (
                <li className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  <a href={`mailto:${settings.email}`} className="hover:text-emerald-600 transition-colors" dir="ltr">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings?.phone_number && (
                <li className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  <a href={`tel:${settings.phone_number.replace(/\s+/g, '')}`} className="hover:text-emerald-600 transition-colors" dir="ltr">
                    {settings.phone_number}
                  </a>
                </li>
              )}
              {displayAddress && (
                <li data-testid="footer-address-card" className="flex flex-col gap-1.5 rounded-lg border border-neutral-200/80 bg-white/50 p-3 text-sm text-neutral-700 shadow-xs dark:border-white/10 dark:bg-neutral-900/40 dark:text-neutral-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-500" />
                    <span className="leading-relaxed">{displayAddress}</span>
                  </div>
                  {displayCityProvince && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 pl-6 rtl:pl-0 rtl:pr-6">
                      {displayCityProvince}
                    </div>
                  )}
                  {settings?.postal_code && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 pl-6 rtl:pl-0 rtl:pr-6">
                      <span className="font-medium text-neutral-600 dark:text-neutral-300">
                        {locale === 'en' ? 'Postal Code: ' : locale === 'ar' ? 'الرمز البريدي: ' : 'کد پستی: '}
                      </span>
                      <span dir="ltr">{settings.postal_code}</span>
                    </div>
                  )}
                  {isValidMapUrl && (
                    <div className="mt-1 pl-6 rtl:pl-0 rtl:pr-6">
                      <a
                        href={settings.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="footer-map-link"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <span>{locale === 'en' ? 'View on map' : locale === 'ar' ? 'عرض على الخريطة' : 'مشاهده روی نقشه'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </li>
              )}
              {!hasContactDetails && (
                <li className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">{t('contact.details_unavailable')}</li>
              )}
            </FooterColumn>
          </ScrollReveal>

          {/* Language */}
          <ScrollReveal variant="fade" delay={0.25} className="lg:col-span-2">
            <FooterColumn title={t('common.language')}>
              <div className="flex flex-wrap gap-2">
                {activeLocales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-500 ${
                      locale === l
                        ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/15'
                        : 'bg-neutral-900/[0.03] text-neutral-500 border border-neutral-900/10 hover:text-neutral-800 hover:bg-neutral-900/[0.06] dark:bg-white/[0.02] dark:text-white/30 dark:border-white/[0.05] dark:hover:text-white/50 dark:hover:bg-white/[0.04]'
                    }`}
                    onClick={() => setLocale(l as Locale)}
                  >
                    {localeNames[l as Locale]}
                  </button>
                ))}
              </div>
            </FooterColumn>
          </ScrollReveal>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 pt-6 border-t border-neutral-200 flex items-center justify-center dark:border-white/[0.03]"
        >
          <p className="text-xs text-neutral-500 dark:text-neutral-400">&copy; {year} {settings?.company_name || t('common.site_name')}.</p>
        </motion.div>
      </div>
    </footer>
  );
}

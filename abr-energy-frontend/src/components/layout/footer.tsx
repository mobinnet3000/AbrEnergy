'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';
import { Zap } from 'lucide-react';

export function Footer() {
  const { locale, setLocale, t } = useLocale();

  return (
    <footer data-section="footer" className="relative bg-black border-t border-white/[0.04] overflow-hidden">
      {/* Animated top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <motion.div
          className="w-full h-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container-page relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">AbrEnergy</span>
            </Link>
            <p className="text-sm text-white/30 leading-relaxed">
              {t('common.site_slogan')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white/60 mb-4 uppercase tracking-wider">{t('nav.about')}</h4>
            <ul className="space-y-3">
              {['about', 'services', 'projects', 'contact'].map((p) => (
                <li key={p}>
                  <Link href={`/${p}`} className="text-sm text-white/30 hover:text-white/70 transition-colors duration-300">
                    {t(`nav.${p}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white/60 mb-4 uppercase tracking-wider">{t('nav.services')}</h4>
            <ul className="space-y-3">
              {['services', 'calculator', 'gallery'].map((p) => (
                <li key={p}>
                  <Link href={`/${p}`} className="text-sm text-white/30 hover:text-white/70 transition-colors duration-300">
                    {t(`nav.${p}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white/60 mb-4 uppercase tracking-wider">{t('common.language')}</h4>
            <ul className="space-y-3">
              {locales.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    className={`text-sm transition-colors duration-300 ${
                      locale === l ? 'text-emerald-400 font-medium' : 'text-white/30 hover:text-white/70'
                    }`}
                    onClick={() => setLocale(l as Locale)}
                  >
                    {localeNames[l as Locale]}
                    {locale === l && ' ✓'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/20">
          <p>&copy; {new Date().getFullYear()} AbrEnergy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:info@abrenv.com" className="hover:text-white/50 transition-colors duration-300">info@abrenv.com</a>
            <span className="hidden sm:inline text-white/10">|</span>
            <a href="tel:+982112345678" className="hover:text-white/50 transition-colors duration-300">+98 21 1234 5678</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

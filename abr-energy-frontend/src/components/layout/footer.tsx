'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Zap } from 'lucide-react';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';
import { ScrollReveal } from '@/components/home/ScrollReveal';

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
      <h4 className="font-heading font-semibold text-xs text-emerald-400/60 mb-5 uppercase tracking-[0.2em]">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-sm text-white/25 hover:text-emerald-400/70 transition-all duration-500 hover:translate-x-0.5 inline-block">
        {label}
      </Link>
    </li>
  );
}

export function Footer() {
  const { locale, setLocale, t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer data-section="footer" className="relative overflow-hidden bg-black border-t border-white/[0.03]">
      {/* Animated top light border */}
      <div className="relative h-px overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      </div>

      <SolarGrid />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/3 blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/3 blur-[120px]" />
      </div>

      <div className="container-page relative z-10 pt-20 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6">
          {/* Brand */}
          <ScrollReveal variant="fade" className="lg:col-span-3">
            <div className="lg:pr-6">
              <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="font-heading font-bold text-lg text-white/90">AbrEnergy</span>
              </Link>
              <p className="text-sm text-white/25 leading-relaxed mb-6 max-w-xs">
                {t('common.site_slogan')}
              </p>
            </div>
          </ScrollReveal>

          {/* Quick links */}
          <ScrollReveal variant="fade" delay={0.1} className="lg:col-span-2">
            <FooterColumn title={t('footer.company')}>
              {['about', 'services', 'projects', 'contact'].map((p) => (
                <FooterLink key={p} href={`/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          <ScrollReveal variant="fade" delay={0.15} className="lg:col-span-2">
            <FooterColumn title={t('services.title')}>
              {['services', 'calculator', 'gallery'].map((p) => (
                <FooterLink key={p} href={`/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          {/* Contact */}
          <ScrollReveal variant="fade" delay={0.2} className="lg:col-span-2">
            <FooterColumn title={t('contact.title')}>
              <li className="flex items-center gap-3 text-sm text-white/25"><Mail className="h-3.5 w-3.5 text-emerald-500/40" /> info@abrenv.com</li>
              <li className="flex items-center gap-3 text-sm text-white/25"><Phone className="h-3.5 w-3.5 text-emerald-500/40" /> +98 21 1234 5678</li>
              <li className="flex items-center gap-3 text-sm text-white/25"><MapPin className="h-3.5 w-3.5 text-emerald-500/40" /> Tehran, Iran</li>
            </FooterColumn>
          </ScrollReveal>

          {/* Language */}
          <ScrollReveal variant="fade" delay={0.25} className="lg:col-span-3">
            <FooterColumn title={t('common.language')}>
              <div className="flex flex-wrap gap-2">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-500 ${
                      locale === l
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        : 'bg-white/[0.02] text-white/30 border border-white/[0.05] hover:text-white/50 hover:bg-white/[0.04]'
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
          className="mt-14 pt-6 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-white/15">&copy; {year} AbrEnergy.</p>
          <div className="flex items-center gap-5 text-xs text-white/15">
            <a href="#" className="hover:text-white/30 transition-colors duration-300">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-white/30 transition-colors duration-300">{t('footer.terms')}</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

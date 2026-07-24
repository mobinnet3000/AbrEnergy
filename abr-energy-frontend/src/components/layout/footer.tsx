'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, ArrowUpRight, Zap, Sun, ChevronRight } from 'lucide-react';
import { useLocale } from '@/i18n';
import { localeNames, locales } from '@/i18n';
import type { Locale } from '@/i18n';
import { ScrollReveal } from '@/components/home/ScrollReveal';

/* ─── Decorative solar panel grid SVG ─── */
function SolarGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.015]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="solar-cells" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="none" stroke="#10B981" strokeWidth="0.3" />
          <line x1="6" y1="0" x2="6" y2="12" stroke="#10B981" strokeWidth="0.15" />
          <line x1="0" y1="6" x2="12" y2="6" stroke="#10B981" strokeWidth="0.15" />
          <circle cx="6" cy="6" r="0.5" fill="#10B981" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#solar-cells)" />
    </svg>
  );
}

/* ─── Footer Column reusable sub-component ─── */
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-heading font-semibold text-sm text-emerald-400/80 mb-5 uppercase tracking-[0.15em]">
        {title}
      </h4>
      <ul className="space-y-3.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-emerald-400 transition-all duration-300"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span>{label}</span>
        {external ? (
          <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" />
        ) : (
          <ChevronRight className="h-3 w-3 opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rtl:rotate-180" />
        )}
      </Link>
    </li>
  );
}

/* ─── Contact Info Item ─── */
function ContactItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/35">
      <Icon className="h-4 w-4 text-emerald-500/60 shrink-0" />
      <span>{text}</span>
    </li>
  );
}

/* ─── Newsletter Form ─── */
function NewsletterForm() {
  const { t } = useLocale();
  return (
    <div className="relative">
      <h4 className="font-heading font-semibold text-sm text-emerald-400/80 mb-5 uppercase tracking-[0.15em]">
        {t('nav.articles')}
      </h4>
      <p className="text-sm text-white/35 mb-4 leading-relaxed">
        Stay informed about the latest in solar energy and our projects.
      </p>
      <div className="relative">
        <input
          type="email"
          placeholder="your@email.com"
          className="w-full h-11 px-4 pr-24 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.06] transition-all duration-500"
          aria-label="Email for newsletter"
        />
        <button
          type="button"
          className="absolute right-1 top-1 h-9 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all duration-300"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

/* ─── Main Footer ─── */
export function Footer() {
  const { locale, setLocale, t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer data-section="footer" className="relative overflow-hidden bg-black">
      {/* Animated top energy border */}
      <div className="relative h-px overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Solar panel grid background */}
      <SolarGrid />

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
        <motion.div
          className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full bg-emerald-400/3 blur-[80px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content */}
      <div className="container-page relative z-10 pt-20 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* ─── Brand — spans 3 cols ─── */}
          <ScrollReveal variant="fade" className="lg:col-span-3">
            <div className="lg:pr-8">
              <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-500">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <motion.div
                    className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <span className="font-heading font-bold text-xl text-white">AbrEnergy</span>
              </Link>
              <p className="text-sm text-white/30 leading-relaxed mb-6">
                {t('common.site_slogan')}
              </p>

              {/* Social placeholders */}
              <div className="flex items-center gap-3">
                {[Sun, Zap, Mail].map((Icon, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-white/[0.08] hover:border-emerald-500/20 transition-all duration-300"
                    aria-label={`Social link ${i + 1}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* ─── Quick Navigation ─── */}
          <ScrollReveal variant="fade" delay={0.1} className="lg:col-span-2">
            <FooterColumn title={t('nav.about')}>
              {['about', 'services', 'projects', 'articles'].map((p) => (
                <FooterLink key={p} href={`/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          {/* ─── Services ─── */}
          <ScrollReveal variant="fade" delay={0.2} className="lg:col-span-2">
            <FooterColumn title={t('nav.services')}>
              {['services', 'calculator', 'gallery', 'contact'].map((p) => (
                <FooterLink key={p} href={`/${p}`} label={t(`nav.${p}`)} />
              ))}
            </FooterColumn>
          </ScrollReveal>

          {/* ─── Contact Info ─── */}
          <ScrollReveal variant="fade" delay={0.3} className="lg:col-span-2">
            <FooterColumn title={t('contact.title')}>
              <ContactItem icon={Mail} text="info@abrenv.com" />
              <ContactItem icon={Phone} text="+98 21 1234 5678" />
              <ContactItem icon={MapPin} text="Tehran, Iran" />
              <ContactItem icon={Clock} text="Sat–Thu, 8:00–17:00" />
            </FooterColumn>
          </ScrollReveal>

          {/* ─── Newsletter / Language ─── */}
          <ScrollReveal variant="fade" delay={0.35} className="lg:col-span-3">
            <NewsletterForm />
            <div className="mt-6">
              <h4 className="font-heading font-semibold text-sm text-emerald-400/80 mb-5 uppercase tracking-[0.15em]">
                {t('common.language')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      locale === l
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]'
                    }`}
                    onClick={() => setLocale(l as Locale)}
                  >
                    {localeNames[l as Locale]}
                    {locale === l && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Bottom bar ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <p className="text-sm text-white/20">
            &copy; {year} AbrEnergy. {t('common.site_name')}. All rights reserved.
          </p>
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-xs text-white/25">
            <a href="#" className="hover:text-white/50 transition-colors duration-300" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white/50 transition-colors duration-300" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>
            <a href="#" className="hover:text-white/50 transition-colors duration-300" onClick={(e) => e.preventDefault()}>
              Cookie Policy
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

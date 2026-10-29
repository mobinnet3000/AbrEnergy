'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageContact } from '@/types';

/** Phase 7 — optional CMS contact CTA copy. Contact details stay in the contact page/Footer. */
export function ContactSection({ cms }: { cms?: HomepageContact | null }) {
  const { t } = useLocale();

  if (cms && cms.enabled === false) return null;

  const title = homepageCopy(cms?.title, t('home.contact_title'));
  const text = homepageCopy(cms?.description, t('home.contact_text'));
  const ctaLabel = homepageCopy(cms?.cta_label, t('home.contact_cta'));
  const ctaUrl = cms?.cta_url?.trim() ? cms.cta_url : '/contact';
  const quoteLabel = homepageCopy(cms?.secondary_cta?.label, t('home.contact_quote'));
  const quoteUrl = cms?.secondary_cta?.url?.trim() ? cms.secondary_cta.url : '/contact';
  return (
    <section data-section="contact" data-testid="contact-panel" aria-labelledby="homepage-contact-heading" className="relative py-16 md:py-24 overflow-hidden bg-neutral-50 border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/[0.06]">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent dark:via-emerald-500/30" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/60 to-transparent dark:from-neutral-950 dark:via-emerald-950/20 dark:to-neutral-950" />

      <div className="container-page text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="max-w-2xl mx-auto p-8 md:p-12 rounded-3xl border border-neutral-900/10 bg-white shadow-xl shadow-emerald-700/10 dark:border-white/10 dark:bg-neutral-900 dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-transparent dark:shadow-none">
            <Phone className="h-14 w-14 mx-auto mb-6 text-emerald-700 dark:text-emerald-400/60" aria-hidden />
            <h2 id="homepage-contact-heading" className="font-heading text-3xl md:text-4xl font-bold text-neutral-950 mb-6 leading-[1.3] dark:text-white">{title}</h2>
            <p className="text-neutral-600 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed dark:text-neutral-300">
              {text}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={ctaUrl} className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-2xl bg-emerald-700 text-white hover:bg-emerald-600 transition-all duration-500 shadow-xl shadow-emerald-700/20 group dark:bg-gradient-to-br dark:from-emerald-500 dark:to-emerald-700 dark:hover:from-emerald-400 dark:hover:to-emerald-600 dark:shadow-emerald-500/20">
                {ctaLabel} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href={quoteUrl} className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-2xl border border-neutral-900/15 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 hover:border-neutral-900/30 transition-all duration-300 dark:border-white/15 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/[0.06] dark:hover:border-white/30 dark:backdrop-blur-sm">
                {quoteLabel}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Calculator, ClipboardList, PanelTop, TrendingUp } from 'lucide-react';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageTeaser } from '@/types';

const CALC_STEPS = [
  { key: 'home.calculator_step_1', Icon: ClipboardList },
  { key: 'home.calculator_step_2', Icon: PanelTop },
  { key: 'home.calculator_step_3', Icon: TrendingUp },
] as const;

/** Phase 7 — optional CMS marketing copy. Calculation logic stays in the app. */
export function CalculatorSection({ cms }: { cms?: HomepageTeaser | null }) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();

  if (cms && cms.enabled === false) return null;

  const title = homepageCopy(cms?.title, t('home.calculator_title'));
  const text = homepageCopy(cms?.description, t('home.calculator_text'));
  const ctaLabel = homepageCopy(cms?.cta_label, t('home.calculator_cta'));
  const ctaUrl = cms?.cta_url?.trim() ? cms.cta_url : '/calculator';
  const external = ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://');
  return (
    <section data-section="calculator" data-testid="calculator-teaser" aria-labelledby="homepage-calculator-heading" className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 border-t border-neutral-900/10 dark:from-emerald-950 dark:via-neutral-900 dark:to-emerald-950 dark:border-white/[0.06]">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]">
          <motion.div className="w-full h-full bg-gradient-to-r from-emerald-500/25 via-amber-500/20 to-emerald-500/25" animate={reduceMotion ? undefined : { rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        </div>
        <motion.div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-emerald-400/10 blur-[100px]" animate={reduceMotion ? undefined : { x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-amber-400/10 blur-[100px]" animate={reduceMotion ? undefined : { x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="container-page text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { rotate: [0, 8, 0, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-8"
          >
            <div className="relative">
              <Calculator className="h-24 w-24 text-emerald-600/60 dark:text-emerald-400/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-full blur-2xl" />
            </div>
          </motion.div>
          
          <h2 id="homepage-calculator-heading" className="font-heading text-3xl md:text-5xl font-bold text-neutral-950 mb-6 leading-[1.3] dark:text-white">{title}</h2>
          <p className="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed dark:text-white/70">
            {text}
          </p>

          {/* Phase 11 — tool framing: three honest steps describing what the
              calculator does. Generic tool copy only; no numbers invented. */}
          <ol className="mx-auto mb-12 grid max-w-3xl gap-3 text-start sm:grid-cols-3">
            {CALC_STEPS.map(({ key, Icon }, i) => (
              <motion.li
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex items-center gap-3 rounded-2xl border border-emerald-700/15 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:shadow-none"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 dark:bg-amber-500/20">
                  <Icon className="h-5 w-5 text-amber-600 dark:text-amber-200" aria-hidden />
                </span>
                <span className="text-sm leading-6 text-neutral-700 dark:text-white/85">
                  <span className="me-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white dark:bg-white/15 dark:text-white/80" aria-hidden>
                    {i + 1}
                  </span>
                  {t(key)}
                </span>
              </motion.li>
            ))}
          </ol>
          {external ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold rounded-2xl overflow-hidden transition-all duration-500"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-400 group-hover:to-orange-500 transition-all duration-500" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
              <span className="relative z-10 flex items-center gap-2 text-white"><Calculator className="h-5 w-5" /> {ctaLabel}</span>
            </a>
          ) : (
            <Link
              href={ctaUrl}
              className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold rounded-2xl overflow-hidden transition-all duration-500"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-400 group-hover:to-orange-500 transition-all duration-500" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
              <span className="relative z-10 flex items-center gap-2 text-white"><Calculator className="h-5 w-5" /> {ctaLabel}</span>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

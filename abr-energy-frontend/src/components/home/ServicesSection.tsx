'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sun } from 'lucide-react';
import { useServices } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import { hasValidSlug } from '@/lib/slug';
import type { HomepageSection } from '@/types';

function ServiceCard({ icon: Icon, title, desc, href, i }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; href: string; i: number;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const { t } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRotateY(((e.clientX - rect.left) / rect.width - 0.5) * 6);
        setRotateX(((e.clientY - rect.top) / rect.height - 0.5) * -6);
      }}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      style={{ perspective: '800px' }}
      className="group"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      >
        <Link href={href}>
          <div className="relative rounded-2xl border border-neutral-900/10 bg-neutral-50 p-8 overflow-hidden h-full hover:border-emerald-700/30 hover:shadow-lg hover:shadow-emerald-700/10 transition-all duration-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:backdrop-blur-sm dark:hover:border-emerald-500/15 dark:hover:shadow-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Phase 11 — technical ghost index (engineering character). */}
            <span
              className="pointer-events-none absolute -top-1 end-4 font-heading text-6xl font-bold text-neutral-900/[0.05] select-none dark:text-white/[0.05]"
              aria-hidden
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* PV corner marks */}
            <svg className="absolute top-0 left-0 w-8 h-8 opacity-[0.2] dark:opacity-[0.12]" viewBox="0 0 20 20" aria-hidden>
              <line x1="0" y1="0" x2="14" y2="0" stroke="#059669" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2="14" stroke="#059669" strokeWidth="0.5" />
            </svg>

            <div className="relative w-12 h-12 rounded-xl bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-700/15 transition-all duration-500 dark:bg-emerald-500/10 dark:border-emerald-500/10 dark:group-hover:bg-emerald-500/15">
              <Icon className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>

            <h3 className="relative font-heading font-semibold text-lg text-neutral-900 mb-2.5 group-hover:text-emerald-800 transition-colors duration-300 dark:text-white dark:group-hover:text-emerald-400">{title}</h3>
            <p className="relative text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">{desc}</p>

            <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 mt-5 group-hover:text-emerald-800 group-hover:gap-2.5 transition-all duration-300 dark:text-emerald-400/70 dark:group-hover:text-emerald-400">
              {t('services.explore')} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function ServicesSection({ cms }: {
  cms?: { items?: Record<string, unknown>[] | null; section?: HomepageSection | null; pending?: boolean } | null;
}) {
  const { t } = useLocale();
  // Phase 12.14 — when the CMS slice is present, the per-page request count
  // drops by one: the /services/ fallback is only fetched when the homepage
  // payload did not supply items. Same idiom as HeroSection.
  const hasCmsItems = cms?.items !== undefined && cms?.items !== null;
  const isPending = cms?.pending === true;
  const { data: servicesData, isLoading: servicesLoading, error: servicesError, refetch } = useServices({ enabled: !hasCmsItems && !isPending });
  const hookServices = Array.isArray(servicesData?.results) ? servicesData.results : (Array.isArray(servicesData) ? servicesData : []);

  if (cms?.section && cms.section.enabled === false) return null;

  // Phase 12.13 — drop services without a slug (no blank/whitespace detail links).
  const services = (hasCmsItems ? (cms.items as Record<string, unknown>[]) : hookServices).filter((s: Record<string, unknown>) => hasValidSlug(s.slug));
  const loading = hasCmsItems ? false : servicesLoading;
  const error = hasCmsItems ? null : servicesError;
  const title = homepageCopy(cms?.section?.title, t('home.services_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.services_subtitle'));

  // No invented fallback services: the section renders only real backend
  // content and hides itself when none is available.
  if (!loading && !error && services.length === 0) return null;

  return (
    <section data-section="services" aria-labelledby="homepage-services-heading" data-testid="services-section" className="relative overflow-hidden border-t border-neutral-900/10 bg-white py-16 md:py-24 dark:border-white/10 dark:bg-neutral-950">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent dark:from-emerald-950/20 dark:via-transparent dark:to-black" />

      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-emerald-700 uppercase tracking-[0.2em] mb-4 dark:text-emerald-400/80">{t('services.what_we_do')}</p>
          <h2 id="homepage-services-heading" className="font-heading text-3xl md:text-4xl font-bold text-neutral-950 mb-4 dark:text-white">{title}</h2>
          <p className="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto dark:text-neutral-400">{subtitle}</p>
        </motion.div>

        {loading ? (
          <CardLoading count={3} />
        ) : error ? (
          <ErrorState
            title={t('common.error')}
            message={t('common.no_data')}
            action={{ label: t('products.retry'), onClick: () => refetch() }}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.slice(0, 6).map((s: Record<string, unknown>, i: number) => (
              <ServiceCard
                key={(s.id as string) ?? i}
                icon={Sun}
                title={s.title as string}
                desc={(s.short_description as string) || ''}
                href={`/services/${(s.slug as string) || ''}`}
                i={i}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 transition-colors duration-300 group dark:text-emerald-400/70 dark:hover:text-emerald-400">
            {t('home.services_cta')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

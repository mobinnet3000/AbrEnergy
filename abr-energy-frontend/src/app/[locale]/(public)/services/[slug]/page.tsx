'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Sun,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Leaf,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import { useLocale } from '@/i18n';
import type { Service } from '@/types';
import { InternalPageShell, PageLoading, BreadcrumbTrail } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';

function statusOf(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

const processSteps = [
  { icon: Sun, title: 'services.step_consultation', desc: 'services.step_consultation_desc' },
  { icon: Zap, title: 'services.step_design', desc: 'services.step_design_desc' },
  { icon: Shield, title: 'services.step_implementation', desc: 'services.step_implementation_desc' },
  { icon: Clock, title: 'services.step_optimization', desc: 'services.step_optimization_desc' },
];

const techAdvantages = [
  { icon: BarChart3, title: 'services.advantage_efficiency', desc: 'services.advantage_efficiency_desc' },
  { icon: Shield, title: 'services.advantage_reliability', desc: 'services.advantage_reliability_desc' },
  { icon: Leaf, title: 'services.advantage_sustainability', desc: 'services.advantage_sustainability_desc' },
];

export default function ServiceDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params?.slug as string;

  const {
    data: service,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Service>({
    queryKey: ['service', slug],
    queryFn: () => axiosInstance.get(`/services/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <InternalPageShell>
        <div className="container-page py-20">
          <PageLoading />
        </div>
      </InternalPageShell>
    );
  }

  if (isError || !service) {
    const status = statusOf(error);
    const is404 = status === 404 || (!isError && !service);
    const is429 = status === 429;
    return (
      <InternalPageShell>
        <div className="container-page py-20">
          {is404 ? (
            <NotFoundState
              title={t('services.service_not_found')}
              message={t('services.service_gone_hint')}
            />
          ) : (
            <ErrorState
              title={is429 ? (t('common.rate_limit_title') || 'محدودیت درخواست') : t('common.error')}
              message={is429 ? (t('common.rate_limit_hint') || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.') : t('admin.failed_load_services')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
            />
          )}
          <div className="flex flex-wrap justify-center gap-3 pb-20">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              {t('services.back_to_services')}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-brand-strong"
            >
              {t('contact.title')}
            </Link>
          </div>
        </div>
      </InternalPageShell>
    );
  }

  const descriptionHtml = sanitizeHtml(service.description || '');

  return (
    <InternalPageShell>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="container-page relative z-10">
          <BreadcrumbTrail
            trail={[
              { label: t('common.back_home'), href: '/' },
              { label: t('home.services_title'), href: '/services' },
              { label: service.title },
            ]}
            className="mb-6"
          />

          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary"
            >
              {service.category_title || t('services.what_we_do')}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {service.title}
            </motion.h1>
            {service.short_description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
              >
                {service.short_description}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-brand-strong active:scale-[0.98]"
              >
                {t('services.get_quote')}{' '}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== COVER IMAGE (IF AVAILABLE) ===== */}
      {service.image_url && (
        <section className="container-page pb-12 sm:pb-16">
          <div className="overflow-hidden rounded-2xl border border-border/80 shadow-xs dark:border-white/10 max-w-4xl">
            <img
              src={service.image_url}
              alt={service.title}
              className="aspect-[2.2/1] w-full object-cover"
              loading="eager"
            />
          </div>
        </section>
      )}

      {/* ===== DESCRIPTION ===== */}
      {descriptionHtml && (
        <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <ScrollReveal variant="slide-up">
                <h2 className="font-heading mb-6 text-2xl font-bold text-foreground sm:text-3xl">
                  {t('services.overview')}
                </h2>
                <div
                  className="prose prose-neutral max-w-none text-base leading-relaxed text-muted-foreground dark:prose-invert sm:text-lg"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES ===== */}
      {Array.isArray(service.features) && service.features.length > 0 && (
        <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="mb-12 text-center sm:mb-14">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('services.what_you_get')}
                </span>
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                  {t('services.features')}
                </h2>
              </div>
            </ScrollReveal>
            <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
              {service.features.map((f, i) => (
                <ScrollReveal key={i} variant="slide-up" delay={i * 0.05}>
                  <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-primary/40 dark:border-white/10 dark:bg-card/70">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm font-medium text-foreground">{f}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROCESS ===== */}
      <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="mb-12 text-center sm:mb-14">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {t('services.how_we_work')}
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {t('services.process')}
              </h2>
            </div>
          </ScrollReveal>
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.1}>
                <div className="relative flex h-full flex-col items-center rounded-2xl border border-border/80 bg-card p-6 text-center shadow-xs transition-all duration-300 hover:border-primary/40 dark:border-white/10 dark:bg-card/70">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading mb-2 text-sm font-semibold text-foreground">
                    {t(step.title)}
                  </h3>
                  <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                    {t(step.desc)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECHNICAL ADVANTAGES ===== */}
      <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="mb-12 text-center sm:mb-14">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {t('services.why_choose_us')}
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {t('services.technical_advantages')}
              </h2>
            </div>
          </ScrollReveal>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {techAdvantages.map((item, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.1}>
                <div className="flex h-full flex-col items-center rounded-2xl border border-border/80 bg-card p-6 text-center shadow-xs transition-all duration-300 hover:border-primary/40 dark:border-white/10 dark:bg-card/70 sm:p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading mb-2 text-base font-semibold text-foreground">
                    {t(item.title)}
                  </h3>
                  <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                    {t(item.desc)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs dark:border-white/10 dark:bg-card/40 sm:p-12">
              <h2 className="font-heading mb-4 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {t('services.cta_title')}
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-sm text-muted-foreground">
                {t('services.cta_desc')}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-brand-strong active:scale-[0.98]"
              >
                {t('contact.title')}{' '}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </InternalPageShell>
  );
}

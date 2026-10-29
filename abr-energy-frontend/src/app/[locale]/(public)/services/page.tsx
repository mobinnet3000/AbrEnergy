'use client';

import Link from 'next/link';
import { ArrowLeft, Sun, Zap, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useServices } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import { hasValidSlug } from '@/lib/slug';

const serviceIcons = [Sun, Zap, Shield];

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  image_url?: string;
  features?: string[];
  status?: string;
}

function ServiceCard({ service, i }: { service: ServiceItem; i: number }) {
  const { t } = useLocale();
  const Icon = serviceIcons[i % 3];

  return (
    <ScrollReveal variant="slide-up" delay={i * 0.08}>
      <Link href={`/services/${service.slug}`} className="group block h-full">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70 sm:p-8">
          {service.image_url ? (
            <div className="mb-5 aspect-video w-full overflow-hidden rounded-xl bg-muted/40">
              <img
                src={service.image_url}
                alt={service.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}

          <h3 className="font-heading mb-2.5 text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
            {service.title}
          </h3>

          {service.short_description && (
            <p className="mb-5 flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {service.short_description}
            </p>
          )}

          {Array.isArray(service.features) && service.features.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {service.features.slice(0, 3).map((f, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all duration-300 group-hover:gap-2.5">
            {t('common.read_more')} <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
          </span>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ServicesPage() {
  const { t } = useLocale();
  const { data: services, isLoading, isError, refetch } = useServices();

  const raw = Array.isArray(services?.results)
    ? services.results
    : Array.isArray(services)
      ? services
      : [];

  // Exclude services without valid slug or inactive services
  const items: ServiceItem[] = (raw as ServiceItem[]).filter(
    (s) => hasValidSlug(s.slug) && (s.status === 'active' || !s.status),
  );

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('home.services_title') },
            ]}
            eyebrow={t('services.what_we_do')}
            title={t('home.services_title')}
            subtitle={t('home.services_subtitle')}
            centered
          />
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <CardLoading count={6} />
          ) : isError ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-card/50 p-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive/80" />
              <p className="mb-4 text-sm font-semibold text-foreground">{t('common.error')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand-strong"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t('products.retry')}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">{t('services.not_found')}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {items.map((s, i) => (
                <ServiceCard key={s.id} service={s} i={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}

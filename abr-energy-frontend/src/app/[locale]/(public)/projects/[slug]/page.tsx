'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Zap,
  Calendar,
  Building2,
  CheckCircle,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import { useLocale } from '@/i18n';
import type { ProjectDetail } from '@/types';
import { InternalPageShell, PageLoading, BreadcrumbTrail } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';
import { formatProjectType, formatProjectStatus } from '@/lib/project-helpers';

function statusOf(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

export default function ProjectDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params?.slug as string;

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProjectDetail>({
    queryKey: ['project', slug],
    queryFn: () => axiosInstance.get(`/projects/${slug}/`).then((r) => r.data),
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

  if (isError || !project) {
    const status = statusOf(error);
    const is404 = status === 404 || (!isError && !project);
    const is429 = status === 429;
    return (
      <InternalPageShell>
        <div className="container-page py-20">
          {is404 ? (
            <NotFoundState
              title={t('projects.project_not_found')}
              message={t('projects.project_gone_hint')}
            />
          ) : (
            <ErrorState
              title={is429 ? (t('common.rate_limit_title') || 'محدودیت درخواست') : t('common.error')}
              message={is429 ? (t('common.rate_limit_hint') || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.') : t('admin.failed_load_projects')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
            />
          )}
          <div className="flex flex-wrap justify-center gap-3 pb-20">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              {t('projects.back_to_projects')}
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

  const formattedType = formatProjectType(project.project_type);
  const formattedStatus = formatProjectStatus(project.status);
  const descriptionHtml = sanitizeHtml(project.description || '');

  // Filter metrics that have actual values
  const metrics: { label: string; value: string; icon: typeof Zap }[] = [];
  if (typeof project.capacity === 'number' && project.capacity > 0) {
    metrics.push({ label: t('projects.capacity'), value: `${project.capacity} kW`, icon: Zap });
  }
  if (formattedType) {
    metrics.push({ label: t('projects.type'), value: formattedType, icon: Building2 });
  }
  if (formattedStatus) {
    metrics.push({ label: t('projects.status'), value: formattedStatus, icon: CheckCircle });
  }
  if (project.location) {
    metrics.push({ label: t('projects.location'), value: project.location, icon: MapPin });
  }

  return (
    <InternalPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden pb-10 pt-6 sm:pb-14 sm:pt-8">
        <div className="container-page relative z-10">
          <BreadcrumbTrail
            trail={[
              { label: t('common.back_home'), href: '/' },
              { label: t('projects.title'), href: '/projects' },
              { label: project.title },
            ]}
            className="mb-6"
          />

          <div className="grid items-end gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary"
              >
                {t('projects.case_study')}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-heading mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.15]"
              >
                {project.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-wrap gap-4 text-xs text-muted-foreground"
              >
                {project.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {project.location}
                  </span>
                )}
                {typeof project.capacity === 'number' && project.capacity > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" /> {project.capacity} kW
                  </span>
                )}
                {project.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />{' '}
                    {new Date(project.created_at).toLocaleDateString('fa-IR', { year: 'numeric' })}
                  </span>
                )}
              </motion.div>
            </div>
            <div className="flex flex-wrap gap-3 pb-2">
              {formattedType && (
                <span className="rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  {formattedType}
                </span>
              )}
              {formattedStatus && (
                <span className="rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                  {formattedStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {project.images?.length > 0 && project.images[0]?.image_url && (
        <section className="container-page pb-10 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border/80 shadow-xs dark:border-white/10"
          >
            <img
              src={project.images[0].image_url}
              alt={project.images[0].alt_text || project.title}
              className="aspect-[2.4/1] w-full object-cover"
              loading="eager"
            />
          </motion.div>
        </section>
      )}

      {/* Overview */}
      {descriptionHtml && (
        <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="mx-auto max-w-3xl">
                <h2 className="font-heading mb-6 text-2xl font-bold text-foreground sm:text-3xl">
                  {t('projects.overview')}
                </h2>
                <div
                  className="prose prose-neutral max-w-none text-base leading-relaxed text-muted-foreground dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Key Metrics */}
      {metrics.length > 0 && (
        <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="mb-12 text-center">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('projects.technical_details')}
                </span>
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {t('projects.metrics')}
                </h2>
              </div>
            </ScrollReveal>
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {metrics.map((m, i) => (
                <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                  <div className="rounded-xl border border-border/80 bg-card p-5 text-center shadow-xs dark:border-white/10 dark:bg-card/70">
                    <p className="mb-1 text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-heading text-sm font-semibold text-foreground">{m.value}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Photos */}
      {project.images && project.images.length > 1 && (
        <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="mb-12 text-center">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('projects.gallery_label')}
                </span>
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {t('projects.photos')}
                </h2>
              </div>
            </ScrollReveal>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              {project.images.slice(1).map((img) => (
                <ScrollReveal key={img.id} variant="scale">
                  <div className="overflow-hidden rounded-xl border border-border/80 shadow-xs dark:border-white/10">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || project.title}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border/60 py-16 dark:border-white/[0.06] sm:py-20 md:py-24">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs dark:border-white/10 dark:bg-card/40 sm:p-12">
              <h2 className="font-heading mb-4 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {t('projects.cta_title')}
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-sm text-muted-foreground">
                {t('projects.cta_desc')}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-brand-strong active:scale-[0.98]"
              >
                {t('projects.cta_button')}{' '}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </InternalPageShell>
  );
}

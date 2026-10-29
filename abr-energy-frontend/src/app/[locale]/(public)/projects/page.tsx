'use client';

import Link from 'next/link';
import { Building2, AlertCircle, RefreshCw, MapPin, Zap } from 'lucide-react';
import { useProjects } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import { hasValidSlug } from '@/lib/slug';
import { formatProjectType, formatProjectStatus } from '@/lib/project-helpers';
import type { Project } from '@/types';

function ProjectCard({ project }: { project: Project }) {
  const formattedType = formatProjectType(project.project_type);
  const formattedStatus = formatProjectStatus(project.status);
  const hasCapacity = typeof project.capacity === 'number' && project.capacity > 0;

  return (
    <ScrollReveal variant="slide-up">
      <Link href={`/projects/${project.slug}`} className="group block h-full">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
            {project.cover_image ? (
              <img
                src={project.cover_image}
                alt={project.title}
                loading="lazy"
                className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="h-14 w-14 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {hasCapacity && (
              <div className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
                <Zap className="h-3 w-3 text-primary" />
                {project.capacity} kW
              </div>
            )}

            {formattedType && (
              <div className="absolute end-3 top-3 rounded-full border border-primary/30 bg-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur-md">
                {formattedType}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                {project.title}
              </h3>
              {project.location && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  {project.location}
                </p>
              )}
            </div>

            {formattedStatus && (
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{formattedStatus}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ProjectsPage() {
  const { t } = useLocale();
  const { data: projects, isLoading, isError, refetch } = useProjects();

  const raw = Array.isArray(projects?.results)
    ? projects.results
    : Array.isArray(projects)
      ? projects
      : [];

  // Exclude projects without a valid slug
  const items: Project[] = (raw as Project[]).filter((p) => hasValidSlug(p.slug));

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('projects.title') },
            ]}
            eyebrow={t('projects.portfolio_label')}
            title={t('projects.title')}
            subtitle={t('projects.subtitle')}
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
            <div className="py-20 text-center text-muted-foreground">{t('projects.not_found')}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {items.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}

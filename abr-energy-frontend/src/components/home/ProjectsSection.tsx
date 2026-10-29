'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { useFeaturedProjects } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import { hasValidSlug } from '@/lib/slug';
import type { HomepageSection } from '@/types';

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      className="group"
    >
      <Link href={`/projects/${project.slug}`}>
          <div className="relative rounded-2xl overflow-hidden border border-neutral-900/10 bg-white hover:border-emerald-700/30 hover:shadow-lg hover:shadow-emerald-700/10 transition-all duration-500 dark:border-white/[0.06] dark:bg-neutral-900 dark:backdrop-blur-sm dark:hover:border-white/[0.12] dark:hover:shadow-none">
          <div className="aspect-[4/3] relative overflow-hidden">
            {(project as { cover_image?: string }).cover_image ? (
              <img src={(project as { cover_image: string }).cover_image} alt={project.title as string} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full"><Building2 className="h-16 w-16 text-neutral-300 dark:text-white/10" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80">
              {(project as { capacity: number }).capacity} kW
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-xs font-medium text-emerald-300">
              {project.project_type as string}
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-heading font-semibold text-lg text-neutral-900 group-hover:text-emerald-800 transition-colors duration-300 dark:text-white dark:group-hover:text-emerald-400">{project.title as string}</h3>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-300">{project.location as string}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectsSection({ cms }: {
  cms?: { items?: Record<string, unknown>[] | null; section?: HomepageSection | null; pending?: boolean } | null;
}) {
  const { t } = useLocale();
  // Phase 12.14 — skip the fallback fetch when the homepage payload supplies
  // project items (request-count hardening; same idiom as HeroSection).
  const hasCmsItems = cms?.items !== undefined && cms?.items !== null;
  const isPending = cms?.pending === true;
  const { data: featured, isLoading, error } = useFeaturedProjects({ enabled: !hasCmsItems && !isPending });
  const hookProjects = Array.isArray(featured?.results) ? featured.results : (Array.isArray(featured) ? featured : []);

  if (cms?.section && cms.section.enabled === false) return null;

  // Phase 12.13 — drop projects without a slug (no blank/whitespace detail links).
  const projects = (hasCmsItems ? (cms.items as Record<string, unknown>[]) : hookProjects).filter((p: Record<string, unknown>) => hasValidSlug(p.slug));
  const loading = hasCmsItems ? false : isLoading;
  const loadError = hasCmsItems ? null : error;
  const title = homepageCopy(cms?.section?.title, t('home.projects_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.projects_subtitle'));

  // Hide the proof section when the backend has no featured projects —
  // never fabricate project imagery, capacities, or locations.

  if (!loading && !loadError && projects.length === 0) return null;

  return (
    <section data-section="projects" data-testid="projects-showcase" aria-labelledby="homepage-projects-heading" className="relative py-16 md:py-24 overflow-hidden bg-neutral-50 border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/[0.06]">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/40 to-transparent dark:from-neutral-950 dark:via-blue-950/10 dark:to-neutral-950" />

      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-[0.2em] mb-4 dark:text-emerald-400/80">{t('home.projects_subtitle_prefix')}</p>
            <h2 id="homepage-projects-heading" className="font-heading text-3xl md:text-4xl font-bold text-neutral-950 dark:text-white">{title}</h2>
            <p className="text-neutral-600 text-base md:text-lg max-w-2xl mt-3 dark:text-neutral-300">{subtitle}</p>
          </div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950 transition-colors duration-300 dark:text-neutral-300 dark:hover:text-white">
            {t('common.view_all')} <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {loading ? (
          <CardLoading count={3} />
        ) : loadError ? (
          <ErrorState title={t('common.error')} message={t('common.no_data')} />
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.slice(0, 3).map((p: Record<string, unknown>, idx: number) => (
              <ProjectCard key={(p.id as string) || (p.slug as string) || `proj-${idx}`} project={p} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

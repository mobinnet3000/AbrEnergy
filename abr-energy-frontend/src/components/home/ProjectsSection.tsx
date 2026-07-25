'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Sun } from 'lucide-react';
import { useFeaturedProjects } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { useLocale } from '@/i18n';

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
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 backdrop-blur-sm">
          <div className="aspect-[4/3] relative overflow-hidden">
            {(project as { cover_image?: string }).cover_image ? (
              <img src={(project as { cover_image: string }).cover_image} alt={project.title as string} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full"><Building2 className="h-16 w-16 text-white/10" /></div>
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
            <h3 className="font-heading font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors duration-300">{project.title as string}</h3>
            <p className="text-sm text-white/40 mt-1">{project.location as string}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectsSection() {
  const { t } = useLocale();
  const { data: featured, isLoading, error } = useFeaturedProjects();
  const projects = Array.isArray(featured?.results) ? featured.results : (Array.isArray(featured) ? featured : []);

  return (
    <section data-section="projects" className="relative py-28 md:py-36 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/5 to-black" />
      
      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-4">{t('home.projects_subtitle_prefix')}</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">{t('home.projects_title')}</h2>
          </div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors duration-300">
            {t('common.view_all')} <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {isLoading ? (
          <CardLoading count={3} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={t('common.no_data')} />
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.slice(0, 3).map((p: Record<string, unknown>) => (
              <ProjectCard key={p.id as string} project={p} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

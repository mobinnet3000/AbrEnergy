'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { useProjects } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  return (
    <ScrollReveal variant="slide-up">
      <Link href={`/projects/${project.slug}`} className="group block h-full">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm h-full hover:border-white/[0.12] transition-all duration-500">
          <div className="aspect-[4/3] relative overflow-hidden">
            {(project as { cover_image?: string }).cover_image ? (
              <img src={(project as { cover_image: string }).cover_image} alt={project.title as string} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full"><Building2 className="h-16 w-16 text-white/10" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/70">
              {(project as { capacity: number }).capacity} kW
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/15 text-[10px] font-medium text-emerald-300">
              {project.project_type as string}
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-heading font-semibold text-white group-hover:text-emerald-400 transition-colors duration-300">{project.title as string}</h3>
            <p className="text-xs text-white/35 mt-1">{project.location as string}</p>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ProjectsPage() {
  const { t } = useLocale();
  const { data: projects, isLoading } = useProjects();
  const items = Array.isArray(projects?.results) ? projects.results : (Array.isArray(projects) ? projects : []);

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">
            {t('projects.portfolio_label')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">
            {t('projects.title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">
            {t('projects.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <CardLoading count={6} />
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-white/30">{t('projects.not_found')}</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {items.map((p: Record<string, unknown>) => (
                <ProjectCard key={p.id as string} project={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

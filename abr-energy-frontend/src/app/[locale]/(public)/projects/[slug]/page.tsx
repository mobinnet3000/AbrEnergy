'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Zap, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import type { ProjectDetail } from '@/types';

export default function ProjectDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const { data: project, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ['project', slug],
    queryFn: () => axiosInstance.get(`/projects/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error(t('admin.failed_load_projects')); }, [error]);

  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">{t('admin.failed_load_projects')}</div>;
  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>;
  if (!project) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">{t('admin.project_not_found')}</div>;

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative pt-28 pb-10 md:pt-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-black" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <Link href="/projects" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> {t('projects.back')}
          </Link>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-end">
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">
                {t('projects.case_study')}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 leading-[1.05]">
                {project.title}
              </motion.h1>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-wrap gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {project.location}</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> {project.capacity} kW</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric' })}</span>
              </motion.div>
            </div>
            <div className="flex flex-wrap gap-3 pb-6">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-300">{project.project_type}</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">{project.status}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      {project.images?.length > 0 && project.images[0]?.image_url && (
        <section className="container-page pb-10 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="rounded-2xl overflow-hidden border border-white/[0.04]">
            <img src={project.images[0].image_url} alt={project.title} className="w-full aspect-[2.4/1] object-cover" loading="eager" />
          </motion.div>
        </section>
      )}

      {/* Overview */}
      <section className="py-16 md:py-24 border-t border-white/[0.03]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading text-3xl font-bold text-white mb-6">{t('projects.overview')}</h2>
              <div className="prose prose-invert prose-emerald max-w-none [&_p]:text-white/50 [&_p]:leading-relaxed" dangerouslySetInnerHTML={{ __html: project.description }} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 md:py-24 border-t border-white/[0.03]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">{t('projects.technical_details')}</p>
              <h2 className="font-heading text-3xl font-bold text-white">{t('projects.metrics')}</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Capacity', value: `${project.capacity} kW`, icon: Zap },
              { label: 'Type', value: project.project_type, icon: Zap },
              { label: 'Status', value: project.status, icon: Zap },
              { label: 'Location', value: project.location, icon: MapPin },
            ].map((m, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] text-center">
                  <p className="text-xs text-white/30 mb-1">{m.label}</p>
                  <p className="font-heading font-semibold text-sm text-white">{m.value}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {project.images && project.images.length > 1 && (
        <section className="py-16 md:py-24 border-t border-white/[0.03]">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="text-center mb-12">
                <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">{t('projects.gallery_label')}</p>
                <h2 className="font-heading text-3xl font-bold text-white">{t('projects.photos')}</h2>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {project.images.slice(1).map((img) => (
                <ScrollReveal key={img.id} variant="scale">
                  <div className="rounded-xl overflow-hidden border border-white/[0.04]">
                    <img src={img.image_url} alt={img.alt_text || project.title} loading="lazy" className="w-full aspect-video object-cover" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">{t('projects.cta_title')}</h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mb-10">{t('projects.cta_desc')}</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
              {t('projects.cta_button')} <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

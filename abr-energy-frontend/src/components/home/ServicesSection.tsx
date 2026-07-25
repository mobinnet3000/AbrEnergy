'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sun, Zap, Shield } from 'lucide-react';
import { useServices } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';
import { useLocale } from '@/i18n';

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
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8 overflow-hidden h-full hover:border-emerald-500/15 transition-colors duration-500">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* PV corner marks */}
            <svg className="absolute top-0 left-0 w-8 h-8 opacity-[0.12]" viewBox="0 0 20 20">
              <line x1="0" y1="0" x2="14" y2="0" stroke="#10B981" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2="14" stroke="#10B981" strokeWidth="0.5" />
            </svg>

            <div className="relative w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-500">
              <Icon className="h-6 w-6 text-emerald-400" />
            </div>
            
            <h3 className="relative font-heading font-semibold text-lg text-white mb-2.5 group-hover:text-emerald-400 transition-colors duration-300">{title}</h3>
            <p className="relative text-sm text-white/40 leading-relaxed">{desc}</p>
            
            <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400/70 mt-5 group-hover:text-emerald-400 group-hover:gap-2.5 transition-all duration-300">
              {t('services.explore')} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function ServicesSection() {
  const { t } = useLocale();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const services = Array.isArray(servicesData?.results) ? servicesData.results : (Array.isArray(servicesData) ? servicesData : []);

  const fallback = [
    { icon: Sun, t: 'Solar Design & EPC', d: 'Complete engineering, procurement, and construction services for solar power plants.' },
    { icon: Zap, t: 'On Grid Systems', d: 'Grid-tied solar systems for residential, commercial, and industrial applications.' },
    { icon: Shield, t: 'Off Grid Systems', d: 'Independent solar power systems with battery storage for remote locations.' },
  ];

  const items = services.length > 0 ? services : fallback;

  return (
    <section data-section="services" className="relative py-28 md:py-36 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/5 to-black" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/4 rounded-full blur-[150px]" />
      
      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-4">{t('services.what_we_do')}</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">{t('home.services_title')}</h2>
          <p className="text-white/35 text-lg max-w-2xl mx-auto">{t('home.services_subtitle')}</p>
        </motion.div>

        {servicesLoading ? (
          <CardLoading count={3} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.slice(0, 6).map((s: Record<string, unknown> | { icon: React.ComponentType<{ className?: string }>; t: string; d: string }, i: number) => (
              <ServiceCard
                key={i}
                icon={(s as Record<string, unknown>).icon as React.ComponentType<{ className?: string }> || Sun}
                title={(s as Record<string, unknown>).title as string || (s as { t: string }).t}
                desc={(s as Record<string, unknown>).short_description as string || (s as { d: string }).d}
                href={`/services/${(s as Record<string, unknown>).slug || ''}`}
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
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors duration-300 group">
            {t('home.services_cta')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sun, Zap, Shield, Sparkles } from 'lucide-react';
import { useServices } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';

const serviceIcons = [Sun, Zap, Shield];

function ServiceCard({ title, desc, slug, i }: { title: string; desc: string; slug: string; i: number }) {
  const Icon = serviceIcons[i % 3];
  return (
    <ScrollReveal variant="slide-up" delay={i * 0.08}>
      <Link href={`/services/${slug}`}>
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg p-8 overflow-hidden h-full hover:border-emerald-500/15 transition-all duration-700">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-500">
            <Icon className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="relative font-heading font-semibold text-lg text-white mb-2.5 group-hover:text-emerald-400 transition-colors duration-300">{title}</h3>
          <p className="relative text-sm text-white/40 leading-relaxed mb-5">{desc}</p>
          <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400/70 group-hover:text-emerald-400 group-hover:gap-2.5 transition-all duration-300">
            Learn more <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const items = Array.isArray(services?.results) ? services.results : (Array.isArray(services) ? services : []);

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10 text-center">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">
            What We Do
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">
            Our Services
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg mx-auto">
            Comprehensive solar energy solutions from design to commissioning
          </motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <CardLoading count={6} />
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-white/30">No services available</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {items.map((s: Record<string, unknown>, i: number) => (
                <ServiceCard key={s.id as string} title={s.title as string} desc={s.short_description as string} slug={s.slug as string} i={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

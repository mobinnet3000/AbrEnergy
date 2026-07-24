'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sun, Zap, Shield, Clock, BarChart3, Leaf, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import type { Service } from '@/types';

const processSteps = [
  { icon: Sun, title: 'Consultation', desc: 'We assess your energy needs and site conditions to design the optimal solar solution.' },
  { icon: Zap, title: 'Design', desc: 'Our engineering team creates a detailed system design using advanced simulation tools.' },
  { icon: Shield, title: 'Implementation', desc: 'Professional installation by certified technicians following strict safety standards.' },
  { icon: Clock, title: 'Optimization', desc: 'Post-installation monitoring and optimization to ensure peak system performance.' },
];

const techAdvantages = [
  { icon: BarChart3, title: 'Efficiency', desc: 'High-efficiency panels with advanced cell technology maximize energy capture.' },
  { icon: Shield, title: 'Reliability', desc: 'Built with premium components and backed by comprehensive warranties.' },
  { icon: Leaf, title: 'Sustainability', desc: 'Designed for long-term environmental sustainability and reduced carbon footprint.' },
];

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: ['service', slug],
    queryFn: () => axiosInstance.get(`/services/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error('Failed to load service'); }, [error]);

  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">Failed to load service</div>;
  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>;
  if (!service) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40">Service not found</div>;

  return (
    <div className="bg-black text-white">
      {/* ===== HERO ===== */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-black" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="container-page relative z-10">
          <Link href="/services" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">
              {service.category_title || 'Service'}
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-heading text-4xl md:text-6xl font-bold text-white mb-6">
              {service.title}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-base md:text-lg text-white/35 max-w-2xl leading-relaxed mb-10">
              {service.short_description}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== DESCRIPTION ===== */}
      <section className="py-20 md:py-28 border-t border-white/[0.03]">
        <div className="container-page">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal variant="slide-up">
              <h2 className="font-heading text-3xl font-bold text-white mb-6">Overview</h2>
              <div className="text-white/35 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: service.description }} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      {service.features?.length > 0 && (
        <section className="py-20 md:py-28 border-t border-white/[0.03]">
          <div className="container-page">
            <ScrollReveal variant="fade">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">What You Get</p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Key Features</h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {service.features.map((f, i) => (
                <ScrollReveal key={i} variant="slide-up" delay={i * 0.05}>
                  <div className="flex items-start gap-3 p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm hover:border-emerald-500/10 transition-all duration-500">
                    <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{f}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROCESS ===== */}
      <section className="py-20 md:py-28 border-t border-white/[0.03]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">How We Work</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Our Process</h2>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {processSteps.map((step, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.1}>
                <div className="relative p-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-lg text-center h-full hover:border-emerald-500/10 transition-all duration-500">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECHNICAL ADVANTAGES ===== */}
      <section className="py-20 md:py-28 border-t border-white/[0.03]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">Why Choose Us</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Technical Advantages</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {techAdvantages.map((item, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.1}>
                <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-lg text-center h-full hover:border-emerald-500/10 transition-all duration-500">
                  <item.icon className="h-8 w-8 text-emerald-400/60 mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-sm text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Interested in This Service?</h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mb-10">Contact our team to discuss how we can help you with your solar energy needs.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

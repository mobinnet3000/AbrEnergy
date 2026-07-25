'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-api';
import { Hero3D, TextReveal } from '@/components/home';
import { useLocale } from '@/i18n';

export function HeroSection() {
  const { t } = useLocale();
  const { data: settings } = useSiteSettings();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity }}
      data-section="hero"
      className="relative min-h-screen flex items-center bg-black text-white overflow-hidden"
    >
      <Hero3D />

      {/* Solar grid overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-cells" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="none" stroke="#10B981" strokeWidth="0.2" />
              <circle cx="4" cy="4" r="0.4" fill="#10B981" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-cells)" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent z-[1]" />
      
      <motion.div style={{ y: heroY, scale: heroScale }} className="container-page relative z-10 py-32 w-full">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-sm mb-10"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-white/70">{settings?.company_name_en || 'AbrEnergy'} — {settings?.company_name || 'ابر انرژی'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-6"
          >
            <TextReveal text={settings?.hero_title?.split(' ').slice(0, 2).join(' ') || 'Powering the'} className="text-white" delay={0.4} />
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
              <TextReveal text={settings?.hero_title?.split(' ').slice(2).join(' ') || 'Future'} delay={0.6} />
            </span>
            <br />
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white/40 font-light">
              <TextReveal text={t('home.hero_title_suffix')} delay={0.8} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-lg md:text-xl text-white/35 max-w-2xl leading-relaxed mb-16"
          >
            {settings?.hero_subtitle || t('home.hero_subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-wrap gap-5"
          >
            <Link href="/calculator" className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500 active:scale-[0.97]">
              <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-700" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
              <span className="relative z-10 flex items-center gap-2.5 text-white">
                {t('home.cta_calculator')} <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>
            <Link href="/projects" className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all duration-500 active:scale-[0.97]">
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.04]" />
              <span className="relative z-10">{t('home.cta_projects')}</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}

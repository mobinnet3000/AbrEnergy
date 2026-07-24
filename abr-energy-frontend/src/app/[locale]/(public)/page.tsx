'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, Calculator, Phone, Building2, Sparkles, Sun } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSiteSettings, useFeaturedProjects, useArticles } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { CursorGlow, Hero3D, StatsSection, AboutSection, FloatingParticles, MouseRipple, GradientMesh, TextReveal, ServicesSection, ProjectsSection, ArticlesSection } from '@/components/home';

export default function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: featured, isLoading: projectsLoading, error: projectsError } = useFeaturedProjects();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ is_featured: 'true' });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const articles = Array.isArray(articlesData?.results) ? articlesData.results : (Array.isArray(articlesData) ? articlesData : []);
  const projects = Array.isArray(featured?.results) ? featured.results : (Array.isArray(featured) ? featured : []);

  return (
    <div className="flex flex-col noise-overlay">
      <GradientMesh />
      <FloatingParticles />
      <MouseRipple />
      <CursorGlow />

      {/* ===== 1. HERO — Cinematic 3D ===== */}
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
                <TextReveal text="with Solar Energy" delay={0.8} />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-lg md:text-xl text-white/35 max-w-2xl leading-relaxed mb-16"
            >
              {settings?.hero_subtitle || 'From design to commissioning — delivering turnkey solar power plants for residential, commercial, and utility-scale projects.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              className="flex flex-wrap gap-5"
            >
              <Link
                href="/calculator"
                className="group relative inline-flex items-center justify-center px-10 py-4.5 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-500" />
                {/* Light sweep */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
                <span className="relative z-10 flex items-center gap-2.5 text-white">
                  Calculate Solar System
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </Link>
              <Link
                href="/projects"
                className="group relative inline-flex items-center justify-center px-10 py-4.5 text-base font-semibold rounded-2xl overflow-hidden border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all duration-500"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.04]" />
                <span className="relative z-10">View Projects</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ===== 2. STATISTICS ===== */}
      <StatsSection />

      {/* ===== 3. ABOUT ===== */}
      <AboutSection />

      {/* ===== 4. SERVICES ===== */}
      <ServicesSection />

      {/* ===== 5. FEATURED PROJECTS ===== */}
      <ProjectsSection />

 {/* ===== 6. CALCULATOR CTA ===== */}
      <section data-section="calculator" className="relative py-32 md:py-40 overflow-hidden bg-black">
        {/* Animated energy background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]">
            <motion.div
              className="w-full h-full bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-emerald-500/20"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <motion.div
            className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-emerald-400/5 blur-[100px]"
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-amber-400/5 blur-[100px]"
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="container-page text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <motion.div
              animate={{ rotate: [0, 8, 0, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex mb-8"
            >
              <div className="relative">
                <Calculator className="h-24 w-24 text-emerald-400/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/20 to-transparent rounded-full blur-2xl" />
              </div>
            </motion.div>
            
            <h2 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Design Your Solar System
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Estimate system size, battery capacity, inverter power, and return on investment for your project in seconds.
            </p>
            <Link
              href="/calculator"
              className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold rounded-2xl overflow-hidden transition-all duration-500"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-400 group-hover:to-orange-500 transition-all duration-500" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
              <span className="relative z-10 flex items-center gap-2 text-white">
                <Calculator className="h-5 w-5" /> Start Calculator
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

     
      {/* ===== 7. ARTICLES ===== */}
      <ArticlesSection />

 {/* ===== 8. CONTACT CTA ===== */}
      <section data-section="contact" className="relative py-32 md:py-40 overflow-hidden bg-black">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/10 to-black" />
        
        <div className="container-page text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="max-w-2xl mx-auto p-12 md:p-16 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
              <Phone className="h-16 w-16 mx-auto mb-8 text-emerald-400/60" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Start Your Solar Project?
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Contact our team today for a free consultation and a personalized solar solution tailored to your needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 transition-all duration-500 shadow-2xl shadow-emerald-500/20 group"
                >
                  Contact Us <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-2xl border border-white/15 text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Sun, Zap, Shield, Calculator, Phone, Building2, Sparkles, Ruler, Maximize2, Droplets } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { useSiteSettings, useFeaturedProjects, useArticles, useServices } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { ScrollReveal, GlassCard, CursorGlow, Hero3D, StatsSection, AboutSection, FloatingParticles, MouseRipple, GradientMesh, TextReveal } from '@/components/home';

/* ===== Service Card — 3D hover with glow ===== */
function ServiceCard({ icon: Icon, title, desc, href, i }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; href: string; i: number }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRotateY(((e.clientX - rect.left) / rect.width - 0.5) * 8);
        setRotateX(((e.clientY - rect.top) / rect.height - 0.5) * -8);
      }}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      style={{ perspective: '800px' }}
      className="group"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Link href={href}>
          <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-8 overflow-hidden hover:border-emerald-500/20 transition-colors duration-500 h-full">
            {/* Hover glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Icon */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-500">
              <Icon className="h-7 w-7 text-emerald-400" />
            </div>
            
            <h3 className="relative font-heading font-semibold text-xl text-white mb-3">{title}</h3>
            <p className="relative text-white/50 leading-relaxed text-sm">{desc}</p>
            
            <span className="relative inline-flex items-center gap-2 text-sm font-medium text-emerald-400 mt-6 group-hover:gap-3 transition-all duration-300">
              Learn more <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ===== Project Card — Showcase style ===== */
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
          {/* Image */}
          <div className="aspect-[4/3] relative overflow-hidden">
            {(project as { cover_image?: string }).cover_image ? (
              <img src={(project as { cover_image: string }).cover_image} alt={project.title as string} loading="lazy" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full"><Building2 className="h-16 w-16 text-white/10" /></div>
            )}
            {/* Glass overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Top badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80">
              {(project as { capacity: number }).capacity} kW
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-xs font-medium text-emerald-300">
              {project.project_type as string}
            </div>
          </div>
          
          {/* Info */}
          <div className="p-6">
            <h3 className="font-heading font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors duration-300">{project.title as string}</h3>
            <p className="text-sm text-white/40 mt-1">{project.location as string}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ===== Article Card ===== */
function ArticleCard({ article }: { article: Record<string, unknown> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="group"
    >
      <Link href={`/articles/${article.slug}`}>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition-all duration-500 h-full">
          <div className="aspect-[16/9] relative overflow-hidden">
            {(article as { cover_image_url?: string }).cover_image_url ? (
              <img src={(article as { cover_image_url: string }).cover_image_url} alt={article.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/10"><Sun className="h-12 w-12" /></div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
              {(article as { category_title?: string }).category_title || 'Article'}
            </p>
            <h3 className="font-heading font-semibold text-lg text-white leading-snug group-hover:text-emerald-400 transition-colors duration-300">
              {article.title as string}
            </h3>
            <p className="text-sm text-white/40 mt-2 line-clamp-2">
              {(article as { short_description?: string }).short_description || ''}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: featured, isLoading: projectsLoading, error: projectsError } = useFeaturedProjects();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ is_featured: 'true' });
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const articles = Array.isArray(articlesData?.results) ? articlesData.results : (Array.isArray(articlesData) ? articlesData : []);
  const projects = Array.isArray(featured?.results) ? featured.results : (Array.isArray(featured) ? featured : []);
  const services = Array.isArray(servicesData?.results) ? servicesData.results : (Array.isArray(servicesData) ? servicesData : []);

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
      <section data-section="services" className="relative py-32 md:py-40 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/5 to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px]" />
        
        <div className="container-page relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">What We Do</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Comprehensive solar energy solutions from design to commissioning</p>
          </motion.div>

          {servicesLoading ? (
            <CardLoading count={3} />
          ) : services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.slice(0, 6).map((s: Record<string, unknown>, i: number) => (
                <ServiceCard key={s.id as string} icon={Sun} title={s.title as string} desc={s.short_description as string} href={`/services/${s.slug}`} i={i} />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: Sun, t: 'Solar Design & EPC', d: 'Complete engineering, procurement, and construction services for solar power plants.' },
                { icon: Zap, t: 'On Grid Systems', d: 'Grid-tied solar systems for residential, commercial, and industrial applications.' },
                { icon: Shield, t: 'Off Grid Systems', d: 'Independent solar power systems with battery storage for remote locations.' },
              ].map((s, i) => (
                <ServiceCard key={s.t} icon={s.icon} title={s.t} desc={s.d} href="/services" i={i} />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <Link href="/services" className="inline-flex items-center gap-2 text-emerald-400 font-medium hover:text-emerald-300 transition-colors text-lg group">
              View All Services <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== 5. FEATURED PROJECTS ===== */}
      <section data-section="projects" className="relative py-32 md:py-40 overflow-hidden bg-black">
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
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">Our Work</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Featured Projects</h2>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {projectsLoading ? (
            <CardLoading count={3} />
          ) : projectsError ? (
            <ErrorState title="Failed to load projects" message="Could not load featured projects." />
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {projects.slice(0, 3).map((p: Record<string, unknown>) => (
                <ProjectCard key={p.id as string} project={p} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

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
      {articles.length > 0 && (
        <section data-section="articles" className="relative py-32 md:py-40 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-teal-950/5 to-black" />
          
          <div className="container-page relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
            >
              <div>
                <p className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">Insights</p>
                <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Latest Articles</h2>
              </div>
              <Link href="/articles" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {articlesLoading ? (
              <CardLoading count={3} />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {articles.slice(0, 3).map((a: Record<string, unknown>) => (
                  <ArticleCard key={a.id as string} article={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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

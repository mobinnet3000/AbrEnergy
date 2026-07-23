'use client';
import Link from 'next/link';
import { ArrowRight, Sun, Zap, Shield, Calculator, Phone, Building2, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { useSiteSettings, useFeaturedProjects, useArticles, useServices } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';
import { ScrollReveal, GlassCard, CursorGlow, Hero3D, StatsSection, AboutSection } from '@/components/home';
import { useRef } from 'react';

function ServiceCard({ icon: Icon, title, desc, href }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; href: string }) {
  return (
    <GlassCard hover delay={0.1}>
      <Link href={href}>
        <CardContent className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-xl mb-3">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{desc}</p>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary mt-6 group-hover:gap-3 transition-all">
            Learn more <ArrowRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Link>
    </GlassCard>
  );
}

function ArticleCard({ article }: { article: Record<string, unknown> }) {
  return (
    <GlassCard hover>
      <Link href={`/articles/${article.slug}`}>
        <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
          {(article as { cover_image_url?: string }).cover_image_url ? (
            <img src={(article as { cover_image_url: string }).cover_image_url} alt={article.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="flex items-center justify-center h-full"><Sun className="h-12 w-12 text-muted-foreground/30" /></div>
          )}
        </div>
        <CardContent className="p-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            {(article as { category_title?: string }).category_title || 'Article'}
          </p>
          <h3 className="font-heading font-semibold text-lg leading-snug">{article.title as string}</h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{(article as { short_description?: string }).short_description || ''}</p>
        </CardContent>
      </Link>
    </GlassCard>
  );
}

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  return (
    <GlassCard hover>
      <Link href={`/projects/${project.slug}`}>
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
          {(project as { cover_image?: string }).cover_image ? (
            <img src={(project as { cover_image: string }).cover_image} alt={project.title as string} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="flex items-center justify-center h-full"><Building2 className="h-12 w-12 text-muted-foreground/30" /></div>
          )}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
            {(project as { capacity: number }).capacity} kW
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{project.project_type as string}</span>
          </div>
          <h3 className="font-heading font-semibold">{project.title as string}</h3>
          <p className="text-sm text-muted-foreground mt-1">{project.location as string}</p>
        </CardContent>
      </Link>
    </GlassCard>
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
    <div className="flex flex-col">
      <CursorGlow />

      {/* ===== 1. HERO — Cinematic 3D Experience ===== */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex items-center bg-black text-white overflow-hidden"
      >
        <Hero3D />

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_0%,black_70%)] z-[1]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[1]" />

        {/* Content */}
        <motion.div
          style={{ y: heroY, scale: heroScale }}
          className="container-page relative z-10 py-32 w-full"
        >
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
              className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8"
            >
              <span className="text-white">{settings?.hero_title?.split(' ')[0] || 'Powering'} </span>
              <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
                {settings?.hero_title?.split(' ').slice(1).join(' ') || 'the Future'}
              </span>
              <br />
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white/50 font-light">
                with Solar Energy
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-14"
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
                className="group relative inline-flex items-center justify-center px-9 py-4 text-base font-semibold rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 transition-all duration-500 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Calculate Solar System
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center px-9 py-4 text-base font-semibold rounded-2xl border border-white/15 text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                View Projects
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
      <section className="relative py-32 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <div className="container-page">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">What We Do</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Comprehensive solar energy solutions from design to commissioning</p>
            </div>
          </ScrollReveal>

          {servicesLoading ? (
            <CardLoading count={3} />
          ) : services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 6).map((s: Record<string, unknown>, i: number) => (
                <ScrollReveal key={s.id as string} delay={i * 0.1}>
                  <ServiceCard icon={Sun} title={s.title as string} desc={s.short_description as string} href={`/services/${s.slug}`} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[{ icon: Sun, t: 'Solar Design & EPC', d: 'Complete engineering, procurement, and construction services for solar power plants.' },
                { icon: Zap, t: 'On Grid Systems', d: 'Grid-tied solar systems for residential, commercial, and industrial applications.' },
                { icon: Shield, t: 'Off Grid Systems', d: 'Independent solar power systems with battery storage for remote locations.' },
              ].map((s, i) => (
                <ScrollReveal key={s.t} delay={i * 0.1}>
                  <ServiceCard icon={s.icon} title={s.t} desc={s.d} href="/services" />
                </ScrollReveal>
              ))}
            </div>
          )}

          <ScrollReveal>
            <div className="text-center mt-14">
              <Link href="/services" className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all text-lg">
                View All Services <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== 5. FEATURED PROJECTS ===== */}
      <section className="relative py-32 overflow-hidden">
        <div className="container-page">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Our Work</p>
                <h2 className="font-heading text-4xl md:text-5xl font-bold">Featured Projects</h2>
              </div>
              <Link href="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          {projectsLoading ? (
            <CardLoading count={3} />
          ) : projectsError ? (
            <ErrorState title="Failed to load projects" message="Could not load featured projects." />
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.slice(0, 3).map((p: Record<string, unknown>, i: number) => (
                <ScrollReveal key={p.id as string} delay={i * 0.15}>
                  <ProjectCard project={p} />
                </ScrollReveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ===== 6. CALCULATOR CTA ===== */}
      <section className="relative py-32 bg-gradient-to-br from-emerald-950 via-emerald-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="container-page text-center relative z-10">
          <ScrollReveal>
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <Calculator className="h-20 w-20 text-emerald-400/80 mb-8" />
            </motion.div>
            <h2 className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Design Your Solar System
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Use our solar calculator to estimate system size, battery capacity, inverter power, and return on investment for your project.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-xl shadow-amber-500/25"
            >
              <Calculator className="h-5 w-5 mr-2" /> Start Calculator
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== 7. ARTICLES ===== */}
      {articles.length > 0 && (
        <section className="relative py-32">
          <div className="container-page">
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
                <div>
                  <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Insights</p>
                  <h2 className="font-heading text-4xl md:text-5xl font-bold">Latest Articles</h2>
                </div>
                <Link href="/articles" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>

            {articlesLoading ? (
              <CardLoading count={3} />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.slice(0, 3).map((a: Record<string, unknown>, i: number) => (
                  <ScrollReveal key={a.id as string} delay={i * 0.15}>
                    <ArticleCard article={a} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 8. CONTACT CTA ===== */}
      <section className="relative py-32 bg-gradient-to-b from-muted/20 to-background border-t border-white/5">
        <div className="container-page text-center">
          <ScrollReveal>
            <Phone className="h-16 w-16 mx-auto mb-8 text-primary/60" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to Start Your Solar Project?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Contact our team today for a free consultation and a personalized solar solution tailored to your needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/25"
              >
                Contact Us <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl border border-border bg-background hover:bg-muted transition-all duration-300"
              >
                Request a Quote
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

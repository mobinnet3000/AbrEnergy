'use client';
import Link from 'next/link';
import { ArrowRight, Sun, Zap, Shield, Calculator, Phone, Building2, Users, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSiteSettings, useFeaturedProjects, useArticles, useServices } from '@/hooks/use-api';
import { CardLoading, ErrorState } from '@/components/shared';

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-3xl font-bold font-heading text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc, href }: { icon: React.ElementType; title: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="group h-full hover:shadow-md transition-all hover:-translate-y-0.5">
        <CardContent className="p-6 md:p-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArticleCard({ article }: { article: Record<string, unknown> }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="overflow-hidden h-full hover:shadow-md transition-all">
        <div className="aspect-[16/9] bg-muted relative overflow-hidden">
          {(article as { cover_image_url?: string }).cover_image_url ? (
            <img
              src={(article as { cover_image_url: string }).cover_image_url}
              alt={article.title as string}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <Sun className="h-10 w-10" />
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            {(article as { category_title?: string }).category_title || 'Article'}
          </p>
          <h3 className="font-heading font-semibold mt-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title as string}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {(article as { short_description?: string }).short_description || ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group">
      <Card className="overflow-hidden h-full hover:shadow-md transition-all">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {(project as { cover_image?: string }).cover_image ? (
            <img
              src={(project as { cover_image: string }).cover_image}
              alt={project.title as string}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <Sun className="h-10 w-10" />
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {project.project_type as string}
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">{(project as { capacity: number }).capacity} kW</span>
          </div>
          <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">
            {project.title as string}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{project.location as string}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: featured, isLoading: projectsLoading, error: projectsError } = useFeaturedProjects();
  const { data: articlesData, isLoading: articlesLoading, error: articlesError } = useArticles({ is_featured: 'true' });
  const { data: servicesData, isLoading: servicesLoading } = useServices();

  const articles = Array.isArray(articlesData?.results) ? articlesData.results : (Array.isArray(articlesData) ? articlesData : []);
  const projects = Array.isArray(featured?.results) ? featured.results : (Array.isArray(featured) ? featured : []);
  const services = Array.isArray(servicesData?.results) ? servicesData.results : (Array.isArray(servicesData) ? servicesData : []);

  return (
    <div className="flex flex-col">
      {/* ===== 1. HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="container-page relative z-10 py-24 w-full">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Professional Solar Energy Solutions
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance mb-6">
              {settings?.hero_title || 'Powering the Future with Solar Energy'}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-10">
              {settings?.hero_subtitle || 'From design to commissioning — we deliver turnkey solar power plants for residential, commercial, and utility-scale projects.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8"
              >
                Calculate Solar System
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 text-white hover:bg-white/10 h-12 px-8"
              >
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. TRUST / STATISTICS ===== */}
      <section className="section-padding bg-muted/30 border-y">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/50 -mx-6">
            <StatCard icon={Zap} value="25 MW+" label="Installed Capacity" />
            <StatCard icon={Building2} value="150+" label="Completed Projects" />
            <StatCard icon={Shield} value="10+" label="Years Experience" />
            <StatCard icon={Users} value="98%" label="Client Satisfaction" />
          </div>
        </div>
      </section>

      {/* ===== 3. ABOUT ===== */}
      <section className="section-padding">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">About AbrEnergy</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Engineering the <span className="text-primary">Energy Transition</span>
              </h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>{settings?.about_us || 'AbrEnergy is a leading solar energy company specializing in the design, engineering, and construction of solar power plants. We provide end-to-end solutions for residential, commercial, and utility-scale projects.'}</p>
                <p>Our team of experienced engineers and project managers ensures every installation meets international standards, delivering reliable and cost-effective solar energy systems.</p>
              </div>
              <Link href="/about" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-8">Learn More <ArrowRight className="ml-2 h-4" /></Link>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/10 flex items-center justify-center border">
                <div className="text-center">
                  <Globe className="h-20 w-20 text-primary/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Sustainable Energy Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. SERVICES ===== */}
      <section className="section-padding bg-muted/30">
        <div className="container-page">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">What We Do</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Comprehensive solar energy solutions from design to commissioning</p>
          </div>

          {servicesLoading ? (
            <CardLoading count={3} />
          ) : services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.slice(0, 6).map((s: Record<string, unknown>) => (
                <ServiceCard
                  key={s.id as string}
                  icon={Sun}
                  title={s.title as string}
                  desc={s.short_description as string}
                  href={`/services/${s.slug}`}
                />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <ServiceCard icon={Sun} title="Solar Design & EPC" desc="Complete engineering, procurement, and construction services for solar power plants." href="/services" />
              <ServiceCard icon={Zap} title="On Grid Systems" desc="Grid-tied solar systems for residential, commercial, and industrial applications." href="/services" />
              <ServiceCard icon={Shield} title="Off Grid Systems" desc="Independent solar power systems with battery storage for remote locations." href="/services" />
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">View All Services <ArrowRight className="ml-2 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* ===== 5. FEATURED PROJECTS ===== */}
      <section className="section-padding">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our Work</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">Featured Projects</h2>
            </div>
            <Link href="/projects" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">View All <ArrowRight className="ml-2 h-4" /></Link>
          </div>

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
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <p>No projects published yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== 6. CALCULATOR CTA ===== */}
      <section className="section-padding bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container-page text-center">
          <Calculator className="h-12 w-12 mx-auto mb-6 text-white/80" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-balance">
            Design Your Solar System
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Use our solar calculator to estimate system size, battery capacity, inverter power, and return on investment for your project.
          </p>
          <Link href="/calculator" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 hover:bg-amber-600 text-black h-12 px-10">Start Calculator</Link>
        </div>
      </section>

      {/* ===== 7. ARTICLES ===== */}
      {articles.length > 0 && (
        <section className="section-padding">
          <div className="container-page">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Insights</p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold">Latest Articles</h2>
              </div>
              <Link href="/articles" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">View All <ArrowRight className="ml-2 h-4" /></Link>
            </div>

            {articlesLoading ? (
              <CardLoading count={3} />
            ) : articlesError ? (
              <ErrorState title="Failed to load articles" message="Could not load latest articles." />
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
      <section className="section-padding bg-muted/30 border-t">
        <div className="container-page text-center">
          <Phone className="h-12 w-12 mx-auto mb-6 text-primary" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-balance">
            Ready to Start Your Solar Project?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Contact our team today for a free consultation and a personalized solar solution tailored to your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">Contact Us</Link>
            <Link href="/contact" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-8">Request a Quote</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

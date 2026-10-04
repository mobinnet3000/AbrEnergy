'use client';
import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowLeft, Sparkles, Sun, Zap, Wrench } from 'lucide-react';
import { useFeaturedPublicProducts, usePublicProductCategories, useSiteSettings } from '@/hooks/use-api';
import { Hero3D, TextReveal } from '@/components/home';
import { HomepageShowcase } from '@/components/home/HomepageShowcase';
import { FloatingVisuals } from '@/components/home/FloatingVisuals';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageHero, HomepageVisual, ProductCategory, ProductListItem } from '@/types';

const HERO_POINTS = [
  { key: 'home.hero_point_1', Icon: Sun },
  { key: 'home.hero_point_2', Icon: Zap },
  { key: 'home.hero_point_3', Icon: Wrench },
] as const;

/**
 * Phase 12.1 — intended first-viewport navigation (Reference B §3).
 * Real routes only: downloads maps to the media gallery (the site's
 * document/image hub — no dedicated downloads page exists and none is
 * invented); the off-grid calculator maps to the existing calculator.
 */
const SHOWCASE_NAV = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/products', labelKey: 'nav.products' },
  { href: '/services', labelKey: 'nav.services' },
  { href: '/projects', labelKey: 'nav.projects' },
  { href: '/gallery', labelKey: 'nav.downloads' },
  { href: '/calculator', labelKey: 'nav.calculator_offgrid' },
  { href: '/contact', labelKey: 'nav.contact' },
] as const;

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function featuredItems(data: unknown): ProductListItem[] {
  if (Array.isArray(data)) return data as ProductListItem[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ProductListItem[] }).results;
  }
  return [];
}

function categoryRoots(data: unknown): ProductCategory[] {
  if (Array.isArray(data)) return data as ProductCategory[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ProductCategory[] }).results;
  }
  return [];
}

/**
 * Phase 7 — accepts optional CMS hero content with full fallback.
 * Phase 12 — recomposed into a 2-zone RTL hero (text + product stage).
 * Phase 12.1 — recomposed into the Reference-B first viewport: a compact
 * light editorial composition where the brand/slogan zone, intended
 * navigation, main visual stage, instant-suggestion panel, and category
 * strip are ALL visible without scrolling past a giant hero.
 *
 * CMS logic, Hero3D (kept mounted, visually subordinate), TextReveal,
 * FloatingVisuals, and CTA handling are preserved. The exact H1 slogan
 * stays in this upper section (regression-guarded by tests).
 */
export function HeroSection({
  hero,
  featured,
  visuals,
  categories,
}: {
  hero?: HomepageHero | null;
  featured?: ProductListItem[] | null;
  visuals?: HomepageVisual[] | null;
  categories?: ProductCategory[] | null;
}) {
  const { t } = useLocale();
  const { data: settings } = useSiteSettings();
  const { data: featuredData } = useFeaturedPublicProducts();
  const { data: categoriesData } = usePublicProductCategories();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // A CMS-disabled hero renders nothing (section visibility rule).
  if (hero && hero.enabled === false) return null;

  const eyebrowDefault = `${settings?.company_name_en || 'AbrEnergy'} — ${settings?.company_name || 'ابر انرژی'}`;
  const eyebrow = hero ? homepageCopy(hero.eyebrow, eyebrowDefault) : eyebrowDefault;
  const slogan = hero ? homepageCopy(hero.title, t('home.hero_slogan')) : t('home.hero_slogan');
  const leadDefault = (settings?.hero_subtitle as string) || t('home.hero_lead');
  const lead = hero ? homepageCopy(hero.subtitle, leadDefault) : leadDefault;

  const primary = hero?.primary_cta;
  const secondary = hero?.secondary_cta;
  const showPrimary = !hero || primary?.enabled !== false;
  const showSecondary = !hero || secondary?.enabled !== false;
  const primaryLabel = hero ? homepageCopy(primary?.label, t('home.hero_cta_products')) : t('home.hero_cta_products');
  const primaryUrl = hero && primary?.url?.trim() ? primary.url : '/products';
  const secondaryLabel = hero ? homepageCopy(secondary?.label, t('home.cta_calculator')) : t('home.cta_calculator');
  const secondaryUrl = hero && secondary?.url?.trim() ? secondary.url : '/calculator';

  return (
    <HeroInner
      heroRef={heroRef}
      heroOpacity={heroOpacity}
      eyebrow={eyebrow}
      slogan={slogan}
      lead={lead}
      showPrimary={showPrimary}
      showSecondary={showSecondary}
      primaryLabel={primaryLabel}
      primaryUrl={primaryUrl}
      secondaryLabel={secondaryLabel}
      secondaryUrl={secondaryUrl}
      featured={featured}
      featuredData={featuredData}
      categories={categories}
      categoriesData={categoriesData}
      visuals={visuals}
    />
  );
}

function HeroInner({
  heroRef,
  heroOpacity,
  eyebrow,
  slogan,
  lead,
  showPrimary,
  showSecondary,
  primaryLabel,
  primaryUrl,
  secondaryLabel,
  secondaryUrl,
  featured,
  featuredData,
  categories,
  categoriesData,
  visuals,
}: {
  heroRef: React.RefObject<HTMLElement | null>;
  heroOpacity: MotionValue<number>;
  eyebrow: string;
  slogan: string;
  lead: string;
  showPrimary: boolean;
  showSecondary: boolean;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  featured?: ProductListItem[] | null;
  featuredData: unknown;
  categories?: ProductCategory[] | null;
  categoriesData: unknown;
  visuals?: HomepageVisual[] | null;
}) {
  const { t } = useLocale();
  const products = useMemo<ProductListItem[]>(() => {
    if (featured !== undefined && featured !== null) return featured;
    return featuredItems(featuredData);
  }, [featured, featuredData]);
  const categoryList = useMemo<ProductCategory[]>(() => {
    if (categories !== undefined && categories !== null) return categories;
    return categoryRoots(categoriesData);
  }, [categories, categoriesData]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity }}
      data-section="hero"
      aria-labelledby="homepage-hero-heading"
      className="showcase-light relative overflow-hidden bg-[#f4f5f1] text-neutral-900"
    >
      {/* Hero3D is preserved but subordinate to the light editorial
          composition: a faint technical field behind the frames. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <Hero3D />
      </div>
      {/* Horizon light line: solar/energy identity across the composition. */}
      <div aria-hidden className="absolute inset-x-0 top-0">
        <div className="h-1 bg-gradient-to-l from-transparent via-amber-400/70 to-transparent" />
      </div>
      <div aria-hidden className="absolute inset-x-0 top-[76px] hidden lg:block">
        <div className="mx-auto h-px max-w-6xl bg-gradient-to-l from-transparent via-neutral-900/20 to-transparent" />
      </div>

      {/* Floating visuals composed inside the hero (not page-scattered). */}
      <FloatingVisuals visuals={visuals ?? null} />

      <div className="container-page relative z-10 w-full pb-8 pt-24 md:pb-10 md:pt-28">
        {/* BRAND / SLOGAN ZONE — visible in the first viewport. */}
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-900/20 bg-white px-4 py-1.5 text-sm"
          >
            <Sparkles className="h-4 w-4 text-emerald-700" aria-hidden />
            <span className="text-neutral-600">{eyebrow}</span>
          </motion.div>

          <motion.h1
            id="homepage-hero-heading"
            data-testid="hero-slogan"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="hero-slogan-display font-heading text-3xl tracking-tight sm:text-4xl lg:text-5xl"
          >
            <span className="bg-gradient-to-l from-emerald-800 via-green-700 to-teal-700 bg-clip-text text-transparent">
              <TextReveal text={slogan} delay={0.2} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-3 max-w-3xl text-base leading-8 text-neutral-600 md:text-lg"
          >
            {lead}
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 flex flex-wrap gap-2"
            aria-label={t('home.hero_badge')}
          >
            {HERO_POINTS.map(({ key, Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-900/15 bg-white px-3.5 py-1.5 text-sm text-neutral-700"
              >
                <Icon className="h-4 w-4 text-emerald-700" aria-hidden />
                {t(key)}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-5 flex flex-wrap gap-3"
          >
            {showPrimary && (
              isExternalUrl(primaryUrl) ? (
                <a href={primaryUrl} target="_blank" rel="noopener noreferrer" data-testid="hero-cta-primary" className="group inline-flex items-center justify-center rounded-xl bg-emerald-700 px-7 py-3 text-base font-bold text-white transition hover:bg-emerald-600 active:scale-[0.97]">
                  <span className="flex items-center gap-2">
                    {primaryLabel} <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                  </span>
                </a>
              ) : (
                <Link href={primaryUrl} data-testid="hero-cta-primary" className="group inline-flex items-center justify-center rounded-xl bg-emerald-700 px-7 py-3 text-base font-bold text-white transition hover:bg-emerald-600 active:scale-[0.97]">
                  <span className="flex items-center gap-2">
                    {primaryLabel} <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                  </span>
                </Link>
              )
            )}
            {showSecondary && (
              isExternalUrl(secondaryUrl) ? (
                <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" data-testid="hero-cta-secondary" className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-900/25 bg-white px-7 py-3 text-base font-bold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.97]">
                  {secondaryLabel}
                </a>
              ) : (
                <Link href={secondaryUrl} data-testid="hero-cta-secondary" className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-900/25 bg-white px-7 py-3 text-base font-bold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.97]">
                  {secondaryLabel}
                </Link>
              )
            )}
          </motion.div>
        </div>

        {/* MAIN NAVIGATION — RTL strip directly under the brand zone. */}
        <motion.nav
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          aria-label={t('home.hero_badge')}
          data-testid="showcase-nav"
          className="mt-6 overflow-x-auto border-y-2 border-neutral-900/80 bg-white/70"
        >
          <ul className="flex min-w-max items-stretch gap-0">
            {SHOWCASE_NAV.map((item) => (
              <li key={item.href + item.labelKey} className="flex">
                <Link
                  href={item.href}
                  className="whitespace-nowrap border-e border-neutral-900/10 px-4 py-3 text-sm font-bold text-neutral-800 transition last:border-e-0 hover:bg-neutral-900 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>

        {/* MAIN SHOWCASE — visual stage + instant panel + category strip. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-5 min-w-0"
        >
          <HomepageShowcase products={products} categories={categoryList} visuals={visuals} />
        </motion.div>
      </div>
    </motion.section>
  );
}

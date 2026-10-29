'use client';
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowLeft, Sparkles, Sun, Zap, Wrench } from 'lucide-react';
import { useFeaturedPublicProducts, useSiteSettings } from '@/hooks/use-api';
import { TextReveal } from '@/components/home/ScrollReveal';
import { HomepageShowcase } from '@/components/home/HomepageShowcase';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import { isHomepagePreviewEnabled, previewCategories, previewProducts, previewVisuals } from '@/lib/homepage-preview';
import type { HomepageHero, HomepageVisual, ProductCategory, ProductListItem } from '@/types';

// Phase 12.4 — Hero3D (three.js, ~600kB) must not block first paint. It is
// code-split and only mounted after hydration on capable devices; the hero
// shell, slogan, nav, and showcase render immediately without it.
const Hero3DLazy = lazy(() => import('@/components/home/Hero3D').then((m) => ({ default: m.Hero3D })));

const HERO_POINTS = [
  { key: 'home.hero_point_1', Icon: Sun },
  { key: 'home.hero_point_2', Icon: Zap },
  { key: 'home.hero_point_3', Icon: Wrench },
] as const;

/**
 * Phase 12.5 — the global header owns primary navigation (see
 * navigationConfig). No homepage-only duplicate strip: it repeated the
 * same destinations beneath the slogan and broke visual hierarchy.
 */
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
  // CMS payload already carries featured products; skip duplicate fetch then.
  const { data: featuredData } = useFeaturedPublicProducts(undefined, { enabled: featured === undefined || featured === null });
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // A CMS-disabled hero renders nothing (section visibility rule).
  if (hero && hero.enabled === false) return null;

  const eyebrowDefault = `${settings?.company_name_en || 'AbarEnergy'} — ${settings?.company_name || 'ابر انرژی'}`;
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
  visuals?: HomepageVisual[] | null;
}) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [mount3D, setMount3D] = useState(false);
  // Mount guard (same pattern as header.tsx): SSR renders plain readable
  // text; the client upgrades to TextReveal + idle WebGL after hydration.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  // Phase 12.4 — defer heavy WebGL until idle, desktop only.
  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const mount = () => setMount3D(true);
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) {
      const id = ric(mount, { timeout: 2500 });
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      return () => cic?.(id);
    }
    const id = window.setTimeout(mount, 1200);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);
  const preview = isHomepagePreviewEnabled();
  const products = useMemo<ProductListItem[]>(() => {
    if (featured !== undefined && featured !== null) return featured.length > 0 || !preview ? featured : previewProducts;
    const hook = featuredItems(featuredData);
    if (hook.length > 0) return hook;
    return preview ? previewProducts : hook;
  }, [featured, featuredData, preview]);
  const categoryList = useMemo<ProductCategory[]>(() => {
    if (categories !== undefined && categories !== null) return categories.length > 0 || !preview ? categories : previewCategories;
    return preview ? previewCategories : [];
  }, [categories, preview]);
  const visualList = useMemo<HomepageVisual[] | null | undefined>(() => {
    if (visuals !== undefined && visuals !== null) return visuals.length > 0 || !preview ? visuals : previewVisuals;
    return preview ? previewVisuals : visuals;
  }, [visuals, preview]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity }}
      data-section="hero"
      aria-labelledby="homepage-hero-heading"
      className="showcase-light relative overflow-hidden bg-gradient-to-b from-white via-[#f4f5f1] to-white text-neutral-900 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100"
    >
      {/* Hero3D preserved, deferred: code-split, desktop + idle only, faint behind content. */}
      {mount3D && (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14] dark:opacity-[0.22]">
          <Suspense fallback={null}>
            <Hero3DLazy />
          </Suspense>
        </div>
      )}
      {/* Horizon light line: solar/energy identity across the composition. */}
      <div aria-hidden className="absolute inset-x-0 top-0">
        <div className="h-1 bg-gradient-to-l from-transparent via-amber-400/70 to-transparent" />
      </div>
      <div aria-hidden className="absolute inset-x-0 top-[76px] hidden lg:block">
        <div className="mx-auto h-px max-w-6xl bg-gradient-to-l from-transparent via-neutral-900/20 to-transparent dark:via-white/15" />
      </div>

      {/* Floating visuals composed inside the showcase (not page-scattered). */}
      <div className="container-page relative z-10 w-full pb-10 pt-24 md:pb-14 md:pt-32 xl:max-w-[96rem]">
        {/* BRAND ZONE — centered masthead ABOVE the stage. H1 focal,
            CTAs inline so first viewport reads: slogan → actions → showcase.
            Navigation lives ONLY in the global header. */}
        <div data-testid="brand-slogan-bar" className="mx-auto min-w-0 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-700/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>{eyebrow}</span>
          </motion.div>

          <motion.h1
            id="homepage-hero-heading"
            data-testid="hero-slogan"
            initial={mounted ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="hero-slogan-display w-full text-center font-heading text-[clamp(1.35rem,4.5vw,3.75rem)] font-extrabold leading-[1.7] tracking-tight text-neutral-950 lg:text-5xl xl:text-6xl dark:text-white"
          >
            {mounted ? <TextReveal text={slogan} delay={0.2} /> : <span>{slogan}</span>}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-3 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg sm:leading-9 dark:text-neutral-300"
          >
            {lead}
          </motion.p>

          {(showPrimary || showSecondary) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-5 flex flex-wrap items-center justify-center gap-2"
            >
              {showPrimary && (
                isExternalUrl(primaryUrl) ? (
                  <a href={primaryUrl} target="_blank" rel="noopener noreferrer" data-testid="hero-cta-primary" className="group inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.97]">
                    <span className="flex items-center gap-2">
                      {primaryLabel} <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                    </span>
                  </a>
                ) : (
                  <Link href={primaryUrl} data-testid="hero-cta-primary" className="group inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.97]">
                    <span className="flex items-center gap-2">
                      {primaryLabel} <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                    </span>
                  </Link>
                )
              )}
              {showSecondary && (
                isExternalUrl(secondaryUrl) ? (
                  <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" data-testid="hero-cta-secondary" className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-900/25 bg-white px-6 py-2.5 text-sm font-bold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.97] dark:border-white/25 dark:bg-transparent dark:text-neutral-100 dark:hover:border-white dark:hover:text-white">
                    {secondaryLabel}
                  </a>
                ) : (
                  <Link href={secondaryUrl} data-testid="hero-cta-secondary" className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-900/25 bg-white px-6 py-2.5 text-sm font-bold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.97] dark:border-white/25 dark:bg-transparent dark:text-neutral-100 dark:hover:border-white dark:hover:text-white">
                    {secondaryLabel}
                  </Link>
                )
              )}
            </motion.div>
          )}

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 flex flex-wrap justify-center gap-2"
            aria-label={t('home.hero_badge')}
          >
            {HERO_POINTS.map(({ key, Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900/15 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 dark:border-white/15 dark:bg-white/10 dark:text-neutral-200"
              >
                <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
                {t(key)}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* MAIN SHOWCASE — dominant full-width stage below masthead. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative mt-8 min-w-0 md:mt-10"
        >
          <HomepageShowcase products={products} categories={categoryList} visuals={visualList} />
        </motion.div>
      </div>
    </motion.section>
  );
}

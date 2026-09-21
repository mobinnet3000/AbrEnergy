'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Sparkles, Sun, Zap, Wrench } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-api';
import { Hero3D, TextReveal } from '@/components/home';
import { useLocale } from '@/i18n';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageHero } from '@/types';

const HERO_POINTS = [
  { key: 'home.hero_point_1', Icon: Sun },
  { key: 'home.hero_point_2', Icon: Zap },
  { key: 'home.hero_point_3', Icon: Wrench },
] as const;

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Phase 7 — accepts optional CMS hero content. Every CMS string falls back
 * to the pre-CMS source (locale strings / site settings) so the visual
 * output is identical until editors publish CMS copy. Visual/animation
 * system below is untouched.
 */
export function HeroSection({ hero }: { hero?: HomepageHero | null }) {
  const { t } = useLocale();
  const { data: settings } = useSiteSettings();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);

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
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity }}
      data-section="hero"
      aria-labelledby="homepage-hero-heading"
      className="relative min-h-screen flex items-center bg-black text-white overflow-hidden"
    >
      <Hero3D />

      {/* Solar grid overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03]" aria-hidden>
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

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black z-[1]" aria-hidden />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent z-[1]" aria-hidden />

      <motion.div style={{ y: heroY, scale: heroScale }} className="container-page relative z-10 py-32 w-full">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-sm mb-10"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden />
            <span className="text-white/70">{eyebrow}</span>
          </motion.div>

          <motion.h1
            id="homepage-hero-heading"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
              <TextReveal text={slogan} delay={0.4} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed mb-8"
          >
            {lead}
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-wrap gap-2.5 mb-12"
            aria-label={t('home.hero_badge')}
          >
            {HERO_POINTS.map(({ key, Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
                {t(key)}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-wrap gap-5"
          >
            {showPrimary && (
              isExternalUrl(primaryUrl) ? (
                <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500 active:scale-[0.97]">
                  <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-700" aria-hidden />
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" aria-hidden />
                  <span className="relative z-10 flex items-center gap-2.5 text-white">
                    {primaryLabel} <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1.5 transition-transform duration-300" aria-hidden />
                  </span>
                </a>
              ) : (
                <Link href={primaryUrl} className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500 active:scale-[0.97]">
                  <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-700" aria-hidden />
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" aria-hidden />
                  <span className="relative z-10 flex items-center gap-2.5 text-white">
                    {primaryLabel} <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1.5 transition-transform duration-300" aria-hidden />
                  </span>
                </Link>
              )
            )}
            {showSecondary && (
              isExternalUrl(secondaryUrl) ? (
                <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all duration-500 active:scale-[0.97]">
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.04]" aria-hidden />
                  <span className="relative z-10">{secondaryLabel}</span>
                </a>
              ) : (
                <Link href={secondaryUrl} className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-2xl overflow-hidden border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all duration-500 active:scale-[0.97]">
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.04]" aria-hidden />
                  <span className="relative z-10">{secondaryLabel}</span>
                </Link>
              )
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}

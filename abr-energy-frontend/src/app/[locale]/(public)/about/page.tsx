'use client';
import { ArrowLeft, Sun, Leaf, Zap, Shield, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import type { SiteSettings } from '@/types';
import { InternalPageShell, InternalPageHeader } from '@/components/shared';

/* ---- Value Card ---- */
function ValueCard({ icon: Icon, title, desc, delay }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; delay: number }) {
  return (
    <ScrollReveal variant="slide-up" delay={delay}>
      <div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70 h-full flex flex-col">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300 shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
      </div>
    </ScrollReveal>
  );
}

/* ---- Story Section ---- */
function StoryBlock({ title, desc, index }: { title: string; desc: string; index: number }) {
  const { t } = useLocale();
  const isReversed = index % 2 === 1;
  return (
    <ScrollReveal variant={isReversed ? 'slide-right' : 'slide-left'}>
      <div className={`grid md:grid-cols-2 gap-8 md:gap-16 items-center ${isReversed ? 'md:flex-row-reverse' : ''}`}>
        <div className={isReversed ? 'md:order-2' : ''}>
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">
            {[t('about.story_label'), t('about.story_title_2'), t('about.story_title_3')][index]}
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{desc}</p>
        </div>
        <div className={`aspect-[4/3] rounded-2xl border border-border/80 bg-muted/40 flex items-center justify-center dark:border-white/10 ${isReversed ? 'md:order-1' : ''}`}>
          <Globe className="h-16 w-16 text-primary/30" />
        </div>
      </div>
    </ScrollReveal>
  );
}

export default function AboutPage() {
  const { t } = useLocale();
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => axiosInstance.get('/site-config/').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const aboutDescription = settings?.about_us?.split('.')[0] || t('home.about_lead');

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('nav.about') },
            ]}
            eyebrow={t('about.subtitle')}
            title={t('home.about_title')}
            subtitle={aboutDescription}
            actions={
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-strong active:scale-[0.98] transition-all duration-300 shadow-md shadow-primary/15"
              >
                {t('about.get_in_touch')} <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            }
          />
        </div>
      </section>

      {/* ===== COMPANY VALUES ===== */}
      <section className="py-16 sm:py-20 md:py-24 border-t border-border/60 dark:border-white/[0.06]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                {t('about.values_label')}
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t('about.values_title')}</h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-3">{t('about.values_desc')}</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ValueCard icon={Sun} title={t('about.value_clean_energy')} desc={t('about.value_clean_energy_desc')} delay={0.1} />
            <ValueCard icon={Zap} title={t('about.value_innovation')} desc={t('about.value_innovation_desc')} delay={0.15} />
            <ValueCard icon={Leaf} title={t('about.value_sustainability')} desc={t('about.value_sustainability_desc')} delay={0.2} />
            <ValueCard icon={Shield} title={t('about.value_reliability')} desc={t('about.value_reliability_desc')} delay={0.25} />
          </div>
        </div>
      </section>

      {/* ===== STORY BLOCKS ===== */}
      <section className="py-16 sm:py-20 md:py-24 border-t border-border/60 dark:border-white/[0.06] overflow-hidden">
        <div className="container-page space-y-16 sm:space-y-24">
          <StoryBlock
            index={0}
            title={t('about.story_title_1')}
            desc={t('about.story_desc_1')}
          />
          <StoryBlock
            index={1}
            title={t('about.story_title_2')}
            desc={t('about.story_desc_2')}
          />
          <StoryBlock
            index={2}
            title={t('about.story_title_3')}
            desc={t('about.story_desc_3')}
          />
        </div>
      </section>

      {/* ===== IMPACT SECTION ===== */}
      <section className="py-16 sm:py-20 md:py-24 border-t border-border/60 dark:border-white/[0.06]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                {t('about.impact_label')}
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t('about.impact_title')}</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: t('about.impact_environmental'), desc: t('about.impact_environmental_desc') },
              { icon: Zap, title: t('about.impact_technology'), desc: t('about.impact_technology_desc') },
              { icon: Globe, title: t('about.impact_future'), desc: t('about.impact_future_desc') },
            ].map((item, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.1}>
                <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card shadow-xs dark:border-white/10 dark:bg-card/70 h-full hover:border-primary/40 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 md:py-24 border-t border-border/60 dark:border-white/[0.06]">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <div className="rounded-2xl border border-border/80 bg-card/60 p-8 sm:p-12 shadow-xs dark:border-white/10 dark:bg-card/40 max-w-3xl mx-auto">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">{t('about.cta_title')}</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-8">{t('about.cta_desc')}</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-strong active:scale-[0.98] transition-all duration-300 shadow-md shadow-primary/15"
              >
                {t('contact.title')} <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </InternalPageShell>
  );
}

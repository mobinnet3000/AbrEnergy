'use client';
import { useRef, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sun, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import { useSiteSettings } from '@/hooks/use-api';

const sr = (seed: number) => { const x = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5; return x - Math.floor(x); };

function EnergyFlowSVG() {
  return (
    <svg viewBox="0 0 500 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="aboutSun" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#059669" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0" />
          <stop offset="50%" stopColor="#34D399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="270" r="200" fill="url(#aboutSun)">
        <animate attributeName="r" values="180;220;180" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="270" r="30" fill="#10B981" opacity="0.7">
        <animate attributeName="r" values="28;34;28" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="270" r="14" fill="#A7F3D0" opacity="0.9" />
      {[1, 2, 3].map((i) => (
        <ellipse key={i} cx="250" cy="270" rx={65 + i * 35} ry={22 + i * 12} fill="none" stroke="#34D399" strokeWidth="0.4" opacity={0.18 - i * 0.04} transform={`rotate(${i * 25}, 250, 270)`}>
          <animateTransform attributeName="transform" type="rotate" from={`${i * 25} 250 270`} to={`${i * 25 + 360} 250 270`} dur={`${9 + i * 3}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i * 36 * Math.PI) / 180;
        // Phase 12.4 — string coords: React SSR serializes numbers with
        // different float precision than the client, causing a hydration
        // mismatch on these beam lines. Fixed-point strings match exactly.
        const x2 = (250 + Math.cos(angle) * 150).toFixed(4);
        const y2 = (270 + Math.sin(angle) * 150).toFixed(4);
        return (
          <line key={i} x1="250" y1="270" x2={x2} y2={y2} stroke="url(#beam)" strokeWidth="1.2" opacity={0.12}>
            <animate attributeName="opacity" values="0.04;0.2;0.04" dur={`${2 + (i % 4)}s`} begin={`${i * 0.25}s`} repeatCount="indefinite" />
          </line>
        );
      })}
      {[20, 45, 78, 110, 135, 160, 190, 215, 240, 265, 290, 320, 345, 370, 395, 420].map((s, i) => (
        <circle key={i} cx={(100 + ((sr(s) * 1000) % 300)).toFixed(2)} cy={(100 + ((sr(s + 50) * 1000) % 400)).toFixed(2)} r={(1.5 + (sr(s + 100) * 1000) % 20 / 10).toFixed(2)} fill="#34D399" opacity={(0.2 + (sr(s + 150) * 1000) % 30 / 100).toFixed(3)}>
          <animate attributeName="cy" values={`${(100 + ((sr(s + 50) * 1000) % 400)).toFixed(2)};${(100 + ((sr(s + 50) * 1000) % 400) - 20 - (sr(s + 200) * 1000) % 30).toFixed(2)};${(100 + ((sr(s + 50) * 1000) % 400)).toFixed(2)}`} dur={`${3 + (sr(s + 250) * 1000) % 4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function TimelineItem({ icon: Icon, title, desc, delay, isRTL }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; delay: number; isRTL: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className="group relative flex items-start gap-5 p-4 rounded-2xl hover:bg-neutral-100 transition-colors duration-500 dark:hover:bg-white/[0.03]"
    >
      <div className="relative flex flex-col items-center">
        <div className="w-11 h-11 rounded-xl bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 dark:bg-emerald-500/15 dark:border-emerald-500/20">
          <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
        </div>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className="w-px h-10 bg-gradient-to-b from-emerald-500/25 to-transparent origin-top"
        />
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-heading font-semibold text-base text-neutral-900 mb-1 group-hover:text-emerald-700 transition-colors duration-300 dark:text-white dark:group-hover:text-emerald-400">{title}</h4>
        <p className="text-neutral-600 text-sm leading-relaxed dark:text-neutral-400">{desc}</p>
      </div>
    </motion.div>
  );
}

export function AboutSection() {
  const { data: settings } = useSiteSettings();
  const { locale, isRTL, t } = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  const items = useMemo(() => {
    if (locale === 'fa') return [
      { icon: Sun, title: 'ماموریت ما', desc: 'تولید انرژی پاک و تجدیدپذیر برای همه' },
      { icon: Eye, title: 'چشم‌انداز', desc: 'پیشرو در تحول انرژی خاورمیانه' },
      { icon: Heart, title: 'ارزش‌های ما', desc: 'نوآوری، پایداری، تعهد به کیفیت' },
    ];
    if (locale === 'ar') return [
      { icon: Sun, title: 'مهمتنا', desc: 'توفير الطاقة النظيفة والمتجددة للجميع' },
      { icon: Eye, title: 'رؤيتنا', desc: 'الريادة في تحول الطاقة في الشرق الأوسط' },
      { icon: Heart, title: 'قيمنا', desc: 'الابتكار والاستدامة والالتزام بالجودة' },
    ];
    return [
      { icon: Sun, title: 'Our Mission', desc: 'To make clean, renewable energy accessible to everyone' },
      { icon: Eye, title: 'Our Vision', desc: 'To lead the energy transition across the Middle East' },
      { icon: Heart, title: 'Our Values', desc: 'Innovation, sustainability, and unwavering quality' },
    ];
  }, [locale]);

  const subtitle = t('home.about_subtitle');

  return (
    <section ref={sectionRef} data-testid="about-section" className="relative overflow-hidden bg-white py-16 md:py-24 dark:bg-neutral-950">
      {/* Parallax background — theme-adaptive washes, no forced black. */}
      <motion.div style={{ y: bgY }} className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-transparent to-amber-50/40 dark:from-emerald-950/20 dark:via-transparent dark:to-black" />
        <div className="absolute top-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[130px] dark:bg-emerald-500/10" />
        <div className="absolute bottom-1/4 right-1/3 h-[320px] w-[320px] rounded-full bg-amber-400/10 blur-[110px] dark:bg-blue-500/10" />
      </motion.div>

      <div className="container-page relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left — Energy SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
          >
            <div className="aspect-[5/6] max-w-md mx-auto lg:mx-0 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/8 via-transparent to-transparent rounded-full blur-[80px]" />
              <EnergyFlowSVG />
            </div>
          </motion.div>

          {/* Right — Content */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-[0.2em] mb-5 dark:text-emerald-400/80">{subtitle}</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-neutral-950 leading-[1.2] mb-6 dark:text-white">
                {t('home.about_title_prefix')}{' '}
                <span className="bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-green-400 dark:to-teal-300">{t('home.about_title_highlight')}</span>
              </h2>
              <p className="text-base md:text-lg text-neutral-600 max-w-xl leading-relaxed mb-12 dark:text-neutral-400">
                {settings?.about_us || t('home.about_text')}
              </p>
            </motion.div>

            <div className="space-y-1">
              {items.map((item, i) => (
                <TimelineItem key={i} {...item} delay={0.2 + i * 0.15} isRTL={isRTL} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="mt-10"
            >
              <Link
                href="/about"
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-neutral-900/15 bg-white hover:bg-neutral-100 hover:border-emerald-700/30 transition-all duration-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-emerald-500/20"
              >
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('home.about_cta')}</span>
                <ArrowRight className={`h-4 w-4 text-emerald-700 group-hover:translate-x-1 transition-transform duration-300 dark:text-emerald-400 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useRef, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sun, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import { useSiteSettings } from '@/hooks/use-api';

// Seeded random for stable SVG particle positions
const sr = (seed: number) => { const x = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5; return x - Math.floor(x); };

function EnergyFlowSVG() {
  return (
    <svg viewBox="0 0 500 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#059669" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0" />
          <stop offset="50%" stopColor="#34D399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="250" cy="270" r="200" fill="url(#sunGlow)">
        <animate attributeName="r" values="180;220;180" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Central sun */}
      <circle cx="250" cy="270" r="30" fill="#10B981" opacity="0.8">
        <animate attributeName="r" values="28;34;28" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="270" r="15" fill="#A7F3D0" opacity="0.9" />

      {/* Orbiting energy rings */}
      {[1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx="250" cy="270"
          rx={70 + i * 40} ry={25 + i * 15}
          fill="none"
          stroke="#34D399"
          strokeWidth="0.5"
          opacity={0.2 - i * 0.04}
          transform={`rotate(${i * 30}, 250, 270)`}
        >
          <animateTransform attributeName="transform" type="rotate" from={`${i * 30} 250 270`} to={`${i * 30 + 360} 250 270`} dur={`${10 + i * 3}s`} repeatCount="indefinite" />
        </ellipse>
      ))}

      {/* Energy beams radiating out */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x2 = 250 + Math.cos(angle) * 160;
        const y2 = 270 + Math.sin(angle) * 160;
        return (
          <line key={i} x1="250" y1="270" x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="1.5" opacity={0.15} filter="url(#glow)">
            <animate attributeName="opacity" values="0.05;0.25;0.05" dur={`${2 + (i % 3)}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="0.5;2;0.5" dur={`${3 + (i % 2)}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Floating particles */}
      {[20, 45, 78, 110, 135, 160, 190, 215, 240, 265, 290, 320, 345, 370, 395, 420, 450, 475, 500, 530].map((s, i) => {
        const cx = 100 + ((sr(s) * 1000) % 300);
        const cy = 100 + ((sr(s + 50) * 1000) % 400);
        const r = 1.5 + (sr(s + 100) * 1000) % 20 / 10;
        const opacity = 0.2 + (sr(s + 150) * 1000) % 30 / 100;
        const drift = 20 + (sr(s + 200) * 1000) % 40;
        const dur1 = 3 + (sr(s + 250) * 1000) % 4;
        const dur2 = 3 + (sr(s + 300) * 1000) % 3;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#34D399" opacity={opacity}>
            <animate attributeName="cy" values={`${cy};${cy - drift};${cy}`} dur={`${dur1}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values={`${opacity - 0.1};${opacity + 0.15};${opacity - 0.1}`} dur={`${dur2}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* Solar panel icon bottom */}
      <g opacity="0.3">
        <rect x="205" y="440" width="90" height="50" rx="4" fill="none" stroke="#34D399" strokeWidth="1" />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={212 + i * 30} y1="444" x2={212 + i * 30} y2={486} stroke="#34D399" strokeWidth="0.5" opacity="0.4" />
        ))}
        <line x1="208" y1="465" x2="292" y2="465" stroke="#34D399" strokeWidth="0.5" opacity="0.4" />
      </g>
    </svg>
  );
}

function TimelineItem({ icon: Icon, title, desc, delay, isRTL }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; delay: number; isRTL: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className="group relative flex items-start gap-5 p-5 rounded-2xl hover:bg-white/[0.03] transition-colors duration-500"
    >
      {/* Timeline dot line */}
      <div className="relative flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 1, delay: delay + 0.3 }}
          className="w-px h-12 bg-gradient-to-b from-emerald-500/30 to-transparent origin-top"
        />
      </div>
      <div className="flex-1 pt-1.5">
        <h4 className="font-heading font-semibold text-lg text-white mb-1.5 group-hover:text-emerald-400 transition-colors duration-300">{title}</h4>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export function AboutSection() {
  const { data: settings } = useSiteSettings();
  const { locale, isRTL } = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

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

  const subtitle = locale === 'fa' ? 'داستان ابر انرژی' : locale === 'ar' ? 'قصة أبر إنيرجي' : 'The AbrEnergy Story';

  return (
    <section ref={sectionRef} className="relative min-h-screen py-32 md:py-44 overflow-hidden bg-black">
      {/* Background layers */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/10 to-black" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      </motion.div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(52, 211, 153, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container-page relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — Energy Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
          >
            <div className="aspect-[5/6] max-w-md mx-auto lg:mx-0 relative">
              {/* Glow aura behind SVG */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent rounded-full blur-[80px]" />
              <EnergyFlowSVG />

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-2 -right-2 md:-right-6 px-5 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]"
              >
                <p className="text-xs text-emerald-400/80 font-medium">25 MW+</p>
                <p className="text-[10px] text-white/40">{locale === 'fa' ? 'ظرفیت نصب شده' : locale === 'ar' ? 'القدرة المركبة' : 'Installed Capacity'}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="absolute -top-2 -left-2 md:-left-6 px-5 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]"
              >
                <p className="text-xs text-emerald-400/80 font-medium">150+</p>
                <p className="text-[10px] text-white/40">{locale === 'fa' ? 'پروژه' : locale === 'ar' ? 'مشروع' : 'Projects'}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right — Story Content */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-5">
                {subtitle}
              </p>
              <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-8 text-balance">
                Engineering the{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
                  Energy Transition
                </span>
              </h2>
              <p className="text-lg text-white/40 max-w-xl leading-relaxed mb-14">
                {settings?.about_us || 'AbrEnergy is a leading solar energy company specializing in the design, engineering, and construction of solar power plants. We provide end-to-end solutions for residential, commercial, and utility-scale projects.'}
              </p>
            </motion.div>

            {/* Timeline items */}
            <div className="space-y-2">
              {items.map((item, i) => (
                <TimelineItem key={i} {...item} delay={0.3 + i * 0.2} isRTL={isRTL} />
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-10"
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 text-emerald-400 font-medium hover:text-emerald-300 transition-colors duration-300 group"
              >
                <span>{locale === 'fa' ? 'درباره ابر انرژی بیشتر بدانید' : locale === 'ar' ? 'اعرف المزيد عن أبر إنيرجي' : 'Learn more about AbrEnergy'}</span>
                <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Building2, Shield, Users } from 'lucide-react';
import { useLocale } from '@/i18n';

const stats = [
  { target: 25, suffix: ' MW+', labelEn: 'Installed Capacity', labelFa: 'ظرفیت نصب شده', labelAr: 'القدرة المركبة', icon: Zap, accent: '#10B981' },
  { target: 150, suffix: '+', labelEn: 'Completed Projects', labelFa: 'پروژه‌های تکمیل شده', labelAr: 'المشاريع المنجزة', icon: Building2, accent: '#3B82F6' },
  { target: 10, suffix: '+', labelEn: 'Years Experience', labelFa: 'سال تجربه', labelAr: 'سنوات الخبرة', icon: Shield, accent: '#F59E0B' },
  { target: 98, suffix: '%', labelEn: 'Client Satisfaction', labelFa: 'رضایت مشتریان', labelAr: 'رضا العملاء', icon: Users, accent: '#EC4899' },
];

function animateNumber(el: HTMLSpanElement, from: number, to: number, duration: number, delay: number) {
  const start = performance.now() + delay * 1000;
  const tick = (now: number) => {
    if (now < start) { requestAnimationFrame(tick); return; }
    const elapsed = (now - start) / (duration * 1000);
    const progress = Math.min(elapsed, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(from + (to - from) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });
  const { locale } = useLocale();
  const label = locale === 'fa' ? stat.labelFa : locale === 'ar' ? stat.labelAr : stat.labelEn;

  useEffect(() => {
    if (isInView && numRef.current) {
      animateNumber(numRef.current, 0, stat.target, 2, index * 0.12);
    }
  }, [isInView, stat.target, index]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
      className="group"
    >
      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg p-8 md:p-10 text-center overflow-hidden hover:border-white/[0.10] transition-all duration-700">
        {/* SVG corner accents */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[0, 25, 50, 75].map((p, i) => (
            <g key={i}>
              <line x1="0" y1="0" x2={p === 0 ? 15 : p === 25 ? 85 : p === 50 ? 100 : 85} y2="0" stroke={stat.accent} strokeWidth="0.4" />
              <line x1="0" y1="0" x2="0" y2={p === 0 ? 15 : p === 25 ? 0 : p === 50 ? 85 : 100} stroke={stat.accent} strokeWidth="0.4" />
            </g>
          ))}
        </svg>

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{ background: `${stat.accent}12`, border: `1px solid ${stat.accent}18` }}>
          <stat.icon className="h-6 w-6" style={{ color: stat.accent }} />
        </div>

        {/* Counter — direct DOM animation via ref */}
        <div className="relative">
          <span className="text-5xl md:text-6xl font-bold font-heading text-white">
            <span ref={numRef}>0</span>
            <span className="text-white/40">{stat.suffix}</span>
          </span>
        </div>

        <p className="relative text-sm text-white/40 mt-3 font-medium tracking-wide">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-black">
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.015]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="st-pv" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="none" stroke="#10B981" strokeWidth="0.15" />
            <path d="M0 6h12M6 0v12" stroke="#10B981" strokeWidth="0.06" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#st-pv)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black to-black/80" />
      
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.06]" style={{ background: 'radial-gradient(circle, #10B981, transparent)' }} animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.04]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="container-page relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }} className="text-center mb-16 md:mb-20">
          <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">Our Impact</p>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white">
            Numbers That{' '}
            <span className="bg-gradient-to-r from-emerald-300/90 via-green-400/90 to-teal-300/90 bg-clip-text text-transparent">Matter</span>
          </h2>
          <p className="text-sm text-white/30 max-w-xl mx-auto mt-4">Driving the renewable energy transition through measurable impact</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

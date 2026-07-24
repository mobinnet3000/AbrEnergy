'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Building2, Shield, Users } from 'lucide-react';
import { useLocale } from '@/i18n';

const stats = [
  { target: 25, suffix: ' MW+', labelEn: 'Installed Capacity', labelFa: 'ظرفیت نصب شده', labelAr: 'القدرة المركبة', icon: Zap, accent: '#10B981' },
  { target: 150, suffix: '+', labelEn: 'Completed Projects', labelFa: 'پروژه‌های تکمیل شده', labelAr: 'المشاريع المنجزة', icon: Building2, accent: '#3B82F6' },
  { target: 10, suffix: '+', labelEn: 'Years Experience', labelFa: 'سال تجربه', labelAr: 'سنوات الخبرة', icon: Shield, accent: '#F59E0B' },
  { target: 98, suffix: '%', labelEn: 'Client Satisfaction', labelFa: 'رضایت مشتریان', labelAr: 'رضا العملاء', icon: Users, accent: '#EC4899' },
];

function PVGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="pv-cells" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="none" stroke="#10B981" strokeWidth="0.2" />
          <path d="M0 5h10M5 0v10" stroke="#10B981" strokeWidth="0.08" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pv-cells)" />
    </svg>
  );
}

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });
  const { locale } = useLocale();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const label = locale === 'fa' ? stat.labelFa : locale === 'ar' ? stat.labelAr : stat.labelEn;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(y * -8);
    setRotateY(x * 8);
  };

  const handleMouseLeave = () => { setRotateX(0); setRotateY(0); };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '800px' }}
      className="group"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-8 md:p-10 text-center overflow-hidden"
      >
        {/* Corner accent lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="20" y2="0" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="20" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="100" y1="0" x2="80" y2="0" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="100" y1="0" x2="100" y2="20" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="0" y1="100" x2="20" y2="100" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="0" y1="100" x2="0" y2="80" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="100" y1="100" x2="80" y2="100" stroke={stat.accent} strokeWidth="0.5" />
          <line x1="100" y1="100" x2="100" y2="80" stroke={stat.accent} strokeWidth="0.5" />
        </svg>

        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.15] transition-opacity duration-700" style={{ background: stat.accent }} />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl opacity-[0.04] group-hover:opacity-[0.1] transition-opacity duration-700" style={{ background: stat.accent }} />

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6" style={{ background: `${stat.accent}15`, border: `1px solid ${stat.accent}20` }}>
          <stat.icon className="h-7 w-7" style={{ color: stat.accent }} />
        </div>

        {/* Counter */}
        <div className="relative">
          <span className="text-5xl md:text-6xl font-bold font-heading text-white">
            {isInView ? <Counter from={0} to={stat.target} duration={2} delay={index * 0.12} /> : <span>0</span>}
            <span className="text-white/50">{stat.suffix}</span>
          </span>
        </div>

        <p className="relative text-sm md:text-base text-white/45 mt-3 font-medium tracking-wide">{label}</p>
      </motion.div>
    </motion.div>
  );
}

function Counter({ from, to, duration, delay }: { from: number; to: number; duration: number; delay: number }) {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isInView || startedRef.current) return;
    startedRef.current = true;
    const startTime = Date.now() + delay * 1000;
    let animId: number;
    const animate = () => {
      const now = Date.now();
      if (now < startTime) { animId = requestAnimationFrame(animate); return; }
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(from + (to - from) * eased));
      if (progress < 1) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isInView, from, to, duration, delay]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function StatsSection() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-black">
      {/* Solar panel grid background */}
      <PVGrid />

      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black to-black/80" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }}
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Third subtle orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-page relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-4">Our Impact</p>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white">
            Numbers That{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">Matter</span>
          </h2>
          <p className="text-white/35 text-lg max-w-xl mx-auto mt-4">
            Driving the renewable energy transition through measurable impact
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

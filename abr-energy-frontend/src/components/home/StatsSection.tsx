'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Building2, Shield, Users } from 'lucide-react';
import { useLocale } from '@/i18n';

const stats = [
  { target: 25, suffix: ' MW+', labelEn: 'Installed Capacity', labelFa: 'ظرفیت نصب شده', labelAr: 'القدرة المركبة', icon: Zap, color: 'from-emerald-500 to-emerald-700' },
  { target: 150, suffix: '+', labelEn: 'Completed Projects', labelFa: 'پروژه‌های تکمیل شده', labelAr: 'المشاريع المنجزة', icon: Building2, color: 'from-blue-500 to-blue-700' },
  { target: 10, suffix: '+', labelEn: 'Years Experience', labelFa: 'سال تجربه', labelAr: 'سنوات الخبرة', icon: Shield, color: 'from-amber-500 to-amber-700' },
  { target: 98, suffix: '%', labelEn: 'Client Satisfaction', labelFa: 'رضایت مشتریان', labelAr: 'رضا العملاء', icon: Users, color: 'from-rose-500 to-rose-700' },
];

function StatCard({ stat, index }: {
  stat: typeof stats[number];
  index: number;
}) {
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
    setRotateX(y * -10);
    setRotateY(x * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
      className="group"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-8 md:p-10 text-center overflow-hidden hover:border-white/[0.12] transition-colors duration-500"
      >
        {/* Background glow */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700`} />
        <div className={`absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full blur-2xl opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700`} />

        {/* Icon */}
        <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mb-6`}>
          <stat.icon className="h-7 w-7 text-white" />
        </div>

        {/* Counter */}
        <div className="relative">
          <span className="text-5xl md:text-6xl font-bold font-heading text-white">
            {isInView ? (
              <Counter from={0} to={stat.target} duration={2} delay={index * 0.15} />
            ) : (
              <span>0</span>
            )}
            <span className="text-white/60">{stat.suffix}</span>
          </span>
        </div>

        {/* Label */}
        <p className="relative text-sm md:text-base text-white/50 mt-3 font-medium tracking-wide">
          {label}
        </p>

        {/* Gradient border shimmer */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[0px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent" />
        </div>
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
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Deep background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-background" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[100px]"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-page relative z-10" ref={sectionRef}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">
            Our Impact
          </p>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white">
            Numbers That{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
              Matter
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto mt-4">
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

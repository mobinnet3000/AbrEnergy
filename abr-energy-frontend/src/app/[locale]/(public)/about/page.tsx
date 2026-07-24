'use client';
import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sun, Leaf, Zap, Shield, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import type { SiteSettings } from '@/types';

/* ---- Animated Number Counter ---- */
function AnimatedNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => {
    if (!isInView || !ref.current) return;
    const start = performance.now() + delay * 1000;
    const el = ref.current;
    const tick = (now: number) => {
      if (now < start) { requestAnimationFrame(tick); return; }
      const p = Math.min((now - start) / 2000, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * e).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, delay]);
  return <span ref={ref}>0</span>;
}

/* ---- Value Card ---- */
function ValueCard({ icon: Icon, title, desc, delay }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; delay: number }) {
  return (
    <ScrollReveal variant="slide-up" delay={delay}>
      <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg p-8 overflow-hidden hover:border-emerald-500/15 transition-all duration-700 h-full">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-500">
          <Icon className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="relative font-heading font-semibold text-lg text-white mb-2">{title}</h3>
        <p className="relative text-sm text-white/40 leading-relaxed">{desc}</p>
      </div>
    </ScrollReveal>
  );
}

/* ---- Story Section ---- */
function StoryBlock({ title, desc, index }: { title: string; desc: string; index: number }) {
  const isReversed = index % 2 === 1;
  return (
    <ScrollReveal variant={isReversed ? 'slide-right' : 'slide-left'}>
      <div className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${isReversed ? 'md:flex-row-reverse' : ''}`}>
        <div className={isReversed ? 'md:order-2' : ''}>
          <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.2em] mb-4">
            {['Our Story', 'Our Mission', 'Our Technology'][index]}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">{title}</h2>
          <p className="text-white/35 leading-relaxed">{desc}</p>
        </div>
        <div className={`aspect-[4/3] rounded-2xl border border-white/[0.04] bg-gradient-to-br from-emerald-900/10 via-emerald-800/5 to-transparent flex items-center justify-center ${isReversed ? 'md:order-1' : ''}`}>
          <Globe className="h-20 w-20 text-emerald-500/20" />
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ---- Hero Decorative SVG ---- */
function HeroGlowSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#059669" stopOpacity="0.03" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#hero-glow)" />
      {Array.from({ length: 3 }).map((_, i) => (
        <ellipse key={i} cx={500} cy={300} rx={180 + i * 60} ry={60 + i * 25} fill="none" stroke="#10B981" strokeWidth="0.3" opacity={0.15 - i * 0.04} transform={`rotate(${i * 20}, 500, 300)`}>
          <animateTransform attributeName="transform" type="rotate" from={`${i * 20} 500 300`} to={`${i * 20 + 360} 500 300`} dur={`${12 + i * 4}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1="500" y1="300" x2={500 + 250 * Math.cos(i * Math.PI / 4)} y2={300 + 250 * Math.sin(i * Math.PI / 4)} stroke="#34D399" strokeWidth="0.5" opacity={0.04}>
          <animate attributeName="opacity" values="0.02;0.08;0.02" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}

export default function AboutPage() {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => axiosInstance.get('/site-config/').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" /></div>;

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* ===== CINEMATIC HERO ===== */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <HeroGlowSVG />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black z-[1]" />
        
        <div className="container-page relative z-10 py-28">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }} className="max-w-3xl">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
              <ArrowRight className="h-3 w-3 rotate-180" /> Back to Home
            </Link>
            <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">About AbrEnergy</p>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] mb-6">
              Engineering the{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">Energy Transition</span>
            </h1>
            <p className="text-lg text-white/35 max-w-2xl leading-relaxed mb-10">
              {settings?.about_us?.split('.')[0] || 'From design to commissioning — we deliver turnkey solar power plants for residential, commercial, and utility-scale projects.'}
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
              Get in Touch <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== STATISTICS ===== */}
      <section className="py-20 md:py-28 border-y border-white/[0.03]">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { target: 25, suffix: ' MW+', label: 'Installed Capacity', color: '#10B981' },
              { target: 150, suffix: '+', label: 'Completed Projects', color: '#3B82F6' },
              { target: 10, suffix: '+', label: 'Years Experience', color: '#F59E0B' },
              { target: 98, suffix: '%', label: 'Client Satisfaction', color: '#EC4899' },
            ].map((s, i) => (
              <ScrollReveal key={i} variant="fade" delay={i * 0.1}>
                <div className="p-4">
                  <div className="text-3xl md:text-4xl font-bold font-heading text-white">
                    <AnimatedNumber target={s.target} delay={i * 0.12} />{s.suffix}
                  </div>
                  <p className="text-sm text-white/35 mt-2">{s.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPANY VALUES ===== */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">What We Stand For</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Our Values</h2>
              <p className="text-white/35 text-sm max-w-xl mx-auto mt-4">Driving the renewable energy transition through engineering excellence</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ValueCard icon={Sun} title="Clean Energy" desc="Committed to making clean, renewable energy accessible to communities worldwide." delay={0.1} />
            <ValueCard icon={Zap} title="Innovation" desc="Continuously advancing solar technology through research and engineering excellence." delay={0.15} />
            <ValueCard icon={Leaf} title="Sustainability" desc="Every project is designed with long-term environmental sustainability in mind." delay={0.2} />
            <ValueCard icon={Shield} title="Reliability" desc="Built to last. Our installations meet the highest international standards of quality." delay={0.25} />
          </div>
        </div>
      </section>

      {/* ===== STORY BLOCKS ===== */}
      <section className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="container-page space-y-28">
          <StoryBlock
            index={0}
            title="Who We Are"
            desc="AbrEnergy is a leading solar energy company specializing in the design, engineering, and construction of solar power plants. We provide end-to-end solutions for residential, commercial, and utility-scale projects. Our team of experienced engineers and project managers ensures every installation meets international standards."
          />
          <StoryBlock
            index={1}
            title="Our Mission"
            desc="To accelerate the global transition to renewable energy by delivering premium solar solutions that are reliable, cost-effective, and environmentally sustainable. We believe clean energy should be accessible to everyone."
          />
          <StoryBlock
            index={2}
            title="Technology Advantage"
            desc="We leverage cutting-edge solar technology, advanced monitoring systems, and precision engineering to maximize energy output and system longevity. Our designs are optimized for local climate conditions to ensure peak performance."
          />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="container-page text-center">
          <ScrollReveal variant="scale">
            <Sparkles className="h-10 w-10 mx-auto mb-6 text-emerald-400/40" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Ready to Work With Us?</h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mb-10">Let&apos;s discuss how we can help you achieve your renewable energy goals.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/15">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

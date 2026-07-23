'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
}

export function ParallaxSection({ children, className = '', bgColor = 'bg-background' }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);

  return (
    <section ref={ref} className={`relative overflow-hidden ${bgColor} ${className}`}>
      <motion.div style={{ y }} className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

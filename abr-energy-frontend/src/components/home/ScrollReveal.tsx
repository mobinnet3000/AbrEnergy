/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useRef } from 'react';
import { motion, useInView, type TargetAndTransition } from 'framer-motion';
import { useLocale } from '@/i18n';

type RevealVariant = 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'blur' | 'clip' | 'cinematic';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  stagger?: boolean;
  staggerDelay?: number;
}

const variants: Record<RevealVariant, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  'fade': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 40, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -40, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
  },
  'scale': {
    initial: { opacity: 0, scale: 0.9, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0 },
  },
  'blur': {
    initial: { opacity: 0, filter: 'blur(6px)', y: 20 },
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
  },
  'clip': {
    initial: { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: 20 },
    animate: { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 },
  },
  'cinematic': {
    initial: { opacity: 0, y: 50, scale: 0.95, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  },
};

export function ScrollReveal({ children, className = '', delay = 0, variant = 'slide-up', stagger = false, staggerDelay = 0.08 }: ScrollRevealProps) {
  const { isRTL } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  // RTL-aware slide direction
  const v = variants[variant];
  const initial = { ...v.initial };
  if (variant === 'slide-left' && isRTL) { initial.x = -60; }
  if (variant === 'slide-right' && isRTL) { initial.x = 60; }

  if (stagger && Array.isArray(children)) {
    return (
      <div ref={ref} className={className}>
        {children.map((child, i) => (
          <motion.div
            key={i}
            initial={initial as any}
            animate={isInView ? (v.animate as any) : initial}
            transition={{ duration: 0.7, delay: delay + i * staggerDelay, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={initial as any}
      animate={isInView ? (v.animate as any) : initial}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word text reveal */
export function TextReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const words = text.split(' ');

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, rotateX: -15 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
          className="mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

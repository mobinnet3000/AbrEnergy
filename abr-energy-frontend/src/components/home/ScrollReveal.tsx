'use client';
import { motion } from 'framer-motion';
import { useLocale } from '@/i18n';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }: ScrollRevealProps) {
  const { isRTL } = useLocale();
  const directionMap = {
    up: { y: 60 },
    down: { y: -60 },
    left: { x: isRTL ? 60 : -60 },
    right: { x: isRTL ? -60 : 60 },
  };
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

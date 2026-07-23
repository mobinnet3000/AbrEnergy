'use client';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({ children, className = '', hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { y: -8, transition: { duration: 0.3 } } : undefined}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

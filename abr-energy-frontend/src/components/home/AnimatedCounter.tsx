'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function AnimatedCounter({ target, suffix = '', label, icon: Icon }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="text-center p-6">
      {Icon && <Icon className="h-8 w-8 mx-auto mb-4 text-primary/80" />}
      <motion.div
        className="text-4xl md:text-5xl font-bold font-heading text-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {isInView ? (
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <CountUp target={target} />
          </motion.span>
        ) : '0'}
        {suffix}
      </motion.div>
      <div className="text-sm text-muted-foreground mt-2">{label}</div>
    </div>
  );
}

function CountUp({ target }: { target: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {target}
    </motion.span>
  );
}

'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] origin-left will-change-transform"
      style={{ scaleX, background: 'linear-gradient(90deg, #059669, #10B981, #34D399, #059669)' }}
    />
  );
}

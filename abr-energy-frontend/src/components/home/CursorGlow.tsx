'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CursorGlow() {
  const [isMobile, setIsMobile] = useState(true);
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springX = useSpring(cursorX, { stiffness: 50, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 150);
      cursorY.set(e.clientY - 150);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [isMobile, cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 opacity-30"
      style={{
        background: `radial-gradient(300px circle at ${springX}px ${springY}px, rgba(5, 150, 105, 0.15), transparent 80%)`,
      }}
    />
  );
}

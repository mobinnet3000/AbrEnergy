'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const sectionColors: Record<string, string> = {
  hero: 'rgba(5, 150, 105, 0.12)',
  stats: 'rgba(59, 130, 246, 0.1)',
  about: 'rgba(16, 185, 129, 0.12)',
  services: 'rgba(217, 119, 6, 0.1)',
  projects: 'rgba(5, 150, 105, 0.1)',
  calculator: 'rgba(249, 115, 22, 0.12)',
  articles: 'rgba(20, 184, 166, 0.1)',
  contact: 'rgba(5, 150, 105, 0.1)',
};

function getSection(x: number, y: number): string {
  const el = document.elementFromPoint(x, y);
  if (!el) return 'hero';
  const section = el.closest('[data-section]');
  return section?.getAttribute('data-section') || 'hero';
}

export function CursorGlow() {
  const [isMobile, setIsMobile] = useState(true);
  const [color, setColor] = useState(sectionColors.hero);
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springX = useSpring(cursorX, { stiffness: 30, damping: 15 });
  const springY = useSpring(cursorY, { stiffness: 30, damping: 15 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let frameId: number;
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setColor(getSection(e.clientX, e.clientY));
      });
    };
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(frameId);
    };
  }, [isMobile, cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <>
      {/* Outer glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: `radial-gradient(600px circle at ${springX}px ${springY}px, ${color}, transparent 70%)`,
        }}
      />
      {/* Inner glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: `radial-gradient(200px circle at ${springX}px ${springY}px, rgba(255, 255, 255, 0.03), transparent 60%)`,
        }}
      />
    </>
  );
}

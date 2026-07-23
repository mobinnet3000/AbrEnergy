'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const sectionColors: Record<string, string> = {
  hero: 'rgba(16,185,129,',
  stats: 'rgba(59,130,246,',
  services: 'rgba(217,119,6,',
  projects: 'rgba(6,182,212,',
  calculator: 'rgba(249,115,22,',
  articles: 'rgba(168,85,247,',
  contact: 'rgba(244,63,94,',
  footer: 'rgba(255,255,255,',
};

function getSection(x: number, y: number): string {
  const el = document.elementFromPoint(x, y);
  if (!el) return 'hero';
  const section = el.closest('[data-section]');
  return section?.getAttribute('data-section') || 'hero';
}

export function CursorGlow() {
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springX = useSpring(cursorX, { stiffness: 120, damping: 22, mass: 0.4 });
  const springY = useSpring(cursorY, { stiffness: 120, damping: 22, mass: 0.4 });
  const glowEl = useRef<HTMLDivElement>(null);
  const lightEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (isMobile) return;

    const colorTimeout: ReturnType<typeof setTimeout>[] = [];

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const t = setTimeout(() => {
        const section = getSection(e.clientX, e.clientY);
        const base = sectionColors[section] || sectionColors.hero;
        if (glowEl.current) {
          glowEl.current.style.background = `
            radial-gradient(600px circle at ${cursorX.get()}px ${cursorY.get()}px, ${base}0.20) 0%, ${base}0.10) 25%, ${base}0.05) 55%, transparent 80%)
          `;
        }
      }, 50);
      colorTimeout.push(t);
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      colorTimeout.forEach(clearTimeout);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        ref={glowEl}
        className="pointer-events-none fixed inset-0 z-50 will-change-transform"
        style={{
          background: `radial-gradient(600px circle at ${springX}px ${springY}px, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0.10) 25%, rgba(16,185,129,0.05) 55%, transparent 80%)`,
        }}
      />
      <motion.div
        ref={lightEl}
        className="pointer-events-none fixed inset-0 z-40 will-change-transform"
        style={{
          mixBlendMode: 'screen' as const,
          background: `radial-gradient(800px circle at ${springX}px ${springY}px, rgba(255,255,255,0.06), transparent 60%)`,
        }}
      />
    </>
  );
}

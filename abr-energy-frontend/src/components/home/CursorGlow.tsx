'use client';
import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

const sectionColors: Record<string, [number, number, number]> = {
  hero: [16, 185, 129],
  stats: [59, 130, 246],
  services: [217, 119, 6],
  projects: [6, 182, 212],
  calculator: [249, 115, 22],
  articles: [168, 85, 247],
  contact: [244, 63, 94],
  footer: [255, 255, 255],
};

function getSection(x: number, y: number): string {
  const el = document.elementFromPoint(x, y);
  if (!el) return 'hero';
  const section = el.closest('[data-section]');
  return section?.getAttribute('data-section') || 'hero';
}

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springX = useSpring(cursorX, { stiffness: 80, damping: 18, mass: 0.6 });
  const springY = useSpring(cursorY, { stiffness: 80, damping: 18, mass: 0.6 });
  const currentColor = useRef<[number, number, number]>([16, 185, 129]);
  const targetColor = useRef<[number, number, number]>([16, 185, 129]);
  const lastSection = useRef('hero');

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (isMobile) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const frame = () => {
      if (!glowRef.current) return;
      const c = currentColor.current;
      const t = targetColor.current;
      const speed = 0.06;
      c[0] += (t[0] - c[0]) * speed;
      c[1] += (t[1] - c[1]) * speed;
      c[2] += (t[2] - c[2]) * speed;

      const r = Math.round(c[0]);
      const g = Math.round(c[1]);
      const b = Math.round(c[2]);

      glowRef.current.style.background = `
        radial-gradient(650px circle at ${springX.get()}px ${springY.get()}px,
          rgba(${r},${g},${b},0.15) 0%,
          rgba(${r},${g},${b},0.08) 30%,
          rgba(${r},${g},${b},0.03) 60%,
          transparent 85%)
      `;
      rafId = requestAnimationFrame(frame);
    };
    let rafId = requestAnimationFrame(frame);

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      const section = getSection(e.clientX, e.clientY);
      if (section !== lastSection.current) {
        lastSection.current = section;
        const col = sectionColors[section];
        if (col) targetColor.current = col;
      }
    };
    window.addEventListener('mousemove', move, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', move);
    };
  }, [cursorX, cursorY, springX, springY]);

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-50 will-change-transform"
        style={{
          background: 'radial-gradient(650px circle at 50% 50%, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 30%, rgba(16,185,129,0.03) 60%, transparent 85%)',
        }}
      />
      <div
        ref={lightRef}
        className="pointer-events-none fixed inset-0 z-40 will-change-transform"
        style={{
          mixBlendMode: 'screen',
          background: `radial-gradient(900px circle at ${springX}px ${springY}px, rgba(255,255,255,0.04), transparent 60%)`,
        }}
      />
    </>
  );
}

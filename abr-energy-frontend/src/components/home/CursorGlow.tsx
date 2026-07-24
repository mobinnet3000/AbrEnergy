'use client';
import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

const sectionColors: Record<string, [number, number, number]> = {
  hero: [16, 185, 129],      // Emerald
  stats: [59, 130, 246],     // Blue
  services: [217, 119, 6],   // Amber
  projects: [6, 182, 212],   // Cyan
  calculator: [249, 115, 22],// Orange
  articles: [168, 85, 247],  // Purple
  contact: [244, 63, 94],    // Rose
  footer: [255, 255, 255],   // White
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
  const springX = useSpring(cursorX, { stiffness: 120, damping: 22, mass: 0.4 });
  const springY = useSpring(cursorY, { stiffness: 120, damping: 22, mass: 0.4 });
  const currentColor = useRef<[number, number, number]>([16, 185, 129]);
  const targetColor = useRef<[number, number, number]>([16, 185, 129]);
  const lastSection = useRef('hero');

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (isMobile) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Single RAF loop: read section once per frame, interpolate color
    const frame = () => {
      if (!glowRef.current) return;

      // Smoothly interpolate RGB toward target
      const c = currentColor.current;
      const t = targetColor.current;
      const speed = 0.04;
      c[0] += (t[0] - c[0]) * speed;
      c[1] += (t[1] - c[1]) * speed;
      c[2] += (t[2] - c[2]) * speed;

      glowRef.current.style.background = `
        radial-gradient(600px circle at ${springX.get()}px ${springY.get()}px,
          rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},0.20) 0%,
          rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},0.10) 25%,
          rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},0.05) 55%,
          transparent 80%)
      `;
      rafId = requestAnimationFrame(frame);
    };
    let rafId = requestAnimationFrame(frame);

    // Mouse handler: update position + section
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
          background: `radial-gradient(600px circle at 50% 50%, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0.10) 25%, rgba(16,185,129,0.05) 55%, transparent 80%)`,
        }}
      />
      <div
        ref={lightRef}
        className="pointer-events-none fixed inset-0 z-40 will-change-transform"
        style={{
          mixBlendMode: 'screen',
          background: `radial-gradient(800px circle at ${springX}px ${springY}px, rgba(255,255,255,0.06), transparent 60%)`,
        }}
      />
    </>
  );
}

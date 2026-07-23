'use client';
import { useEffect, useRef } from 'react';

export function MouseRipple() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (isMobile) return;

    let lastMoveTime = Date.now();

    const move = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      lastMoveTime = Date.now();
    };

    const checkStill = () => {
      if (Date.now() - lastMoveTime < 500) return;
      const container = containerRef.current;
      if (!container) return;

      const ring = document.createElement('div');
      ring.className = 'mouse-ripple';
      ring.style.left = `${mouseRef.current.x - 25}px`;
      ring.style.top = `${mouseRef.current.y - 25}px`;
      container.appendChild(ring);

      // Remove after animation completes
      setTimeout(() => ring.remove(), 1200);
    };

    window.addEventListener('mousemove', move, { passive: true });
    const intervalId = setInterval(checkStill, 300);

    return () => {
      window.removeEventListener('mousemove', move);
      clearInterval(intervalId);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />;
}

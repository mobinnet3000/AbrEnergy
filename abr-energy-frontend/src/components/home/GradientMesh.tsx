'use client';
import { useEffect, useRef } from 'react';

export function GradientMesh() {
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const blobs = meshRef.current?.querySelectorAll('.mesh-blob') as NodeListOf<HTMLDivElement> | undefined;
    if (!blobs) return;

    const targets = Array.from(blobs).map(() => ({ x: 0, y: 0 }));
    const current = Array.from(blobs).map((_, i) => ({
      x: [20, -30, 40, -20][i] || 0,
      y: [-25, 35, -15, 30][i] || 0,
    }));

    const move = (e: MouseEvent) => {
      const rx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ry = (e.clientY / window.innerHeight - 0.5) * 2;
      blobs.forEach((b, i) => {
        targets[i].x = (current[i].x || 0) + rx * 15;
        targets[i].y = (current[i].y || 0) + ry * 10;
      });
    };

    window.addEventListener('mousemove', move, { passive: true });

    // Smooth animation loop
    let rafId: number;
    const animate = () => {
      blobs.forEach((b, i) => {
        const cx = current[i].x + (targets[i].x - current[i].x) * 0.02;
        const cy = current[i].y + (targets[i].y - current[i].y) * 0.02;
        current[i].x = cx;
        current[i].y = cy;
        b.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={meshRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ willChange: 'transform' }}>
      <div className="mesh-blob absolute -top-[10%] -left-[10%] w-[50%] aspect-square rounded-full bg-gradient-to-br from-emerald-500/8 to-transparent blur-[120px]" />
      <div className="mesh-blob absolute -bottom-[15%] -right-[5%] w-[45%] aspect-square rounded-full bg-gradient-to-tl from-blue-500/6 to-transparent blur-[120px]" />
      <div className="mesh-blob absolute top-[30%] -right-[10%] w-[35%] aspect-square rounded-full bg-gradient-to-bl from-amber-500/5 to-transparent blur-[100px]" />
      <div className="mesh-blob absolute bottom-[25%] left-[5%] w-[30%] aspect-square rounded-full bg-gradient-to-tr from-rose-500/5 to-transparent blur-[100px]" />
    </div>
  );
}

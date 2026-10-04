'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { resolveMediaUrl } from '@/lib/media-url';
import type { HomepageVisual } from '@/types';

// Phase 11 — four curated decorative slots composing a solar/energy orbit
// around the hero copy: large top-end panel, small mid-end chip,
// medium bottom-start panel, small top-start chip (wide screens only).
// No pixel editor in this phase — the CMS controls image / alt / order /
// enabled / link only, and up to 4 enabled visuals fill these slots.
const SLOTS = [
  'top-[16%] end-[4%] w-44 md:w-60 rotate-2',
  'top-[46%] end-[10%] w-24 md:w-32 -rotate-2 hidden lg:block',
  'bottom-[12%] start-[4%] w-36 md:w-52 -rotate-2',
  'top-[14%] start-[6%] w-24 md:w-32 rotate-2 hidden lg:block',
] as const;

/**
 * Phase 7 — CMS floating visuals. Renders nothing when the CMS holds no
 * enabled visuals, so the pre-CMS hero output is byte-identical.
 * Decorative only (`aria-hidden`, pointer-events-none), hidden on small
 * screens and under `prefers-reduced-motion` (static, no animation).
 *
 * Phase 11 — four-slot cinematic composition with refined glass frames.
 * Empty slots never render placeholders; visuals without media are
 * filtered out; alt text stays stored for future accessible use.
 */
export function FloatingVisuals({ visuals }: { visuals?: HomepageVisual[] | null }) {
  const prefersReduced = useReducedMotion();
  const items = (visuals ?? []).filter((v) => v.image_url?.trim());
  if (items.length === 0) return null;

  return (
    <div
      aria-hidden
      data-testid="floating-visuals"
      className="pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden md:block"
    >
      {items.slice(0, 4).map((v, i) => {
        const slot = SLOTS[i % SLOTS.length];
        // NOTE: `link_url` is stored in the CMS/API but intentionally not
        // rendered — this subtree is decorative (`aria-hidden`), and a
        // focusable link inside hidden content would be an a11y violation.
        // A future accessible visual treatment can consume it.
        const positioned = (
          <div className={`absolute ${slot}`} data-testid="floating-visual">
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] shadow-2xl shadow-black/60 ring-1 ring-emerald-400/10 backdrop-blur-sm">
              <Image
                src={resolveMediaUrl(v.image_url) || v.image_url}
                alt=""
                width={240}
                height={240}
                loading="lazy"
                sizes="(max-width: 768px) 0px, 240px"
                className="object-cover opacity-80"
              />
            </div>
            <div
              className="mx-auto mt-2 h-px w-2/3 bg-gradient-to-l from-transparent via-emerald-300/40 to-transparent"
            />
          </div>
        );
        return prefersReduced ? (
          <div key={v.id}>{positioned}</div>
        ) : (
          <motion.div
            key={v.id}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 7 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {positioned}
          </motion.div>
        );
      })}
    </div>
  );
}

'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { resolveMediaUrl } from '@/lib/media-url';
import type { HomepageVisual } from '@/types';

// Two preset decorative slots (top-end / bottom-start). No pixel editor in
// this phase — the CMS controls image / alt / order / enabled / link only.
const SLOTS = [
  'top-[18%] end-[6%] w-40 md:w-56 rotate-3',
  'bottom-[14%] start-[5%] w-36 md:w-48 -rotate-3',
] as const;

/**
 * Phase 7 — CMS floating visuals. Renders nothing when the CMS holds no
 * enabled visuals, so the pre-CMS hero output is byte-identical.
 * Decorative only (`aria-hidden`, pointer-events-none), hidden on small
 * screens and under `prefers-reduced-motion` (static, no animation).
 */
export function FloatingVisuals({ visuals }: { visuals?: HomepageVisual[] | null }) {
  const prefersReduced = useReducedMotion();
  const items = (visuals ?? []).filter((v) => v.image_url?.trim());
  if (items.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] hidden md:block overflow-hidden">
      {items.slice(0, 4).map((v, i) => {
        const slot = SLOTS[i % SLOTS.length];
        // NOTE: `link_url` is stored in the CMS/API but intentionally not
        // rendered — this subtree is decorative (`aria-hidden`), and a
        // focusable link inside hidden content would be an a11y violation.
        // A future accessible visual treatment can consume it.
        const positioned = (
          <div className={`absolute ${slot}`}>
            <Image
              src={resolveMediaUrl(v.image_url) || v.image_url}
              alt=""
              width={224}
              height={224}
              loading="lazy"
              sizes="(max-width: 768px) 0px, 224px"
              className="rounded-2xl border border-white/10 object-cover opacity-70 shadow-2xl shadow-black/50"
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

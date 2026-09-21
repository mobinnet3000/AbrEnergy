/**
 * Phase 6 — homepage visual asset configuration.
 *
 * The hero visual area currently renders the existing `Hero3D` canvas.
 * When real product/floating imagery becomes available, add entries to
 * `HERO_FLOATING_SLOTS` (backend media URLs via `resolveMediaUrl`) instead
 * of scattering image paths through JSX. No filenames are invented here:
 * an empty slot list means "no floating imagery yet".
 */

export interface HeroFloatingSlot {
  /** Stable key for the slot (e.g. `panel`, `inverter`). */
  key: string;
  /** Absolute or backend-relative media URL. Empty = slot unfilled. */
  src: string;
  /** Accessible label for the image. */
  alt: string;
}

/** Floating product-imagery slots overlaid on the hero 3D scene. */
export const HERO_FLOATING_SLOTS: HeroFloatingSlot[] = [];

/** Whether the hero renders floating imagery (false until assets land). */
export function hasHeroFloatingVisuals(): boolean {
  return HERO_FLOATING_SLOTS.some((slot) => slot.src.trim().length > 0);
}

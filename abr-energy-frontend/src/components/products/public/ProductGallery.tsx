'use client';
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductImageItem } from '@/types';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: ProductImageItem[];
  productTitle: string;
}

/** Order gallery images cover-first, matching the admin editor convention. */
export function sortGalleryImages(images: ProductImageItem[]): ProductImageItem[] {
  return [...(images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

/**
 * Accessible product gallery: main image + thumbnails + prev/next +
 * keyboard navigation (arrow keys flip in RTL) + mobile swipe affordance.
 * Fully theme-aware.
 */
export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const { t, isRTL } = useLocale();
  const ordered = useMemo(() => sortGalleryImages(images), [images]);
  const [active, setActive] = useState(0);

  const count = ordered.length;
  // Clamp during render (no reset effect): safe when refetches reorder rows.
  const activeIndex = count === 0 ? 0 : Math.min(Math.max(active, 0), count - 1);
  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count],
  );
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // In RTL the visual "forward" direction is left.
        if (isRTL) goNext();
        else goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRTL) goPrev();
        else goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(count - 1);
      }
    },
    [count, goNext, goPrev, goTo, isRTL],
  );

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border/80 bg-card shadow-xs dark:border-white/10 dark:bg-card/70">
        <Sun className="h-16 w-16 text-muted-foreground/30" aria-hidden />
        <span className="sr-only">{productTitle}</span>
      </div>
    );
  }

  const current = ordered[activeIndex];

  return (
    <div
      className="flex flex-col gap-3"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('products.gallery_label')}
      onKeyDown={onKeyDown}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs dark:border-white/10 dark:bg-neutral-900">
        {/* Phase 5.2: narrow next/image adoption (gallery hero only). fill +
            priority preserve the 4:3 aspect, object-cover, and eager (LCP)
            loading of the previous <img loading="eager">. */}
        <div className="relative aspect-[4/3]">
          <Image
            key={current.id}
            src={resolveMediaUrl(current.url)}
            alt={current.alt_text || productTitle}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('products.prev_image')}
              className="absolute top-1/2 -translate-y-1/2 start-3 rounded-full border border-border bg-background/80 p-2.5 text-foreground backdrop-blur-md transition hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className={cn('h-5 w-5', isRTL && 'rotate-180')} aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('products.next_image')}
              className="absolute top-1/2 -translate-y-1/2 end-3 rounded-full border border-border bg-background/80 p-2.5 text-foreground backdrop-blur-md transition hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className={cn('h-5 w-5', isRTL && 'rotate-180')} aria-hidden />
            </button>
            <p className="absolute bottom-3 end-3 rounded-full bg-background/80 px-2.5 py-1 text-[11px] text-foreground border border-border backdrop-blur-md" dir="ltr" aria-live="polite">
              {activeIndex + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6" role="tablist" aria-label={t('products.gallery_label')}>
          {ordered.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`${productTitle} — ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border transition-all duration-300',
                'focus-visible:outline-2 focus-visible:outline-primary',
                i === activeIndex
                  ? 'border-primary ring-2 ring-primary/30 opacity-100'
                  : 'border-border/80 opacity-60 hover:opacity-100 hover:border-primary/40 dark:border-white/10',
              )}
            >
              <Image
                src={resolveMediaUrl(img.url)}
                alt={img.alt_text || `${productTitle} thumbnail ${i + 1}`}
                fill
                sizes="(max-width: 640px) 20vw, 10vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

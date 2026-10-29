'use client';
import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Sun, Zap } from 'lucide-react';
import { useLocale } from '@/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { ProductPrice } from '@/components/products/public/ProductPrice';
import type { HomepageVisual, ProductCategory, ProductListItem } from '@/types';

/**
 * Phase 12.7 — dominant showcase: main stage + instant panel only.
 * Category navigation lives in its own section DIRECTLY BELOW the hero
 * (ProductRailSection), not inside the showcase — no duplication.
 * `categories` prop kept for API compatibility, ignored.
 */
export function HomepageShowcase({
  products,
  visuals,
}: {
  products: ProductListItem[];
  categories?: ProductCategory[];
  visuals?: HomepageVisual[] | null;
}) {
  const { t, isRTL } = useLocale();
  const prefersReduced = useReducedMotion();
  const instantTouchX = useRef<number | null>(null);

  const stageList = products;
  const [stageIndex, setStageIndex] = useState(0);
  const stageSafe = stageList.length === 0 ? 0 : Math.min(Math.max(stageIndex, 0), stageList.length - 1);
  const stage = stageList.length === 0 ? null : stageList[stageSafe];

  const goStage = useCallback(
    (index: number) => {
      if (stageList.length === 0) return;
      setStageIndex(((index % stageList.length) + stageList.length) % stageList.length);
    },
    [stageList.length],
  );

  // Instant-suggestion panel cycles the full featured list independently.
  const [instantIndex, setInstantIndex] = useState(0);
  const instantSafe = products.length === 0 ? 0 : Math.min(Math.max(instantIndex, 0), products.length - 1);
  const instant = products.length === 0 ? null : products[instantSafe];
  const goInstant = useCallback(
    (index: number) => {
      if (products.length === 0) return;
      setInstantIndex(((index % products.length) + products.length) % products.length);
    },
    [products.length],
  );

  const floating = (visuals ?? []).filter((v) => v.image_url?.trim()).slice(0, 2);

  const stageBody = stage ? (
    stage.cover_image_url?.trim() ? (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 lg:aspect-[16/9] xl:aspect-[21/11] dark:bg-neutral-900">
      <Image
        key={stage.id}
        src={resolveMediaUrl(stage.cover_image_url)}
        alt={stage.title}
        fill
        sizes="(max-width: 1024px) 100vw, 720px"
        className="object-cover"
        priority
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"
      />
      {stageList.length > 1 && (
        <p
          dir="auto"
          className="absolute end-3 top-3 rounded-full border border-neutral-900/20 bg-white/90 px-3 py-1 text-xs font-bold text-neutral-900"
        >
          {stageSafe + 1} / {stageList.length}
        </p>
      )}
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/55 p-3 backdrop-blur-md sm:p-4 lg:inset-x-5 lg:bottom-5 lg:p-5">
        <p data-testid="hero-product-title" className="font-heading text-lg font-bold leading-8 text-white sm:text-xl lg:text-2xl lg:leading-10">
          {stage.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ProductPrice price={stage.price} size="md" />
          <Link
            href={`/products/${stage.slug}`}
            aria-label={`${stage.title} — ${t('products.view_details')}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            {t('products.view_details')}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
    ) : (
    /* Phase 12.4 — designed fallback for real products without cover
       imagery (incl. dev-preview fixtures): solar gradient panel with
       product info, never a blank/broken frame. */
    <div data-testid="hero-showcase-fallback" className="relative flex aspect-[16/10] w-full flex-col justify-end overflow-hidden bg-gradient-to-bl from-emerald-800 via-neutral-900 to-amber-900 p-5 text-start sm:p-6 lg:aspect-[16/9] lg:p-8 xl:aspect-[21/11] dark:from-emerald-950 dark:via-neutral-900 dark:to-amber-950">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute end-1/4 top-1/4 h-32 w-32 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
      <Sun className="absolute end-6 top-6 h-14 w-14 text-amber-400/60" aria-hidden />
      {stageList.length > 1 && (
        <p dir="auto" className="absolute start-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">
          {stageSafe + 1} / {stageList.length}
        </p>
      )}
      <div className="relative">
        <p data-testid="hero-product-title" className="font-heading text-lg font-bold leading-8 text-white sm:text-xl lg:text-2xl lg:leading-10">
          {stage.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ProductPrice price={stage.price} size="md" />
          <Link
            href={`/products/${stage.slug}`}
            aria-label={`${stage.title} — ${t('products.view_details')}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            {t('products.view_details')}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
    )
  ) : null;

  const stageInner = prefersReduced ? (
    <div>{stageBody}</div>
  ) : (
    <motion.div
      key={stage?.id ?? 'empty'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {stageBody}
    </motion.div>
  );

  return (
    <div data-testid="homepage-showcase">
      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-[2.1fr_0.9fr] lg:gap-6">
        {/* MAIN VISUAL FRAME (first in DOM = right in RTL) */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="showcase-stage-glow pointer-events-none absolute -inset-6 rounded-[2rem]"
          />
          <div
            data-testid="hero-showcase"
            className="relative overflow-hidden rounded-2xl border-2 border-neutral-900/80 bg-white shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)] dark:border-white/20 dark:bg-neutral-900 dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.8)]"
          >
            {stageBody ? (
              stageInner
            ) : (
              <div
                data-testid="hero-showcase-empty"
                className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 p-8 text-center"
              >
                <span aria-hidden className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl" />
                  <span className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-gradient-to-l from-transparent via-amber-500/80 to-transparent" />
                  <Sun className="relative h-10 w-10 text-amber-500" />
                </span>
                <span aria-hidden className="h-px w-36 bg-neutral-900/15 dark:bg-white/15" />
                <p className="max-w-xs text-sm leading-7 text-neutral-500 dark:text-neutral-400">{t('home.empty_showcase_hint')}</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-900/80 bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-900 hover:text-white dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-neutral-900"
                >
                  {t('home.featured_cta')}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-600/10" />
          </div>

          {/* CMS floating visuals composed around the main frame. */}
          {floating.map((v, i) => (
            <div
              key={v.id}
              aria-hidden
              data-testid="hero-floating-visual"
              className={`absolute hidden w-24 md:block ${i === 0 ? '-end-5 -top-7 rotate-3' : '-start-6 -bottom-7 -rotate-3'}`}
            >
              <div className="overflow-hidden rounded-xl border-2 border-neutral-900/70 bg-white shadow-lg dark:border-white/20 dark:bg-neutral-900">
                <Image
                  src={resolveMediaUrl(v.image_url) || v.image_url}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  className="h-24 w-full object-cover"
                />
              </div>
            </div>
          ))}

        </div>

        {/* INSTANT-SUGGESTION PANEL (left in RTL, subordinate to the stage) */}
        <aside
          aria-labelledby="instant-offer-heading"
          data-testid="instant-offer-panel"
          className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-neutral-900/80 bg-white shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)] dark:border-white/20 dark:bg-neutral-900"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-neutral-900/80 bg-neutral-900 px-4 py-2.5 dark:border-white/20 dark:bg-neutral-800">
            <h2 id="instant-offer-heading" className="font-heading text-sm font-extrabold text-white">
              {t('home.instant_offer')}
            </h2>
            {instant?.price?.state === 'discounted' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                <Zap className="h-3 w-3" aria-hidden />
                {t('products.discount_badge')}
              </span>
            )}
          </div>

          {instant ? (
            <div
              className="flex flex-1 flex-col"
              onTouchStart={(e) => {
                instantTouchX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const start = instantTouchX.current;
                instantTouchX.current = null;
                if (start === null) return;
                const end = e.changedTouches[0]?.clientX ?? start;
                const delta = end - start;
                if (Math.abs(delta) < 40) return;
                const forward = isRTL ? delta < 0 : delta > 0;
                goInstant(instantSafe + (forward ? 1 : -1));
              }}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {instant.cover_image_url?.trim() ? (
                  <Image
                    key={instant.id}
                    src={resolveMediaUrl(instant.cover_image_url)}
                    alt={instant.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center" aria-hidden>
                    <Sun className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p data-testid="instant-offer-title" className="font-heading text-base font-extrabold leading-7 text-neutral-900 line-clamp-2 dark:text-white">
                  {instant.title}
                </p>
                {instant.short_description && (
                  <p className="text-xs leading-6 text-neutral-500 line-clamp-2 dark:text-neutral-400">{instant.short_description}</p>
                )}
                <div className="mt-auto pt-2">
                  <ProductPrice price={instant.price} size="sm" tone="light" />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Link
                      href={`/products/${instant.slug}`}
                      aria-label={`${instant.title} — ${t('products.view_details')}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-700"
                    >
                      {t('products.view_details')}
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                    </Link>
                    {products.length > 1 && (
                      <div className="flex items-center gap-1.5" role="group" aria-label={t('home.instant_offer')}>
                        <button
                          type="button"
                          onClick={() => goInstant(instantSafe - 1)}
                          aria-label={`${t('common.previous')} — ${t('home.instant_offer')}`}
                          className="rounded-full border border-neutral-900/20 p-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/20 dark:text-neutral-300 dark:hover:border-white dark:hover:text-white"
                        >
                          {isRTL ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
                        </button>
                        <button
                          type="button"
                          onClick={() => goInstant(instantSafe + 1)}
                          aria-label={`${t('common.next')} — ${t('home.instant_offer')}`}
                          className="rounded-full border border-neutral-900/20 p-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/20 dark:text-neutral-300 dark:hover:border-white dark:hover:text-white"
                        >
                          {isRTL ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                        </button>
                      </div>
                    )}
                  </div>
                  {products.length > 1 && (
                    <p className="mt-2 text-xs text-neutral-400" aria-live="polite" dir="auto">
                      {instantSafe + 1} / {products.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden />
              <p className="text-sm leading-7 text-neutral-500 dark:text-neutral-400">{t('home.empty_showcase_hint')}</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-900/25 px-4 py-2 text-sm font-bold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white/25 dark:text-neutral-200 dark:hover:bg-white dark:hover:text-neutral-900"
              >
                {t('home.featured_cta')}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Main-stage prev/next (visual transition across the scoped list). */}
      {stageList.length > 1 && (
        <div className="mt-3 flex items-center gap-2" role="group" aria-label={t('home.featured_title')}>
          <button
            type="button"
            onClick={() => goStage(stageSafe - 1)}
            aria-label={`${t('common.previous')} — ${t('home.featured_title')}`}
            className="rounded-full border-2 border-neutral-900/25 bg-white p-2 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => goStage(stageSafe + 1)}
            aria-label={`${t('common.next')} — ${t('home.featured_title')}`}
            className="rounded-full border-2 border-neutral-900/25 bg-white p-2 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      )}
    </div>
  );
}

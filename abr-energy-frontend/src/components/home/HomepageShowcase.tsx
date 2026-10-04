'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Sun, Zap } from 'lucide-react';
import { useLocale } from '@/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { ProductPrice } from '@/components/products/public/ProductPrice';
import type { HomepageVisual, ProductCategory, ProductListItem } from '@/types';

/**
 * Phase 12.1 — Reference-B homepage showcase composition.
 *
 * Light editorial first-viewport workspace rendered inside the hero section:
 *
 *   [ MAIN VISUAL FRAME (right in RTL) ] [ INSTANT-SUGGESTION PANEL (left) ]
 *   [ CATEGORY / VISUAL NAVIGATION STRIP — below the main frame          ]
 *
 * Everything is CMS-driven with hook fallbacks resolved by the caller:
 * - `products`: featured products (title / image / price / detail CTA).
 * - `categories`: real category tree (ids, titles, slugs, order).
 * - `visuals`: HomepageVisual media composed around the main frame.
 *
 * No fake products, prices, or images are ever invented. Category → visual
 * mapping resolves the first featured product in the selected category
 * (the public category list carries no cover of its own); when nothing
 * matches, a designed empty state preserves the composition.
 *
 * Testid contract (shared with the Phase-12 hero stage so existing
 * assertions keep passing): `hero-showcase`, `hero-product-title`,
 * `hero-showcase-empty`, `hero-floating-visual`.
 */
export function HomepageShowcase({
  products,
  categories,
  visuals,
}: {
  products: ProductListItem[];
  categories: ProductCategory[];
  visuals?: HomepageVisual[] | null;
}) {
  const { t, isRTL } = useLocale();
  const prefersReduced = useReducedMotion();
  const stripRef = useRef<HTMLDivElement>(null);
  const instantTouchX = useRef<number | null>(null);

  const roots = useMemo(() => {
    const list = categories.some((c) => !c.parent)
      ? categories.filter((c) => !c.parent)
      : categories;
    return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [categories]);

  // Selected category (real id, null = overview). Defaults to the first
  // root so the strip always has an active state when taxonomy exists.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeCategoryId = selectedId ?? roots[0]?.id ?? null;
  const activeCategory = roots.find((c) => c.id === activeCategoryId) ?? null;

  // Main visual: first featured product in the selected category, else the
  // first featured product overall (CMS order). Never fabricated.
  const scoped = useMemo(
    () =>
      activeCategoryId
        ? products.filter((p) => p.category === activeCategoryId)
        : [],
    [products, activeCategoryId],
  );
  const stageList = scoped.length > 0 ? scoped : products;
  const [stageIndex, setStageIndex] = useState(0);
  const stageSafe = stageList.length === 0 ? 0 : Math.min(Math.max(stageIndex, 0), stageList.length - 1);
  const stage = stageList.length === 0 ? null : stageList[stageSafe];

  const selectCategory = useCallback((id: string | null) => {
    setSelectedId(id);
    setStageIndex(0);
  }, []);

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

  const onStripKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (roots.length === 0) return;
      const current = Math.max(
        0,
        roots.findIndex((c) => c.id === activeCategoryId),
      );
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectCategory(roots[(current + (isRTL ? 1 : roots.length - 1)) % roots.length]?.id ?? null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectCategory(roots[(current + (isRTL ? roots.length - 1 : 1)) % roots.length]?.id ?? null);
      }
    },
    [roots, activeCategoryId, selectCategory, isRTL],
  );

  const floating = (visuals ?? []).filter((v) => v.image_url?.trim()).slice(0, 2);

  const stageBody = stage && stage.cover_image_url?.trim() ? (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
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
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/55 p-3 backdrop-blur-md sm:p-4">
        <p data-testid="hero-product-title" className="font-heading text-base font-bold leading-7 text-white sm:text-lg">
          {stage.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ProductPrice price={stage.price} size="sm" />
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
      <div className="grid items-stretch gap-4 lg:grid-cols-[1.65fr_0.85fr] lg:gap-5">
        {/* MAIN VISUAL FRAME (first in DOM = right in RTL) */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="showcase-stage-glow pointer-events-none absolute -inset-6 rounded-[2rem]"
          />
          <div
            data-testid="hero-showcase"
            className="relative overflow-hidden rounded-2xl border-2 border-neutral-900/80 bg-white shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)]"
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
                <span aria-hidden className="h-px w-36 bg-neutral-900/15" />
                <p className="max-w-xs text-sm leading-7 text-neutral-500">{t('home.featured_subtitle')}</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-900/80 bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
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
              <div className="overflow-hidden rounded-xl border-2 border-neutral-900/70 bg-white shadow-lg">
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

          {/* CATEGORY / VISUAL NAVIGATION STRIP — below the main frame. */}
          {roots.length > 0 && (
            <div className="mt-3">
              <div
                ref={stripRef}
                role="navigation"
                aria-label={t('home.categories_title')}
                data-testid="showcase-category-rail"
                onKeyDown={onStripKeyDown}
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x"
              >
                {roots.map((cat) => {
                  const isActive = cat.id === activeCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => selectCategory(cat.id)}
                      aria-current={isActive ? true : undefined}
                      aria-pressed={isActive}
                      data-active={isActive}
                      className={`shrink-0 snap-start rounded-xl border-2 px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                        isActive
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                          : 'border-neutral-900/25 bg-white text-neutral-700 hover:border-neutral-900/60 hover:text-neutral-900'
                      }`}
                    >
                      {cat.title}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-xs text-neutral-500" aria-live="polite">
                  {activeCategory ? activeCategory.title : ''}
                </p>
                <Link
                  href={activeCategory ? `/products/category/${activeCategory.slug}` : '/products'}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-900/25 px-3 py-1.5 text-xs font-bold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  {t('home.categories_cta')}
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* INSTANT-SUGGESTION PANEL (left in RTL, subordinate to the stage) */}
        <aside
          aria-labelledby="instant-offer-heading"
          data-testid="instant-offer-panel"
          className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-neutral-900/80 bg-white shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-neutral-900/80 bg-neutral-900 px-4 py-2.5">
            <h2 id="instant-offer-heading" className="font-heading text-sm font-extrabold text-white">
              {t('home.instant_offer')}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
              <Zap className="h-3 w-3" aria-hidden />
              {t('products.discount_badge')}
            </span>
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
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
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
                <p data-testid="instant-offer-title" className="font-heading text-base font-extrabold leading-7 text-neutral-900 line-clamp-2">
                  {instant.title}
                </p>
                {instant.short_description && (
                  <p className="text-xs leading-6 text-neutral-500 line-clamp-2">{instant.short_description}</p>
                )}
                <div className="mt-auto pt-2">
                  <ProductPrice price={instant.price} size="sm" />
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
                          className="rounded-full border border-neutral-900/20 p-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
                        >
                          {isRTL ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
                        </button>
                        <button
                          type="button"
                          onClick={() => goInstant(instantSafe + 1)}
                          aria-label={`${t('common.next')} — ${t('home.instant_offer')}`}
                          className="rounded-full border border-neutral-900/20 p-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
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
              <Search className="h-8 w-8 text-neutral-300" aria-hidden />
              <p className="text-sm leading-7 text-neutral-500">{t('home.featured_subtitle')}</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-900/25 px-4 py-2 text-sm font-bold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
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
            className="rounded-full border-2 border-neutral-900/25 bg-white p-2 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => goStage(stageSafe + 1)}
            aria-label={`${t('common.next')} — ${t('home.featured_title')}`}
            className="rounded-full border-2 border-neutral-900/25 bg-white p-2 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      )}
    </div>
  );
}

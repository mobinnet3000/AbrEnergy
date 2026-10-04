'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import { useFeaturedPublicProducts, usePublicProductCategories } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { CardLoading } from '@/components/shared';
import { ProductCard, flattenCategoryTree } from '@/components/products/public';
import { ProductPrice } from '@/components/products/public/ProductPrice';
import { resolveMediaUrl } from '@/lib/media-url';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageSection, ProductListItem } from '@/types';

function featuredItems(data: unknown): ProductListItem[] {
  if (Array.isArray(data)) return data as ProductListItem[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ProductListItem[] }).results;
  }
  return [];
}

/**
 * Homepage featured-products showcase. Phase 7 — accepts optional CMS
 * content (`cms.items` = curated relations, `cms.section` = copy +
 * visibility). Without CMS data it consumes the real public
 * `useFeaturedPublicProducts` hook exactly as before. Renders the shared
 * `ProductCard` (backend effective pricing — never recomputed here).
 * Hides itself when empty instead of showing fake items.
 *
 * Phase 11 — premium showcase composition: an active-product spotlight
 * (large visual, title, category context, backend pricing, detail CTA)
 * with the rail acting as adjacent discoverable navigation. The rail
 * keeps its scroll/keyboard/reduced-motion behavior; the spotlight adds
 * wrapped prev/next, dots, touch-swipe, and live active state.
 */
export function FeaturedProductsSection({ cms }: {
  cms?: { items?: ProductListItem[] | null; section?: HomepageSection | null } | null;
}) {
  const { t, isRTL } = useLocale();
  const prefersReduced = useReducedMotion();
  const { data, isLoading } = useFeaturedPublicProducts();
  const { data: categoriesData } = usePublicProductCategories();
  const railRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const hookProducts = useMemo(() => featuredItems(data), [data]);

  const products = cms?.items !== undefined && cms?.items !== null ? cms.items : hookProducts;
  const loading = cms?.items !== undefined && cms?.items !== null ? false : isLoading;
  const cmsDisabled = !!cms?.section && cms.section.enabled === false;

  const title = homepageCopy(cms?.section?.title, t('home.featured_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.featured_subtitle'));

  const categoryTitles = useMemo(() => {
    const map = new Map<string, string>();
    const roots = Array.isArray(categoriesData)
      ? categoriesData
      : Array.isArray(categoriesData?.results)
        ? categoriesData.results
        : [];
    for (const { category } of flattenCategoryTree(roots)) {
      map.set(category.id, category.title);
    }
    return map;
  }, [categoriesData]);

  // Active spotlight index (wrapped). safeIndex clamps on every render so
  // list changes can never produce an out-of-range active product.
  const [activeIndex, setActiveIndex] = useState(0);
  const count = products.length;
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(activeIndex, 0), count - 1);
  const active = count === 0 ? null : products[safeIndex];

  const scrollRail = useCallback(
    (direction: 1 | -1) => {
      const el = railRef.current;
      if (!el) return;
      // Logical "next" moves toward inline-end: visually left in RTL.
      const delta = (isRTL ? -direction : direction) * Math.min(el.clientWidth * 0.8, 640);
      el.scrollBy({ left: delta, behavior: prefersReduced ? 'auto' : 'smooth' });
    },
    [isRTL, prefersReduced],
  );

  const scrollToCard = useCallback(
    (index: number) => {
      const el = railRef.current?.children[index] as HTMLElement | undefined;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          inline: 'nearest',
          block: 'nearest',
        });
      }
    },
    [prefersReduced],
  );

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const wrapped = ((index % count) + count) % count;
      setActiveIndex(wrapped);
      scrollToCard(wrapped);
    },
    [count, scrollToCard],
  );

  const goNext = useCallback(() => scrollRail(1), [scrollRail]);
  const goPrev = useCallback(() => scrollRail(-1), [scrollRail]);
  const goSpotlightNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
  const goSpotlightPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isRTL) goNext();
        else goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRTL) goPrev();
        else goNext();
      }
    },
    [goNext, goPrev, isRTL],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start === null) return;
      const end = e.changedTouches[0]?.clientX ?? start;
      const delta = end - start;
      if (Math.abs(delta) < 40) return;
      // Swipe toward inline-start reveals the previous item in RTL reading
      // order; toward inline-end reveals the next one.
      const forward = isRTL ? delta < 0 : delta > 0;
      if (forward) goSpotlightNext();
      else goSpotlightPrev();
    },
    [goSpotlightNext, goSpotlightPrev, isRTL],
  );

  if (loading) {
    return (
      <section data-section="featured" aria-busy="true" className="relative py-24 md:py-32 overflow-hidden bg-black">
        <div className="container-page relative z-10">
          <CardLoading count={4} />
        </div>
      </section>
    );
  }

  // Graceful empty/error state: hide the section without breaking layout.
  // Never render fake fallback products. A CMS-disabled section renders
  // nothing (section visibility rule).
  if (cmsDisabled || products.length === 0) return null;

  const showControls = products.length > 1;
  // The spotlight needs adjacent products to navigate between; a single
  // featured product keeps the classic rail exactly as before.
  const showShowcase = products.length > 1;
  const activeCategory = active?.category ? categoryTitles.get(active.category) : undefined;

  const spotlightBody = active && (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Phase 12 — solar stage glow behind the active product. */}
        <div aria-hidden className="hero-stage-glow absolute -inset-8 rounded-[2.5rem]" />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_32px_100px_-24px_rgba(0,0,0,0.85)]">
        <div className="relative aspect-[4/3]">
          {active.cover_image_url ? (
            <Image
              key={active.id}
              src={resolveMediaUrl(active.cover_image_url)}
              alt={active.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center" aria-hidden>
              <Sun className="h-20 w-20 text-white/10" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
            {/* Phase 12 — product number + category glass chips on the stage. */}
            <div className="absolute inset-x-4 top-4 flex items-start justify-between" aria-hidden={false}>
              <span dir="auto" className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md">
                {safeIndex + 1} / {count}
              </span>
              {(activeCategory || active.category) && (
                <span className="rounded-full border border-amber-300/25 bg-black/55 px-3 py-1 text-xs font-semibold text-amber-200/90 backdrop-blur-md">
                  {activeCategory ?? ''}
                </span>
              )}
            </div>
          </div>
          <div aria-hidden className="mx-auto mt-3 h-px w-2/3 bg-gradient-to-l from-transparent via-emerald-300/30 to-transparent" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-emerald-400/10" aria-hidden />
        </div>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {(activeCategory || active.category) && (
          <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-3">
            {activeCategory ?? ''}
          </p>
        )}
        <h3 className="font-heading text-3xl md:text-4xl font-bold text-white leading-snug mb-3">
          {active.title}
        </h3>
        {active.short_description && (
          <p className="text-white/50 leading-8 mb-5 line-clamp-3">{active.short_description}</p>
        )}
        <div className="mb-6">
          <ProductPrice price={active.price} size="lg" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/products/${active.slug}`}
            aria-label={`${active.title} — ${t('products.view_details')}`}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-500 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 transition-all duration-700" aria-hidden />
            <span className="relative z-10 flex items-center gap-2 text-white">
              {t('products.view_details')} <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" aria-hidden />
            </span>
          </Link>
          {showControls && (
            <div className="flex items-center gap-2" role="group" aria-label={t('products.label')}>
              <button
                type="button"
                onClick={goSpotlightPrev}
                aria-label={`${t('common.previous')} — ${active.title}`}
                className="rounded-full border border-white/10 bg-white/[0.03] p-3 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                {isRTL ? <ChevronRight className="h-5 w-5" aria-hidden /> : <ChevronLeft className="h-5 w-5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={goSpotlightNext}
                aria-label={`${t('common.next')} — ${active.title}`}
                className="rounded-full border border-white/10 bg-white/[0.03] p-3 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                {isRTL ? <ChevronLeft className="h-5 w-5" aria-hidden /> : <ChevronRight className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          )}
        </div>
        {showControls && (
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2" role="group" aria-label={title}>
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={p.title}
                  aria-current={i === safeIndex ? true : undefined}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                    i === safeIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-white/40" aria-live="polite" dir="auto">
              {safeIndex + 1} / {count}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      data-section="featured"
      data-testid="featured-products"
      className="relative py-24 md:py-32 overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950/5 to-black" aria-hidden />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/4 rounded-full blur-[150px]" aria-hidden />

      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col gap-6 mb-12 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-[0.2em] mb-4">
              {t('products.label')}
            </p>
            <h2 id="homepage-featured-heading" className="font-heading text-4xl md:text-5xl font-bold text-white">
              {title}
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mt-3">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {showControls && (
              <div className="flex items-center gap-2" role="group" aria-label={title}>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t('common.previous')}
                  className="rounded-full border border-white/10 bg-white/[0.03] p-3 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  {/* Prev points toward inline-start (right in RTL, left in LTR). */}
                  {isRTL ? <ChevronRight className="h-5 w-5" aria-hidden /> : <ChevronLeft className="h-5 w-5" aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t('common.next')}
                  className="rounded-full border border-white/10 bg-white/[0.03] p-3 text-white/70 backdrop-blur-md transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  {/* Next points toward inline-end (left in RTL, right in LTR). */}
                  {isRTL ? <ChevronLeft className="h-5 w-5" aria-hidden /> : <ChevronRight className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            )}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              {t('home.featured_cta')}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>

        {/* Phase 11 — active product spotlight. Static under reduced motion. */}
        {showShowcase && (
          <div data-testid="featured-spotlight" className="mb-12">
            {prefersReduced ? (
              <div>{spotlightBody}</div>
            ) : (
              <motion.div
                key={active?.id ?? 'empty'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
              >
                {spotlightBody}
              </motion.div>
            )}
          </div>
        )}

        {/* Phase 12.1 — Reference-A dense rail: narrow cards so 5–8
            products are visible simultaneously on desktop (3–4 tablet,
            1–2 mobile). Scroll/keyboard/RTL/reduced-motion logic untouched. */}
        <div
          ref={railRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
          data-testid="featured-rail"
          onKeyDown={onKeyDown}
          className="product-rail-dense -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x scroll-px-1"
        >
          {products.map((product, i) => (
            <div
              key={product.id}
              className="w-[168px] sm:w-[188px] lg:w-[208px] xl:w-[220px] shrink-0 snap-start"
              role="group"
              aria-roledescription="slide"
              aria-label={product.title}
              aria-current={i === safeIndex ? true : undefined}
              data-active={i === safeIndex}
            >
              <ProductCard
                product={product}
                categoryTitle={product.category ? categoryTitles.get(product.category) : undefined}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

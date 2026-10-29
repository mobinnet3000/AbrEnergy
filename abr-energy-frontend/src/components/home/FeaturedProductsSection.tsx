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
import { hasValidSlug } from '@/lib/slug';
import { homepageCopy } from '@/lib/homepage';
import { isHomepagePreviewEnabled, previewProducts } from '@/lib/homepage-preview';
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
  cms?: { items?: ProductListItem[] | null; section?: HomepageSection | null; pending?: boolean } | null;
}) {
  const { t, isRTL } = useLocale();
  const prefersReduced = useReducedMotion();
  // Phase 12.4 — preview fixtures fill the rail when the CMS is empty
  // (dev only, never prod). Tones stay `light` (dark-adaptive via CSS).
  const preview = isHomepagePreviewEnabled();
  // Phase 12.14 — skip the featured-products fallback fetch when the homepage
  // payload supplies curated items. The category tree is still fetched (it
  // resolves the filter labels). Same idiom as HeroSection.
  const cmsGiven = cms?.items !== undefined && cms?.items !== null;
  const isPending = cms?.pending === true;
  const { data, isLoading } = useFeaturedPublicProducts(undefined, { enabled: !cmsGiven && !isPending });
  const { data: categoriesData } = usePublicProductCategories();
  const railRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const hookProducts = useMemo(() => featuredItems(data), [data]);


  const baseProducts = cmsGiven ? (cms.items as ProductListItem[]) : hookProducts;
  // Preview fills CMS-driven AND hook-driven empties alike (dev only);
  // real products always win when present.
  // Phase 12.13 — a product without a slug cannot open a detail page.
  const products = (baseProducts.length > 0 || !preview ? baseProducts : previewProducts).filter(
    (p) => hasValidSlug(p.slug),
  );
  const loading = cmsGiven ? false : isLoading;
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

  // Phase 12.11 — category filter on the featured rail. The person picks one
  // of the categories actually present among the featured products, or "all".
  // Options are derived from the data (never invented) and resolve titles via
  // the real category tree.
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const filterOptions = useMemo(() => {
    const used = new Set<string>();
    const options: { id: string; title: string }[] = [];
    for (const p of products) {
      if (!p.category || used.has(p.category)) continue;
      const title = categoryTitles.get(p.category);
      if (!title) continue;
      used.add(p.category);
      options.push({ id: p.category, title });
    }
    return options;
  }, [products, categoryTitles]);
  const activeFilter = filterOptions.some((o) => o.id === categoryFilter) ? categoryFilter : 'all';
  const visibleProducts = useMemo(
    () => (activeFilter === 'all' ? products : products.filter((p) => p.category === activeFilter)),
    [products, activeFilter],
  );

  // Active spotlight index (wrapped). safeIndex clamps on every render so
  // list changes can never produce an out-of-range active product.
  const [activeIndex, setActiveIndex] = useState(0);
  // Switching category always restarts at the first product of that category
  // (done in the handler — no effect needed, avoids a cascading render).
  const selectFilter = useCallback((id: string) => {
    setCategoryFilter(id);
    setActiveIndex(0);
  }, []);
  const count = visibleProducts.length;
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(activeIndex, 0), count - 1);
  const active = count === 0 ? null : visibleProducts[safeIndex];

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
      <section data-section="featured" aria-busy="true" className="relative py-12 md:py-16 overflow-hidden bg-white border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/10">
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

  const showControls = visibleProducts.length > 1;
  // The spotlight needs adjacent products to navigate between; a single
  // featured product keeps the classic rail exactly as before.
  const showShowcase = visibleProducts.length > 1;
  const showFilter = filterOptions.length > 1;
  const activeCategory = active?.category ? categoryTitles.get(active.category) : undefined;

  const spotlightBody = active && (
    <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Phase 12 — solar stage glow behind the active product. */}
        <div aria-hidden className="showcase-stage-glow absolute -inset-4 rounded-[1.5rem]" />
        <div className="relative overflow-hidden rounded-2xl border-2 border-neutral-900/80 bg-white shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)] dark:border-white/20 dark:bg-neutral-900">
        <div className="relative aspect-[16/10]">
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
            <div data-testid="featured-spotlight-fallback" className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-bl from-emerald-950 via-neutral-900 to-amber-950 p-6 text-center" aria-hidden={false}>
              <Sun className="h-16 w-16 text-amber-400/70" aria-hidden />
              <p className="max-w-xs text-sm font-bold leading-7 text-white">{active.title}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
            {/* Phase 12 — product number + category glass chips on the stage. */}
            <div className="absolute inset-x-4 top-4 flex items-start justify-between" aria-hidden={false}>
              <span dir="auto" className="rounded-full border border-neutral-900/20 bg-white/90 px-3 py-1 text-xs font-bold text-neutral-900">
                {safeIndex + 1} / {count}
              </span>
              {activeCategory && (
                <span className="rounded-full border border-neutral-900/20 bg-white/90 px-3 py-1 text-xs font-bold text-emerald-800">
                  {activeCategory}
                </span>
              )}
            </div>
          </div>
          <div aria-hidden className="mx-auto mt-3 h-px w-2/3 bg-gradient-to-l from-transparent via-emerald-600/30 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-600/10" />
        </div>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {activeCategory && (
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.2em] mb-2 dark:text-emerald-400">
            {activeCategory}
          </p>
        )}
        <h3 className="font-heading text-xl md:text-2xl font-bold text-neutral-950 leading-[1.6] mb-2 dark:text-white">
          {active.title}
        </h3>
        {active.short_description && (
          <p className="text-neutral-600 leading-7 mb-4 text-sm line-clamp-3 dark:text-neutral-300">{active.short_description}</p>
        )}
        <div className="mb-4">
          <ProductPrice price={active.price} size="lg" tone="light" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/products/${active.slug}`}
            aria-label={`${active.title} — ${t('products.view_details')}`}
            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold rounded-xl overflow-hidden transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <span className="absolute inset-0 bg-emerald-700 group-hover:bg-emerald-600 transition-all duration-300" aria-hidden />
            <span className="relative z-10 flex items-center gap-2 text-white">
              {t('products.view_details')} <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" aria-hidden />
            </span>
          </Link>
          {showControls && (
            <div className="flex items-center gap-2" role="group" aria-label={t('products.label')}>
              <button
                type="button"
                onClick={goSpotlightPrev}
                aria-label={`${t('common.previous')} — ${active.title}`}
                className="rounded-full border-2 border-neutral-900/25 bg-white p-2.5 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
              >
                {isRTL ? <ChevronRight className="h-5 w-5" aria-hidden /> : <ChevronLeft className="h-5 w-5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={goSpotlightNext}
                aria-label={`${t('common.next')} — ${active.title}`}
                className="rounded-full border-2 border-neutral-900/25 bg-white p-2.5 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
              >
                {isRTL ? <ChevronLeft className="h-5 w-5" aria-hidden /> : <ChevronRight className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          )}
        </div>
        {showControls && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2" role="group" aria-label={title}>
              {visibleProducts.map((p, i) => (
                <button
                  key={p.id ?? p.slug ?? `dot-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={p.title}
                  aria-current={i === safeIndex ? true : undefined}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    i === safeIndex ? 'w-8 bg-emerald-700 dark:bg-emerald-400' : 'w-2 bg-neutral-900/20 hover:bg-neutral-900/40 dark:bg-white/20 dark:hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400" aria-live="polite" dir="auto">
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
      className="relative py-12 md:py-16 overflow-hidden bg-white border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/10"
    >
      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col gap-3 mb-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.2em] mb-2 dark:text-emerald-400">
              {t('products.label')}
            </p>
            <h2 id="homepage-featured-heading" className="font-heading text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              {title}
            </h2>
            <p className="text-neutral-500 text-sm max-w-2xl mt-2 dark:text-neutral-400">{subtitle}</p>
            {preview && (
              <p data-testid="preview-notice" className="mt-2 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                {t('home.preview_notice')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showControls && (
              <div className="flex items-center gap-2" role="group" aria-label={title}>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t('common.previous')}
                  className="rounded-full border-2 border-neutral-900/25 bg-white p-2.5 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
                >
                  {/* Prev points toward inline-start (right in RTL, left in LTR). */}
                  {isRTL ? <ChevronRight className="h-5 w-5" aria-hidden /> : <ChevronLeft className="h-5 w-5" aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t('common.next')}
                  className="rounded-full border-2 border-neutral-900/25 bg-white p-2.5 text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/25 dark:bg-transparent dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
                >
                  {/* Next points toward inline-end (left in RTL, right in LTR). */}
                  {isRTL ? <ChevronLeft className="h-5 w-5" aria-hidden /> : <ChevronRight className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            )}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              {t('home.featured_cta')}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>

        {/* Phase 12.11 — featured rail submenu: pick a category (real, from the
            data) or "all". Filtering never invents products. */}
        {showFilter && (
          <div
            className="mb-6 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t('products.filter_category')}
          >
            <FeaturedFilterPill
              label={t('home.featured_filter_all')}
              active={activeFilter === 'all'}
              onClick={() => selectFilter('all')}
            />
            {filterOptions.map((option) => (
              <FeaturedFilterPill
                key={option.id || option.title}
                label={option.title}
                active={activeFilter === option.id}
                onClick={() => selectFilter(option.id)}
              />
            ))}
          </div>
        )}

        {/* Phase 11 — active product spotlight. Static under reduced motion. */}
        {showShowcase && (
          <div data-testid="featured-spotlight" className="mb-6">
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
          {visibleProducts.map((product, i) => (
            <div
              key={product.id ?? product.slug ?? `rail-prod-${i}`}
              className="w-[240px] sm:w-[260px] lg:w-[280px] xl:w-[300px] shrink-0 snap-start"
              role="group"
              aria-roledescription="slide"
              aria-label={product.title}
              aria-current={i === safeIndex ? true : undefined}
              data-active={i === safeIndex}
            >
              <ProductCard
                product={product}
                categoryTitle={product.category ? categoryTitles.get(product.category) : undefined}
                tone="light"
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedFilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-600 ${
        active
          ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-600'
          : 'border-emerald-700/20 bg-emerald-50 text-emerald-800 hover:border-emerald-700/40 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50'
      }`}
    >
      {label}
    </button>
  );
}

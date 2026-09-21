'use client';
import { useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedPublicProducts, usePublicProductCategories } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { CardLoading } from '@/components/shared';
import { ProductCard, flattenCategoryTree } from '@/components/products/public';
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
 */
export function FeaturedProductsSection({ cms }: {
  cms?: { items?: ProductListItem[] | null; section?: HomepageSection | null } | null;
}) {
  const { t, isRTL } = useLocale();
  const prefersReduced = useReducedMotion();
  const { data, isLoading } = useFeaturedPublicProducts();
  const { data: categoriesData } = usePublicProductCategories();
  const railRef = useRef<HTMLDivElement>(null);

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

  const goNext = useCallback(() => scrollRail(1), [scrollRail]);
  const goPrev = useCallback(() => scrollRail(-1), [scrollRail]);

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

        <div
          ref={railRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
          data-testid="featured-rail"
          onKeyDown={onKeyDown}
          className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-2 snap-x scroll-px-1"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[270px] sm:w-[320px] shrink-0 snap-start" role="group" aria-roledescription="slide" aria-label={product.title}>
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

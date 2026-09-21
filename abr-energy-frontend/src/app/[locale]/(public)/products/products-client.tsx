'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/i18n';
import { usePublicProductCategories, usePublicProducts } from '@/hooks/use-api';
import { CardLoading } from '@/components/shared';
import { ErrorState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import {
  DEFAULT_PRODUCT_FILTERS,
  ProductBreadcrumbs,
  ProductCategoryNavigation,
  ProductEmptyState,
  ProductFilters,
  ProductGrid,
  flattenCategoryTree,
  type ProductFilterState,
} from '@/components/products/public';
import type { ProductListItem } from '@/types';

const PAGE_SIZE = 20;

function faDigits(n: number | string): string {
  return Number(n).toLocaleString('fa-IR');
}

export function ProductsClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTERS);
  const [page, setPage] = useState(1);

  const applyFilters = (next: ProductFilterState) => {
    setFilters(next);
    setPage(1);
  };

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page) };
    if (filters.search.trim()) p.search = filters.search.trim();
    if (filters.categoryId) p.category = filters.categoryId;
    if (filters.featuredOnly) p.is_featured = 'true';
    if (filters.ordering) p.ordering = filters.ordering;
    return p;
  }, [filters, page]);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = usePublicProductCategories();
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? [])),
    [categoriesData],
  );

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = usePublicProducts(params);

  const products: ProductListItem[] = productsData?.results ?? [];
  const count: number = productsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const categoryTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const { category } of flattenCategoryTree(categories)) {
      map.set(category.id, category.title);
    }
    return map;
  }, [categories]);

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-10 md:pt-36 md:pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/15 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductBreadcrumbs
              trail={[{ label: t('products.home_crumb'), href: '/' }, { label: t('products.title') }]}
            />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5 mt-6">
            {t('products.label')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">
            {t('products.title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-2xl">
            {t('products.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8 md:pb-10">
        <div className="container-page">
          {categoriesLoading ? (
            <CardLoading count={4} />
          ) : (
            <ScrollReveal variant="slide-up">
              <ProductCategoryNavigation categories={categories} />
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Filters + listing */}
      <section className="pb-28 md:pb-36">
        <div className="container-page flex flex-col gap-6">
          <ProductFilters filters={filters} onChange={applyFilters} categories={categories} />

          {productsLoading ? (
            <CardLoading count={6} />
          ) : productsError ? (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetchProducts() }}
            />
          ) : products.length === 0 ? (
            <ProductEmptyState
              action={
                filters.search || filters.categoryId || filters.featuredOnly
                  ? { label: t('products.clear_filters'), onClick: () => applyFilters({ ...DEFAULT_PRODUCT_FILTERS }) }
                  : undefined
              }
            />
          ) : (
            <>
              <p className="text-sm text-white/40" role="status" aria-live="polite">
                {faDigits(count)} {t('products.results_count')}
              </p>
              <ProductGrid products={products} categoryTitles={categoryTitles} />
              {totalPages > 1 && (
                <nav className="mt-4 flex items-center justify-center gap-2" aria-label={t('products.ordering_label')}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label={t('common.previous')}
                    className="rounded-xl border border-white/[0.08] p-2.5 text-white/60 transition enabled:hover:border-white/[0.16] enabled:hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="px-3 text-sm text-white/50" aria-current="page">
                    {t('products.page_of')} {faDigits(page)} / {faDigits(totalPages)}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label={t('common.next')}
                    className="rounded-xl border border-white/[0.08] p-2.5 text-white/60 transition enabled:hover:border-white/[0.16] enabled:hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}


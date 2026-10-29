'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useLocale } from '@/i18n';
import { usePublicProductCategories, usePublicProducts } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ErrorState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import {
  parseCatalogCategory,
  parseCatalogFeatured,
  parseCatalogOrdering,
  parseCatalogPage,
  parseCatalogSearch,
  buildCatalogQuery,
} from '@/lib/catalog-query';
import {
  DEFAULT_PRODUCT_FILTERS,
  ProductCategoryNavigation,
  ProductEmptyState,
  ProductFilters,
  ProductGrid,
  flattenCategoryTree,
  type ProductFilterState,
} from '@/components/products/public';
import type { ProductListItem } from '@/types';

const PAGE_SIZE = 20;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(val: string): boolean {
  return UUID_REGEX.test(val);
}

function faDigits(n: number | string): string {
  return Number(n).toLocaleString('fa-IR');
}

export function ProductsClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = parseCatalogSearch(searchParams.get('search'));
  const urlCategoryRaw = parseCatalogCategory(searchParams.get('category'));
  const urlFeatured = parseCatalogFeatured(searchParams.get('featured'));
  const urlOrdering = parseCatalogOrdering(searchParams.get('ordering'));
  const urlPage = parseCatalogPage(searchParams.get('page'));

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = usePublicProductCategories();
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? [])),
    [categoriesData],
  );

  const flatCategories = useMemo(() => flattenCategoryTree(categories), [categories]);

  // Resolve urlCategory (which may be a slug or a UUID) to the exact category.id expected by DRF.
  const resolvedCategoryId = useMemo(() => {
    if (!urlCategoryRaw) return '';
    const match = flatCategories.find(
      ({ category: c }) =>
        c.id === urlCategoryRaw || c.slug === urlCategoryRaw || c.slug_t === urlCategoryRaw,
    );
    if (match) return match.category.id;
    return isUuid(urlCategoryRaw) ? urlCategoryRaw : (flatCategories.length > 0 ? '' : urlCategoryRaw);
  }, [flatCategories, urlCategoryRaw]);

  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    search: urlSearch,
    categoryId: resolvedCategoryId,
    featuredOnly: urlFeatured,
    ordering: urlOrdering,
  }));
  const [page, setPage] = useState(urlPage);

  // Canonical query snapshot of the URL to prevent navigation loops
  const urlSnapshotRef = useRef('');

  // Sync external navigation (browser back/forward or deep links) to internal state
  /* eslint-disable react-hooks/set-state-in-effect -- The address bar is
  external state: adopt its snapshot into local state when navigation changes
  it underneath us. Every setter is a guarded no-op when already equal, so
  this converges without looping. */
  useEffect(() => {
    const canonicalQuery = buildCatalogQuery({
      search: urlSearch,
      category: urlCategoryRaw,
      featured: urlFeatured,
      ordering: urlOrdering,
      page: urlPage,
    });
    urlSnapshotRef.current = canonicalQuery;

    const targetCat = resolvedCategoryId || urlCategoryRaw;
    setFilters((prev) => {
      if (
        prev.search === urlSearch &&
        prev.categoryId === targetCat &&
        prev.featuredOnly === urlFeatured &&
        prev.ordering === urlOrdering
      ) {
        return prev;
      }
      return {
        search: urlSearch,
        categoryId: targetCat,
        featuredOnly: urlFeatured,
        ordering: urlOrdering,
      };
    });
    setPage((p) => (p === urlPage ? p : urlPage));
  }, [urlSearch, urlCategoryRaw, resolvedCategoryId, urlFeatured, urlOrdering, urlPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const syncUrl = (nextFilters: ProductFilterState, nextPage: number, method: 'push' | 'replace') => {
    const nextQuery = buildCatalogQuery({
      search: nextFilters.search,
      category: nextFilters.categoryId,
      featured: nextFilters.featuredOnly,
      ordering: nextFilters.ordering,
      page: nextPage,
    });
    if (nextQuery !== urlSnapshotRef.current) {
      urlSnapshotRef.current = nextQuery;
      const targetUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      if (method === 'push') {
        router.push(targetUrl);
      } else {
        router.replace(targetUrl);
      }
    }
  };

  const applyFilters = (next: ProductFilterState) => {
    setFilters(next);
    setPage(1);
    syncUrl(next, 1, 'replace');
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    syncUrl(filters, nextPage, 'push');
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
    for (const { category } of flatCategories) {
      map.set(category.id, category.title);
    }
    return map;
  }, [flatCategories]);

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('products.home_crumb'), href: '/' },
              { label: t('products.title') },
            ]}
            eyebrow={t('products.label')}
            title={t('products.title')}
            subtitle={t('products.subtitle')}
            actions={
              <Link
                href="/products/category"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Layers className="h-4 w-4 text-primary" aria-hidden />
                {t('products.categories_label')}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" aria-hidden />
              </Link>
            }
          />
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8 md:pb-10">
        <div className="container-page">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
              {t('products.filter_category')}
            </h2>
            <Link
              href="/products/category"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:underline"
            >
              {t('products.view_all_categories')}
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" aria-hidden />
            </Link>
          </div>
          {categoriesLoading ? (
            <CardLoading count={4} />
          ) : (
            <ScrollReveal variant="slide-up">
              <ProductCategoryNavigation categories={categories} tone="light" />
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Filters + listing */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page flex flex-col gap-6">
          <ProductFilters filters={filters} onChange={applyFilters} categories={categories} />

          {productsLoading ? (
            <CardLoading count={6} />
          ) : productsError ? (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={page > 1 ? { label: t('common.first_page') || 'بازگشت به صفحه اول', onClick: () => goToPage(1) } : { label: t('products.retry'), onClick: () => refetchProducts() }}
            />
          ) : products.length === 0 ? (
            <ProductEmptyState
              action={
                filters.search || filters.categoryId || filters.featuredOnly || filters.ordering
                  ? { label: t('products.clear_filters'), onClick: () => applyFilters({ ...DEFAULT_PRODUCT_FILTERS }) }
                  : undefined
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {faDigits(count)} {t('products.results_count')}
              </p>
              <ProductGrid products={products} categoryTitles={categoryTitles} tone="light" />
              {totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-2" aria-label={t('products.ordering_label')}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    aria-label={t('common.previous')}
                    className="rounded-xl border border-border bg-card p-2.5 text-foreground transition enabled:hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="px-3 text-sm text-muted-foreground" aria-current="page">
                    {t('products.page_of')} {faDigits(page)} / {faDigits(totalPages)}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    aria-label={t('common.next')}
                    className="rounded-xl border border-border bg-card p-2.5 text-foreground transition enabled:hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}


'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useLocale } from '@/i18n';
import { usePublicProductCategories, usePublicProductCategory, usePublicProducts } from '@/hooks/use-api';
import { resolveMediaUrl } from '@/lib/media-url';
import { CardLoading, PageLoading } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  ProductBreadcrumbs,
  ProductCategoryNavigation,
  ProductEmptyState,
  ProductGrid,
  flattenCategoryTree,
  type Crumb,
} from '@/components/products/public';
import type { ProductCategory, ProductListItem } from '@/types';

const PAGE_SIZE = 20;

function faDigits(n: number | string): string {
  return Number(n).toLocaleString('fa-IR');
}

function statusOf(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

export function CategoryClient({ slug }: { slug: string }) {
  const { t } = useLocale();
  // Page state lives here; the route renders <CategoryClient key={slug}>
  // so navigating between categories remounts and resets pagination.
  const [page, setPage] = useState(1);

  const {
    data: category,
    isLoading: categoryLoading,
    isError: categoryError,
    error: categoryErr,
    refetch: refetchCategory,
  } = usePublicProductCategory(slug);

  const { data: treeData } = usePublicProductCategories();
  const tree: ProductCategory[] = useMemo(
    () => (Array.isArray(treeData) ? treeData : (treeData?.results ?? [])),
    [treeData],
  );

  const flat = useMemo(() => flattenCategoryTree(tree), [tree]);
  const byId = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    for (const { category: node } of flat) map.set(node.id, node);
    return map;
  }, [flat]);

  // Active node within the tree (matches canonical or translated slug).
  const activeNode = useMemo(
    () => flat.find(({ category: node }) => node.slug === slug || node.slug_t === slug)?.category,
    [flat, slug],
  );
  const children = useMemo(() => activeNode?.children ?? [], [activeNode]);

  // Parent breadcrumb chain (root → direct parent), resolved from the tree.
  const parentCrumbs: Crumb[] = useMemo(() => {
    const chain: Crumb[] = [];
    const startId = category?.parent ?? activeNode?.parent ?? null;
    let currentId = startId;
    const guard = new Set<string>();
    while (currentId && !guard.has(currentId)) {
      guard.add(currentId);
      const node = byId.get(currentId);
      if (!node) break;
      chain.unshift({ label: node.title, href: `/products/category/${node.slug}` });
      currentId = node.parent;
    }
    return chain;
  }, [byId, category?.parent, activeNode?.parent]);

  const categoryId = category?.id;
  const productParams = useMemo(
    () => ({ category: categoryId ?? '', page: String(page) }),
    [categoryId, page],
  );
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = usePublicProducts(productParams, { enabled: !!categoryId });

  const products: ProductListItem[] = productsData?.results ?? [];
  const count: number = productsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const categoryTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const { category: node } of flat) map.set(node.id, node.title);
    return map;
  }, [flat]);

  if (categoryLoading) {
    return (
      <div className="bg-black min-h-screen pt-28 md:pt-36">
        <div className="container-page">
          <PageLoading />
        </div>
      </div>
    );
  }

  if (categoryError || !category) {
    const gone = statusOf(categoryErr) === 404;
    return (
      <div className="bg-black min-h-screen pt-28 md:pt-36">
        <div className="container-page">
          {gone ? (
            <NotFoundState title={t('products.category_not_found')} message={t('products.product_gone_hint')} />
          ) : (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetchCategory() }}
            />
          )}
          <div className="flex justify-center pb-20">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition hover:border-white/[0.16] hover:text-white"
            >
              {t('products.back_to_products')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const contentHtml = sanitizeHtml(category.content ?? '');

  return (
    <div className="bg-black min-h-screen">
      {/* Header */}
      <section className="relative pt-28 pb-10 md:pt-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/15 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductBreadcrumbs
              trail={[
                { label: t('products.home_crumb'), href: '/' },
                { label: t('products.title'), href: '/products' },
                ...parentCrumbs,
                { label: category.title },
              ]}
            />
          </motion.div>

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-heading text-4xl font-bold text-white md:text-6xl"
              >
                {category.title}
              </motion.h1>
              {category.description && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-4 max-w-2xl text-base leading-8 text-white/45"
                >
                  {category.description}
                </motion.p>
              )}
            </div>
            {category.cover_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.06]"
              >
                {/* Phase 5.2: narrow next/image adoption (category cover).
                    fill + priority preserve aspect, object-cover, eager load. */}
                <Image
                  src={resolveMediaUrl(category.cover_image_url)}
                  alt={category.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover"
                />
              </motion.div>
            )}
          </div>

          {contentHtml && (
            <div
              className="max-w-3xl text-sm leading-8 text-white/55"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}
        </div>
      </section>

      {/* Child categories — emphasized when present */}
      {children.length > 0 && (
        <section className="pb-8 md:pb-10" aria-label={t('products.children_title')}>
          <div className="container-page flex flex-col gap-4">
            <ScrollReveal variant="slide-up">
              <h2 className="font-heading text-xl font-bold text-white md:text-2xl">
                {t('products.children_title')}
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="slide-up" delay={0.05}>
              <ProductCategoryNavigation categories={children} activeSlug={slug} />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Products in this category */}
      <section className="pb-28 md:pb-36" aria-label={t('products.products_in_category')}>
        <div className="container-page flex flex-col gap-6">
          <h2 className="font-heading text-xl font-bold text-white md:text-2xl">
            {t('products.products_in_category')}
          </h2>
          {productsLoading ? (
            <CardLoading count={6} />
          ) : productsError ? (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetchProducts() }}
            />
          ) : products.length === 0 ? (
            <ProductEmptyState />
          ) : (
            <>
              <p className="text-sm text-white/40" role="status" aria-live="polite">
                {faDigits(count)} {t('products.results_count')}
              </p>
              <ProductGrid products={products} categoryTitles={categoryTitles} />
              {totalPages > 1 && (
                <nav className="mt-4 flex items-center justify-center gap-2" aria-label={t('products.page_of')}>
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

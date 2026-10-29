'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useLocale } from '@/i18n';
import {
  usePublicProductCategories,
  usePublicProductCategory,
  usePublicProducts,
} from '@/hooks/use-api';
import { CardLoading, InternalPageShell, PageLoading } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import { resolveMediaUrl } from '@/lib/media-url';
import { parseCatalogPage } from '@/lib/catalog-query';
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

export function CategoryClient({
  slug,
  previewCategory,
}: {
  slug: string;
  previewCategory?: import('@/types').ProductCategoryDetail | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseCatalogPage(searchParams.get('page'));

  const goToPage = (nextPage: number) => {
    const query = nextPage > 1 ? `?page=${nextPage}` : '';
    router.push(`${pathname}${query}`);
  };

  const isPreview = previewCategory !== undefined;
  const {
    data: fetchedCategory,
    isLoading: categoryLoading,
    isError: categoryError,
    error: categoryErr,
    refetch: refetchCategory,
  } = usePublicProductCategory(slug, { enabled: !isPreview });
  const category = (isPreview ? previewCategory : fetchedCategory) as typeof fetchedCategory;

  const { data: treeData } = usePublicProductCategories();
  const tree = useMemo(
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
      <InternalPageShell>
        <div className="container-page py-16">
          <PageLoading />
        </div>
      </InternalPageShell>
    );
  }

  if (categoryError || !category) {
    const status = statusOf(categoryErr);
    const gone = status === 404 || (!categoryError && !category);
    const is429 = status === 429;
    return (
      <InternalPageShell>
        <div className="container-page py-16">
          {gone ? (
            <NotFoundState title={t('products.category_not_found')} message={t('products.product_gone_hint')} />
          ) : (
            <ErrorState
              title={is429 ? (t('common.rate_limit_title') || 'محدودیت درخواست') : t('common.error')}
              message={is429 ? (t('common.rate_limit_hint') || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.') : t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetchCategory() }}
            />
          )}
          <div className="flex flex-wrap justify-center gap-3 pb-20">
            <Link
              href="/products/category"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {t('products.categories_label')}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              {t('products.back_to_products')}
            </Link>
          </div>
        </div>
      </InternalPageShell>
    );
  }

  const contentHtml = sanitizeHtml(category.content ?? '');

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-8 pt-6 sm:pb-10 sm:pt-8">
        <div className="container-page relative z-10 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductBreadcrumbs
              trail={[
                { label: t('products.home_crumb'), href: '/' },
                { label: t('products.title'), href: '/products' },
                { label: t('products.categories_crumb'), href: '/products/category' },
                ...parentCrumbs,
                { label: category.title },
              ]}
            />
          </motion.div>

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
              >
                {category.title}
              </motion.h1>
              {category.description && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground"
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
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs dark:border-white/10"
              >
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
              className="max-w-3xl text-sm leading-relaxed text-foreground/80 prose prose-neutral dark:prose-invert"
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
              <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                {t('products.children_title')}
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="slide-up" delay={0.05}>
              <ProductCategoryNavigation categories={children} activeSlug={slug} tone="light" />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Products in this category */}
      <section className="pb-20 sm:pb-28 md:pb-36" aria-label={t('products.products_in_category')}>
        <div className="container-page flex flex-col gap-6">
          <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
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
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {faDigits(count)} {t('products.results_count')}
              </p>
              <ProductGrid products={products} categoryTitles={categoryTitles} tone="light" />
              {totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-2" aria-label={t('products.page_of')}>
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

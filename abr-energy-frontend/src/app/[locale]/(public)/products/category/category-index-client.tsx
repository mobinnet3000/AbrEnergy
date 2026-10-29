'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Folder, Layers, Package, Star } from 'lucide-react';
import { useLocale } from '@/i18n';
import { usePublicProductCategories } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ErrorState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { hasValidSlug } from '@/lib/slug';
import { ProductEmptyState } from '@/components/products/public';
import type { ProductCategory } from '@/types';

export function CategoryIndexClient() {
  const { t } = useLocale();
  const {
    data: categoriesData,
    isLoading,
    isError,
    refetch,
  } = usePublicProductCategories();

  const rawCategories: ProductCategory[] = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData as ProductCategory[];
    const res = (categoriesData as { results?: ProductCategory[] } | null)?.results;
    return Array.isArray(res) ? res : [];
  }, [categoriesData]);

  // Group root categories and eliminate duplicates caused by flat lists containing nested children.
  const roots: ProductCategory[] = useMemo(() => {
    const hasRoots = rawCategories.some((c: ProductCategory) => !c.parent);
    const list = hasRoots ? rawCategories.filter((c: ProductCategory) => !c.parent) : rawCategories;
    return [...list]
      .filter((c: ProductCategory) => c.is_active !== false && hasValidSlug(c.slug))
      .sort((a: ProductCategory, b: ProductCategory) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [rawCategories]);

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10 flex flex-col gap-6">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('products.home_crumb'), href: '/' },
              { label: t('products.title'), href: '/products' },
              { label: t('products.categories_crumb') },
            ]}
            eyebrow={t('products.categories_label')}
            title={t('products.categories_title')}
            subtitle={t('products.categories_subtitle')}
            actions={
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Package className="h-4 w-4 text-primary" aria-hidden />
                {t('products.all_products')}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" aria-hidden />
              </Link>
            }
          />
        </div>
      </section>

      {/* Main Hierarchy Listing */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page flex flex-col gap-10">
          {isLoading ? (
            <div data-testid="category-index-loading" className="flex flex-col gap-6">
              <CardLoading count={4} />
            </div>
          ) : isError ? (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
            />
          ) : roots.length === 0 ? (
            <ProductEmptyState />
          ) : (
            <>
              {/* Quick Jump Rail for Root Categories */}
              <nav
                aria-label={t('products.categories_label')}
                className="flex gap-2 overflow-x-auto pb-2 snap-x"
              >
                {roots.map((root) => (
                  <a
                    key={root.id}
                    href={`#cat-${root.slug}`}
                    className="shrink-0 snap-start rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary dark:border-white/10 dark:bg-card/70"
                  >
                    {root.title}
                  </a>
                ))}
              </nav>

              {/* Top-Level Categories with Subcategory Cards */}
              <div className="flex flex-col gap-12">
                {roots.map((root: ProductCategory, index: number) => {
                  const children: ProductCategory[] = (root.children ?? [])
                    .filter((c: ProductCategory) => c.is_active !== false && hasValidSlug(c.slug))
                    .sort((a: ProductCategory, b: ProductCategory) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

                  return (
                    <ScrollReveal key={root.id} variant="slide-up" delay={index * 0.05}>
                      <section
                        id={`cat-${root.slug}`}
                        aria-labelledby={`heading-${root.slug}`}
                        className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-xs backdrop-blur-sm transition-all duration-300 dark:border-white/10 dark:bg-card/40 md:p-8"
                      >
                        {/* Root Category Header Row */}
                        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                          <div className="flex items-start gap-3.5">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                              <Folder className="h-6 w-6" aria-hidden />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2
                                  id={`heading-${root.slug}`}
                                  className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl"
                                >
                                  {root.title}
                                </h2>
                                {root.is_featured && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                    <Star className="h-3 w-3" aria-hidden />
                                    {t('products.featured_badge')}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {children.length > 0
                                  ? `${children.length} ${t('products.subcategories_title')}`
                                  : t('products.no_subcategories')}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/products/category/${root.slug}`}
                            aria-label={`${t('products.view_category_main')} ${root.title}`}
                            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-primary transition hover:bg-muted hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-primary sm:self-auto"
                          >
                            {t('products.view_category_main')}
                            <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" aria-hidden />
                          </Link>
                        </div>

                        {/* Nested Subcategories */}
                        {children.length > 0 ? (
                          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {children.map((child: ProductCategory) => (
                              <SubcategoryCard key={child.id} category={child} />
                            ))}
                          </div>
                        ) : (
                          <div className="mt-6 rounded-2xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
                            <p>{t('products.no_subcategories')}</p>
                            <Link
                              href={`/products/category/${root.slug}`}
                              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              {t('products.explore_category')}
                              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" aria-hidden />
                            </Link>
                          </div>
                        )}
                      </section>
                    </ScrollReveal>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}

interface SubcategoryCardProps {
  category: ProductCategory;
}

function SubcategoryCard({ category }: SubcategoryCardProps) {
  const { t } = useLocale();
  const subChildren = (category.children ?? []).filter((c) => c.is_active !== false && hasValidSlug(c.slug));

  return (
    <Link
      href={`/products/category/${category.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all duration-300 hover:border-primary/50 hover:bg-card/90 focus-visible:outline-2 focus-visible:outline-primary dark:border-white/10 dark:bg-card/60 dark:hover:border-white/40"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
            <Layers className="h-4 w-4" aria-hidden />
          </span>
          {category.is_featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Star className="h-2.5 w-2.5" aria-hidden />
              {t('products.featured_badge')}
            </span>
          )}
        </div>

        <h3 className="font-heading mt-3 text-base font-bold text-card-foreground transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-emerald-300">
          {category.title}
        </h3>

        {subChildren.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1" aria-label={t('products.children_title')}>
            {subChildren.slice(0, 3).map((sub) => (
              <span
                key={sub.id}
                className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground dark:border-white/10 dark:text-neutral-300"
              >
                {sub.title}
              </span>
            ))}
            {subChildren.length > 3 && (
              <span className="px-1 text-[10px] text-muted-foreground">
                +{subChildren.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <span className="mt-4 inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-primary transition-colors group-hover:text-brand-strong dark:text-emerald-400 dark:group-hover:text-emerald-300">
        {t('products.view_category')}
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-0 rotate-180 rtl:group-hover:-translate-x-1 group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}

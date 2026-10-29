'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useLocale } from '@/i18n';
import { usePublicProduct, usePublicProductCategories } from '@/hooks/use-api';
import { InternalPageShell, PageLoading } from '@/components/shared';
import { ErrorState, NotFoundState } from '@/components/shared/states';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  ProductAttributes,
  ProductBreadcrumbs,
  ProductDocuments,
  ProductGallery,
  ProductPrice,
  ProductSpecifications,
  RelatedProducts,
  flattenCategoryTree,
} from '@/components/products/public';
import type { ProductDetail } from '@/types';

function statusOf(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

/**
 * Structured data for the product detail page. Price offers are exposed
 * ONLY for states backed by a real backend price (regular/discounted with
 * a numeric final_price) — never invented for contact/scheduled/expired.
 */
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const state = product.price?.state;
  const finalPrice = product.price?.final_price;
  const numeric = finalPrice != null && finalPrice !== '' && !Number.isNaN(Number(finalPrice));
  const withOffer = (state === 'regular' || state === 'discounted') && numeric;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.short_description ? { description: product.short_description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.cover_image_url ? { image: [product.cover_image_url] } : {}),
    ...(withOffer
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: product.price?.currency || 'IRR',
            price: String(finalPrice),
          },
        }
      : {}),
  };
  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify of backend-supplied strings, no HTML parsing.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function ProductDetailClient({ slug, previewProduct }: { slug: string; previewProduct?: ProductDetail | null }) {
  const { t } = useLocale();
  // Phase 8.2 — saved-state preview: when `previewProduct` is provided the
  // public fetch is disabled and the SAME rendering below consumes the
  // token-gated preview payload (public ProductDetailSerializer — no admin
  // fields). The normal public path (`previewProduct` undefined) is untouched.
  const isPreview = previewProduct !== undefined;
  const { data, isLoading, isError, error, refetch } = usePublicProduct(slug, { enabled: !isPreview });
  const product = (isPreview ? previewProduct : (data as ProductDetail | undefined)) as ProductDetail | undefined;

  const { data: categoriesData } = usePublicProductCategories();
  const categoryTree = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? [])),
    [categoriesData],
  );
  const flat = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const byId = useMemo(() => {
    const map = new Map<string, import('@/types').ProductCategory>();
    for (const { category: node } of flat) map.set(node.id, node);
    return map;
  }, [flat]);

  const activeCategory = product?.category ? byId.get(product.category) : undefined;
  const categoryTitle = activeCategory?.title;
  const categorySlug = activeCategory?.slug;

  const categoryCrumbs = useMemo(() => {
    if (!activeCategory) return [];
    const chain: { label: string; href: string }[] = [];
    let current: import('@/types').ProductCategory | undefined = activeCategory;
    const guard = new Set<string>();
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      chain.unshift({ label: current.title, href: `/products/category/${current.slug}` });
      current = current.parent ? byId.get(current.parent) : undefined;
    }
    return chain;
  }, [activeCategory, byId]);

  if (isLoading) {
    return (
      <InternalPageShell>
        <div className="container-page py-16">
          <PageLoading />
        </div>
      </InternalPageShell>
    );
  }

  if (isError || !product) {
    const status = statusOf(error);
    const gone = status === 404 || (!isError && !product);
    const is429 = status === 429;
    return (
      <InternalPageShell>
        <div className="container-page py-16">
          {gone ? (
            <NotFoundState title={t('products.product_not_found')} message={t('products.product_gone_hint')} />
          ) : (
            <ErrorState
              title={is429 ? (t('common.rate_limit_title') || 'محدودیت درخواست') : t('common.error')}
              message={is429 ? (t('common.rate_limit_hint') || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.') : t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
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

  const descriptionHtml = sanitizeHtml(product.description ?? '');
  const featuresHtml = sanitizeHtml(product.features ?? '');

  return (
    <InternalPageShell>
      <ProductJsonLd product={product} />
      {/* Hero */}
      <section className="relative overflow-hidden pb-8 pt-6 sm:pb-10 sm:pt-8">
        <div className="container-page relative z-10 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductBreadcrumbs
              trail={[
                { label: t('products.home_crumb'), href: '/' },
                { label: t('products.title'), href: '/products' },
                { label: t('products.categories_crumb'), href: '/products/category' },
                ...categoryCrumbs,
                { label: product.title },
              ]}
            />
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <ProductGallery images={product.images ?? []} productTitle={product.title} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col gap-4"
            >
              {product.is_featured && (
                <span className="inline-flex w-fit items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {t('products.featured_badge')}
                </span>
              )}
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">{product.title}</h1>
              {product.short_description && (
                <p className="text-base leading-8 text-muted-foreground">{product.short_description}</p>
              )}
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="text-muted-foreground">{t('products.sku_label')}:</dt>
                  <dd className="font-medium text-foreground" dir="ltr">{product.sku}</dd>
                </div>
                {categoryTitle && (
                  <div className="flex items-center gap-2">
                    <dt className="text-muted-foreground">{t('products.category_label')}:</dt>
                    <dd>
                      {categorySlug ? (
                        <Link href={`/products/category/${categorySlug}`} className="font-medium text-primary hover:underline">
                          {categoryTitle}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{categoryTitle}</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs dark:border-white/10 dark:bg-card/70">
                <ProductPrice price={product.price} size="lg" tone="light" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition hover:bg-brand-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t('products.cta_consult')}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-0 rotate-180" aria-hidden />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {t('products.cta_contact')}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page flex flex-col gap-10">
          {(descriptionHtml || featuresHtml) && (
            <ScrollReveal variant="slide-up">
              <div className="grid gap-6 lg:grid-cols-2">
                {descriptionHtml && (
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs dark:border-white/10 dark:bg-card/70">
                    <h2 className="font-heading mb-3 text-xl font-bold text-foreground">{t('products.description_title')}</h2>
                    <div
                      className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-8 text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  </div>
                )}
                {featuresHtml && (
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs dark:border-white/10 dark:bg-card/70">
                    <h2 className="font-heading mb-3 text-xl font-bold text-foreground">{t('products.features_title')}</h2>
                    <div
                      className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-8 text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: featuresHtml }}
                    />
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal variant="slide-up">
            <ProductSpecifications specs={product.specifications ?? []} />
          </ScrollReveal>
          <ScrollReveal variant="slide-up">
            <ProductAttributes values={product.attribute_values ?? []} />
          </ScrollReveal>
          <ScrollReveal variant="slide-up">
            <ProductDocuments documents={product.documents ?? []} />
          </ScrollReveal>
          <ScrollReveal variant="slide-up">
            <RelatedProducts items={product.related ?? []} />
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal variant="scale">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-8 text-center shadow-xs md:p-12 dark:border-white/10 dark:bg-card/40">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{t('products.cta_title')}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{t('products.cta_desc')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition hover:bg-brand-strong active:scale-[0.98]"
                >
                  {t('products.cta_consult')}
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {t('products.all_products')}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </InternalPageShell>
  );
}

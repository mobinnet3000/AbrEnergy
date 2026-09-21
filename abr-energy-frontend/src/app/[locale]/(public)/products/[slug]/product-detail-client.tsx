'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useLocale } from '@/i18n';
import { usePublicProduct, usePublicProductCategories } from '@/hooks/use-api';
import { PageLoading } from '@/components/shared';
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

export function ProductDetailClient({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { data, isLoading, isError, error, refetch } = usePublicProduct(slug);
  const product = data as ProductDetail | undefined;

  const { data: categoriesData } = usePublicProductCategories();
  const categoryIndex = useMemo(() => {
    const map = new Map<string, { title: string; slug: string }>();
    for (const { category: node } of flattenCategoryTree(
      Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? []),
    )) {
      map.set(node.id, { title: node.title, slug: node.slug });
    }
    return map;
  }, [categoriesData]);
  const categoryRef = product?.category ? categoryIndex.get(product.category) : undefined;
  const categoryTitle = categoryRef?.title;
  const categorySlug = categoryRef?.slug;

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen pt-28 md:pt-36">
        <div className="container-page">
          <PageLoading />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    const gone = statusOf(error) === 404;
    return (
      <div className="bg-black min-h-screen pt-28 md:pt-36">
        <div className="container-page">
          {gone ? (
            <NotFoundState title={t('products.product_not_found')} message={t('products.product_gone_hint')} />
          ) : (
            <ErrorState
              title={t('common.error')}
              message={t('products.load_failed')}
              action={{ label: t('products.retry'), onClick: () => refetch() }}
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

  const descriptionHtml = sanitizeHtml(product.description ?? '');
  const featuresHtml = sanitizeHtml(product.features ?? '');

  return (
    <div className="bg-black min-h-screen">
      <ProductJsonLd product={product} />
      {/* Hero */}
      <section className="relative pt-28 pb-10 md:pt-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/15 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductBreadcrumbs
              trail={[
                { label: t('products.home_crumb'), href: '/' },
                { label: t('products.title'), href: '/products' },
                ...(categoryTitle && categorySlug
                  ? [{ label: categoryTitle, href: `/products/category/${categorySlug}` }]
                  : []),
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
                <span className="inline-flex w-fit items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs font-medium text-amber-300">
                  {t('products.featured_badge')}
                </span>
              )}
              <h1 className="font-heading text-3xl font-bold text-white md:text-5xl">{product.title}</h1>
              {product.short_description && (
                <p className="text-base leading-8 text-white/50">{product.short_description}</p>
              )}
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="text-white/40">{t('products.sku_label')}:</dt>
                  <dd className="font-medium text-white/80" dir="ltr">{product.sku}</dd>
                </div>
                {categoryTitle && (
                  <div className="flex items-center gap-2">
                    <dt className="text-white/40">{t('products.category_label')}:</dt>
                    <dd>
                      {categorySlug ? (
                        <Link href={`/products/category/${categorySlug}`} className="font-medium text-emerald-400 hover:text-emerald-300">
                          {categoryTitle}
                        </Link>
                      ) : (
                        <span className="font-medium text-white/80">{categoryTitle}</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                <ProductPrice price={product.price} size="lg" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-300"
                >
                  {t('products.cta_consult')}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/[0.2] hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
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
      <section className="pb-28 md:pb-36">
        <div className="container-page flex flex-col gap-10">
          {(descriptionHtml || featuresHtml) && (
            <ScrollReveal variant="slide-up">
              <div className="grid gap-6 lg:grid-cols-2">
                {descriptionHtml && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                    <h2 className="font-heading mb-3 text-xl font-bold text-white">{t('products.description_title')}</h2>
                    <div
                      className="prose-invert max-w-none text-sm leading-8 text-white/60"
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  </div>
                )}
                {featuresHtml && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                    <h2 className="font-heading mb-3 text-xl font-bold text-white">{t('products.features_title')}</h2>
                    <div
                      className="prose-invert max-w-none text-sm leading-8 text-white/60"
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
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-l from-emerald-950/40 via-transparent to-transparent p-8 text-center md:p-12">
              <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">{t('products.cta_title')}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">{t('products.cta_desc')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 active:scale-[0.97]"
                >
                  {t('products.cta_consult')}
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/[0.2] hover:text-white"
                >
                  {t('products.all_products')}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

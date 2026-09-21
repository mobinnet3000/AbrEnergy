'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { usePublicProductCategories } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { CardLoading } from '@/components/shared';
import { ProductCategoryNavigation } from '@/components/products/public';
import { homepageCopy } from '@/lib/homepage';
import type { HomepageSection, ProductCategory } from '@/types';

/**
 * Homepage product-category navigation. Phase 7 — accepts optional CMS
 * content (`cms.items` = curated categories, `cms.section` = copy +
 * visibility). Without CMS data it reads the backend tree exactly as
 * before — no hardcoded taxonomy. Hides itself when empty.
 */
export function ProductRailSection({ cms }: {
  cms?: { items?: ProductCategory[] | null; section?: HomepageSection | null } | null;
}) {
  const { t } = useLocale();
  const { data, isLoading } = usePublicProductCategories();

  const hookRoots: ProductCategory[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  const loading = cms?.items !== undefined && cms?.items !== null ? false : isLoading;

  if (cms?.section && cms.section.enabled === false) return null;

  const roots = cms?.items !== undefined && cms?.items !== null ? cms.items : hookRoots;
  const title = homepageCopy(cms?.section?.title, t('home.categories_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.categories_subtitle'));

  if (loading) {
    return (
      <section data-section="categories" aria-busy="true" className="relative py-24 md:py-32 overflow-hidden bg-black">
        <div className="container-page relative z-10">
          <CardLoading count={4} />
        </div>
      </section>
    );
  }

  if (roots.length === 0) return null;

  return (
    <section
      data-section="categories"
      aria-labelledby="homepage-categories-heading"
      data-testid="product-rail"
      className="relative py-24 md:py-32 overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/5 to-black" aria-hidden />

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
            <h2 id="homepage-categories-heading" className="font-heading text-4xl md:text-5xl font-bold text-white">
              {title}
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mt-3">{subtitle}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            {t('home.categories_cta')}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>

        <ProductCategoryNavigation categories={roots} />
      </div>
    </section>
  );
}

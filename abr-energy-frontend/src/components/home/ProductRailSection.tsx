'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { usePublicProductCategories } from '@/hooks/use-api';
import { useLocale } from '@/i18n';
import { CardLoading } from '@/components/shared';
import { ProductCategoryNavigation, flattenCategoryTree } from '@/components/products/public';
import { homepageCopy } from '@/lib/homepage';
import { hasValidSlug } from '@/lib/slug';
import { isHomepagePreviewEnabled, previewCategories } from '@/lib/homepage-preview';
import type { HomepageSection, ProductCategory } from '@/types';

/**
 * Homepage product-category navigation. Phase 7 — accepts optional CMS
 * content (`cms.items` = curated categories, `cms.section` = copy +
 * visibility). Without CMS data it reads the backend tree exactly as
 * before — no hardcoded taxonomy. Hides itself when empty.
 */
export function ProductRailSection({ cms }: {
  cms?: { items?: ProductCategory[] | null; section?: HomepageSection | null; pending?: boolean } | null;
}) {
  const { t } = useLocale();
  // Phase 12.14 — skip the fallback tree fetch when the homepage payload
  // supplies curated categories (request-count hardening).
  const cmsGiven = cms?.items !== undefined && cms?.items !== null;
  const isPending = cms?.pending === true;
  const { data, isLoading } = usePublicProductCategories({ enabled: !cmsGiven && !isPending });

  const hookRoots: ProductCategory[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  const loading = cmsGiven ? false : isLoading;

  if (cms?.section && cms.section.enabled === false) return null;

  const baseRoots = cmsGiven ? (cms.items as ProductCategory[]) : hookRoots;
  // Phase 12.4 — preview taxonomy fills the rail when the CMS is empty
  // (dev only, never prod). Real categories always win when present.
  const preview = isHomepagePreviewEnabled();
  const roots = baseRoots.length > 0 || !preview ? baseRoots : previewCategories;
  const title = homepageCopy(cms?.section?.title, t('home.categories_title'));
  const subtitle = homepageCopy(cms?.section?.subtitle, t('home.categories_subtitle'));

  if (loading) {
    return (
      <section data-section="categories" aria-busy="true" className="relative py-12 md:py-16 overflow-hidden bg-neutral-50 border-t border-neutral-900/10 dark:bg-neutral-950 dark:border-white/10">
        <div className="container-page relative z-10">
          <CardLoading count={4} />
        </div>
      </section>
    );
  }

  if (roots.length === 0) return null;

  // Phase 12.10 — quick-access strip: the four product families plus the
  // real "بست لوله" subcategory shortcut. Slugs are resolved from the live
  // API tree (never hardcoded); when absent the shortcut is simply omitted.
  const flatCats = flattenCategoryTree(roots);
  const pipeClamp = flatCats.find(({ category }) => category.title.includes('بست لوله') && hasValidSlug(category.slug))?.category;
  // Phase 12.13 — a category without a slug cannot open a detail page.
  const familyRoots = roots.filter((r) => !r.parent && hasValidSlug(r.slug));

  return (
    <section
      data-section="categories"
      aria-labelledby="homepage-categories-heading"
      data-testid="product-rail"
      className="relative overflow-hidden border-t border-neutral-900/10 bg-white py-14 md:py-20 dark:border-white/10 dark:bg-neutral-950"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-emerald-600/30 to-transparent" />
      <div className="container-page relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-700/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
              {t('products.label')}
            </p>
            <h2 id="homepage-categories-heading" className="font-heading text-3xl font-extrabold leading-[1.4] text-neutral-950 md:text-4xl dark:text-white">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base md:leading-8 dark:text-neutral-300">{subtitle}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-700 active:scale-[0.97]"
          >
            {t('home.categories_cta')}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mb-8 flex flex-wrap items-center gap-2"
          aria-label={t('menu.quick_access')}
        >
          {familyRoots.map((family) => (
            <Link
              key={family.id}
              href={`/products/category/${family.slug}`}
              className="rounded-full border border-emerald-700/20 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700/40 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
            >
              {family.title}
            </Link>
          ))}
          {pipeClamp && (
            <Link
              href={`/products/category/${pipeClamp.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              {t('menu.quick_pipe_clamp')}
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </motion.div>

        {/* Phase 12.11 — the brand quick-access strip above is the single pill
            row; suppress the navigation's own pill row so categories are not
            rendered twice. Only the category cards render here. */}
        <ProductCategoryNavigation categories={roots} tone="light" showPills={false} />
      </div>
    </section>
  );
}

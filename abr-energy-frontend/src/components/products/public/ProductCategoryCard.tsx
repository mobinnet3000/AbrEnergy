'use client';
import Link from 'next/link';
import { ArrowLeft, Folder, Star } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductCategory } from '@/types';

interface ProductCategoryCardProps {
  category: ProductCategory;
}

/** Public category card: title + child pills + CTA. Fully data-driven. */
export function ProductCategoryCard({ category }: ProductCategoryCardProps) {
  const { t } = useLocale();
  const href = `/products/category/${category.slug}`;
  const children = category.children ?? [];

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-500 hover:border-emerald-500/25 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-emerald-500"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/20">
          <Folder className="h-5 w-5 text-emerald-300" aria-hidden />
        </span>
        {category.is_featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            <Star className="h-3 w-3" aria-hidden />
            {t('products.featured_badge')}
          </span>
        )}
      </div>
      <h3 className="font-heading mt-4 text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
        {category.title}
      </h3>
      {children.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t('products.children_title')}>
          {children.slice(0, 5).map((child) => (
            <span
              key={child.id}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55"
            >
              {child.title}
            </span>
          ))}
          {children.length > 5 && (
            <span className="rounded-full px-2 py-1 text-[11px] text-white/40">+{children.length - 5}</span>
          )}
        </div>
      )}
      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-emerald-400 transition-colors group-hover:text-emerald-300">
        {t('products.view_category')}
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}

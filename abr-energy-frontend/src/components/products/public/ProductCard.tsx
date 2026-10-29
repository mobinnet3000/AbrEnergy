'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Sun } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductListItem } from '@/types';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media-url';
import { ProductPrice } from './ProductPrice';

interface ProductCardProps {
  product: ProductListItem;
  /** Resolved category title (public list exposes only the category id). */
  categoryTitle?: string;
  className?: string;
  /** Surface tone. Default `dark` (existing dark catalog pages). */
  tone?: 'dark' | 'light';
}

/**
 * Reusable public product card. Pricing comes straight from the backend
 * `price` (effective state) — never recomputed here.
 */
export function ProductCard({ product, categoryTitle, className, tone = 'dark' }: ProductCardProps) {
  const { t } = useLocale();
  const detailHref = `/products/${product.slug}`;
  const light = tone === 'light';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-500',
        light
          ? 'border-neutral-900/15 bg-white hover:border-neutral-900/40 focus-within:border-emerald-700/60 focus-within:ring-2 focus-within:ring-emerald-700/20 dark:border-white/15 dark:bg-neutral-900 dark:hover:border-white/40'
          : 'border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/30',
        className,
      )}
    >
      <Link
        href={detailHref}
        className="block focus:outline-none"
        aria-label={`${product.title} — ${t('products.view_details')}`}
      >
        <div className={cn('relative aspect-[4/3] overflow-hidden', light ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-white/[0.02]')}>
          {product.cover_image_url ? (
            // Phase 5.2: narrow next/image adoption (card cover only).
            // fill preserves the 4:3 aspect + object-cover + hover zoom.
            <Image
              src={resolveMediaUrl(product.cover_image_url)}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-all duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center" aria-hidden>
              <Sun className={cn('h-14 w-14', light ? 'text-neutral-300' : 'text-white/10')} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute top-3 flex gap-1.5 start-3">
            {product.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 backdrop-blur-md">
                <Star className="h-3 w-3" aria-hidden />
                {t('products.featured_badge')}
              </span>
            )}
            {product.price?.state === 'discounted' && (
              <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">
                {t('products.discount_badge')}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {(categoryTitle || product.category) && (
          <p className={cn('text-[11px] font-semibold uppercase tracking-widest', light ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-400/80')}>
            {categoryTitle ?? ''}
          </p>
        )}
        <h3 className={cn('font-heading text-base font-semibold transition-colors duration-300 line-clamp-2', light ? 'text-neutral-900 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-300' : 'text-white group-hover:text-emerald-300')}>
          <Link href={detailHref} className="focus:outline-none">
            {product.title}
          </Link>
        </h3>
        {product.short_description && (
          <p className={cn('text-xs leading-6 line-clamp-2', light ? 'text-neutral-500 dark:text-neutral-400' : 'text-white/40')}>{product.short_description}</p>
        )}
        <div className="mt-auto pt-3">
          <ProductPrice price={product.price} size="sm" tone={light ? 'light' : 'dark'} />
          <Link
            href={detailHref}
            className={cn('mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-colors rounded', light ? 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300' : 'text-emerald-400 hover:text-emerald-300', 'focus-visible:outline-2 focus-visible:outline-emerald-500')}
          >
            {t('products.view_details')}
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

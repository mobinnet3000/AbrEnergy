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
}

/**
 * Reusable public product card. Pricing comes straight from the backend
 * `price` (effective state) — never recomputed here.
 */
export function ProductCard({ product, categoryTitle, className }: ProductCardProps) {
  const { t } = useLocale();
  const detailHref = `/products/${product.slug}`;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06]',
        'bg-white/[0.02] backdrop-blur-sm transition-all duration-500',
        'hover:border-white/[0.12] hover:bg-white/[0.04]',
        'focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/30',
        className,
      )}
    >
      <Link
        href={detailHref}
        className="block focus:outline-none"
        aria-label={`${product.title} — ${t('products.view_details')}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.02]">
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
              <Sun className="h-14 w-14 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute top-3 flex gap-1.5 start-3">
            {product.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-md">
                <Star className="h-3 w-3" aria-hidden />
                {t('products.featured_badge')}
              </span>
            )}
            {product.price?.state === 'discounted' && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
                {t('products.discount_badge')}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {(categoryTitle || product.category) && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400/80">
            {categoryTitle ?? ''}
          </p>
        )}
        <h3 className="font-heading text-base font-semibold text-white transition-colors duration-300 group-hover:text-emerald-300 line-clamp-2">
          <Link href={detailHref} className="focus:outline-none">
            {product.title}
          </Link>
        </h3>
        {product.short_description && (
          <p className="text-xs leading-6 text-white/40 line-clamp-2">{product.short_description}</p>
        )}
        <div className="mt-auto pt-3">
          <ProductPrice price={product.price} size="sm" />
          <Link
            href={detailHref}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-500 rounded"
          >
            {t('products.view_details')}
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

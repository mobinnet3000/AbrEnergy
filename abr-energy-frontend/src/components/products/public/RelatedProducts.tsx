'use client';
import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductRelatedItem } from '@/types';

const RELATION_LABEL_KEY: Record<string, string> = {
  related: 'admin.relation_related',
  similar: 'admin.relation_similar',
  accessory: 'admin.relation_accessory',
  recommended: 'admin.relation_recommended',
};

/**
 * Related products from the backend (`id/slug/title/relation_type`).
 *
 * NOTE: the public API exposes related items as lightweight links (no cover
 * or price), so compact link cards are rendered instead of `ProductCard` —
 * resolving full cards would require one detail request per item (N+1).
 */
export function RelatedProducts({ items }: { items: ProductRelatedItem[] }) {
  const { t } = useLocale();
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="product-related-heading" className="flex flex-col gap-4">
      <h2 id="product-related-heading" className="font-heading text-xl font-bold text-white md:text-2xl">
        {t('products.related_title')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Link2 className="h-4 w-4 text-emerald-300" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white transition-colors group-hover:text-emerald-300">
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs text-white/40">
                {t(RELATION_LABEL_KEY[item.relation_type] ?? 'admin.relation_related')}
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 shrink-0 text-emerald-400 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

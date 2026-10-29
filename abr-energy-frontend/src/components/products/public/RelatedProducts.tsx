'use client';
import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';
import { useLocale } from '@/i18n';
import { hasValidSlug } from '@/lib/slug';
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
 * Fully theme-aware.
 */
export function RelatedProducts({ items }: { items: ProductRelatedItem[] }) {
  const { t } = useLocale();
  // Phase 12.13 — a related item without a slug cannot open a detail page.
  const visible = (items ?? []).filter((item) => hasValidSlug(item.slug));
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="product-related-heading" className="flex flex-col gap-4">
      <h2 id="product-related-heading" className="font-heading text-xl font-bold text-foreground md:text-2xl">
        {t('products.related_title')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary dark:border-white/10 dark:bg-card/70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Link2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(RELATION_LABEL_KEY[item.relation_type] ?? 'admin.relation_related')}
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 rtl:group-hover:-translate-x-1 group-hover:translate-x-1 rtl:rotate-0 rotate-180" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

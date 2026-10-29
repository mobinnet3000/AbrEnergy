'use client';
import type { ProductListItem } from '@/types';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { hasValidSlug } from '@/lib/slug';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductListItem[];
  /** Map of category id → translated title for card subtitles. */
  categoryTitles?: Map<string, string>;
  /** Surface tone. Default `light` (theme-adaptive via CSS tokens). */
  tone?: 'dark' | 'light';
}

/** Responsive product grid with staggered reveal. Purely presentational. */
export function ProductGrid({ products, categoryTitles, tone = 'light' }: ProductGridProps) {
  // Phase 12.13 — a product without a slug cannot open a detail page.
  const visible = products.filter((product) => hasValidSlug(product.slug));
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6" role="list" aria-label="products">
      {visible.map((product, i) => (
        <ScrollReveal key={product.id} variant="slide-up" delay={(i % 3) * 0.06}>
          <div role="listitem" className="h-full">
            <ProductCard
              product={product}
              categoryTitle={product.category ? categoryTitles?.get(product.category) : undefined}
              tone={tone}
            />
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

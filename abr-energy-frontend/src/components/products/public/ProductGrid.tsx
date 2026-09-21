'use client';
import type { ProductListItem } from '@/types';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductListItem[];
  /** Map of category id → translated title for card subtitles. */
  categoryTitles?: Map<string, string>;
}

/** Responsive product grid with staggered reveal. Purely presentational. */
export function ProductGrid({ products, categoryTitles }: ProductGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6" role="list" aria-label="products">
      {products.map((product, i) => (
        <ScrollReveal key={product.id} variant="slide-up" delay={(i % 3) * 0.06}>
          <div role="listitem" className="h-full">
            <ProductCard
              product={product}
              categoryTitle={product.category ? categoryTitles?.get(product.category) : undefined}
            />
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}


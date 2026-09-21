'use client';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import type { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';
import { ProductCategoryCard } from './ProductCategoryCard';

interface ProductCategoryNavigationProps {
  /** Full category tree (roots with nested `children`). */
  categories: ProductCategory[];
  /** Currently active category slug (matches `slug` or translated `slug_t`). */
  activeSlug?: string;
}

/** Flatten a category tree for rail/select use, preserving depth. */
export function flattenCategoryTree(
  categories: ProductCategory[],
  depth = 0,
): { category: ProductCategory; depth: number }[] {
  const out: { category: ProductCategory; depth: number }[] = [];
  const ordered = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  for (const cat of ordered) {
    out.push({ category: cat, depth });
    if (cat.children && cat.children.length > 0) {
      out.push(...flattenCategoryTree(cat.children, depth + 1));
    }
  }
  return out;
}

function isActive(cat: ProductCategory, activeSlug?: string): boolean {
  if (!activeSlug) return false;
  return cat.slug === activeSlug || cat.slug_t === activeSlug;
}

/**
 * Category navigation: a horizontal quick-access rail plus data-driven
 * cards for root categories (with direct-child preview). The same component
 * renders any subtree, so unlimited tree depth is supported — child pages
 * simply pass the active node's children.
 */
export function ProductCategoryNavigation({ categories, activeSlug }: ProductCategoryNavigationProps) {
  const { t } = useLocale();
  const roots = useMemoRoots(categories);

  if (roots.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex gap-2 overflow-x-auto pb-2 snap-x"
        role="navigation"
        aria-label={t('products.filter_category')}
      >
        <CategoryPill
          href="/products"
          label={t('products.all_products')}
          active={!activeSlug}
        />
        {flattenCategoryTree(roots)
          .filter(({ depth }) => depth === 0)
          .map(({ category }) => (
            <CategoryPill
              key={category.id}
              href={`/products/category/${category.slug}`}
              label={category.title}
              active={isActive(category, activeSlug)}
            />
          ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roots.map((category) => (
          <ProductCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

function useMemoRoots(categories: ProductCategory[]): ProductCategory[] {
  // Categories arrive nested from the API; guard against a flat list by
  // treating parent-less nodes as roots.
  const hasRoots = categories.some((c) => !c.parent);
  const list = hasRoots ? categories.filter((c) => !c.parent) : categories;
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function CategoryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300',
        'focus-visible:outline-2 focus-visible:outline-emerald-500',
        active
          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
          : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/[0.16] hover:text-white',
      )}
    >
      {label}
    </Link>
  );
}

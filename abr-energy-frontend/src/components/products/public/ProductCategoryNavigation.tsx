'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import type { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';
import { hasValidSlug } from '@/lib/slug';
import { ProductCategoryCard } from './ProductCategoryCard';

interface ProductCategoryNavigationProps {
  /** Full category tree (roots with nested `children`). */
  categories: ProductCategory[];
  /** Currently active category slug (matches `slug` or translated `slug_t`). */
  activeSlug?: string;
  /**
   * Phase 12.11 — when `false`, only the data-driven category cards render and
   * the redundant quick-access pill row is suppressed. Homepage uses this so
   * categories are not shown twice (its own brand pill strip already carries
   * quick access). Catalog pages keep the default `true`.
   */
  showPills?: boolean;
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
export function ProductCategoryNavigation({ categories, activeSlug, tone = 'light', showPills = true }: ProductCategoryNavigationProps & {
  /** Surface tone. Default `light` (theme-adaptive via CSS tokens). */
  tone?: 'dark' | 'light';
}) {
  const { t } = useLocale();
  // Categories arrive nested from the API; guard against a flat list by
  // treating parent-less nodes as roots.
  const roots = useMemo(() => {
    const hasRoots = categories.some((c) => !c.parent);
    const list = hasRoots ? categories.filter((c) => !c.parent) : categories;
    // Phase 12.13 — a category without a slug cannot open a detail page.
    return [...list]
      .filter((c) => hasValidSlug(c.slug))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [categories]);
  const flat = useMemo(() => flattenCategoryTree(roots), [roots]);
  const childPills = useMemo(() => {
    if (!activeSlug) return [];
    const active = flat.find(({ category }) => isActive(category, activeSlug))?.category ?? null;
    const kids = active?.children ?? [];
    return [...kids].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [flat, activeSlug]);

  if (roots.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {showPills && (
        <div
          className="flex gap-2 overflow-x-auto pb-2 snap-x"
          role="navigation"
          aria-label={t('products.filter_category')}
        >
          <CategoryPill
            href="/products"
            label={t('products.all_products')}
            active={!activeSlug}
            tone={tone}
          />
          {flat
            .filter(({ depth }) => depth === 0)
            .map(({ category }) => (
              <CategoryPill
                key={category.id}
                href={`/products/category/${category.slug}`}
                label={category.title}
                active={isActive(category, activeSlug)}
                tone={tone}
              />
            ))}
          {childPills.map((child) => (
            <CategoryPill
              key={child.id}
              href={`/products/category/${child.slug}`}
              label={child.title}
              active={isActive(child, activeSlug)}
              tone={tone}
            />
          ))}
        </div>
      )}

      <div className={tone === 'light' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'}>
        {roots.map((category) => (
          <ProductCategoryCard key={category.id} category={category} tone={tone} />
        ))}
      </div>
    </div>
  );
}

function CategoryPill({ href, label, active, tone = 'light' }: { href: string; label: string; active: boolean; tone?: 'dark' | 'light' }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300',
        'focus-visible:outline-2 focus-visible:outline-emerald-500',
        tone === 'light'
          ? active
            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
            : 'border-neutral-900/25 bg-white text-neutral-700 hover:border-neutral-900/60 hover:text-neutral-900 dark:border-white/20 dark:bg-transparent dark:text-neutral-300 dark:hover:border-white/60 dark:hover:text-white'
          : active
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/[0.16] hover:text-white',
      )}
    >
      {label}
    </Link>
  );
}

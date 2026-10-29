'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductCategory } from '@/types';
import { flattenCategoryTree } from './ProductCategoryNavigation';
import { cn } from '@/lib/utils';

export interface ProductFilterState {
  search: string;
  categoryId: string;
  featuredOnly: boolean;
  ordering: string;
}

interface ProductFiltersProps {
  filters: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  categories: ProductCategory[];
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilterState = {
  search: '',
  categoryId: '',
  featuredOnly: false,
  ordering: '',
};

function isFiltering(f: ProductFilterState): boolean {
  return !!(f.search || f.categoryId || f.featuredOnly || f.ordering);
}

/**
 * Catalog filters. Every control maps 1:1 to a server-side API parameter
 * (search / category / is_featured / ordering) — nothing is faked over an
 * incomplete page. Search is debounced to avoid a request per keystroke.
 * Fully theme-aware (clean surfaces in both light and dark modes).
 */
export function ProductFilters({ filters, onChange, categories }: ProductFiltersProps) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(filters.search);
  // Sync when the parent overwrites the search (e.g. "clear filters").
  // Render-time adjustment (React-endorsed) instead of a sync effect.
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search);
    setDraft(filters.search);
  }

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (draft === filters.search) return;
    const timer = setTimeout(() => onChange({ ...filtersRef.current, search: draft }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const flat = flattenCategoryTree(categories);
  const filtering = isFiltering(filters);

  const selectCls =
    'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none [&>option]:bg-background [&>option]:text-foreground';

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs dark:border-white/10 dark:bg-card/70 md:p-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">{t('products.search_placeholder')}</span>
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('products.search_placeholder')}
            className="w-full rounded-xl border border-input bg-background py-2.5 pe-3 ps-10 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="sr-only">{t('products.filter_category')}</span>
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
            className={selectCls}
            aria-label={t('products.filter_category')}
          >
            <option value="">{t('products.all_categories')}</option>
            {flat.map(({ category, depth }) => (
              <option key={category.id} value={category.id}>
                {`${'— '.repeat(depth)}${category.title}`}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">{t('products.ordering_label')}</span>
          <select
            value={filters.ordering}
            onChange={(e) => onChange({ ...filters, ordering: e.target.value })}
            className={selectCls}
            aria-label={t('products.ordering_label')}
          >
            <option value="">{t('products.ordering_default')}</option>
            <option value="-created_at">{t('products.ordering_newest')}</option>
            <option value="created_at">{t('products.ordering_oldest')}</option>
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={filters.featuredOnly}
            onClick={() => onChange({ ...filters, featuredOnly: !filters.featuredOnly })}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition',
              'focus-visible:outline-2 focus-visible:outline-primary',
              filters.featuredOnly
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-border/80 bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'relative h-4 w-7 rounded-full transition-colors',
                filters.featuredOnly ? 'bg-amber-500' : 'bg-muted-foreground/30',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
                  filters.featuredOnly ? 'start-3.5' : 'start-0.5',
                )}
              />
            </span>
            {t('products.featured_only')}
          </button>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setDraft('');
                onChange({ ...DEFAULT_PRODUCT_FILTERS });
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" aria-hidden />
              {t('products.clear_filters')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

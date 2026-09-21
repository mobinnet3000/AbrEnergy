'use client';
import { useMemo } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-tree';
import type { ProductCategory } from '@/types';

interface CategorySelectorProps {
  categories: ProductCategory[];
  value: string;
  onChange: (id: string) => void;
  allowEmpty?: boolean;
  excludeId?: string;
}

function flatten(nodes: CategoryTreeNode[], depth: number, out: { id: string; title: string; depth: number }[]): void {
  for (const n of nodes) {
    out.push({ id: n.id, title: n.title, depth });
    flatten(n.kids, depth + 1, out);
  }
}

/** Hierarchical category picker built from the live category tree API. */
export function CategorySelector({ categories, value, onChange, allowEmpty = true, excludeId }: CategorySelectorProps) {
  const { t } = useLocale();
  const options = useMemo(() => {
    const tree = buildCategoryTree(categories.filter((c) => c.id !== excludeId));
    const out: { id: string; title: string; depth: number }[] = [];
    flatten(tree, 0, out);
    return out;
  }, [categories, excludeId]);

  return (
    <Select value={value || 'none'} onValueChange={(v: string | null) => onChange(v === 'none' ? '' : (v || ''))}>
      <SelectTrigger className="w-full" aria-label={t('admin.category_field')}>
        <SelectValue placeholder={t('admin.select_product_category')} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="none">{t('admin.no_category')}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            <span style={{ paddingInlineStart: `${o.depth * 1.25}rem` }}>{o.title}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

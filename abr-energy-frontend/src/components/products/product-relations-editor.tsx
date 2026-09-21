'use client';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { adminProductsApi } from '@/api';
import { formKey, type ProductRelationFormItem } from '@/lib/product-form';
import type { ProductListItem } from '@/types';
import { toast } from 'sonner';

interface ProductRelationsEditorProps {
  currentProductId?: string;
  relations: ProductRelationFormItem[];
  onChange: (relations: ProductRelationFormItem[]) => void;
  errors?: string[];
}

const RELATION_OPTIONS = ['related', 'similar', 'accessory', 'recommended'];

/** Related-product picker with search/pagination (never loads the whole catalog). */
export function ProductRelationsEditor({ currentProductId, relations, onChange, errors }: ProductRelationsEditorProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { relSearch: search }],
    queryFn: () => adminProductsApi.list({ search: search.trim(), page_size: '10' }),
    enabled: open,
  });
  const results: ProductListItem[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

  const usedIds = new Set(relations.map((r) => r.to_product));

  const add = (p: ProductListItem) => {
    if (currentProductId && p.id === currentProductId) {
      toast.error(t('admin.no_self_relation'));
      return;
    }
    if (usedIds.has(p.id)) {
      toast.error(t('admin.duplicate_relation'));
      return;
    }
    onChange([
      ...relations,
      { key: formKey('rel'), to_product: p.id, title: p.title, relation_type: 'related', sort_order: relations.length, is_active: true },
    ]);
    setOpen(false);
    setSearch('');
  };

  const patch = (key: string, p: Partial<ProductRelationFormItem>) => {
    onChange(relations.map((r) => (r.key === key ? { ...r, ...p } : r)));
  };

  const move = (key: string, dir: -1 | 1) => {
    const idx = relations.findIndex((r) => r.key === key);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= relations.length) return;
    const copy = [...relations];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    onChange(copy.map((r, i) => ({ ...r, sort_order: i })));
  };

  const remove = (key: string) => {
    onChange(relations.filter((r) => r.key !== key).map((r, i) => ({ ...r, sort_order: i })));
  };

  return (
    <div className="space-y-3">
      {relations.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.relations_empty')}</p>
      )}
      {relations.map((r, i) => (
        <div key={r.key} className="flex items-center gap-2 rounded-lg border bg-muted/10 p-2">
          <span className="text-sm font-medium flex-1 min-w-0 truncate" dir="auto">{r.title}</span>
          <span className="text-xs text-muted-foreground shrink-0" dir="ltr">{r.to_product.slice(0, 8)}</span>
          <Select value={r.relation_type} onValueChange={(v: string | null) => patch(r.key, { relation_type: v || 'related' })}>
            <SelectTrigger className="w-32" aria-label={t('admin.relation_type_field')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATION_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{t(`admin.relation_${o}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button" role="switch" aria-checked={r.is_active}
            onClick={() => patch(r.key, { is_active: !r.is_active })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${r.is_active ? 'bg-primary' : 'bg-input'}`}
            aria-label={t('admin.active')}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${r.is_active ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
          </button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(r.key, -1)} disabled={i === 0} aria-label={t('admin.media_reorder_up')}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(r.key, 1)} disabled={i === relations.length - 1} aria-label={t('admin.media_reorder_down')}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(r.key)} aria-label={t('admin.delete')}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      {!open ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 me-1" />{t('admin.relations_add')}
        </Button>
      ) : (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute top-2.5 start-3 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.relations_search')}
              dir="auto"
              className="ps-9"
              aria-label={t('admin.relations_search')}
              autoFocus
            />
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">…</p>
          ) : (
            <ul className="max-h-48 overflow-auto divide-y rounded-md border">
              {results
                .filter((p) => !currentProductId || p.id !== currentProductId)
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => add(p)}
                      disabled={usedIds.has(p.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-start disabled:opacity-40"
                    >
                      <span className="flex-1 min-w-0 truncate" dir="auto">{p.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0" dir="ltr">{p.sku}</span>
                    </button>
                  </li>
                ))}
              {results.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">{t('admin.no_products')}</li>
              )}
            </ul>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setSearch(''); }}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

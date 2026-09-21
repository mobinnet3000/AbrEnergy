'use client';
import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import type { ProductAttributeFormItem } from '@/lib/product-form';
import type { ProductAttributeDefinition } from '@/types';

interface ProductAttributesEditorProps {
  categoryId: string;
  definitions: ProductAttributeDefinition[];
  defsLoading: boolean;
  rows: ProductAttributeFormItem[];
  onChange: (rows: ProductAttributeFormItem[]) => void;
  errors?: string[];
}

/** Category-dependent attribute inputs. Definitions come from the backend;
 *  nothing is hardcoded — select renders as text until options are exposed. */
export function ProductAttributesEditor({ categoryId, definitions, defsLoading, rows, onChange, errors }: ProductAttributesEditorProps) {
  const { t } = useLocale();

  const defById = useMemo(() => new Map(definitions.map((d) => [d.id, d])), [definitions]);
  const usedIds = useMemo(() => new Set(rows.map((r) => r.definition).filter(Boolean)), [rows]);
  const available = useMemo(() => definitions.filter((d) => !usedIds.has(d.id)), [definitions, usedIds]);

  const add = () => {
    const first = available[0];
    if (!first) return;
    onChange([...rows, { definition: first.id, value_text: '', value_number: '', value_boolean: null }]);
  };

  const patch = (idx: number, p: Partial<ProductAttributeFormItem>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...p } : r)));
  };

  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  if (!categoryId) {
    return <p className="text-sm text-muted-foreground">{t('admin.attrs_select_category')}</p>;
  }
  if (defsLoading) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }
  if (definitions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('admin.attrs_empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const def = defById.get(row.definition);
        return (
          <div key={idx} className="rounded-lg border p-3 space-y-2 bg-muted/10">
            <div className="flex items-center gap-2">
              <Select
                value={row.definition}
                onValueChange={(v: string | null) => patch(idx, { definition: v || '', value_text: '', value_number: '', value_boolean: null })}
              >
                <SelectTrigger className="w-full flex-1" aria-label={t('admin.product_attributes')}>
                  <SelectValue placeholder={t('admin.product_attributes')} />
                </SelectTrigger>
                <SelectContent>
                  {definitions
                    .filter((d) => d.id === row.definition || !usedIds.has(d.id))
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}{d.unit ? ` (${d.unit})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(idx)} aria-label={t('admin.delete')}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            {def?.data_type === 'number' && (
              <Input
                inputMode="decimal"
                value={row.value_number}
                onChange={(e) => patch(idx, { value_number: e.target.value })}
                placeholder={`${t('admin.attrs_value')}${def.unit ? ` (${def.unit})` : ''}`}
                dir="ltr"
                aria-label={`${def.name}`}
              />
            )}
            {def?.data_type === 'boolean' && (
              <Select
                value={row.value_boolean == null ? 'none' : String(row.value_boolean)}
                onValueChange={(v: string | null) => patch(idx, { value_boolean: v === 'none' ? null : v === 'true' })}
              >
                <SelectTrigger className="w-full" aria-label={def.name}>
                  <SelectValue placeholder={t('admin.attrs_value')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="true">✓</SelectItem>
                  <SelectItem value="false">✕</SelectItem>
                </SelectContent>
              </Select>
            )}
            {(def == null || def.data_type === 'text' || def.data_type === 'select') && def && (
              <Input
                value={row.value_text}
                onChange={(e) => patch(idx, { value_text: e.target.value })}
                placeholder={`${t('admin.attrs_value')}${def.unit ? ` (${def.unit})` : ''}`}
                dir="auto"
                aria-label={def.name}
              />
            )}
          </div>
        );
      })}
      {available.length > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          + {t('admin.specs_add')}
        </Button>
      )}
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

'use client';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/i18n';
import { formKey, groupSpecsBySection, type ProductSpecFormItem } from '@/lib/product-form';

interface ProductSpecificationsEditorProps {
  specs: ProductSpecFormItem[];
  onChange: (specs: ProductSpecFormItem[]) => void;
  errors?: string[];
}

/** Flexible section-grouped specification builder (sections are free-form). */
export function ProductSpecificationsEditor({ specs, onChange, errors }: ProductSpecificationsEditorProps) {
  const { t } = useLocale();

  const add = () => {
    onChange([...specs, { key: formKey('spec'), section: '', label: '', value: '', unit: '', sort_order: specs.length }]);
  };

  const patch = (key: string, p: Partial<ProductSpecFormItem>) => {
    onChange(specs.map((s) => (s.key === key ? { ...s, ...p } : s)));
  };

  const move = (key: string, dir: -1 | 1) => {
    const idx = specs.findIndex((s) => s.key === key);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= specs.length) return;
    const copy = [...specs];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    onChange(copy.map((s, i) => ({ ...s, sort_order: i })));
  };

  const remove = (key: string) => {
    onChange(specs.filter((s) => s.key !== key).map((s, i) => ({ ...s, sort_order: i })));
  };

  const groups = groupSpecsBySection(specs);

  return (
    <div className="space-y-4">
      {specs.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.specs_empty')}</p>
      )}
      {groups.map((g, gi) => (
        <div key={gi} className="rounded-lg border bg-muted/10 p-3 space-y-2">
          {g.section && <h4 className="text-sm font-semibold">{g.section}</h4>}
          {g.rows.map((s) => {
            const idx = specs.findIndex((x) => x.key === s.key);
            return (
              <div key={s.key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center rounded-md border bg-background p-2">
                <Input value={s.section} onChange={(e) => patch(s.key, { section: e.target.value })} placeholder={t('admin.specs_section')} dir="auto" aria-label={t('admin.specs_section')} />
                <Input value={s.label} onChange={(e) => patch(s.key, { label: e.target.value })} placeholder={t('admin.specs_label')} dir="auto" aria-label={t('admin.specs_label')} />
                <div className="flex gap-2">
                  <Input value={s.value} onChange={(e) => patch(s.key, { value: e.target.value })} placeholder={t('admin.specs_value')} dir="auto" aria-label={t('admin.specs_value')} className="flex-1" />
                  <Input value={s.unit} onChange={(e) => patch(s.key, { unit: e.target.value })} placeholder={t('admin.specs_unit')} dir="auto" aria-label={t('admin.specs_unit')} className="w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(s.key, -1)} disabled={idx === 0} aria-label={t('admin.media_reorder_up')}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(s.key, 1)} disabled={idx === specs.length - 1} aria-label={t('admin.media_reorder_down')}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(s.key)} aria-label={t('admin.delete')}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5 me-1" />{t('admin.specs_add')}
      </Button>
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

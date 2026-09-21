'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { STATUS_OPTIONS, VISIBILITY_OPTIONS, type ProductFormState } from '@/lib/product-form';
import { CategorySelector } from './category-selector';
import type { ProductCategory } from '@/types';

interface ProductPublishPanelProps {
  form: ProductFormState;
  set: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
  categories: ProductCategory[];
}

function Switch({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-input'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
      </button>
    </div>
  );
}

/** Sidebar publishing card: status / visibility / flags / category / order. */
export function ProductPublishPanel({ form, set, categories }: ProductPublishPanelProps) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.status')}</label>
        <Select value={form.status} onValueChange={(v: string | null) => set('status', (v as ProductFormState['status']) || 'draft')}>
          <SelectTrigger className="w-full" aria-label={t('admin.status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{t(`admin.status_${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.filter_visibility')}</label>
        <Select value={form.visibility} onValueChange={(v: string | null) => set('visibility', (v as ProductFormState['visibility']) || 'public')}>
          <SelectTrigger className="w-full" aria-label={t('admin.filter_visibility')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((v) => (
              <SelectItem key={v} value={v}>{t(`admin.visibility_${v}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Switch checked={form.is_active} onToggle={() => set('is_active', !form.is_active)} label={t('admin.is_active')} />
      <Switch checked={form.is_featured} onToggle={() => set('is_featured', !form.is_featured)} label={t('admin.is_featured')} />
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.category_field')}</label>
        <CategorySelector categories={categories} value={form.category} onChange={(id) => set('category', id)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.sort_order')}</label>
        <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} min={0} />
      </div>
    </div>
  );
}

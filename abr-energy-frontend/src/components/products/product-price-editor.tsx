'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/i18n';
import { formatPrice, type ProductErrorMap } from '@/lib/product-form';
import type { PriceDisplayMode, ProductPriceInput } from '@/types';
import { PriceStateBadge } from './product-status-badge';

interface ProductPriceEditorProps {
  price: ProductPriceInput;
  onChange: (price: ProductPriceInput) => void;
  /** Backend-computed preview (from detail response) — never calculated client-side. */
  effective?: { state?: string; final_price?: string | null; regular_price?: string | null } | null;
  errors?: string[];
  errorMap?: ProductErrorMap;
}

const MODE_OPTIONS: PriceDisplayMode[] = ['contact', 'regular', 'discounted', 'hidden'];

/** Pricing editor. The backend `get_effective()` result is the only source of
 *  truth for the final price; this UI only edits inputs and previews state. */
export function ProductPriceEditor({ price, onChange, effective, errors }: ProductPriceEditorProps) {
  const { t } = useLocale();
  const set = <K extends keyof ProductPriceInput>(k: K, v: ProductPriceInput[K]) => onChange({ ...price, [k]: v });

  const showAmounts = price.display_mode === 'regular' || price.display_mode === 'discounted';
  const showDiscount = price.display_mode === 'discounted';

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.price_mode')}</label>
        <Select value={price.display_mode} onValueChange={(v: string | null) => set('display_mode', (v as PriceDisplayMode) || 'contact')}>
          <SelectTrigger className="w-full" aria-label={t('admin.price_mode')}>
            <SelectValue placeholder={t('admin.price_mode')} />
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>{t(`admin.price_${m}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAmounts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.regular_price')}</label>
            <Input
              inputMode="decimal"
              value={price.regular_price ?? ''}
              onChange={(e) => set('regular_price', e.target.value || null)}
              placeholder="1000000"
              dir="ltr"
              aria-label={t('admin.regular_price')}
            />
          </div>
          {showDiscount && (
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.sale_price')}</label>
              <Input
                inputMode="decimal"
                value={price.sale_price ?? ''}
                onChange={(e) => set('sale_price', e.target.value || null)}
                placeholder="800000"
                dir="ltr"
                aria-label={t('admin.sale_price')}
              />
            </div>
          )}
        </div>
      )}

      {showDiscount && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.discount_type')}</label>
            <Select value={price.discount_type} onValueChange={(v: string | null) => set('discount_type', (v as ProductPriceInput['discount_type']) || 'none')}>
              <SelectTrigger className="w-full" aria-label={t('admin.discount_type')}>
                <SelectValue placeholder={t('admin.discount_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('admin.discount_none')}</SelectItem>
                <SelectItem value="percentage">{t('admin.discount_percentage')}</SelectItem>
                <SelectItem value="fixed">{t('admin.discount_fixed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {price.discount_type !== 'none' && (
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.discount_value')}</label>
              <Input
                inputMode="decimal"
                value={price.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
                dir="ltr"
                aria-label={t('admin.discount_value')}
              />
            </div>
          )}
        </div>
      )}

      {showDiscount && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.price_starts_at')}</label>
            <Input
              type="datetime-local"
              value={price.starts_at ?? ''}
              onChange={(e) => set('starts_at', e.target.value || null)}
              dir="ltr"
              aria-label={t('admin.price_starts_at')}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.price_ends_at')}</label>
            <Input
              type="datetime-local"
              value={price.ends_at ?? ''}
              onChange={(e) => set('ends_at', e.target.value || null)}
              dir="ltr"
              aria-label={t('admin.price_ends_at')}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t('admin.price_active')}</label>
        <button
          type="button" role="switch" aria-checked={price.is_active}
          onClick={() => set('is_active', !price.is_active)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${price.is_active ? 'bg-primary' : 'bg-input'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${price.is_active ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
        </button>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('admin.price_effective_preview')}</span>
          <PriceStateBadge state={effective?.state} />
        </div>
        {effective?.state === 'discounted' ? (
          <div className="text-sm space-y-1">
            <div className="text-muted-foreground">
              {t('admin.price_original')}: <s dir="ltr">{formatPrice(effective?.regular_price)}</s>
            </div>
            <div className="font-semibold">
              {t('admin.price_final')}: <span dir="ltr">{formatPrice(effective?.final_price)}</span>
            </div>
          </div>
        ) : effective?.final_price ? (
          <div className="text-sm font-semibold">
            {t('admin.price_final')}: <span dir="ltr">{formatPrice(effective?.final_price)}</span>
          </div>
        ) : (
          <Badge variant="outline">{t('admin.price_contact')}</Badge>
        )}
      </div>

      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

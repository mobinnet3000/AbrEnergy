'use client';
import { useLocale } from '@/i18n';
import { formatPrice } from '@/lib/product-form';
import type { ProductAttributeValueItem } from '@/types';

/** Render a backend attribute display value (boolean needs localization). */
export function renderAttributeDisplay(
  value: ProductAttributeValueItem,
  yesLabel: string,
  noLabel: string,
): string {
  if (value.data_type === 'boolean') {
    if (typeof value.display === 'boolean') return value.display ? yesLabel : noLabel;
    if (value.value_boolean !== null && value.value_boolean !== undefined) {
      return value.value_boolean ? yesLabel : noLabel;
    }
    return '';
  }
  if (value.data_type === 'number' && value.value_number !== null && value.value_number !== undefined) {
    const num = formatPrice(value.value_number);
    return value.unit ? `${num} ${value.unit}` : num;
  }
  return String(value.display ?? value.value_text ?? '');
}

/**
 * Dynamic attribute list. Field names come from the backend definitions —
 * nothing like power/voltage/dimensions is hardcoded here.
 */
export function ProductAttributes({ values }: { values: ProductAttributeValueItem[] }) {
  const { t } = useLocale();
  if (!values || values.length === 0) return null;

  return (
    <section aria-labelledby="product-attrs-heading" className="flex flex-col gap-4">
      <h2 id="product-attrs-heading" className="font-heading text-xl font-bold text-white md:text-2xl">
        {t('products.attributes_title')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {values.map((value) => (
          <li
            key={value.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
          >
            <span className="text-sm text-white/50">{value.name}</span>
            <span className="text-sm font-semibold text-white" dir="auto">
              {renderAttributeDisplay(value, t('products.boolean_yes'), t('products.boolean_no'))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

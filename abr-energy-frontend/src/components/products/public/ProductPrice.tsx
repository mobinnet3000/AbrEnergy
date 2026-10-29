'use client';
import { Phone } from 'lucide-react';
import { useLocale } from '@/i18n';
import { formatPrice } from '@/lib/product-form';
import type { ProductListItem } from '@/types';
import { cn } from '@/lib/utils';

type EffectivePrice = ProductListItem['price'];

interface ProductPriceProps {
  price?: EffectivePrice | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Show the scheduled/expired helper note under the price. Default true. */
  showStateNote?: boolean;
  /** Surface tone. Default `light` (theme-adaptive via CSS tokens). */
  tone?: 'dark' | 'light';
}

/**
 * Public price renderer. Uses ONLY the backend `get_effective()` state —
 * no discount math is recreated in React.
 */
export function ProductPrice({ price, size = 'md', className, showStateNote = true, tone = 'light' }: ProductPriceProps) {
  const { t } = useLocale();
  const state = price?.state;

  if (!price || !state || state === 'hidden') return null;

  const currency = price.currency === 'IRR' ? t('products.currency_toman') : price.currency;
  const sizeCls =
    size === 'lg' ? 'text-2xl md:text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const light = tone === 'light';

  if (state === 'contact_for_price') {
    return (
      <p className={cn('inline-flex items-center gap-1.5 text-sm font-medium', light ? 'text-amber-700 dark:text-amber-300' : 'text-amber-300', className)}>
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('products.price_contact')}</span>
      </p>
    );
  }

  // Backend guarantees `final_price` for regular/scheduled/expired/discounted.
  const finalLabel = `${formatPrice(price.final_price ?? price.regular_price)} ${currency}`.trim();

  if (state === 'discounted') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={cn('font-heading font-bold', light ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-400', sizeCls)} dir="auto">
            {finalLabel}
          </span>
          <span className={cn('text-sm line-through', light ? 'text-neutral-400 dark:text-neutral-500' : 'text-white/35')} dir="auto" aria-label={t('products.original_price')}>
            {formatPrice(price.regular_price)} {currency}
          </span>
        </div>
        <span className={cn('inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', light ? 'bg-emerald-700/10 border-emerald-700/25 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300' : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-300')}>
          {t('products.discount_badge')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className={cn('font-heading font-bold', light ? 'text-neutral-900 dark:text-white' : 'text-white', sizeCls)} dir="auto">
        {finalLabel}
      </span>
      {showStateNote && state === 'scheduled' && (
        <span className={cn('text-xs', light ? 'text-sky-700 dark:text-sky-300/80' : 'text-sky-300/80')}>{t('products.price_soon')}</span>
      )}
      {showStateNote && state === 'expired' && (
        <span className={cn('text-xs', light ? 'text-neutral-500 dark:text-white/40' : 'text-white/40')}>{t('products.price_expired_note')}</span>
      )}
    </div>
  );
}

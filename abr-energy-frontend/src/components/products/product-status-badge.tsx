import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/i18n';
import { priceStateLabelKey } from '@/lib/product-form';
import type { PriceState, ProductStatus, ProductVisibility } from '@/types';

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { t } = useLocale();
  const key = status === 'published' ? 'admin.status_published' : status === 'archived' ? 'admin.status_archived' : 'admin.status_draft';
  return (
    <Badge variant={status === 'published' ? 'default' : status === 'archived' ? 'secondary' : 'outline'}>
      {t(key)}
    </Badge>
  );
}

export function ProductVisibilityBadge({ visibility }: { visibility: ProductVisibility }) {
  const { t } = useLocale();
  return (
    <Badge variant={visibility === 'public' ? 'outline' : 'secondary'}>
      {t(visibility === 'public' ? 'admin.visibility_public' : 'admin.visibility_hidden')}
    </Badge>
  );
}

export function PriceStateBadge({ state }: { state?: string }) {
  const { t } = useLocale();
  const s = (state ?? 'contact_for_price') as PriceState;
  return (
    <Badge variant={s === 'discounted' ? 'default' : s === 'hidden' ? 'secondary' : 'outline'}>
      {t(priceStateLabelKey(s))}
    </Badge>
  );
}

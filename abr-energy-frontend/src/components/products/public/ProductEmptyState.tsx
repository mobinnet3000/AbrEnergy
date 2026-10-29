'use client';
import { PackageSearch } from 'lucide-react';
import { useLocale } from '@/i18n';
import { EmptyState } from '@/components/shared/states';

interface ProductEmptyStateProps {
  action?: { label: string; onClick: () => void };
}

/** Catalog empty state with Persian defaults (API returned zero results, theme-aware). */
export function ProductEmptyState({ action }: ProductEmptyStateProps) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 shadow-xs dark:border-white/10 dark:bg-card/40">
      <div className="flex justify-center pt-10" aria-hidden>
        <PackageSearch className="h-12 w-12 text-muted-foreground/30" />
      </div>
      <EmptyState
        title={t('products.not_found')}
        message={t('products.not_found_hint')}
        action={action}
        className="pt-4"
      />
    </div>
  );
}

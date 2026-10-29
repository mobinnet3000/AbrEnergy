'use client';
import { useLocale } from '@/i18n';
import type { ProductSpecificationItem } from '@/types';

/** Group spec rows by section, preserving first-seen section order. */
export function groupPublicSpecs(
  specs: ProductSpecificationItem[],
): { section: string; rows: ProductSpecificationItem[] }[] {
  const groups = new Map<string, ProductSpecificationItem[]>();
  for (const spec of specs ?? []) {
    const key = (spec.section || '').trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(spec);
  }
  return [...groups.entries()]
    .map(([section, rows]) => ({
      section,
      rows: [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }))
    .sort((a, b) => a.section.localeCompare(b.section, 'fa'));
}

/**
 * Responsive specification display: section cards with label/value rows.
 * Renders backend-supplied rows only — no hardcoded spec fields.
 * Fully theme-aware.
 */
export function ProductSpecifications({ specs }: { specs: ProductSpecificationItem[] }) {
  const { t } = useLocale();
  if (!specs || specs.length === 0) return null;
  const groups = groupPublicSpecs(specs);

  return (
    <section aria-labelledby="product-specs-heading" className="flex flex-col gap-4">
      <h2 id="product-specs-heading" className="font-heading text-xl font-bold text-foreground md:text-2xl">
        {t('products.specs_title')}
      </h2>
      {groups.map((group) => (
        <div
          key={group.section || 'general'}
          className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs dark:border-white/10 dark:bg-card/70"
        >
          {group.section && (
            <h3 className="border-b border-border/80 bg-muted/40 px-5 py-3 text-sm font-semibold text-primary dark:border-white/10">
              {group.section}
            </h3>
          )}
          <dl className="divide-y divide-border/60 dark:divide-white/[0.08]">
            {group.rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr] gap-1 px-5 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
              >
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-foreground" dir="auto">
                  {row.value}
                  {row.unit && <span className="ms-1 text-xs font-normal text-muted-foreground/80">{row.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}

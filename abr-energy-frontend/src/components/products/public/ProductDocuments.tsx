'use client';
import { Download, FileText } from 'lucide-react';
import { useLocale } from '@/i18n';
import type { ProductDocumentItem } from '@/types';

const DOC_TYPE_LABEL_KEY: Record<string, string> = {
  catalog: 'admin.doc_type_catalog',
  datasheet: 'admin.doc_type_datasheet',
  installation_guide: 'admin.doc_type_installation_guide',
  spec_sheet: 'admin.doc_type_spec_sheet',
  other: 'admin.doc_type_other',
};

/**
 * Active downloadable product documents supplied by the API
 * (catalog, datasheet, installation guide, spec sheet, ...).
 * Fully theme-aware.
 */
export function ProductDocuments({ documents }: { documents: ProductDocumentItem[] }) {
  const { t } = useLocale();
  const active = (documents ?? []).filter((d) => d.is_active);
  if (active.length === 0) return null;

  return (
    <section aria-labelledby="product-docs-heading" className="flex flex-col gap-4">
      <h2 id="product-docs-heading" className="font-heading text-xl font-bold text-foreground md:text-2xl">
        {t('products.documents_title')}
      </h2>
      <ul className="flex flex-col gap-3">
        {active.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-colors hover:border-primary/40 dark:border-white/10 dark:bg-card/70"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{doc.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/80 bg-muted/40 px-2 py-0.5">
                  {t(DOC_TYPE_LABEL_KEY[doc.doc_type] ?? 'admin.doc_type_other')}
                </span>
                {doc.description && <span className="truncate">{doc.description}</span>}
              </p>
            </div>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              aria-label={`${t('products.document_download')}: ${doc.title}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t('products.document_download')}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

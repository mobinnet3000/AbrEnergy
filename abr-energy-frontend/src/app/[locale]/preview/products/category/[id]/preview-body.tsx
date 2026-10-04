'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { CategoryClient } from '@/app/[locale]/(public)/products/category/[slug]/category-client';
import { PreviewBanner } from '@/components/preview/preview-banner';
import { ErrorState } from '@/components/shared/states';
import { PageLoading } from '@/components/shared/loading';
import { useCategoryPreview } from '@/hooks/use-api';

/**
 * Phase 8.2 — token-gated category preview body. Reuses `CategoryClient`
 * (same header/children/product-grid rendering — zero duplicated design).
 * The signed `?token=...` itself is the credential; the public category
 * route and its filters are untouched.
 */
export function CategoryPreviewBody() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'fa';
  const id = (params?.id as string) || '';
  const token = searchParams.get('token');
  const { data, isLoading, error, refetch } = useCategoryPreview(id || null, token);

  return (
    <div>
      <PreviewBanner studioHref={`/${locale}/admin/products/categories/${id}/edit`} studioLabel="Back to Category Studio" />

      {!token ? (
        <ErrorState
          title="Missing preview token"
          message="Open this page via the Preview button in Category Studio."
          action={{ label: 'Back to Studio', onClick: () => { window.location.href = `/${locale}/admin/products/categories/${id}/edit`; } }}
        />
      ) : isLoading ? (
        <PageLoading />
      ) : error || !data ? (
        <ErrorState
          title="Preview unavailable"
          message="The preview token is invalid or has expired. Issue a fresh one from Category Studio."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <CategoryClient key={id} slug={id} previewCategory={data} />
      )}
    </div>
  );
}

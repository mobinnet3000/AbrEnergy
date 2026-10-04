'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ProductDetailClient } from '@/app/[locale]/(public)/products/[slug]/product-detail-client';
import { PreviewBanner } from '@/components/preview/preview-banner';
import { ErrorState } from '@/components/shared/states';
import { PageLoading } from '@/components/shared/loading';
import { useProductPreview } from '@/hooks/use-api';

/**
 * Phase 8.2 — token-gated product preview body. Reuses `ProductDetailClient`
 * (same gallery/pricing/specs/documents/related rendering — zero duplicated
 * design). The signed `?token=...` itself is the credential; the public
 * product route and its filters are untouched.
 */
export function ProductPreviewBody() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'fa';
  const id = (params?.id as string) || '';
  const token = searchParams.get('token');
  const { data, isLoading, error, refetch } = useProductPreview(id || null, token);

  return (
    <div>
      <PreviewBanner studioHref={`/${locale}/admin/products/${id}/edit`} studioLabel="Back to Product Studio" />

      {!token ? (
        <ErrorState
          title="Missing preview token"
          message="Open this page via the Preview button in Product Studio."
          action={{ label: 'Back to Studio', onClick: () => { window.location.href = `/${locale}/admin/products/${id}/edit`; } }}
        />
      ) : isLoading ? (
        <PageLoading />
      ) : error || !data ? (
        <ErrorState
          title="Preview unavailable"
          message="The preview token is invalid or has expired. Issue a fresh one from Product Studio."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <ProductDetailClient key={id} slug={id} previewProduct={data} />
      )}
    </div>
  );
}

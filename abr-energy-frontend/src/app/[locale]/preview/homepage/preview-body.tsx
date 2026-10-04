'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { HomepageClient } from '@/app/[locale]/(public)/homepage-client';
import { ErrorState } from '@/components/shared/states';
import { PageLoading } from '@/components/shared/loading';
import { useHomepagePreview } from '@/hooks/use-api';

/**
 * Phase 8.1 — token-gated homepage preview body. Reuses `HomepageClient`
 * (same sections, Hero3D, animation stack — zero duplicated design).
 * The signed `?token=...` itself is the credential; the public homepage
 * route and its filters are untouched.
 */
export function HomepagePreviewBody() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'fa';
  const token = searchParams.get('token');
  const { data, isLoading, error, refetch } = useHomepagePreview(token);

  return (
    <div>
      <div
        role="status"
        className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black"
      >
        <span>PREVIEW — not public. Links and content reflect saved CMS state including hidden items.</span>
        <Link
          href={`/${locale}/admin/content/homepage`}
          className="underline underline-offset-2"
        >
          Back to Homepage Studio
        </Link>
      </div>

      {!token ? (
        <ErrorState
          title="Missing preview token"
          message="Open this page via the Preview button in Homepage Studio."
          action={{ label: 'Back to Studio', onClick: () => { window.location.href = `/${locale}/admin/content/homepage`; } }}
        />
      ) : isLoading ? (
        <PageLoading />
      ) : error || !data ? (
        <ErrorState
          title="Preview unavailable"
          message="The preview token is invalid or has expired. Issue a fresh one from Homepage Studio."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <HomepageClient previewPayload={data} />
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomepagePreviewBody } from './preview-body';

// Phase 8.1 — token-gated homepage preview. Never indexed, never in the
// sitemap (static sitemap only lists public routes), always dynamic.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Homepage Preview',
  robots: { index: false, follow: false },
};

export default function HomepagePreviewPage() {
  return (
    <Suspense fallback={null}>
      <HomepagePreviewBody />
    </Suspense>
  );
}

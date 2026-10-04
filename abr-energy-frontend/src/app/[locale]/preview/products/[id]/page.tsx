import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductPreviewBody } from './preview-body';

// Phase 8.2 — token-gated product preview (saved-but-hidden only). Never
// indexed, never in the sitemap (static sitemap only lists public routes),
// always dynamic. Reuses the public ProductDetailClient rendering verbatim.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Product Preview',
  robots: { index: false, follow: false },
};

export default function ProductPreviewPage() {
  return (
    <Suspense fallback={null}>
      <ProductPreviewBody />
    </Suspense>
  );
}

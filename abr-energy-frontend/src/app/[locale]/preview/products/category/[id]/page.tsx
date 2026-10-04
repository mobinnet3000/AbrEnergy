import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoryPreviewBody } from './preview-body';

// Phase 8.2 — token-gated category preview (saved-but-hidden only). Never
// indexed, never in the sitemap (static sitemap only lists public routes),
// always dynamic. Reuses the public CategoryClient rendering verbatim.
// NOTE: this path lives under `/preview/…`, so it cannot collide with the
// public `/products/category/[slug]` route.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Category Preview',
  robots: { index: false, follow: false },
};

export default function CategoryPreviewPage() {
  return (
    <Suspense fallback={null}>
      <CategoryPreviewBody />
    </Suspense>
  );
}

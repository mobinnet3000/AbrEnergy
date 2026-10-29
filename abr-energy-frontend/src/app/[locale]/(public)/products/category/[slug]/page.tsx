import { Suspense } from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import {
  fetchPublicProductCategoryWithStatus,
  productCategoryMetadata,
  resolvePublicProductCategorySlug,
} from '@/lib/product-metadata';
import { InternalPageShell, PageLoading } from '@/components/shared';
import { CategoryClient } from './category-client';

interface CategoryPageProps {
  params: Promise<{ locale?: string; slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  return productCategoryMetadata(slug);
}

function CategoryFallback() {
  return (
    <InternalPageShell>
      <div className="container-page py-16">
        <PageLoading />
      </div>
    </InternalPageShell>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale = 'fa', slug } = await params;
  // Phase 12.25 — Only consult slug history on genuine 404 Not Found.
  // Throttled (429) or transient 5xx responses must never trigger history
  // resolution fetches, preventing retry amplification.
  const { data: category, status } = await fetchPublicProductCategoryWithStatus(slug);
  if (!category && status === 404) {
    const canonical = await resolvePublicProductCategorySlug(slug);
    if (canonical && canonical !== slug) {
      permanentRedirect(`/${locale}/products/category/${canonical}`);
    }
  }
  // Remount per category so pagination never leaks between categories.
  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryClient key={slug} slug={slug} />
    </Suspense>
  );
}

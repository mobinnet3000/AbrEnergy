import { Suspense } from 'react';
import type { Metadata } from 'next';
import { productCategoriesIndexMetadata } from '@/lib/product-metadata';
import { CardLoading, InternalPageShell } from '@/components/shared';
import { CategoryIndexClient } from './category-index-client';

export function generateMetadata(): Metadata {
  return productCategoriesIndexMetadata();
}

function CategoryIndexFallback() {
  return (
    <InternalPageShell>
      <div className="container-page py-16">
        <CardLoading count={4} />
      </div>
    </InternalPageShell>
  );
}

export default function CategoryIndexPage() {
  return (
    <Suspense fallback={<CategoryIndexFallback />}>
      <CategoryIndexClient />
    </Suspense>
  );
}

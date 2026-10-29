import { Suspense } from 'react';
import type { Metadata } from 'next';
import { productsIndexMetadata } from '@/lib/product-metadata';
import { CardLoading, InternalPageShell } from '@/components/shared';
import { ProductsClient } from './products-client';

export function generateMetadata(): Metadata {
  return productsIndexMetadata();
}

function ProductsFallback() {
  return (
    <InternalPageShell>
      <div className="container-page py-16">
        <CardLoading count={6} />
      </div>
    </InternalPageShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsClient />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { productsIndexMetadata } from '@/lib/product-metadata';
import { ProductsClient } from './products-client';

export function generateMetadata(): Metadata {
  return productsIndexMetadata();
}

export default function ProductsPage() {
  return <ProductsClient />;
}

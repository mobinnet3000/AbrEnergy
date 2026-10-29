import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import {
  fetchPublicProductWithStatus,
  productMetadata,
  resolvePublicProductSlug,
} from '@/lib/product-metadata';
import { ProductDetailClient } from './product-detail-client';

interface ProductDetailPageProps {
  params: Promise<{ locale?: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug);
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { locale = 'fa', slug } = await params;
  // Phase 12.25 — Only consult slug history on genuine 404 Not Found.
  // Throttled (429) or transient 5xx responses must never trigger history
  // resolution fetches, preventing retry amplification.
  const { data: product, status } = await fetchPublicProductWithStatus(slug);
  if (!product && status === 404) {
    const canonical = await resolvePublicProductSlug(slug);
    if (canonical && canonical !== slug) {
      permanentRedirect(`/${locale}/products/${canonical}`);
    }
  }
  // Remount per product so gallery/scroll state never leaks between slugs.
  return <ProductDetailClient key={slug} slug={slug} />;
}

import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import {
  fetchPublicProduct,
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
  // Phase 5.2 — slug-history redirect: current slugs render normally; only
  // when the canonical fetch misses do we consult history, and only a
  // DIFFERENT canonical slug triggers a permanent redirect (loop-safe:
  // canonical targets always fetch successfully, unknown slugs fall through
  // to the existing NotFoundState).
  const product = await fetchPublicProduct(slug);
  if (!product) {
    const canonical = await resolvePublicProductSlug(slug);
    if (canonical && canonical !== slug) {
      permanentRedirect(`/${locale}/products/${canonical}`);
    }
  }
  // Remount per product so gallery/scroll state never leaks between slugs.
  return <ProductDetailClient key={slug} slug={slug} />;
}

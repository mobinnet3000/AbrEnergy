import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import {
  fetchPublicProductCategory,
  productCategoryMetadata,
  resolvePublicProductCategorySlug,
} from '@/lib/product-metadata';
import { CategoryClient } from './category-client';

interface CategoryPageProps {
  params: Promise<{ locale?: string; slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  return productCategoryMetadata(slug);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale = 'fa', slug } = await params;
  // Phase 5.2 — slug-history redirect (same contract as product detail:
  // redirect only on history hit with a different canonical slug).
  const category = await fetchPublicProductCategory(slug);
  if (!category) {
    const canonical = await resolvePublicProductCategorySlug(slug);
    if (canonical && canonical !== slug) {
      permanentRedirect(`/${locale}/products/category/${canonical}`);
    }
  }
  // Remount per category so pagination never leaks between categories.
  return <CategoryClient key={slug} slug={slug} />;
}

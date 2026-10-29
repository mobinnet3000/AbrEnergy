import type { Metadata } from 'next';
import { HomepageClient } from './homepage-client';
import { buildHomepageMetadata, fetchHomepage } from '@/lib/homepage';

// Phase 7 — CMS-driven homepage metadata with the static Persian copy as
// the fallback (same never-500s pattern as the catalog metadata).
export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = 'fa' } = await params;
  const homepage = await fetchHomepage(locale);
  return buildHomepageMetadata(homepage);
}

export default function HomePage() {
  return <HomepageClient />;
}

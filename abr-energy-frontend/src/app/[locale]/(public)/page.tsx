import type { Metadata } from 'next';
import { HomepageClient } from './homepage-client';
import { buildHomepageMetadata, fetchHomepage } from '@/lib/homepage';

// Phase 7 — CMS-driven homepage metadata with the static Persian copy as
// the fallback (same never-500s pattern as the catalog metadata).
export async function generateMetadata(): Promise<Metadata> {
  const homepage = await fetchHomepage();
  return buildHomepageMetadata(homepage);
}

export default function HomePage() {
  return <HomepageClient />;
}

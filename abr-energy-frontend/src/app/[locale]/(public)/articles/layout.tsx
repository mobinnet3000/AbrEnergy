import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({ locale, path: '/articles', titleKey: 'articles.title', descriptionKey: 'articles.subtitle' });
}

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

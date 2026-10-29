import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({
    locale,
    path: '/about',
    titleKey: 'about.subtitle',
    descriptionKey: 'about.values_desc',
  });
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({ locale, path: '/services', titleKey: 'services.title', descriptionKey: 'services.subtitle' });
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

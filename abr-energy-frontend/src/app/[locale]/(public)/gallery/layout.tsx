import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({ locale, path: '/gallery', titleKey: 'gallery.title', descriptionKey: 'gallery.subtitle' });
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

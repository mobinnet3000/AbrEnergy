import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return listMetadata({ locale, path: '/projects', titleKey: 'projects.title', descriptionKey: 'projects.subtitle' });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

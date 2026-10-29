import type { Metadata } from 'next';
import { listMetadata } from '@/lib/content-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = 'fa' } = await params;
  return listMetadata({
    locale,
    path: '/downloads',
    titleKey: 'downloads.title',
    descriptionKey: 'downloads.subtitle',
  });
}

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

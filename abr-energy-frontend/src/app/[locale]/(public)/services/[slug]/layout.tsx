import type { Metadata } from 'next';
import { detailMetadata, fetchPublicService } from '@/lib/content-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale = 'fa', slug } = await params;
  const service = await fetchPublicService(slug, locale);
  return detailMetadata({
    locale,
    path: `/services/${slug}`,
    entity: service,
    titleKey: 'services.title',
    descriptionKey: 'services.subtitle',
  });
}

export default function ServiceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

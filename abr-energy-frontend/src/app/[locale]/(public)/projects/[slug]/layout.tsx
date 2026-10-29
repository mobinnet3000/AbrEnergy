import type { Metadata } from 'next';
import { detailMetadata, fetchPublicProject } from '@/lib/content-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale = 'fa', slug } = await params;
  const project = await fetchPublicProject(slug, locale);
  return detailMetadata({
    locale,
    path: `/projects/${slug}`,
    entity: project,
    titleKey: 'projects.title',
    descriptionKey: 'projects.subtitle',
  });
}

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

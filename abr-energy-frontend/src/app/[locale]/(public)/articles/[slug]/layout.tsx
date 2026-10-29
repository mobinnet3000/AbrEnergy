import type { Metadata } from 'next';
import { detailMetadata, fetchPublicArticle } from '@/lib/content-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale = 'fa', slug } = await params;
  const article = await fetchPublicArticle(slug, locale);
  return detailMetadata({
    locale,
    path: `/articles/${slug}`,
    entity: article,
    titleKey: 'articles.title',
    descriptionKey: 'articles.subtitle',
  });
}

export default function ArticleDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

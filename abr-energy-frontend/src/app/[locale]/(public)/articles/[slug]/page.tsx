'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import type { Article } from '@/types';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', slug],
    queryFn: () => axiosInstance.get(`/articles/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error('Failed to load article'); }, [error]);
  if (error) return <div className="py-20 text-center text-muted-foreground">Failed to load article</div>;
  if (isLoading) return <div className="py-20 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!article) return <div className="py-20 text-center text-muted-foreground">Article not found</div>;

  return (
    <article className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/articles" className="hover:text-foreground">Articles</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{article.title}</span>
        </nav>

        <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </Link>

        <div className="mb-8">
          <span className="text-sm text-green-600 font-medium">{article.category_title}</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{article.title}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>By {article.author_name}</span>
            <span>{new Date(article.publish_date || article.created_at).toLocaleDateString()}</span>
            <span>{article.view_count} views</span>
          </div>
        </div>

        {article.cover_image_url && (

          <img src={article.cover_image_url} alt={article.title} className="w-full aspect-video object-cover rounded-xl mb-8" />
        )}

        <div className="prose prose-green dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

        {article.tags?.length > 0 && (
          <div className="flex gap-2 mt-8 pt-8 border-t">
            {article.tags.map((t) => (
              <span key={t.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">{t.title}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

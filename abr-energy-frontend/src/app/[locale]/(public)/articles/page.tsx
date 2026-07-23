'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useArticles } from '@/hooks/use-api';

export default function ArticlesPage() {
  const { data, isLoading } = useArticles();
  const articles = Array.isArray(data?.results) ? data.results : [];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Articles & <span className="text-green-600">Insights</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Learn about solar energy, technology, and industry updates</p>
        </div>
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No articles published yet</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a: Record<string, unknown>) => (
              <Link key={a.id as string} href={`/articles/${a.slug}`}>
                <Card className="overflow-hidden group hover:shadow-lg transition-all h-full">
                  <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800">
                    {(a as { cover_image_url?: string }).cover_image_url ? (
                      <img src={(a as { cover_image_url: string }).cover_image_url} alt={a.title as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <span className="text-xs text-green-600 font-medium">{(a as { category_title?: string }).category_title || 'Article'}</span>
                    <h3 className="font-semibold mt-1 line-clamp-2 group-hover:text-green-600 transition-colors">{a.title as string}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{(a as { short_description?: string }).short_description || ''}</p>
                    <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at as string).toLocaleDateString('fa-IR')}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


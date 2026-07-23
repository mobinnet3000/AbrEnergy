'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ArticleListData } from '@/types';

export default function AdminArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => axiosInstance.get('/articles/', { params: { id } }).then((r) => {
      const results = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      return results.find((a: ArticleListData) => a.id === id) || null;
    }),
    enabled: !!id,
  });

  useEffect(() => { if (error) toast.error('Failed to load article'); }, [error]);
  if (error) return <div className="py-10 text-center text-muted-foreground">Failed to load article</div>;
  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">Article not found</div>;

  const a = data as ArticleListData;

  return (
    <div>
      <Link href="/admin/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Articles
      </Link>
      <h1 className="text-3xl font-bold mb-8">Article Detail</h1>
      <Card>
        <CardHeader><CardTitle>{a.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Slug:</span> <span className="text-muted-foreground">{a.slug}</span></div>
            <div><span className="font-medium">Status:</span> <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>{a.status}</Badge></div>
            <div><span className="font-medium">Author:</span> <span className="text-muted-foreground">{a.author_name}</span></div>
            <div><span className="font-medium">Category:</span> <span className="text-muted-foreground">{a.category_title || '-'}</span></div>
            <div><span className="font-medium">Created:</span> <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span></div>
            <div><span className="font-medium">Views:</span> <span className="text-muted-foreground">{a.view_count}</span></div>
            <div><span className="font-medium">Published:</span> <span className="text-muted-foreground">{a.publish_date ? new Date(a.publish_date).toLocaleDateString() : '-'}</span></div>
            <div><span className="font-medium">Featured:</span> <span className="text-muted-foreground">{a.is_featured ? 'Yes' : 'No'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

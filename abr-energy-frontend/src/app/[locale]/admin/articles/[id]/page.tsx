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
import { useLocale } from '@/i18n';

export default function AdminArticleDetailPage() {
  const { t } = useLocale();
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

  useEffect(() => { if (error) toast.error(t('admin.failed_load_articles')); }, [error]);
  if (error) return <div className="py-10 text-center text-muted-foreground">{t('admin.failed_load_articles')}</div>;
  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">{t('admin.article_not_found')}</div>;

  const a = data as ArticleListData;

  return (
    <div>
      <Link href="/admin/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('admin.back_to_articles')}
      </Link>
      <h1 className="text-3xl font-bold mb-8">{t('admin.article_detail')}</h1>
      <Card>
        <CardHeader><CardTitle>{a.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">{t('admin.slug')}:</span> <span className="text-muted-foreground">{a.slug}</span></div>
            <div><span className="font-medium">{t('admin.status')}:</span> <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>{a.status}</Badge></div>
            <div><span className="font-medium">Author:</span> <span className="text-muted-foreground">{a.author_name}</span></div>
            <div><span className="font-medium">{t('admin.category')}:</span> <span className="text-muted-foreground">{a.category_title || '-'}</span></div>
            <div><span className="font-medium">{t('admin.created')}:</span> <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span></div>
            <div><span className="font-medium">{t('admin.views')}:</span> <span className="text-muted-foreground">{a.view_count}</span></div>
            <div><span className="font-medium">{t('admin.publish_date')}:</span> <span className="text-muted-foreground">{a.publish_date ? new Date(a.publish_date).toLocaleDateString() : '-'}</span></div>
            <div><span className="font-medium">{t('admin.featured')}:</span> <span className="text-muted-foreground">{a.is_featured ? 'Yes' : 'No'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n';

export default function AdminInquiriesPage() {
  const { t } = useLocale();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/project-inquiries/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error(t('admin.failed_load')); }, [error]);
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.inquiries')}</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">{t('admin.no_inquiries')}</p>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_inquiries')} ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">{t('admin.name')}</th><th className="py-3 px-2">{t('admin.phone')}</th><th className="py-3 px-2">{t('admin.city')}</th><th className="py-3 px-2">{t('admin.project_type')}</th><th className="py-3 px-2">{t('admin.status')}</th><th className="py-3 px-2">{t('admin.date')}</th></tr></thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{item.name as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.phone as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.city as string || '-'}</td>
                      <td className="py-3 px-2"><Badge variant="outline">{item.project_type as string}</Badge></td>
                      <td className="py-3 px-2"><Badge variant={(item as { status?: string }).status === 'pending' ? 'secondary' : 'default'}>{(item as { status?: string }).status || 'pending'}</Badge></td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(item.created_at as string).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

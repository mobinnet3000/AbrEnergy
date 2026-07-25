'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n';

export default function AdminNotificationsPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const res = await axiosInstance.get('/notifications/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error(t('admin.failed_load')); }, [error]);

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.patch('/notifications/read-all/');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('admin.notifications')}</h1>
        <Button type="button" variant="outline" size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
          {markAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t('admin.mark_all_read')}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">{t('admin.no_notifications')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item: Record<string, unknown>) => (
            <Card key={item.id as string} className={cn(!(item as { is_read: boolean }).is_read && 'border-l-4 border-l-primary')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{item.title as string}</span>
                      {(item as { is_read: boolean }).is_read === false && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.message as string}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs">{(item as { notification_type?: string }).notification_type || (item as { type?: string }).type || 'info'}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.created_at as string).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

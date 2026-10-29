'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotifications, useMarkRead, useMarkAllRead, useDeleteNotification, useUnreadCount } from '@/hooks/use-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  MessageSquare,
  FolderKanban,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useLocale } from '@/i18n';
import { resolveNotificationLink } from '@/lib/notification-route';

export default function AdminNotificationsPage() {
  const { t, locale } = useLocale();
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const { data, isLoading, error, refetch, isFetching } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  const allItems: Array<Record<string, unknown>> = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  const filteredItems = filterMode === 'unread'
    ? allItems.filter((it) => !it.is_read)
    : allItems;

  const unreadCount = typeof unreadData?.count === 'number'
    ? unreadData.count
    : allItems.filter((it) => !it.is_read).length;

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('admin.saved_successfully'));
      },
      onError: () => {
        toast.error(t('admin.failed_load'));
      },
    });
  };

  const handleMarkOne = (id: string) => {
    markRead.mutate(id, {
      onSuccess: () => {
        toast.success(t('admin.status_updated'));
      },
      onError: () => {
        toast.error(t('admin.status_update_failed'));
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteNotif.mutate(id, {
      onSuccess: () => {
        toast.success(t('admin.notification_deleted'));
      },
      onError: () => {
        toast.error(t('admin.notification_delete_failed'));
      },
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_contact':
      case 'contact_status_change':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'new_project_inquiry':
      case 'project_inquiry_status_change':
        return <FolderKanban className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            {t('admin.notifications')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} ${t('admin.filter_unread')}`
              : t('admin.all')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('admin.try_again')}
          </Button>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
              className="gap-1.5"
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {t('admin.mark_all_read')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          type="button"
          variant={filterMode === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterMode('all')}
          className="text-xs"
        >
          {t('admin.all')} ({allItems.length})
        </Button>
        <Button
          type="button"
          variant={filterMode === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterMode('unread')}
          className="text-xs"
        >
          {t('admin.filter_unread')} ({unreadCount})
        </Button>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-emerald-600" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{t('admin.failed_load')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('admin.try_again')}
            </Button>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center text-muted-foreground space-y-2">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-base font-medium">{t('admin.no_notifications')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isUnread = !item.is_read;
            const notifType = (item.notification_type as string) || 'general';
            const destUrl = item.link ? resolveNotificationLink(item.link as string, locale) : null;

            return (
              <Card
                key={item.id as string}
                className={cn(
                  'transition-all duration-200 border',
                  isUnread
                    ? 'border-emerald-500/40 bg-card/90 shadow-xs rtl:border-r-4 ltr:border-l-4 rtl:border-r-emerald-500 ltr:border-l-emerald-500'
                    : 'bg-card/50 opacity-80 hover:opacity-100'
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notifType)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.title as string}
                          </h3>
                          {isUnread && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white">
                              {t('admin.inquiry_status_new')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {item.message as string}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 pt-1">
                          {item.created_at
                            ? new Date(item.created_at as string).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                      {destUrl && (
                        <Link
                          href={destUrl}
                          onClick={() => {
                            if (isUnread) markRead.mutate(item.id as string);
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('admin.notification_view')}
                          </Button>
                        </Link>
                      )}

                      {isUnread && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkOne(item.id as string)}
                          disabled={markRead.isPending}
                          className="h-8 text-xs gap-1"
                          title={t('admin.notification_mark_read')}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('admin.notification_mark_read')}</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id as string)}
                        disabled={deleteNotif.isPending}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        title={t('admin.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

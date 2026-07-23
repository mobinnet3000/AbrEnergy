'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-api';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const notifications = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some((n: { is_read: boolean }) => !n.is_read) && (
          <Button type="button" variant="outline" size="sm" onClick={() => markAllRead.mutate()}>Mark All Read</Button>
        )}
      </div>
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No notifications</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: Record<string, unknown>) => (
            <Card key={n.id as string} className={n.is_read ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{n.title as string}</h3>
                  <p className="text-sm text-muted-foreground">{n.message as string}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at as string).toLocaleDateString('fa-IR')}</p>
                </div>
                {!n.is_read && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => markRead.mutate(n.id as string)}>Read</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

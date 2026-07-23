'use client';
import { useActivityLog } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminActivityLogPage() {
  const { data, isLoading } = useActivityLog();
  const logs = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Activity Log</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">Loading...</div> : (
        <Card>
          <CardHeader><CardTitle>Recent Activities ({logs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((l: Record<string, unknown>) => (
                <div key={l.id as string} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      <span className="text-green-600 font-semibold capitalize">{(l as { action: string }).action}</span>
                      {' '}on{' '}
                      <span className="font-semibold">{(l as { model_name: string }).model_name}</span>
                      {l.object_repr ? `: ${l.object_repr as string}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.user ? (l as { user_email: string }).user_email : 'System'}
                      {' · '}{new Date(l.timestamp as string).toLocaleString()}
                      {l.ip_address ? ` · ${l.ip_address as string}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

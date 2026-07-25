'use client';
import { useAdminUsers } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/i18n';

export default function AdminUsersPage() {
  const { t } = useLocale();
  const { data, isLoading } = useAdminUsers();
  const users = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.users')}</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div> : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_users')} ({users.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">{t('admin.name')}</th><th className="py-3 px-2">{t('admin.email')}</th><th className="py-3 px-2">Role</th><th className="py-3 px-2">{t('admin.status')}</th><th className="py-3 px-2">{t('admin.date')}</th></tr></thead>
                <tbody>
                  {users.map((u: Record<string, unknown>) => (
                    <tr key={u.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{u.full_name as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email as string}</td>
                      <td className="py-3 px-2"><Badge variant="outline">{u.role as string}</Badge></td>
                      <td className="py-3 px-2">                        <Badge variant={u.is_active ? 'default' : 'secondary'}>{u.is_active ? t('admin.published') : t('admin.draft')}</Badge></td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(u.created_at as string).toLocaleDateString()}</td>
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

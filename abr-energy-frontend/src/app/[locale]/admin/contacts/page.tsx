'use client';
import { useAdminContacts } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/i18n';

export default function AdminContactsPage() {
  const { t } = useLocale();
  const { data, isLoading } = useAdminContacts();
  const contacts = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.contacts')}</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div> : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_requests')} ({contacts.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">{t('admin.name')}</th><th className="py-3 px-2">{t('admin.email')}</th><th className="py-3 px-2">{t('admin.type')}</th><th className="py-3 px-2">{t('admin.status')}</th><th className="py-3 px-2">{t('admin.date')}</th></tr></thead>
                <tbody>
                  {contacts.map((c: Record<string, unknown>) => (
                    <tr key={c.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{c.full_name as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{c.email as string}</td>
                      <td className="py-3 px-2"><Badge variant="outline">{c.request_type as string}</Badge></td>
                      <td className="py-3 px-2"><Badge variant={c.status === 'pending' ? 'secondary' : 'default'}>{c.status as string}</Badge></td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(c.created_at as string).toLocaleDateString()}</td>
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

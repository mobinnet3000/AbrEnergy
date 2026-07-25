'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/i18n';

export default function AdminServicesPage() {
  const { t } = useLocale();
  const { data, isLoading } = useServices();
  const services = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.services')}</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div> : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_services')} ({services.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">{t('admin.title_label')}</th><th className="py-3 px-2">{t('admin.category')}</th><th className="py-3 px-2">{t('admin.status')}</th><th className="py-3 px-2">{t('admin.featured')}</th><th className="py-3 px-2">{t('admin.created')}</th></tr></thead>
                <tbody>
                  {services.map((s: Record<string, unknown>) => (
                    <tr key={s.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{s.title as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{(s as { category_title?: string }).category_title || '-'}</td>
                      <td className="py-3 px-2"><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status as string}</Badge></td>
                      <td className="py-3 px-2">{s.is_featured ? '✓' : '-'}</td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(s.created_at as string).toLocaleDateString()}</td>
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

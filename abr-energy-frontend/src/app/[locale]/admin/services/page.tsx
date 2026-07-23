'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';

export default function AdminServicesPage() {
  const { data, isLoading } = useServices();
  const services = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Services</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">Loading...</div> : (
        <Card>
          <CardHeader><CardTitle>All Services ({services.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">Title</th><th className="py-3 px-2">Category</th><th className="py-3 px-2">Status</th><th className="py-3 px-2">Featured</th><th className="py-3 px-2">Created</th></tr></thead>
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

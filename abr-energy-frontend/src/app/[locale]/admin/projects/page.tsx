'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';

export default function AdminProjectsPage() {
  const { data, isLoading } = useProjects();
  const projects = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">Loading...</div> : (
        <Card>
          <CardHeader><CardTitle>All Projects ({projects.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">Title</th><th className="py-3 px-2">Type</th><th className="py-3 px-2">Location</th><th className="py-3 px-2">Capacity</th><th className="py-3 px-2">Status</th></tr></thead>
                <tbody>
                  {projects.map((p: Record<string, unknown>) => (
                    <tr key={p.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{p.title as string}</td>
                      <td className="py-3 px-2"><Badge variant="outline">{p.project_type as string}</Badge></td>
                      <td className="py-3 px-2 text-muted-foreground">{p.location as string || '-'}</td>
                      <td className="py-3 px-2">{(p as { capacity: number }).capacity} kW</td>
                      <td className="py-3 px-2"><Badge>{p.status as string}</Badge></td>
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

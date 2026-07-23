'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader, TableLoading } from '@/components/shared';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const locales = [
  { code: 'fa', label: 'FA', color: 'text-green-600' },
  { code: 'ar', label: 'AR', color: 'text-red-500' },
  { code: 'en', label: 'EN', color: 'text-blue-600' },
];

export default function AdminProjectsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await axiosInstance.get('/projects/');
      return res.data;
    },
  });

  useEffect(() => { if (error) toast.error('Failed to load projects'); }, [error]);

  const projects = Array.isArray(data?.results) ? data.results : [];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await axiosInstance.delete(`/admin/projects/${id}/`);
      toast.success('Project deleted');
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div>
      <PageHeader title="Projects" description="Manage CMS projects and multilingual content">
        <Link href="/admin/projects/new">
          <Button><Plus className="h-4 w-4 mr-1" /> Create Project</Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <TableLoading rows={5} />
      ) : error ? (
        <div className="text-center py-12 text-destructive">Failed to load projects</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No projects yet.</p>
            <Link href="/admin/projects/new">
              <Button variant="outline" className="mt-4">Create your first project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Projects ({projects.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Location</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Capacity</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Languages</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p: Record<string, unknown>) => (
                    <tr key={p.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{p.title as string}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className="capitalize">{(p.project_type as string || '').replace('_', ' ')}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground">{p.location as string || '-'}</td>
                      <td className="py-3 px-4">{(p as { capacity: number }).capacity} kW</td>
                      <td className="py-3 px-4"><Badge>{p.status as string}</Badge></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {locales.map((l) => (
                            <span key={l.code} className={`text-xs font-medium ${l.color}`}>{l.label}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link href={`/admin/projects/${p.id}/edit`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button type="button" onClick={() => handleDelete(p.id as string)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive h-8 w-8" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
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

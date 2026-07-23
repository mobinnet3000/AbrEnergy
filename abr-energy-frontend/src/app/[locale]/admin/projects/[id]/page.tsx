'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types';

export default function AdminProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-project', id],
    queryFn: () => axiosInstance.get('/projects/').then((r) => {
      const results = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      return results.find((p: Project) => p.id === id) || null;
    }),
    enabled: !!id,
  });

  useEffect(() => { if (error) toast.error('Failed to load project'); }, [error]);
  if (error) return <div className="py-10 text-center text-muted-foreground">Failed to load project</div>;
  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">Project not found</div>;

  const p = data as Project;

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>
      <h1 className="text-3xl font-bold mb-8">Project Detail</h1>
      <Card>
        <CardHeader><CardTitle>{p.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Slug:</span> <span className="text-muted-foreground">{p.slug}</span></div>
            <div><span className="font-medium">Status:</span> <Badge>{p.status}</Badge></div>
            <div><span className="font-medium">Location:</span> <span className="text-muted-foreground">{p.location || '-'}</span></div>
            <div><span className="font-medium">Capacity:</span> <span className="text-muted-foreground">{p.capacity} kW</span></div>
            <div><span className="font-medium">Type:</span> <span className="text-muted-foreground capitalize">{p.project_type.replace('_', ' ')}</span></div>
            <div><span className="font-medium">Featured:</span> <span className="text-muted-foreground">{p.is_featured ? 'Yes' : 'No'}</span></div>
            <div><span className="font-medium">Created:</span> <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

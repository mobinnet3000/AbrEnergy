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
import type { Service } from '@/types';

export default function AdminServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-service', id],
    queryFn: () => axiosInstance.get('/services/').then((r) => {
      const results = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      return results.find((s: Service) => s.id === id) || null;
    }),
    enabled: !!id,
  });

  useEffect(() => { if (error) toast.error('Failed to load service'); }, [error]);
  if (error) return <div className="py-10 text-center text-muted-foreground">Failed to load service</div>;
  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">Service not found</div>;

  const s = data as Service;

  return (
    <div>
      <Link href="/admin/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </Link>
      <h1 className="text-3xl font-bold mb-8">Service Detail</h1>
      <Card>
        <CardHeader><CardTitle>{s.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Slug:</span> <span className="text-muted-foreground">{s.slug}</span></div>
            <div><span className="font-medium">Status:</span> <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge></div>
            <div><span className="font-medium">Category:</span> <span className="text-muted-foreground">{s.category_title || '-'}</span></div>
            <div><span className="font-medium">Order:</span> <span className="text-muted-foreground">{s.order}</span></div>
            <div><span className="font-medium">Featured:</span> <span className="text-muted-foreground">{s.is_featured ? 'Yes' : 'No'}</span></div>
            <div><span className="font-medium">Created:</span> <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span></div>
          </div>
          {s.features?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {s.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

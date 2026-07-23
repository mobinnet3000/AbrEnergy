'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await axiosInstance.get('/categories/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error('Failed to load categories'); }, [error]);
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No categories found</p>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Categories ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 px-2">Title</th><th className="py-3 px-2">Slug</th><th className="py-3 px-2">Parent</th><th className="py-3 px-2">Status</th></tr></thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="border-b">
                      <td className="py-3 px-2 font-medium">{item.title as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.slug as string}</td>
                      <td className="py-3 px-2 text-muted-foreground">{(item as { parent?: string | null }).parent || '-'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={(item as { is_active: boolean }).is_active ? 'default' : 'secondary'}>
                          {(item as { is_active: boolean }).is_active ? 'Active' : 'Inactive'}
                        </Badge>
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

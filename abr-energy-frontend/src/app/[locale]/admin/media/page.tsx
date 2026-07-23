'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AdminMediaPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => {
      const res = await axiosInstance.get('/media/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error('Failed to load media'); }, [error]);
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Media</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No media found</p>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Media ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item: Record<string, unknown>) => (
                <div key={item.id as string} className="border rounded-lg p-4">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    {(item as { file?: string }).file ? (
                      <img src={(item as { file: string }).file} alt={item.name as string} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-xs">No preview</span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{item.name as string}</p>
                  <p className="text-xs text-muted-foreground truncate">{(item as { file_type?: string }).file_type || 'Unknown'}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{(item as { size?: number }).size !== undefined ? formatSize((item as { size: number }).size) : '-'}</span>
                    <span className="text-xs text-muted-foreground">{new Date((item as { uploaded_at?: string }).uploaded_at || (item as { created_at?: string }).created_at || '').toLocaleDateString()}</span>
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


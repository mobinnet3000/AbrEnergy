'use client';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import type { GalleryImage } from '@/types';

export default function GalleryPage() {
  const { data, isLoading } = useQuery<GalleryImage[] | { results: GalleryImage[] }>({
    queryKey: ['gallery'],
    queryFn: () => axiosInstance.get('/gallery/').then((r) => r.data),
  });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const images: GalleryImage[] = Array.isArray(data)
    ? data
    : (data as { results: GalleryImage[] })?.results ?? [];

  if (!images.length) return <div className="py-20 text-center text-muted-foreground">No images in gallery</div>;

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Photo <span className="text-green-600">Gallery</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Browse our project installations and solar energy solutions</p>
        </div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img) => (
            <div key={img.id} className="break-inside-avoid rounded-xl overflow-hidden bg-card ring-1 ring-foreground/10">
              <img src={img.image_url} alt={img.alt_text || img.title} className="w-full object-cover" />
              <div className="p-3">
                <p className="font-medium text-sm truncate">{img.title}</p>
                {img.category_title && (
                  <p className="text-xs text-muted-foreground mt-0.5">{img.category_title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


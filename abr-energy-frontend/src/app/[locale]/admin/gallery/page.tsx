'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGallery } from '@/hooks/use-api';
import { useLocale } from '@/i18n';

export default function AdminGalleryPage() {
  const { t } = useLocale();
  const { data, isLoading } = useGallery();
  const images = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.gallery')}</h1>
      {isLoading ? <div className="text-center py-10 text-muted-foreground">{t('common.loading')}</div> : (
        <Card>
          <CardHeader><CardTitle>{t('admin.all_images')} ({images.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {images.map((img: Record<string, unknown>) => (
                <div key={img.id as string} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {(img as { image_url?: string }).image_url ? (
                    <img src={(img as { image_url: string }).image_url} alt={(img as { title: string }).title || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{t('admin.no_image')}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


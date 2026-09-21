'use client';
import { ArrowUp, ArrowDown, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MediaUpload } from '@/components/shared/media-upload';
import { useLocale } from '@/i18n';
import { formKey, type ProductImageFormItem } from '@/lib/product-form';

interface ProductMediaManagerProps {
  images: ProductImageFormItem[];
  onChange: (images: ProductImageFormItem[]) => void;
  errors?: string[];
}

function renumber(images: ProductImageFormItem[]): ProductImageFormItem[] {
  return images.map((im, i) => ({ ...im, sort_order: i }));
}

/** Gallery manager: multi-upload, cover choice, accessible ordering, alt/caption. */
export function ProductMediaManager({ images, onChange, errors }: ProductMediaManagerProps) {
  const { t } = useLocale();

  const addImage = (url: string, fileId?: string) => {
    if (!fileId) return;
    onChange(renumber([
      ...images,
      {
        key: formKey('img'),
        media_file: fileId,
        url,
        sort_order: images.length,
        is_cover: images.length === 0,
        alt_text: '',
        caption: '',
      },
    ]));
  };

  const move = (key: string, dir: -1 | 1) => {
    const idx = images.findIndex((im) => im.key === key);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    onChange(renumber(copy));
  };

  const patch = (key: string, p: Partial<ProductImageFormItem>) => {
    onChange(images.map((im) => (im.key === key ? { ...im, ...p } : im)));
  };

  const setCover = (key: string) => {
    onChange(images.map((im) => ({ ...im, is_cover: im.key === key })));
  };

  const remove = (key: string) => {
    const rest = renumber(images.filter((im) => im.key !== key));
    if (rest.length > 0 && !rest.some((im) => im.is_cover)) rest[0].is_cover = true;
    onChange(rest);
  };

  return (
    <div className="space-y-4">
      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.media_empty')}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {images.map((im, i) => (
          <div key={im.key} className="rounded-lg border p-3 space-y-2 bg-muted/10">
            <div className="relative aspect-video rounded-md overflow-hidden border bg-muted/30">
              {im.url ? (
                <img src={im.url} alt={im.alt_text || `product-${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">—</div>
              )}
              {im.is_cover && (
                <Badge className="absolute top-2 start-2 gap-1">
                  <Star className="h-3 w-3" aria-hidden="true" />{t('admin.media_cover')}
                </Badge>
              )}
            </div>
            <Input
              value={im.alt_text}
              onChange={(e) => patch(im.key, { alt_text: e.target.value })}
              placeholder={t('admin.media_alt')}
              dir="auto"
              aria-label={t('admin.media_alt')}
            />
            <Input
              value={im.caption}
              onChange={(e) => patch(im.key, { caption: e.target.value })}
              placeholder={t('admin.media_caption')}
              dir="auto"
              aria-label={t('admin.media_caption')}
            />
            <div className="flex items-center gap-1 flex-wrap">
              {!im.is_cover && (
                <Button type="button" variant="outline" size="sm" onClick={() => setCover(im.key)}>
                  <Star className="h-3.5 w-3.5 me-1" />{t('admin.media_set_cover')}
                </Button>
              )}
              <Button
                type="button" variant="ghost" size="icon-xs"
                onClick={() => move(im.key, -1)} disabled={i === 0}
                aria-label={t('admin.media_reorder_up')} title={t('admin.media_reorder_up')}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon-xs"
                onClick={() => move(im.key, 1)} disabled={i === images.length - 1}
                aria-label={t('admin.media_reorder_down')} title={t('admin.media_reorder_down')}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon-xs"
                onClick={() => remove(im.key)}
                aria-label={t('admin.media_remove')} title={t('admin.media_remove')}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <MediaUpload onUpload={addImage} label={t('admin.media_upload_images')} subfolder="products" />
      {errors && errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

'use client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MediaUpload } from '@/components/shared/media-upload';
import { useLocale } from '@/i18n';
import { ROBOT_OPTIONS, type ProductFormState } from '@/lib/product-form';

interface ProductSeoFieldsProps {
  form: ProductFormState;
  set: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
  originalSlug?: string;
}

/** SEO card — same field set as the category CMS (translated meta + OG + robots). */
export function ProductSeoFields({ form, set, originalSlug }: ProductSeoFieldsProps) {
  const { t } = useLocale();
  const slugChanged = originalSlug != null && originalSlug !== '' && form.slug.trim() !== '' && form.slug.trim() !== originalSlug;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">{t('admin.seo_title')}</label>
            <span className="text-xs text-muted-foreground" dir="ltr">{form.seo_title.length}/60</span>
          </div>
          <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} dir="auto" maxLength={200} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">{t('admin.seo_description')}</label>
            <span className="text-xs text-muted-foreground" dir="ltr">{form.seo_description.length}/160</span>
          </div>
          <Textarea value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} dir="auto" rows={2} maxLength={500} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.canonical_url')}</label>
          <Input value={form.canonical_url} onChange={(e) => set('canonical_url', e.target.value)} dir="ltr" placeholder="https://…" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.robots')}</label>
          <Select value={form.robots} onValueChange={(v: string | null) => set('robots', v || 'index_follow')}>
            <SelectTrigger className="w-full" dir="ltr"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROBOT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.og_title')}</label>
        <Input value={form.og_title} onChange={(e) => set('og_title', e.target.value)} dir="auto" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.og_description')}</label>
        <Textarea value={form.og_description} onChange={(e) => set('og_description', e.target.value)} dir="auto" rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.og_image')}</label>
        <MediaUpload
          onUpload={(url, fid) => { set('og_image_url', url); set('og_image_id', fid || ''); }}
          currentImage={form.og_image_url}
          label={t('admin.og_image')}
          subfolder="products"
        />
      </div>
      {slugChanged && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="note">
          {t('admin.seo_slug_warning')}
        </p>
      )}
    </div>
  );
}

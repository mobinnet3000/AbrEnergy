'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { MediaUpload } from '@/components/shared/media-upload';
import { useCreateAdminProductCategory, useAdminProductCategories } from '@/hooks/use-api';
import { useLocale } from '@/i18n';

const ROBOT_OPTIONS = [
  { value: 'index_follow', label: 'Index, Follow' },
  { value: 'noindex_follow', label: 'No Index, Follow' },
  { value: 'index_nofollow', label: 'Index, No Follow' },
  { value: 'noindex_nofollow', label: 'No Index, No Follow' },
];

interface FormState {
  title: string;
  slug: string;
  description: string;
  content: string;
  parent: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  cover_id: string;
  cover_url: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image_id: string;
  og_image_url: string;
}

const emptyForm: FormState = {
  title: '', slug: '', description: '', content: '', parent: '', sort_order: 0,
  is_active: true, is_featured: false, cover_id: '', cover_url: '',
  seo_title: '', seo_description: '', canonical_url: '', robots: 'index_follow',
  og_title: '', og_description: '', og_image_id: '', og_image_url: '',
};

export default function NewCategoryPage() {
  const { t } = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const createMut = useCreateAdminProductCategory();
  const { data: parentData } = useAdminProductCategories({ page_size: '200' });

  const parents: Array<{ id: string; title: string; parent: string | null }> = useMemo(() => {
    const list = Array.isArray(parentData?.results) ? parentData.results : Array.isArray(parentData) ? parentData : [];
    return list.filter((r: { parent: string | null }) => !r.parent);
  }, [parentData]);

  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    parent: search.get('parent') || '',
  }));
  const [dirty, setDirty] = useState(false);
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => { setForm((p) => ({ ...p, [key]: val })); setDirty(true); };

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t('admin.required_field'));
      return;
    }
    createMut.mutate(
      {
        translations: { fa: { title: form.title.trim(), slug: form.slug || undefined, description: form.description, content: form.content } },
        slug: form.slug || form.title.trim(),
        parent: form.parent || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
        is_featured: form.is_featured,
        cover: form.cover_id || null,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        canonical_url: form.canonical_url,
        robots: form.robots,
        og_title: form.og_title,
        og_description: form.og_description,
        og_image: form.og_image_id || null,
      },
      {
        onSuccess: () => { toast.success(t('admin.category_created')); router.push('/admin/products/categories'); },
        onError: () => { toast.error(t('admin.category_save_failed')); },
      },
    );
  };

  return (
    <div>
      <Link href="/admin/products/categories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 ms-0 me-2" />{t('admin.back_to_categories')}
      </Link>
      <PageHeader title={t('admin.create_category')} description={t('admin.main_info')} />

      <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.main_info')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.title_fa')} *</label>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.slug_field')}</label>
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} dir="ltr" />
                <p className="text-xs text-muted-foreground mt-1">{t('admin.slug_hint')}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.short_desc_fa')}</label>
                <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.full_content_fa')}</label>
                <RichTextEditor content={form.content} onChange={(html) => set('content', html)} dir="rtl" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('admin.seo_section')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.seo_title')}</label>
                <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.seo_description')}</label>
                <Textarea value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.canonical_url')}</label>
                <Input value={form.canonical_url} onChange={(e) => set('canonical_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.robots')}</label>
                <Select value={form.robots} onValueChange={(v: string | null) => v && set('robots', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROBOT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.og_title')}</label>
                <Input value={form.og_title} onChange={(e) => set('og_title', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.og_description')}</label>
                <Textarea value={form.og_description} onChange={(e) => set('og_description', e.target.value)} dir="auto" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.og_image')}</label>
                <MediaUpload
                  onUpload={(url, fid) => { set('og_image_url', url); set('og_image_id', fid || ''); }}
                  currentImage={form.og_image_url}
                  label={t('admin.og_image')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.status')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('admin.is_active')}</label>
                <button type="button" role="switch" aria-checked={form.is_active}
                  onClick={() => set('is_active', !form.is_active)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_active ? 'bg-primary' : 'bg-input'}`}>
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('admin.is_featured')}</label>
                <button type="button" role="switch" aria-checked={form.is_featured}
                  onClick={() => set('is_featured', !form.is_featured)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_featured ? 'bg-primary' : 'bg-input'}`}>
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.is_featured ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.sort_order')}</label>
                <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} min={0} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.parent_category')}</label>
                <Select value={form.parent || 'none'} onValueChange={(v: string | null) => set('parent', v === 'none' ? '' : (v || ''))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t('admin.parent_category')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('admin.no_parent')}</SelectItem>
                    {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('admin.cover')}</CardTitle></CardHeader>
            <CardContent>
              <MediaUpload
                onUpload={(url, fid) => { set('cover_url', url); set('cover_id', fid || ''); }}
                currentImage={form.cover_url}
                label={t('admin.cover')}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 mt-6 -mx-4 md:-mx-8 px-4 md:px-8 flex justify-end gap-3 z-10">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/products/categories')}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={createMut.isPending}>
          {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
          {t('admin.save')}
        </Button>
      </div>
      </form>
    </div>
  );
}

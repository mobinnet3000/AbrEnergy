'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { MediaUpload } from '@/components/shared/media-upload';
import Link from 'next/link';
import { useLocale } from '@/i18n';

const locales = [
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

interface FormData {
  status: string;
  category: string;
  is_featured: boolean;
  publish_date: string;
  cover_image_url: string;
  tags: string;
  title_fa: string; short_description_fa: string; content_fa: string;
  title_ar: string; short_description_ar: string; content_ar: string;
  title_en: string; short_description_en: string; content_en: string;
}

export default function AdminArticleEditPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-article-edit', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/articles/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  const initialForm: FormData = {
    status: 'draft', category: '', is_featured: false, publish_date: '', cover_image_url: '', tags: '',
    title_fa: '', short_description_fa: '', content_fa: '',
    title_ar: '', short_description_ar: '', content_ar: '',
    title_en: '', short_description_en: '', content_en: '',
  };

  const [edits, setEdits] = useState<Partial<FormData>>({});
  const form = useMemo<FormData>(() => {
    if (!data) return initialForm;
    return {
      status: data.status || 'draft',
      category: data.category || '',
      is_featured: data.is_featured || false,
      publish_date: data.publish_date ? data.publish_date.slice(0, 10) : '',
      cover_image_url: data.cover_image_url || '',
      tags: Array.isArray(data.tags) ? data.tags.map((t: { id?: string; title?: string }) => t.title || t).join(', ') : '',
      title_fa: data.title_fa || '', short_description_fa: data.short_description_fa || '', content_fa: data.content_fa || '',
      title_ar: data.title_ar || '', short_description_ar: data.short_description_ar || '', content_ar: data.content_ar || '',
      title_en: data.title_en || '', short_description_en: data.short_description_en || '', content_en: data.content_en || '',
      ...edits,
    };
  }, [data, edits]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (error) toast.error(t('admin.failed_load_articles')); }, [error]);

  const update = (field: string, value: unknown) => setEdits((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/admin/articles/${id}/`, form);
      toast.success('Article updated');
      router.push('/admin/articles');
    } catch {
      toast.error('Failed to update article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/articles/${id}/`);
      toast.success('Article deleted');
      router.push('/admin/articles');
    } catch {
      toast.error('Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>;
  if (error) return <div className="py-10 text-center text-destructive">{t('admin.failed_load_articles')}</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">{t('admin.article_not_found')}</div>;

  return (
    <div>
      <Link href="/admin/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('admin.back_to_articles')}
      </Link>
      <PageHeader title={t('admin.edit_article')}>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            {t('common.delete')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {t('admin.save_changes')}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{t('admin.content')}</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="fa">
                <TabsList className="mb-4">
                  {locales.map((l) => <TabsTrigger key={l.value} value={l.value}>{l.label}</TabsTrigger>)}
                </TabsList>
                {locales.map((l) => (
                  <TabsContent key={l.value} value={l.value} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title ({l.label})</label>
                      <Input value={form[`title_${l.value}` as keyof FormData] as string} onChange={(e) => update(`title_${l.value}`, e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Short Description ({l.label})</label>
                      <Textarea value={form[`short_description_${l.value}` as keyof FormData] as string} onChange={(e) => update(`short_description_${l.value}`, e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Content ({l.label})</label>
                      <RichTextEditor
                        content={form[`content_${l.value}` as keyof FormData] as string}
                        onChange={(html) => update(`content_${l.value}`, html)}
                        dir={l.value === 'en' ? 'ltr' : 'rtl'}
                        placeholder="Write article content..."
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.settings')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.status')}</label>
                <Select value={form.status} onValueChange={(v) => v && update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('admin.draft')}</SelectItem>
                    <SelectItem value="published">{t('admin.published')}</SelectItem>
                    <SelectItem value="scheduled">{t('admin.scheduled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.category')}</label>
                <CategorySelect value={form.category} onChange={(v) => v && update('category', v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
                <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.publish_date')}</label>
                <Input type="date" value={form.publish_date} onChange={(e) => update('publish_date', e.target.value)} />
              </div>
              <div>
                <MediaUpload
                  onUpload={(url) => update('cover_image_url', url)}
                  currentImage={form.cover_image_url}
                  label={t('admin.cover_image')}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_featured} onCheckedChange={(v) => update('is_featured', v)} />
                {t('admin.featured')}
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosInstance.get('/categories/');
      return res.data?.results ?? [];
    },
  });
  const cats = Array.isArray(data) ? data : [];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
      <SelectContent>
        {cats.map((c: { id: string; title: string }) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

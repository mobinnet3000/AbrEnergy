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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { MediaUpload } from '@/components/shared/media-upload';
import { ChooseMediaButton } from '@/components/shared/media-picker-dialog';
import { useDirtyNavigationGuard } from '@/hooks/use-dirty-navigation-guard';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityCategorySelect } from '@/components/admin/entity-category-select';
import {
  ARTICLE_TRANSLATION_FIELDS,
  buildArticlePayload,
  contentTranslationsFromDetail,
  createTranslationMap,
  relationId,
  translationLocalesFromDetail,
  type ContentLocale,
  type TranslationMap,
} from '@/lib/cms-form-contracts';
import { contentSaveErrorMessage } from '@/lib/cms-error-toast';
import Link from 'next/link';
import { useLocale } from '@/i18n';

const locales: { value: ContentLocale; label: string }[] = [
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
  // Phase 9.5 — additive MediaFile reference (legacy URL-only rows keep
  // rendering via `cover_image_url`; `''` serializes as null on save).
  cover_image: string;
  tags: string;
  translations: TranslationMap;
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

  const [initialForm] = useState<FormData>(() => ({
    status: 'draft', category: '', is_featured: false, publish_date: '', cover_image_url: '', cover_image: '', tags: '',
    translations: createTranslationMap(ARTICLE_TRANSLATION_FIELDS),
  }));

  const [edits, setEdits] = useState<Partial<FormData>>({});
  const form = useMemo<FormData>(() => {
    if (!data) return initialForm;
    return {
      status: data.status || 'draft',
      category: relationId(data.category),
      is_featured: data.is_featured || false,
      publish_date: data.publish_date ? data.publish_date.slice(0, 10) : '',
      cover_image_url: data.cover_image_url || '',
      cover_image: data.cover_image || '',
      tags: Array.isArray(data.tags) ? data.tags.map((t: { id?: string; title?: string }) => t.title || t).join(', ') : '',
      translations: contentTranslationsFromDetail(data, ARTICLE_TRANSLATION_FIELDS),
      ...edits,
    };
  }, [data, edits, initialForm]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Phase 9.2 — dirty navigation guard over the EXISTING `edits` state (same
  // semantics as Homepage Studio: any pending edit = dirty; failed saves
  // never touch `edits`, so dirty is preserved for retry). Save/delete
  // navigations run directly (persisted / intentionally discarded).
  const isDirty = Object.keys(edits).length > 0;
  const guard = useDirtyNavigationGuard({ isDirty });
  const backHref = '/admin/articles';

  useEffect(() => { if (error) toast.error(t('admin.failed_load_articles')); }, [error, t]);

  const update = (field: string, value: unknown) => setEdits((prev) => ({ ...prev, [field]: value }));

  const updateTranslation = (locale: ContentLocale, field: string, value: string) => {
    setEdits((prev) => {
      const current = prev.translations ?? form.translations;
      return {
        ...prev,
        translations: {
          ...current,
          [locale]: { ...current[locale], [field]: value },
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(
        `/admin/articles/${id}/`,
        buildArticlePayload(form, translationLocalesFromDetail(data)),
      );
      toast.success(t('admin.article_updated'));
      router.push('/admin/articles');
    } catch (error) {
      toast.error(contentSaveErrorMessage(t('admin.article_save_failed'), error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.delete_article_confirm'))) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/articles/${id}/`);
      toast.success(t('admin.article_deleted'));
      router.push('/admin/articles');
    } catch (error) {
      toast.error(contentSaveErrorMessage(t('admin.article_delete_failed'), error));
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>;
  if (error) return <div className="py-10 text-center text-destructive">{t('admin.failed_load_articles')}</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">{t('admin.article_not_found')}</div>;

  return (
    <div>
      <Link
        href="/admin/articles"
        onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
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
                      <label className="text-sm font-medium mb-1 block">{t('admin.title_label')} ({l.label})</label>
                      <Input value={form.translations[l.value].title} onChange={(e) => updateTranslation(l.value, 'title', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('admin.slug')} ({l.label})</label>
                      <Input value={form.translations[l.value].slug} onChange={(e) => updateTranslation(l.value, 'slug', e.target.value)} dir={l.value === 'en' ? 'ltr' : 'rtl'} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('admin.short_description')} ({l.label})</label>
                      <Textarea value={form.translations[l.value].short_description} onChange={(e) => updateTranslation(l.value, 'short_description', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('admin.content')} ({l.label})</label>
                      <RichTextEditor
                        content={form.translations[l.value].content}
                        onChange={(html) => updateTranslation(l.value, 'content', html)}
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
                <EntityCategorySelect kind="article" value={form.category} onChange={(v) => update('category', v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.tags')} (comma separated)</label>
                <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.publish_date')}</label>
                <Input type="date" value={form.publish_date} onChange={(e) => update('publish_date', e.target.value)} />
              </div>
              <div>
                <div className="flex items-start gap-2 flex-wrap">
                  <MediaUpload
                    key={form.cover_image_url}
                    onUpload={(url, fid) => { update('cover_image_url', url); update('cover_image', fid || ''); }}
                    currentImage={form.cover_image_url}
                    label={t('admin.cover_image')}
                  />
                  <ChooseMediaButton
                    mode="image"
                    onSelect={(picked) => {
                      const first = picked[0];
                      if (!first) return;
                      update('cover_image_url', first.url);
                      update('cover_image', first.id);
                    }}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_featured} onCheckedChange={(v) => update('is_featured', v)} />
                {t('admin.featured')}
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase 9.2 (8.3 mechanism) — single dirty-navigation confirmation. */}
      <ConfirmDialog
        open={guard.dialogOpen}
        onOpenChange={guard.handleDialogOpenChange}
        title={t('admin.unsaved_changes_title')}
        description={t('admin.unsaved_changes')}
        confirmText={t('admin.unsaved_changes_leave')}
        cancelText={t('admin.unsaved_changes_stay')}
        onConfirm={guard.confirmLeave}
        variant="default"
      />
    </div>
  );
}

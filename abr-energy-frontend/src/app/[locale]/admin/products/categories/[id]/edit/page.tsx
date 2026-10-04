'use client';
import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PageLoading, ErrorState } from '@/components/shared';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { MediaUpload } from '@/components/shared/media-upload';
import { ChooseMediaButton } from '@/components/shared/media-picker-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useAdminProductCategory, useAdminProductCategories,
  useUpdateAdminProductCategory, useDeleteAdminProductCategory,
} from '@/hooks/use-api';
import { useDirtyNavigationGuard } from '@/hooks/use-dirty-navigation-guard';
import { useLocale } from '@/i18n';
import { previewApi } from '@/api';
import { buildCategoryPreviewUrl } from '@/lib/preview';
import { flattenNormalizedError, normalizeApiError, summarizeNormalizedError } from '@/lib/api-errors';
import type { ProductCategoryDetail } from '@/types';

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
  meta_title: string;
  meta_description: string;
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

function toForm(d: ProductCategoryDetail): FormState {
  return {
    title: d.title || '', slug: d.slug || '', description: d.description || '', content: d.content || '',
    meta_title: d.meta_title || '', meta_description: d.meta_description || '',
    parent: d.parent || '', sort_order: d.sort_order ?? 0,
    is_active: d.is_active, is_featured: d.is_featured,
    cover_id: d.cover || '', cover_url: d.cover_image_url || '',
    seo_title: d.seo_title || '', seo_description: d.seo_description || '',
    canonical_url: d.canonical_url || '', robots: d.robots || 'index_follow',
    og_title: d.og_title || '', og_description: d.og_description || '',
    og_image_id: d.og_image || '', og_image_url: d.og_image_url || '',
  };
}

export default function EditCategoryPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const updateMut = useUpdateAdminProductCategory();
  const deleteMut = useDeleteAdminProductCategory();
  const { data, isLoading, error, refetch } = useAdminProductCategory(id);
  const { data: parentData } = useAdminProductCategories({ page_size: '100' });

  const parents: Array<{ id: string; title: string; parent: string | null }> = (() => {
    const list = Array.isArray(parentData?.results) ? parentData.results : Array.isArray(parentData) ? parentData : [];
    return list.filter((r: { id: string; parent: string | null }) => !r.parent && r.id !== id);
  })();

  const initial: FormState | null = useMemo(
    () => (data ? toForm(data as ProductCategoryDetail) : null),
    [data],
  );
  const [edits, setEdits] = useState<Partial<FormState>>({});
  const [showDelete, setShowDelete] = useState(false);
  const [isPreviewIssuing, setIsPreviewIssuing] = useState(false);
  // Phase 8.5 (BUG-06) — normalized save-error summary (inline + toast).
  // Separate state: error branches never touch `edits`, so failed saves
  // keep the form dirty by construction.
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const form: FormState | null = useMemo(
    () => (initial ? { ...initial, ...edits } : null),
    [initial, edits],
  );
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setEdits((p) => ({ ...p, [key]: val }));

  // Phase 8.3 — dirty navigation guard over the EXISTING initial-vs-form
  // comparison (no second dirty system). beforeunload is armed only while
  // dirty (the previous listener was attached even on a clean form);
  // breadcrumb/back/Cancel SPA navigations prompt while dirty. Save/delete
  // success navigations run directly: save leaves nothing unsaved, delete
  // is an intentional discard of an entity that no longer exists.
  const dirty = !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial);
  const guard = useDirtyNavigationGuard({ isDirty: dirty });
  const backHref = '/admin/products/categories';

  if (isLoading) return <PageLoading />;
  if (error || !form || !initial) {
    return (
      <ErrorState
        title={t('admin.not_found')}
        message={t('admin.server_connection_failed')}
        action={{ label: t('admin.try_again'), onClick: () => refetch() }}
      />
    );
  }

  const originalSlug = (data as ProductCategoryDetail)?.slug || '';
  const slugChanged = form.slug !== originalSlug;

  const buildPayload = () => ({
    translations: { fa: { title: form.title.trim(), slug: form.slug || undefined, description: form.description, content: form.content, meta_title: form.meta_title, meta_description: form.meta_description } },
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
  });

  // Phase 8.5 (BUG-06): one shared normalization path. Nested backend
  // errors surface with field context instead of a bare generic toast.
  const handleSaveError = (err: unknown) => {
    const normalized = normalizeApiError(err);
    if (normalized.kind === 'permission') {
      toast.error(t('admin.permission_denied'));
      setSaveErrors(flattenNormalizedError(normalized));
      return;
    }
    if (normalized.kind === 'network' || normalized.kind === 'server') {
      toast.error(t('admin.server_connection_failed'));
      setSaveErrors([]);
      return;
    }
    const details = flattenNormalizedError(normalized).slice(0, 8);
    setSaveErrors(details);
    toast.error(summarizeNormalizedError(normalized) ?? t('admin.category_save_failed'));
  };

  const submitWithMode = (mode: 'save' | 'continue') => {
    if (!form.title.trim()) {
      toast.error(t('admin.required_field'));
      return;
    }
    setSaveErrors([]);
    updateMut.mutate(
      { id, data: buildPayload() },
      {
        onSuccess: () => {
          toast.success(t('admin.category_updated'));
          if (mode === 'continue') {
            // Phase 9.1 Save & Continue: remain on this editor and
            // reconcile with the server. The update hook already
            // invalidates the detail query; the explicit refetch refreshes
            // the baseline so the dirty comparison resets (failed saves
            // never reach this branch, so edits stay dirty on error).
            refetch();
            return;
          }
          router.push('/admin/products/categories');
        },
        onError: handleSaveError,
      },
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitWithMode('save');
  };

  const onDelete = () => {
    deleteMut.mutate(id, {
      onSuccess: () => { toast.success(t('admin.category_deleted')); router.push('/admin/products/categories'); },
      onError: () => { toast.error(t('admin.category_save_failed')); },
    });
  };

  // Phase 8.2 — saved-state preview: issue a short-lived signed token
  // (IsContentManager only) and open the isolated preview route in a new
  // tab. Unsaved edits are NOT previewed (no draft persistence — save
  // first). Duplicate issuance is blocked while a request is in flight.
  const onPreview = async () => {
    if (isPreviewIssuing) return;
    setIsPreviewIssuing(true);
    try {
      const res = await previewApi.issue({ resource_type: 'category', resource_id: id, locale: 'fa' });
      window.open(buildCategoryPreviewUrl(res.token, id, 'fa'), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(t('admin.preview_failed'));
    } finally {
      setIsPreviewIssuing(false);
    }
  };

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link
          href="/admin"
          className="hover:text-foreground"
          onClick={(e) => guard.guardLinkClick(e, '/admin', () => router.push('/admin'))}
        >{t('admin.dashboard')}</Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/admin/products/categories"
          className="hover:text-foreground"
          onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        >{t('admin.product_categories')}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground truncate max-w-[200px]">{form.title || originalSlug}</span>
      </nav>
      <PageHeader title={t('admin.edit_category')} description={form.title}>
        <Badge variant={form.is_active ? 'default' : 'secondary'}>{t(form.is_active ? 'admin.active' : 'admin.inactive')}</Badge>
        {form.is_featured && <Badge variant="outline">{t('admin.featured')}</Badge>}
        {/* Phase 8.2 — saved-state preview: secondary to Save, never
            auto-saves, previews the persisted category only. */}
        <Button type="button" variant="outline" size="sm" disabled={updateMut.isPending || isPreviewIssuing} onClick={onPreview}>
          {isPreviewIssuing ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <ExternalLink className="h-4 w-4 me-1" />}{t('admin.category_preview')}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4 me-1" />{t('admin.delete')}
        </Button>
      </PageHeader>

      {/* Phase 8.5 (BUG-06) — normalized save errors with field context.
          Plain text list (never color-only, `role="alert"`); rendering it
          never touches `edits`, so the form stays dirty for retry. */}
      {saveErrors.length > 0 && (
        <div
          id="cms-form-errors"
          role="alert"
          className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
        >
          <p className="text-sm font-semibold">{t('admin.form_errors_present')}</p>
          <ul className="mt-1 space-y-1 text-sm text-destructive">
            {saveErrors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.main_info')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.title_fa')} *</label>
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  dir="auto"
                  aria-invalid={saveErrors.length > 0}
                  aria-describedby={saveErrors.length > 0 ? 'cms-form-errors' : undefined}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.slug_field')}</label>
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} dir="ltr" />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('admin.slug_hint')}</p>
                {slugChanged && <p className="text-xs text-amber-600 dark:text-amber-400">{t('admin.slug_hint')}</p>}
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
                <div className="flex items-start gap-2 flex-wrap">
                  <MediaUpload
                    key={form.og_image_url}
                    onUpload={(url, fid) => { set('og_image_url', url); set('og_image_id', fid || ''); }}
                    currentImage={form.og_image_url}
                    label={t('admin.og_image')}
                  />
                  <ChooseMediaButton
                    mode="image"
                    onSelect={(picked) => {
                      const first = picked[0];
                      if (!first) return;
                      set('og_image_url', first.url);
                      set('og_image_id', first.id);
                    }}
                  />
                </div>
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
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ transform: form.is_active ? 'translateX(1rem)' : 'translateX(0.125rem)' }} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('admin.is_featured')}</label>
                <button type="button" role="switch" aria-checked={form.is_featured}
                  onClick={() => set('is_featured', !form.is_featured)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_featured ? 'bg-primary' : 'bg-input'}`}>
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform" style={{ transform: form.is_featured ? 'translateX(1rem)' : 'translateX(0.125rem)' }} />
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
              <div className="flex items-start gap-2 flex-wrap">
                <MediaUpload
                  key={form.cover_url}
                  onUpload={(url, fid) => { set('cover_url', url); set('cover_id', fid || ''); }}
                  currentImage={form.cover_url}
                  label={t('admin.cover')}
                />
                <ChooseMediaButton
                  mode="image"
                  onSelect={(picked) => {
                    const first = picked[0];
                    if (!first) return;
                    set('cover_url', first.url);
                    set('cover_id', first.id);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 mt-6 -mx-4 md:-mx-8 px-4 md:px-8 flex justify-between gap-3 z-10">
        <Link
          href="/admin/products/categories"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        >
          <ArrowLeft className="h-4 w-4 me-1" />{t('admin.back_to_categories')}
        </Link>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => guard.requestNavigation(backHref, () => router.push(backHref))}>{t('common.cancel')}</Button>
          <Button type="button" variant="outline" disabled={updateMut.isPending} onClick={() => submitWithMode('continue')}>
            {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
            {t('admin.save_continue')}
          </Button>
          <Button type="submit" disabled={updateMut.isPending}>
            {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
            {t('admin.save')}
          </Button>
        </div>
      </div>
      </form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={t('admin.delete_category_title')}
        description={t('admin.delete_category_desc')}
        confirmText={t('admin.delete')}
        cancelText={t('common.cancel')}
        onConfirm={onDelete}
        loading={deleteMut.isPending}
      />

      {/* Phase 8.3 — single dirty-navigation confirmation (Stay/Leave). */}
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

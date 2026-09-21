'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader, PageLoading, ErrorState } from '@/components/shared';
import { MediaUpload } from '@/components/shared/media-upload';
import { useAdminHomepage, useUpdateAdminHomepage, usePublicProductCategories, useServices } from '@/hooks/use-api';
import { articlesApi, productsApi, projectsApi } from '@/api';
import { flattenCategoryTree } from '@/components/products/public';
import {
  HomepageRelationPicker,
  HomepageSectionCard,
  HomepageVisualsEditor,
  type PickerOption,
} from '@/components/homepage';
import { useLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { canManageHomepage } from '@/lib/admin-permissions';
import {
  buildHomepagePayload,
  homepageToForm,
  mapHomepageErrors,
  type HomepageFormState,
  type HomepageRelationItem,
  type HomepageVisualItem,
} from '@/lib/homepage-form';
import type { HomepageAdminPayload, HomepageSection } from '@/types';

const ROBOT_OPTIONS = [
  { value: 'index_follow', label: 'Index, Follow' },
  { value: 'noindex_follow', label: 'No Index, Follow' },
  { value: 'index_nofollow', label: 'Index, No Follow' },
  { value: 'noindex_nofollow', label: 'No Index, No Follow' },
];

function asRows(data: unknown): Record<string, string>[] {
  if (Array.isArray(data)) return data as Record<string, string>[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: Record<string, string>[] }).results;
  }
  return [];
}

function CtaFields({
  labelKey,
  label,
  url,
  enabled,
  onLabel,
  onUrl,
  onEnabled,
  hideEnabled,
  t,
}: {
  labelKey: string;
  label: string;
  url: string;
  enabled: boolean;
  onLabel: (v: string) => void;
  onUrl: (v: string) => void;
  onEnabled: (v: boolean) => void;
  hideEnabled?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold flex-1">{t(labelKey)}</p>
        {!hideEnabled && (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t(labelKey)}
            onClick={() => onEnabled(!enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enabled ? 'bg-primary' : 'bg-input'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
            />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.homepage_cta_label')}</label>
          <Input value={label} onChange={(e) => onLabel(e.target.value)} dir="auto" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.homepage_cta_url')}</label>
          <Input value={url} onChange={(e) => onUrl(e.target.value)} dir="ltr" placeholder="/products" />
        </div>
      </div>
    </div>
  );
}

export default function HomepageStudioPage() {
  const { t } = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canEdit = canManageHomepage(user?.role);
  const updateMut = useUpdateAdminHomepage();
  const { data, isLoading, error, refetch } = useAdminHomepage();
  const { data: catTree } = usePublicProductCategories();
  const { data: servicesData } = useServices();

  const initial: HomepageFormState | null = useMemo(
    () => (data ? homepageToForm(data as HomepageAdminPayload) : null),
    [data],
  );
  const [edits, setEdits] = useState<Partial<HomepageFormState>>({});
  const form: HomepageFormState | null = useMemo(
    () => (initial ? { ...initial, ...edits } : null),
    [initial, edits],
  );
  const set = useCallback(
    <K extends keyof HomepageFormState>(key: K, val: HomepageFormState[K]) =>
      setEdits((p) => ({ ...p, [key]: val })),
    [],
  );
  const dirty = !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // ── picker search (public list endpoints — same titles the site shows) ──
  const searchProducts = useCallback(async (q: string): Promise<PickerOption[]> => {
    const rows = asRows(await productsApi.list({ search: q, page_size: '10' }));
    return rows.map((p) => ({ id: String(p.id), title: String(p.title ?? ''), subtitle: String(p.sku ?? '') }));
  }, []);

  const searchCategories = useCallback(
    async (q: string): Promise<PickerOption[]> => {
      const tree = catTree as unknown;
      const roots = Array.isArray(tree)
        ? tree
        : Array.isArray((tree as { results?: unknown })?.results)
          ? (tree as { results: unknown[] }).results
          : [];
      const needle = q.trim().toLowerCase();
      return flattenCategoryTree(roots as Parameters<typeof flattenCategoryTree>[0])
        .map(({ category }) => ({ id: String(category.id), title: String(category.title ?? '') }))
        .filter((o) => !needle || o.title.toLowerCase().includes(needle))
        .slice(0, 20);
    },
    [catTree],
  );

  const searchServices = useCallback(
    async (q: string): Promise<PickerOption[]> => {
      const rows = asRows(servicesData);
      const needle = q.trim().toLowerCase();
      return rows
        .map((s) => ({ id: String(s.id), title: String(s.title ?? '') }))
        .filter((o) => !needle || o.title.toLowerCase().includes(needle))
        .slice(0, 20);
    },
    [servicesData],
  );

  const searchProjects = useCallback(async (q: string): Promise<PickerOption[]> => {
    const rows = asRows(await projectsApi.list({ search: q, page_size: '10' }));
    return rows.map((p) => ({ id: String(p.id), title: String(p.title ?? '') }));
  }, []);

  const searchArticles = useCallback(async (q: string): Promise<PickerOption[]> => {
    const rows = asRows(await articlesApi.list({ search: q, page_size: '10', status: 'published' }));
    return rows.map((a) => ({ id: String(a.id), title: String(a.title ?? '') }));
  }, []);

  const patchSection = useCallback(
    (key: string, patch: Partial<HomepageSection>) => {
      if (!form) return;
      set(
        'sections',
        form.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)),
      );
    },
    [form, set],
  );

  const moveSection = useCallback(
    (key: string, dir: -1 | 1) => {
      if (!form) return;
      const idx = form.sections.findIndex((s) => s.key === key);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= form.sections.length) return;
      const copy = [...form.sections];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      set(
        'sections',
        copy.map((s, i) => ({ ...s, order: (i + 1) * 10 })),
      );
    },
    [form, set],
  );

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

  const onSave = (mode: 'save' | 'continue') => {
    if (!canEdit) {
      toast.error(t('admin.permission_denied'));
      return;
    }
    updateMut.mutate(buildHomepagePayload(form) as unknown as Record<string, unknown>, {
      onSuccess: () => {
        toast.success(t('admin.homepage_saved'));
        setEdits({});
        if (mode === 'save') router.push('/admin');
        else refetch();
      },
      onError: (err) => {
        const details = mapHomepageErrors(err);
        toast.error(details.length > 0 ? details.join(' — ') : t('admin.homepage_save_failed'));
      },
    });
  };

  const setRelations = (field: 'featured_products' | 'categories' | 'services' | 'projects' | 'articles') =>
    (items: HomepageRelationItem[]) => set(field, items);
  const setVisuals = (visuals: HomepageVisualItem[]) => set('visuals', visuals);

  const enabledSections = form.sections.filter((s) => s.enabled).length;

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-foreground">
          {t('admin.dashboard')}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{t('admin.homepage_studio')}</span>
      </nav>

      <PageHeader title={t('admin.homepage_studio')} description={t('admin.homepage_studio_desc')}>
        <Button type="button" variant="outline" size="sm" onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="h-4 w-4 me-1" />
          {t('admin.homepage_preview')}
        </Button>
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave('continue');
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="space-y-6">
            {/* ── Hero ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_hero')}</CardTitle>
                <CardDescription>{t('admin.homepage_hero_hint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.homepage_eyebrow')}</label>
                  <Input value={form.hero_eyebrow} onChange={(e) => set('hero_eyebrow', e.target.value)} dir="auto" />
                </div>
                <CtaFields
                  t={t}
                  labelKey="admin.homepage_cta_primary"
                  label={form.hero_primary_cta_label}
                  url={form.hero_primary_cta_url}
                  enabled={form.hero_primary_cta_enabled}
                  onLabel={(v) => set('hero_primary_cta_label', v)}
                  onUrl={(v) => set('hero_primary_cta_url', v)}
                  onEnabled={(v) => set('hero_primary_cta_enabled', v)}
                />
                <CtaFields
                  t={t}
                  labelKey="admin.homepage_cta_secondary"
                  label={form.hero_secondary_cta_label}
                  url={form.hero_secondary_cta_url}
                  enabled={form.hero_secondary_cta_enabled}
                  onLabel={(v) => set('hero_secondary_cta_label', v)}
                  onUrl={(v) => set('hero_secondary_cta_url', v)}
                  onEnabled={(v) => set('hero_secondary_cta_enabled', v)}
                />
              </CardContent>
            </Card>

            {/* ── Sections ── */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{t('admin.homepage_sections')}</h2>
                <p className="text-sm text-muted-foreground">{t('admin.homepage_sections_hint')}</p>
              </div>
              {form.sections.map((s, i) => (
                <HomepageSectionCard
                  key={s.key}
                  section={s}
                  onMove={moveSection}
                  onChange={patchSection}
                  isFirst={i === 0}
                  isLast={i === form.sections.length - 1}
                />
              ))}
            </div>

            {/* ── Floating visuals ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_visuals')}</CardTitle>
                <CardDescription>{t('admin.homepage_visuals_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageVisualsEditor visuals={form.visuals} onChange={setVisuals} />
              </CardContent>
            </Card>

            {/* ── Featured products ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_featured')}</CardTitle>
                <CardDescription>{t('admin.homepage_featured_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageRelationPicker
                  kind="products"
                  items={form.featured_products}
                  onChange={setRelations('featured_products')}
                  onSearch={searchProducts}
                  addLabel={t('admin.homepage_featured_add')}
                  emptyLabel={t('admin.homepage_featured_empty')}
                  searchPlaceholder={t('admin.homepage_picker_search')}
                  noResultsLabel={t('admin.homepage_picker_no_results')}
                />
              </CardContent>
            </Card>

            {/* ── Categories ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_categories')}</CardTitle>
                <CardDescription>{t('admin.homepage_categories_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageRelationPicker
                  kind="categories"
                  items={form.categories}
                  onChange={setRelations('categories')}
                  onSearch={searchCategories}
                  addLabel={t('admin.homepage_categories_add')}
                  emptyLabel={t('admin.homepage_categories_empty')}
                  searchPlaceholder={t('admin.homepage_picker_search')}
                  noResultsLabel={t('admin.homepage_picker_no_results')}
                />
              </CardContent>
            </Card>

            {/* ── Services ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_services')}</CardTitle>
                <CardDescription>{t('admin.homepage_services_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageRelationPicker
                  kind="services"
                  items={form.services}
                  onChange={setRelations('services')}
                  onSearch={searchServices}
                  addLabel={t('admin.homepage_services_add')}
                  emptyLabel={t('admin.homepage_services_empty')}
                  searchPlaceholder={t('admin.homepage_picker_search')}
                  noResultsLabel={t('admin.homepage_picker_no_results')}
                />
              </CardContent>
            </Card>

            {/* ── Calculator ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_calculator')}</CardTitle>
                <CardDescription>{t('admin.homepage_calculator_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CtaFields
                  t={t}
                  labelKey="admin.homepage_cta_primary"
                  label={form.calculator_cta_label}
                  url={form.calculator_cta_url}
                  enabled
                  onLabel={(v) => set('calculator_cta_label', v)}
                  onUrl={(v) => set('calculator_cta_url', v)}
                  onEnabled={() => undefined}
                  hideEnabled
                />
              </CardContent>
            </Card>

            {/* ── Projects ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_projects')}</CardTitle>
                <CardDescription>{t('admin.homepage_projects_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <HomepageRelationPicker
                  kind="projects"
                  items={form.projects}
                  onChange={setRelations('projects')}
                  onSearch={searchProjects}
                  addLabel={t('admin.homepage_projects_add')}
                  emptyLabel={t('admin.homepage_projects_empty')}
                  searchPlaceholder={t('admin.homepage_picker_search')}
                  noResultsLabel={t('admin.homepage_picker_no_results')}
                />
              </CardContent>
            </Card>

            {/* ── Articles ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_articles')}</CardTitle>
                <CardDescription>{t('admin.homepage_articles_hint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('admin.homepage_articles_count')}</label>
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={form.articles_count}
                    onChange={(e) => set('articles_count', Math.min(12, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-28"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('admin.homepage_articles_count_hint')}</p>
                </div>
                <HomepageRelationPicker
                  kind="articles"
                  items={form.articles}
                  onChange={setRelations('articles')}
                  onSearch={searchArticles}
                  addLabel={t('admin.homepage_articles_add')}
                  emptyLabel={t('admin.homepage_articles_empty')}
                  searchPlaceholder={t('admin.homepage_picker_search')}
                  noResultsLabel={t('admin.homepage_picker_no_results')}
                />
              </CardContent>
            </Card>

            {/* ── Contact ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_contact')}</CardTitle>
                <CardDescription>{t('admin.homepage_contact_hint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CtaFields
                  t={t}
                  labelKey="admin.homepage_cta_primary"
                  label={form.contact_cta_label}
                  url={form.contact_cta_url}
                  enabled
                  onLabel={(v) => set('contact_cta_label', v)}
                  onUrl={(v) => set('contact_cta_url', v)}
                  onEnabled={() => undefined}
                  hideEnabled
                />
                <CtaFields
                  t={t}
                  labelKey="admin.homepage_contact_secondary"
                  label={form.contact_secondary_cta_label}
                  url={form.contact_secondary_cta_url}
                  enabled
                  onLabel={(v) => set('contact_secondary_cta_label', v)}
                  onUrl={(v) => set('contact_secondary_cta_url', v)}
                  onEnabled={() => undefined}
                  hideEnabled
                />
              </CardContent>
            </Card>

            {/* ── SEO ── */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.seo_section')}</CardTitle>
                <CardDescription>{t('admin.homepage_seo_hint')}</CardDescription>
              </CardHeader>
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
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROBOT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
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
                    subfolder="homepage"
                    onUpload={(url, fid) => {
                      set('og_image_url', url);
                      set('og_image_id', fid || '');
                    }}
                    currentImage={form.og_image_url}
                    label={t('admin.og_image')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_sections')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('admin.active')}</dt>
                    <dd className="font-medium" dir="ltr">
                      {enabledSections} / {form.sections.length}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('admin.homepage_featured')}</dt>
                    <dd className="font-medium" dir="ltr">
                      {form.featured_products.length}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('admin.homepage_visuals')}</dt>
                    <dd className="font-medium" dir="ltr">
                      {form.visuals.length}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Sticky save bar ── */}
        <div className="sticky bottom-0 z-10 mt-6 border-t bg-background/95 backdrop-blur py-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin')}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="outline" disabled={updateMut.isPending || !canEdit} onClick={() => onSave('continue')}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {t('admin.save_continue')}
            </Button>
            <Button type="button" disabled={updateMut.isPending || !canEdit} onClick={() => onSave('save')}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

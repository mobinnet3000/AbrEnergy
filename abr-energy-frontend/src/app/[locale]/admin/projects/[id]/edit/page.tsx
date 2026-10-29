'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared';
import { EntityCategorySelect } from '@/components/admin/entity-category-select';
import { useDirtyNavigationGuard } from '@/hooks/use-dirty-navigation-guard';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  PROJECT_TRANSLATION_FIELDS,
  buildProjectPayload,
  contentTranslationsFromDetail,
  createTranslationMap,
  normalizeProjectStatus,
  relationId,
  translationLocalesFromDetail,
  type ContentLocale,
  type ProjectFormValues,
} from '@/lib/cms-form-contracts';
import { contentSaveErrorMessage } from '@/lib/cms-error-toast';
import Link from 'next/link';
import { useLocale } from '@/i18n';

const locales: { value: ContentLocale; label: string }[] = [
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const projectTypes = [
  { value: 'on_grid', label: 'On Grid' },
  { value: 'off_grid', label: 'Off Grid' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'large_scale', label: 'Large Scale' },
];

const statuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

function createInitialForm(): ProjectFormValues {
  return {
    project_type: 'on_grid', capacity: '', location: '', status: 'planning', start_date: '', end_date: '',
    service_category: '', is_featured: false, completion_percentage: 0,
    translations: createTranslationMap(PROJECT_TRANSLATION_FIELDS),
  };
}

const initialForm = createInitialForm();

export default function AdminProjectEditPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-project-edit', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/projects/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  const [edits, setEdits] = useState<Partial<ProjectFormValues>>({});
  const form = useMemo<ProjectFormValues>(() => {
    if (!data) return initialForm;
    return {
      project_type: data.project_type || 'on_grid',
      capacity: data.capacity ?? '',
      location: data.location || '',
      status: normalizeProjectStatus(data.status),
      start_date: data.start_date ? data.start_date.slice(0, 10) : '',
      end_date: data.end_date ? data.end_date.slice(0, 10) : '',
      service_category: relationId(data.service_category),
      is_featured: data.is_featured || false,
      completion_percentage: data.completion_percentage ?? 0,
      translations: contentTranslationsFromDetail(data, PROJECT_TRANSLATION_FIELDS),
      ...edits,
    };
  }, [data, edits]);
  const [saving, setSaving] = useState(false);

  // Phase 9.2 — dirty navigation guard over the EXISTING `edits` state (same
  // semantics as Homepage Studio: any pending edit = dirty; failed saves
  // never touch `edits`, so dirty is preserved for retry). Save-success
  // navigation runs directly (the persisted entity is left behind).
  const isDirty = Object.keys(edits).length > 0;
  const guard = useDirtyNavigationGuard({ isDirty });
  const backHref = '/admin/projects';

  useEffect(() => { if (error) toast.error(t('admin.failed_load_projects')); }, [error, t]);

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
        `/admin/projects/${id}/`,
        buildProjectPayload(form, translationLocalesFromDetail(data)),
      );
      toast.success(t('admin.project_updated'));
      router.push('/admin/projects');
    } catch (error) {
      toast.error(contentSaveErrorMessage(t('admin.project_save_failed'), error));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>;
  if (error) return <div className="py-10 text-center text-destructive">{t('admin.failed_load_projects')}</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">{t('admin.project_not_found')}</div>;

  return (
    <div>
      <Link
        href="/admin/projects"
        onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> {t('admin.back_to_projects')}
      </Link>
      <PageHeader title={t('admin.edit_project')}>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {t('admin.save_changes')}
        </Button>
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
                      <label className="text-sm font-medium mb-1 block">{t('admin.description_label')} ({l.label})</label>
                      <Textarea className="min-h-32" value={form.translations[l.value].description} onChange={(e) => updateTranslation(l.value, 'description', e.target.value)} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.details')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.project_type')}</label>
                <Select value={form.project_type} onValueChange={(v) => update('project_type', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Capacity (kW)</label>
                <Input type="number" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.location')}</label>
                <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.status')}</label>
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.service_category')}</label>
                <EntityCategorySelect kind="service" value={form.service_category} onChange={(v) => update('service_category', v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.completion_percentage')}</label>
                <Input type="number" min={0} max={100} value={form.completion_percentage} onChange={(e) => update('completion_percentage', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.start_date')}</label>
                <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.end_date')}</label>
                <Input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} />
              </div>
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

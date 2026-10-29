'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  createTranslationMap,
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

function createEmptyProjectForm(): ProjectFormValues {
  return {
    project_type: 'on_grid', capacity: '', location: '', status: 'planning', start_date: '', end_date: '',
    service_category: '', is_featured: false, completion_percentage: 0,
    translations: createTranslationMap(PROJECT_TRANSLATION_FIELDS),
  };
}

const emptyProjectForm = createEmptyProjectForm();

export default function AdminProjectNewPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectFormValues>(createEmptyProjectForm);

  // Phase 9.2 — dirty navigation guard over the EXISTING form state (no new
  // dirty system): `isDirty` is the initial-vs-current comparison owned by
  // this form. Save-success navigation runs directly; failed saves never
  // touch the form, so edits stay dirty by construction.
  const isDirty = JSON.stringify(form) !== JSON.stringify(emptyProjectForm);
  const guard = useDirtyNavigationGuard({ isDirty });
  const backHref = '/admin/projects';

  const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateTranslation = (locale: ContentLocale, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: { ...prev.translations[locale], [field]: value },
      },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axiosInstance.post('/admin/projects/', buildProjectPayload(form));
      toast.success(t('admin.project_created'));
      router.push('/admin/projects');
    } catch (error) {
      toast.error(contentSaveErrorMessage(t('admin.project_save_failed'), error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/projects"
        onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> {t('admin.back_to_projects')}
      </Link>
      <PageHeader title={t('admin.new_project')}>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {t('admin.create_project')}
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

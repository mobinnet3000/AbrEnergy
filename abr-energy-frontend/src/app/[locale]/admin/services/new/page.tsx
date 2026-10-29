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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared';
import { EntityCategorySelect } from '@/components/admin/entity-category-select';
import { useDirtyNavigationGuard } from '@/hooks/use-dirty-navigation-guard';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  SERVICE_TRANSLATION_FIELDS,
  buildServicePayload,
  createTranslationMap,
  type ContentLocale,
  type ServiceFormValues,
} from '@/lib/cms-form-contracts';
import { contentSaveErrorMessage } from '@/lib/cms-error-toast';
import Link from 'next/link';
import { useLocale } from '@/i18n';

const locales: { value: ContentLocale; label: string }[] = [
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function createEmptyServiceForm(): ServiceFormValues {
  return {
    icon: '', category: '', order: 0, status: 'active', is_featured: false, features: '',
    translations: createTranslationMap(SERVICE_TRANSLATION_FIELDS),
  };
}

const emptyServiceForm = createEmptyServiceForm();

export default function AdminServiceNewPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceFormValues>(createEmptyServiceForm);

  // Phase 9.2 — dirty navigation guard over the EXISTING form state (no new
  // dirty system): `isDirty` is the initial-vs-current comparison owned by
  // this form. Save-success navigation runs directly; failed saves never
  // touch the form, so edits stay dirty by construction.
  const isDirty = JSON.stringify(form) !== JSON.stringify(emptyServiceForm);
  const guard = useDirtyNavigationGuard({ isDirty });
  const backHref = '/admin/services';

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
      await axiosInstance.post('/admin/services/', buildServicePayload(form));
      toast.success(t('admin.service_created'));
      router.push('/admin/services');
    } catch (error) {
      toast.error(contentSaveErrorMessage(t('admin.service_save_failed'), error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/services"
        onClick={(e) => guard.guardLinkClick(e, backHref, () => router.push(backHref))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> {t('admin.back_to_services')}
      </Link>
      <PageHeader title={t('admin.new_service')}>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {t('admin.create_service')}
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
                      <label className="text-sm font-medium mb-1 block">{t('admin.short_description')} ({l.label})</label>
                      <Textarea value={form.translations[l.value].short_description} onChange={(e) => updateTranslation(l.value, 'short_description', e.target.value)} />
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
            <CardHeader><CardTitle>{t('admin.settings')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.icon')}</label>
                <Input value={form.icon} onChange={(e) => update('icon', e.target.value)} placeholder="e.g. solar-panel" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.category')}</label>
                <EntityCategorySelect kind="service" value={form.category} onChange={(v) => update('category', v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.order')}</label>
                <Input type="number" value={form.order} onChange={(e) => update('order', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.status')}</label>
                <Select value={form.status} onValueChange={(v) => v && update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Features (comma separated)</label>
                <Input value={form.features} onChange={(e) => update('features', e.target.value)} placeholder="24/7 support, Warranty, Fast installation" />
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

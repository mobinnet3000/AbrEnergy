'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared';
import Link from 'next/link';
import { useLocale } from '@/i18n';

const locales = [
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminServiceNewPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    icon: '', category: '', order: 0, status: 'active', is_featured: false, features: '',
    title_fa: '', short_description_fa: '', description_fa: '',
    title_ar: '', short_description_ar: '', description_ar: '',
    title_en: '', short_description_en: '', description_en: '',
  });

  const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      await axiosInstance.post('/admin/services/', payload);
      toast.success('Service created');
      router.push('/admin/services');
    } catch {
      toast.error('Failed to create service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link href="/admin/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
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
                      <label className="text-sm font-medium mb-1 block">Title ({l.label})</label>
                      <Input value={form[`title_${l.value}` as keyof typeof form] as string} onChange={(e) => update(`title_${l.value}`, e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Short Description ({l.label})</label>
                      <Textarea value={form[`short_description_${l.value}` as keyof typeof form] as string} onChange={(e) => update(`short_description_${l.value}`, e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description ({l.label})</label>
                      <Textarea className="min-h-32" value={form[`description_${l.value}` as keyof typeof form] as string} onChange={(e) => update(`description_${l.value}`, e.target.value)} />
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
                <ServiceCategorySelect value={form.category} onChange={(v) => update('category', v)} />
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
    </div>
  );
}

function ServiceCategorySelect({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const { data } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await axiosInstance.get('/service-categories/');
      return res.data?.results ?? [];
    },
  });
  const cats = Array.isArray(data) ? data : [];
  return (
                <Select value={value} onValueChange={(val) => val && onChange(val)}>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
      <SelectContent>
        {cats.map((c: { id: string; title: string }) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

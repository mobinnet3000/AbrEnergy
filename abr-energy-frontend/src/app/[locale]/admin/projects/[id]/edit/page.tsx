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
import Link from 'next/link';

const locales = [
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
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function AdminProjectEditPage() {
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

  const initialForm = {
    project_type: 'on_grid', capacity: '', location: '', status: 'planned', start_date: '', end_date: '',
    title_fa: '', description_fa: '',
    title_ar: '', description_ar: '',
    title_en: '', description_en: '',
  };

  const [edits, setEdits] = useState<Partial<typeof initialForm>>({});
  const form = useMemo(() => {
    if (!data) return initialForm;
    return {
      project_type: data.project_type || 'on_grid',
      capacity: data.capacity ?? '',
      location: data.location || '',
      status: data.status || 'planned',
      start_date: data.start_date ? data.start_date.slice(0, 10) : '',
      end_date: data.end_date ? data.end_date.slice(0, 10) : '',
      title_fa: data.title_fa || '', description_fa: data.description_fa || '',
      title_ar: data.title_ar || '', description_ar: data.description_ar || '',
      title_en: data.title_en || '', description_en: data.description_en || '',
      ...edits,
    };
  }, [data, edits]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (error) toast.error('Failed to load project'); }, [error]);

  const update = (field: string, value: unknown) => setEdits((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/admin/projects/${id}/`, form);
      toast.success('Project updated');
      router.push('/admin/projects');
    } catch {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (error) return <div className="py-10 text-center text-destructive">Failed to load project</div>;
  if (!data) return <div className="py-10 text-center text-muted-foreground">Project not found</div>;

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>
      <PageHeader title="Edit Project">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Save Changes
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Content</CardTitle></CardHeader>
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
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Project Type</label>
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
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

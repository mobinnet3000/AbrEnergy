'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await axiosInstance.get('/site-config/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error('Failed to load settings'); }, [error]);
  const settings = data as Record<string, unknown> | undefined;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : !settings ? (
        <p className="text-center py-10 text-muted-foreground">No settings found</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Company Info</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Company Name</dt><dd className="font-medium">{settings.company_name as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Company Name (EN)</dt><dd className="font-medium">{settings.company_name_en as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{settings.email as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{settings.phone_number as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Phone 2</dt><dd className="font-medium">{settings.phone_number_2 as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Address</dt><dd className="font-medium">{settings.address as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Site URL</dt><dd className="font-medium">{settings.site_url as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Social Media</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Instagram</dt><dd className="font-medium">{settings.instagram as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Telegram</dt><dd className="font-medium">{settings.telegram as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">LinkedIn</dt><dd className="font-medium">{settings.linkedin as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">WhatsApp</dt><dd className="font-medium">{settings.whatsapp as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">YouTube</dt><dd className="font-medium">{settings.youtube as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>SEO & Content</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Default Meta Title</dt><dd className="font-medium">{settings.default_meta_title as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Default Meta Description</dt><dd className="font-medium text-right max-w-lg">{settings.default_meta_description as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Hero Title</dt><dd className="font-medium">{settings.hero_title as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Hero Subtitle</dt><dd className="font-medium">{settings.hero_subtitle as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">About Us</dt><dd className="font-medium text-right max-w-lg">{settings.about_us as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Footer Text</dt><dd className="font-medium">{settings.footer_text as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

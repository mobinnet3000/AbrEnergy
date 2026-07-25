'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n';

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await axiosInstance.get('/site-config/');
      return res.data;
    },
  });
  useEffect(() => { if (error) toast.error(t('admin.failed_load')); }, [error]);
  const settings = data as Record<string, unknown> | undefined;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('admin.site_settings')}</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('common.loading')}</div>
      ) : !settings ? (
        <p className="text-center py-10 text-muted-foreground">{t('admin.no_settings')}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t('admin.company_info')}</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.company_name')}</dt><dd className="font-medium">{settings.company_name as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.company_name')} (EN)</dt><dd className="font-medium">{settings.company_name_en as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.email')}</dt><dd className="font-medium">{settings.email as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.phone')}</dt><dd className="font-medium">{settings.phone_number as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.phone')} 2</dt><dd className="font-medium">{settings.phone_number_2 as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.address')}</dt><dd className="font-medium">{settings.address as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.site_url')}</dt><dd className="font-medium">{settings.site_url as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('admin.social_media')}</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.instagram')}</dt><dd className="font-medium">{settings.instagram as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.telegram')}</dt><dd className="font-medium">{settings.telegram as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.linkedin')}</dt><dd className="font-medium">{settings.linkedin as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.whatsapp')}</dt><dd className="font-medium">{settings.whatsapp as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.youtube')}</dt><dd className="font-medium">{settings.youtube as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>{t('admin.seo_content')}</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.default_meta_title')}</dt><dd className="font-medium">{settings.default_meta_title as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.default_meta_description')}</dt><dd className="font-medium text-right max-w-lg">{settings.default_meta_description as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.hero_title')}</dt><dd className="font-medium">{settings.hero_title as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.hero_subtitle')}</dt><dd className="font-medium">{settings.hero_subtitle as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.about_us')}</dt><dd className="font-medium text-right max-w-lg">{settings.about_us as string || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t('admin.footer_text')}</dt><dd className="font-medium">{settings.footer_text as string || '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

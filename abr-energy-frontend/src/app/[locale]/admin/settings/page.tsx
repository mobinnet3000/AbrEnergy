'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Upload, ImageIcon, MapPin, ExternalLink, Eye } from 'lucide-react';
import { useLocale } from '@/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { DEFAULT_LOGO_SRC } from '@/components/layout/brand-logo';
import { contentSaveErrorMessage } from '@/lib/cms-error-toast';
import type { SiteSettings } from '@/types';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

type SettingsForm = {
  company_name: string;
  company_name_en: string;
  company_name_ar: string;
  phone_number: string;
  phone_number_2: string;
  email: string;
  address: string;
  address_en: string;
  address_ar: string;
  city: string;
  city_en: string;
  city_ar: string;
  province: string;
  province_en: string;
  province_ar: string;
  postal_code: string;
  map_url: string;
  instagram: string;
  telegram: string;
  linkedin: string;
  whatsapp: string;
  youtube: string;
  hero_title: string;
  hero_subtitle: string;
  about_us: string;
  about_us_en: string;
  default_meta_title: string;
  default_meta_description: string;
  footer_text: string;
  site_url: string;
};

const EMPTY_SETTINGS: SettingsForm = {
  company_name: '',
  company_name_en: '',
  company_name_ar: '',
  phone_number: '',
  phone_number_2: '',
  email: '',
  address: '',
  address_en: '',
  address_ar: '',
  city: '',
  city_en: '',
  city_ar: '',
  province: '',
  province_en: '',
  province_ar: '',
  postal_code: '',
  map_url: '',
  instagram: '',
  telegram: '',
  linkedin: '',
  whatsapp: '',
  youtube: '',
  hero_title: '',
  hero_subtitle: '',
  about_us: '',
  about_us_en: '',
  default_meta_title: '',
  default_meta_description: '',
  footer_text: '',
  site_url: '',
};

function formFromData(data: Record<string, unknown>): SettingsForm {
  const form = { ...EMPTY_SETTINGS };
  (Object.keys(form) as (keyof SettingsForm)[]).forEach((key) => {
    const value = data[key];
    if (typeof value === 'string') form[key] = value;
  });
  return form;
}

function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  ltr = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  ltr?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={multiline ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          dir={ltr ? 'ltr' : undefined}
          placeholder={placeholder}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={ltr ? 'ltr' : undefined}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function BrandAssetUpload({
  field,
  label,
  current,
  onUploaded,
}: {
  field: 'logo' | 'favicon';
  label: string;
  current?: string | null;
  onUploaded: (data: Record<string, unknown>) => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const preview = field === 'logo'
    ? (current ? resolveMediaUrl(current) : DEFAULT_LOGO_SRC)
    : (current ? resolveMediaUrl(current) : '');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('admin.brand_invalid_type'));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t('admin.brand_too_large'));
      return;
    }
    const form = new FormData();
    form.append(field, file);
    setBusy(true);
    try {
      const res = await axiosInstance.patch('/admin/site-config/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data as Record<string, unknown>);
      toast.success(t('admin.brand_saved'));
    } catch {
      toast.error(t('admin.brand_save_failed'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-1">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {t('admin.brand_upload')}
        </button>
      </div>
    </div>
  );
}

function SettingsEditor({ data }: { data: Record<string, unknown> }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(() => formFromData(data));
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const settings = { ...data, ...overrides };

  const invalidateSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
  };

  const onUploaded = (updated: Record<string, unknown>) => {
    setOverrides((prev) => ({ ...prev, ...updated }));
    invalidateSettings();
  };

  const update = (field: keyof SettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch('/admin/site-config/', form);
      toast.success(t('admin.settings_saved'));
      setOverrides({});
      invalidateSettings();
    } catch (saveError) {
      toast.error(contentSaveErrorMessage(t('admin.settings_save_failed'), saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.site_settings')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت هویت برند، آدرس رسمی شرکت در فوتر، اطلاعات تماس، شبکه‌های اجتماعی و تنظیمات سئو.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="min-w-28">
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Brand Assets */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('admin.brand_assets')}</CardTitle>
            <CardDescription>لوگوی رسمی و نماد فاوآیکون وب‌سایت در هدر و تب مرورگر</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <BrandAssetUpload field="logo" label={t('admin.brand_logo')} current={settings.logo as string | null} onUploaded={onUploaded} />
            <BrandAssetUpload field="favicon" label={t('admin.brand_favicon')} current={settings.favicon as string | null} onUploaded={onUploaded} />
          </CardContent>
        </Card>

        {/* Company Identity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.company_info')}</CardTitle>
            <CardDescription>نام و راه‌های ارتباطی رسمی سازمان</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SettingsField label={`${t('admin.company_name')} (فارسی)`} value={form.company_name} onChange={(value) => update('company_name', value)} />
            <SettingsField label={`${t('admin.company_name')} (English)`} value={form.company_name_en} onChange={(value) => update('company_name_en', value)} ltr />
            <SettingsField label={`${t('admin.company_name')} (العربية)`} value={form.company_name_ar} onChange={(value) => update('company_name_ar', value)} />
            <SettingsField label={t('admin.email')} value={form.email} onChange={(value) => update('email', value)} type="email" ltr />
            <SettingsField label={t('admin.phone')} value={form.phone_number} onChange={(value) => update('phone_number', value)} ltr />
            <SettingsField label={`${t('admin.phone')} ۲`} value={form.phone_number_2} onChange={(value) => update('phone_number_2', value)} ltr />
            <SettingsField label={t('admin.site_url')} value={form.site_url} onChange={(value) => update('site_url', value)} type="url" ltr />
          </CardContent>
        </Card>

        {/* Structured Address & Location Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <span>مدیریت آدرس رسمی و موقعیت مکانی شرکت</span>
            </CardTitle>
            <CardDescription>
              این اطلاعات به‌صورت مستقیم در فوتر سایت، صفحات تماس و داده‌های ساختاریافته Schema.org نمایش داده می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              label="آدرس پستی (فارسی)"
              value={form.address}
              onChange={(value) => update('address', value)}
              multiline
              placeholder="تهران، خیابان آزادی، ..."
            />
            <SettingsField
              label="Company Address (English)"
              value={form.address_en}
              onChange={(value) => update('address_en', value)}
              multiline
              ltr
              placeholder="Tehran, Azadi St., ..."
            />
            <SettingsField
              label="عنوان العنوان (العربية)"
              value={form.address_ar}
              onChange={(value) => update('address_ar', value)}
              multiline
              placeholder="طهران، شارع آزادی، ..."
            />
            <SettingsField label="شهر (فارسی)" value={form.city} onChange={(value) => update('city', value)} />
            <SettingsField label="City (EN)" value={form.city_en} onChange={(value) => update('city_en', value)} ltr />
            <SettingsField label="المدينة (AR)" value={form.city_ar} onChange={(value) => update('city_ar', value)} />
            <SettingsField label="استان (فارسی)" value={form.province} onChange={(value) => update('province', value)} />
            <SettingsField label="Province (EN)" value={form.province_en} onChange={(value) => update('province_en', value)} ltr />
            <SettingsField label="المحافظة (AR)" value={form.province_ar} onChange={(value) => update('province_ar', value)} />
            <SettingsField label="کد پستی ده رقمی" value={form.postal_code} onChange={(value) => update('postal_code', value)} ltr placeholder="12345-67890" />
            <SettingsField
              label="لینک نقشه (HTTPS Google Maps / Neshan / Balad)"
              value={form.map_url}
              onChange={(value) => update('map_url', value)}
              ltr
              type="url"
              placeholder="https://maps.google.com/?q=35.6892,51.3890"
            />
          </CardContent>
        </Card>

        {/* Live Footer Preview Card */}
        <Card className="md:col-span-2 border-emerald-500/20 bg-emerald-950/[0.02] dark:bg-emerald-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
              <Eye className="h-4 w-4" />
              <span>پیش‌نمایش کارت آدرس در فوتر (Live Footer Preview)</span>
            </CardTitle>
            <CardDescription>نمایش آنی اطلاعات آدرس به شکلی که کاربران در فوتر سایت مشاهده خواهند کرد.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md rounded-xl border border-border bg-card p-4 shadow-xs">
              <h4 className="font-heading font-semibold text-xs text-emerald-700/80 mb-3 uppercase tracking-wider dark:text-emerald-400/80">
                اطلاعات تماس و نشانی شرکت
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {form.email && (
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-medium text-xs text-muted-foreground">ایمیل:</span>
                    <span dir="ltr">{form.email}</span>
                  </div>
                )}
                {form.phone_number && (
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-medium text-xs text-muted-foreground">تلفن:</span>
                    <span dir="ltr">{form.phone_number}</span>
                  </div>
                )}
                <div className="mt-3 rounded-lg border border-border/80 bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="text-foreground leading-relaxed">
                      {form.address || 'آدرس هنوز ثبت نشده است'}
                    </span>
                  </div>
                  {(form.city || form.province) && (
                    <div className="mt-1 text-xs text-muted-foreground pr-6">
                      {[form.city, form.province].filter(Boolean).join('، ')}
                    </div>
                  )}
                  {form.postal_code && (
                    <div className="mt-1 text-xs text-muted-foreground pr-6">
                      <span className="font-medium">کد پستی: </span>
                      <span dir="ltr">{form.postal_code}</span>
                    </div>
                  )}
                  {form.map_url && form.map_url.startsWith('https://') && (
                    <div className="mt-2 pr-6">
                      <a
                        href={form.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                      >
                        <span>مشاهده روی نقشه</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.social_media')}</CardTitle>
            <CardDescription>پیوند شبکه‌های اجتماعی رسمی در فوتر و سربرگ</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SettingsField label={t('admin.instagram')} value={form.instagram} onChange={(value) => update('instagram', value)} ltr />
            <SettingsField label={t('admin.telegram')} value={form.telegram} onChange={(value) => update('telegram', value)} ltr />
            <SettingsField label={t('admin.linkedin')} value={form.linkedin} onChange={(value) => update('linkedin', value)} ltr />
            <SettingsField label={t('admin.whatsapp')} value={form.whatsapp} onChange={(value) => update('whatsapp', value)} ltr />
            <SettingsField label={t('admin.youtube')} value={form.youtube} onChange={(value) => update('youtube', value)} ltr />
          </CardContent>
        </Card>

        {/* SEO & Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.seo_content')}</CardTitle>
            <CardDescription>پیش‌فرض‌های متادیتا و متون صفحات اصلی</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SettingsField label={t('admin.default_meta_title')} value={form.default_meta_title} onChange={(value) => update('default_meta_title', value)} />
            <SettingsField label={t('admin.default_meta_description')} value={form.default_meta_description} onChange={(value) => update('default_meta_description', value)} multiline />
            <SettingsField label={t('admin.hero_title')} value={form.hero_title} onChange={(value) => update('hero_title', value)} />
            <SettingsField label={t('admin.hero_subtitle')} value={form.hero_subtitle} onChange={(value) => update('hero_subtitle', value)} />
            <SettingsField label={t('admin.about_us')} value={form.about_us} onChange={(value) => update('about_us', value)} multiline />
            <SettingsField label={`${t('admin.about_us')} (EN)`} value={form.about_us_en} onChange={(value) => update('about_us_en', value)} multiline ltr />
            <SettingsField label={t('admin.footer_text')} value={form.footer_text} onChange={(value) => update('footer_text', value)} multiline />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/site-config/');
      return res.data as Record<string, unknown>;
    },
  });

  useEffect(() => { if (error) toast.error(t('admin.failed_load')); }, [error, t]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('common.loading')}</div>;
  }
  if (!data) {
    return <p className="text-center py-10 text-muted-foreground">{t('admin.no_settings')}</p>;
  }
  return <SettingsEditor key="site-settings" data={data} />;
}

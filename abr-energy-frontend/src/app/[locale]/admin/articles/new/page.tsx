'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { MediaUpload } from '@/components/shared/media-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useLocale } from '@/i18n';

const LANGUAGES = [
  { code: 'fa', label: 'فارسی' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

const emptyTrans = { title: '', slug: '', short_description: '', content: '' };

export default function NewArticlePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [translations, setTranslations] = useState({
    fa: { ...emptyTrans },
    ar: { ...emptyTrans },
    en: { ...emptyTrans },
  });
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [featured, setFeatured] = useState(false);

  const handleTransChange = (lang: string, field: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang as keyof typeof prev], [field]: value } }));
  };

  const completion = {
    fa: !!(translations.fa.title && translations.fa.slug && translations.fa.short_description && translations.fa.content),
    ar: !!(translations.ar.title && translations.ar.slug && translations.ar.short_description && translations.ar.content),
    en: !!(translations.en.title && translations.en.slug && translations.en.short_description && translations.en.content),
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const translationList = LANGUAGES.map((l) => ({
        language_code: l.code,
        title: translations[l.code as keyof typeof translations].title,
        slug: translations[l.code as keyof typeof translations].slug,
        short_description: translations[l.code as keyof typeof translations].short_description,
        content: translations[l.code as keyof typeof translations].content,
      }));
      await axiosInstance.post('/admin/articles/', {
        translations: translationList,
        status,
        category,
        tags,
        publish_date: publishDate,
        cover_image_url: coverImage,
        is_featured: featured,
      });
      toast.success('Article created');
      router.push('/admin/articles');
    } catch {
      toast.error('Failed to create article');
    } finally {
      setSubmitting(false);
    }
  };

  const renderLangTab = (code: string, label: string) => (
    <TabsContent key={code} value={code} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.title_label')}</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={(translations as Record<string, Record<string, string>>)[code].title}
          onChange={(e) => handleTransChange(code, 'title', e.target.value)}
          placeholder="Article title"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.slug')}</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={(translations as Record<string, Record<string, string>>)[code].slug}
          onChange={(e) => handleTransChange(code, 'slug', e.target.value)}
          placeholder="article-slug"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.short_description')}</label>
        <textarea
          className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={(translations as Record<string, Record<string, string>>)[code].short_description}
          onChange={(e) => handleTransChange(code, 'short_description', e.target.value)}
          placeholder="Brief description"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t('admin.content')}</label>
        <RichTextEditor
          content={(translations as Record<string, Record<string, string>>)[code].content}
          onChange={(html) => handleTransChange(code, 'content', html)}
          dir={code === 'en' ? 'ltr' : 'rtl'}
          placeholder="Write article content..."
        />
      </div>
    </TabsContent>
  );

  return (
    <div>
      <Link href="/admin/articles" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 ms-0 me-2" /> {t('admin.back_to_articles')}
      </Link>
      <h1 className="text-3xl font-bold mb-8">{t('admin.create_article')}</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Translations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.translations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fa">
              <TabsList className="mb-4">
                {LANGUAGES.map((l) => (
                  <TabsTrigger key={l.code} value={l.code} className="gap-2">
                    {l.label}
                    <Badge variant={completion[l.code as keyof typeof completion] ? 'default' : 'outline'} className="text-xs px-1.5">
                      {completion[l.code as keyof typeof completion] ? '✅' : '⚠️'}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {LANGUAGES.map((l) => renderLangTab(l.code, l.label))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle>{t('admin.settings')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.status')}</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">{t('admin.draft')}</option>
                  <option value="published">{t('admin.published')}</option>
                  <option value="scheduled">{t('admin.scheduled')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.category_id')}</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category UUID" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.tags')} (comma)</label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="solar, energy" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.publish_date')}</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
              </div>
              <div>
                <MediaUpload
                  onUpload={(url) => setCoverImage(url)}
                  currentImage={coverImage}
                  label={t('admin.cover_image')}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
                  {t('admin.featured_article')}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
            {t('admin.create_article')}
          </Button>
          <Link href="/admin/articles" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}

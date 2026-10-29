'use client';

import { useState, useMemo } from 'react';
import {
  Loader2,
  Upload,
  Search,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Edit2,
  Check,
  X,
  HardDrive,
  Calendar,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdminMediaList, useUpdateAdminMedia } from '@/hooks/use-api';
import { mediaApi } from '@/api';
import { useLocale } from '@/i18n';

interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  original_name: string;
  file_type: 'image' | 'document';
  file_size: number;
  width?: number | null;
  height?: number | null;
  alt_text?: string;
  subfolder?: string;
  uploaded_at: string;
}

function formatSize(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AdminMediaPage() {
  const { t } = useLocale();
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params: { file_type?: 'image' | 'document'; search?: string } = {};
    if (filterType !== 'all') params.file_type = filterType;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [filterType, search]);

  const { data, isLoading, refetch } = useAdminMediaList(queryParams);
  const updateMutation = useUpdateAdminMedia();

  const items: MediaItem[] = useMemo(() => {
    if (!data) return [];
    const list = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];
    return list as MediaItem[];
  }, [data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size and extension before upload
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

    if (!isPdf && !isImage) {
      toast.error('فرمت فایل مجاز نیست. فرمت‌های مجاز: jpg, png, webp, pdf');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    if (isPdf && file.size > 25 * 1024 * 1024) {
      toast.error('حجم فایل PDF نباید بیشتر از ۲۵ مگابایت باشد.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subfolder', isPdf ? 'documents' : 'general');

    try {
      setUploading(true);
      await mediaApi.upload(formData);
      toast.success('فایل با موفقیت بارگذاری شد.');
      refetch();
    } catch {
      toast.error('بارگذاری فایل با خطا مواجه شد.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveAltText = () => {
    if (!editingItem) return;
    updateMutation.mutate(
      { id: editingItem.id, data: { alt_text: editAltText } },
      {
        onSuccess: () => {
          toast.success(t('admin.saved_successfully'));
          setEditingItem(null);
          refetch();
        },
        onError: () => {
          toast.error(t('common.error'));
        },
      },
    );
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('آدرس فایل کپی شد');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('admin.media')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت تصاویر، اسناد، کاتالوگ‌ها و متادیتای فایل‌های بارگذاری‌شده
          </p>
        </div>

        {/* Upload Action */}
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-brand-strong">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{t('admin.upload_media')}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
            />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="text-xs h-8"
              >
                {t('admin.filter_all')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterType === 'image' ? 'default' : 'outline'}
                onClick={() => setFilterType('image')}
                className="text-xs h-8 gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {t('admin.filter_images')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterType === 'document' ? 'default' : 'outline'}
                onClick={() => setFilterType('document')}
                className="text-xs h-8 gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                {t('admin.filter_documents')}
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('admin.search_media')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 ps-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin me-2" />
          <span>{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">{t('admin.no_media')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isDoc = item.file_type === 'document' || item.original_name.endsWith('.pdf');
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-xs transition-all hover:border-primary/40 dark:border-white/10"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted/40 mb-3 flex items-center justify-center">
                  {!isDoc && item.url ? (
                    <img
                      src={item.thumbnail_url || item.url}
                      alt={item.alt_text || item.original_name}
                      className="h-full w-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(item.url)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-primary">
                      <FileText className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                    </div>
                  )}

                  {/* Top-end Badge */}
                  <div className="absolute top-2 end-2 flex gap-1">
                    <span className="rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-md">
                      {isDoc ? 'سند' : 'تصویر'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <p
                    className="font-medium text-xs text-foreground truncate"
                    title={item.original_name}
                  >
                    {item.original_name}
                  </p>
                  {item.alt_text ? (
                    <p
                      className="text-[11px] text-muted-foreground truncate"
                      title={item.alt_text}
                    >
                      {item.alt_text}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60 italic">بدون متن جایگزین</p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatSize(item.file_size)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.uploaded_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setEditAltText(item.alt_text || '');
                      }}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="ویرایش متادیتا"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(item.url)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="کپی لینک"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <span>{isDoc ? 'دانلود' : 'نمایش'}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Alt Text Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t('admin.edit_media')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">نام فایل:</p>
              <p className="text-xs font-semibold text-foreground truncate">
                {editingItem?.original_name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                {t('admin.alt_text_label')}
              </label>
              <Input
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="توضیح کوتاه درباره تصویر یا سند..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingItem(null)}
              disabled={updateMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAltText}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
              ) : (
                <Check className="h-3.5 w-3.5 me-1" />
              )}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-neutral-800">
          {previewImage && (
            <div className="flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

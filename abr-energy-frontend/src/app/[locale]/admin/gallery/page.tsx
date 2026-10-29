'use client';

import { useState, useMemo } from 'react';
import {
  Loader2,
  Plus,
  Search,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Eye,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  useAdminGalleryImages,
  useAdminGalleryCategories,
  useCreateAdminGalleryImage,
  useUpdateAdminGalleryImage,
  useDeleteAdminGalleryImage,
  useAdminMediaList,
} from '@/hooks/use-api';
import { mediaApi } from '@/api';
import { useLocale } from '@/i18n';

interface GalleryImageItem {
  id: string;
  category: string | null;
  category_title?: string;
  image_url: string;
  title: string;
  alt_text?: string;
  caption?: string;
  order: number;
  is_active: boolean;
  uploaded_at?: string;
}

interface CategoryItem {
  id: string;
  title: string;
  slug: string;
}

export default function AdminGalleryPage() {
  const { t } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);
  const [activeItem, setActiveItem] = useState<GalleryImageItem | null>(null);

  // Add form state
  const [addMediaId, setAddMediaId] = useState<string>('');
  const [addMediaPreview, setAddMediaPreview] = useState<string>('');
  const [addTitle, setAddTitle] = useState<string>('');
  const [addAltText, setAddAltText] = useState<string>('');
  const [addCaption, setAddCaption] = useState<string>('');
  const [addCategoryId, setAddCategoryId] = useState<string>('');
  const [addOrder, setAddOrder] = useState<number>(0);
  const [addIsActive, setAddIsActive] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState<string>('');
  const [editAltText, setEditAltText] = useState<string>('');
  const [editCaption, setEditCaption] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editOrder, setEditOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // API hooks
  const { data: rawImages, isLoading, refetch } = useAdminGalleryImages();
  const { data: rawCategories } = useAdminGalleryCategories();
  const { data: mediaLibrary } = useAdminMediaList({ file_type: 'image' });

  const createMutation = useCreateAdminGalleryImage();
  const updateMutation = useUpdateAdminGalleryImage();
  const deleteMutation = useDeleteAdminGalleryImage();

  const categories: CategoryItem[] = useMemo(() => {
    if (!rawCategories) return [];
    const list = Array.isArray(rawCategories?.results)
      ? rawCategories.results
      : Array.isArray(rawCategories)
        ? rawCategories
        : [];
    return list as CategoryItem[];
  }, [rawCategories]);

  const images: GalleryImageItem[] = useMemo(() => {
    if (!rawImages) return [];
    const list = Array.isArray(rawImages?.results)
      ? rawImages.results
      : Array.isArray(rawImages)
        ? rawImages
        : [];
    return list as GalleryImageItem[];
  }, [rawImages]);

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchCat =
        selectedCategory === 'all' ||
        img.category === selectedCategory ||
        (selectedCategory === 'uncategorized' && !img.category);

      const matchSearch =
        !search.trim() ||
        (img.title && img.title.toLowerCase().includes(search.toLowerCase())) ||
        (img.caption && img.caption.toLowerCase().includes(search.toLowerCase())) ||
        (img.category_title && img.category_title.toLowerCase().includes(search.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [images, selectedCategory, search]);

  const availableMedia = useMemo(() => {
    if (!mediaLibrary) return [];
    const list = Array.isArray(mediaLibrary?.results)
      ? mediaLibrary.results
      : Array.isArray(mediaLibrary)
        ? mediaLibrary
        : [];
    return list as Array<{ id: string; url: string; original_name: string; alt_text?: string }>;
  }, [mediaLibrary]);

  const resetAddForm = () => {
    setAddMediaId('');
    setAddMediaPreview('');
    setAddTitle('');
    setAddAltText('');
    setAddCaption('');
    setAddCategoryId('');
    setAddOrder(0);
    setAddIsActive(true);
    setShowMediaPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      toast.error('فرمت فایل مجاز نیست. لطفاً یک تصویر (JPG, PNG, WebP) انتخاب کنید.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', 'gallery');
      const uploaded = await mediaApi.upload(formData);
      setAddMediaId(uploaded.id);
      setAddMediaPreview(uploaded.url);
      if (!addTitle) {
        const defaultTitle = file.name.replace(/\.[^/.]+$/, '');
        setAddTitle(defaultTitle);
      }
      toast.success('تصویر با موفقیت بارگذاری شد.');
    } catch {
      toast.error('خطا در بارگذاری تصویر.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCreate = async () => {
    if (!addMediaId) {
      toast.error('لطفاً یک تصویر انتخاب یا بارگذاری کنید.');
      return;
    }
    if (!addTitle.trim()) {
      toast.error('عنوان تصویر الزامی است.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        media_file: addMediaId,
        title: addTitle.trim(),
        alt_text: addAltText.trim(),
        caption: addCaption.trim(),
        category: addCategoryId || null,
        order: Number(addOrder) || 0,
        is_active: addIsActive,
      });
      toast.success(t('admin.saved_successfully') || 'تصویر با موفقیت به گالری اضافه شد.');
      setIsAddOpen(false);
      resetAddForm();
      refetch();
    } catch {
      toast.error('خطا در افزودن تصویر به گالری.');
    }
  };

  const openEdit = (img: GalleryImageItem) => {
    setActiveItem(img);
    setEditTitle(img.title || '');
    setEditAltText(img.alt_text || '');
    setEditCaption(img.caption || '');
    setEditCategoryId(img.category || '');
    setEditOrder(img.order || 0);
    setEditIsActive(Boolean(img.is_active));
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!activeItem) return;
    if (!editTitle.trim()) {
      toast.error('عنوان تصویر الزامی است.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: activeItem.id,
        data: {
          title: editTitle.trim(),
          alt_text: editAltText.trim(),
          caption: editCaption.trim(),
          category: editCategoryId || null,
          order: Number(editOrder) || 0,
          is_active: editIsActive,
        },
      });
      toast.success(t('admin.saved_successfully') || 'تغییرات با موفقیت ذخیره شد.');
      setIsEditOpen(false);
      setActiveItem(null);
      refetch();
    } catch {
      toast.error('خطا در ویرایش اطلاعات تصویر.');
    }
  };

  const openDelete = (img: GalleryImageItem) => {
    setActiveItem(img);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteMutation.mutateAsync(activeItem.id);
      toast.success('تصویر با موفقیت از گالری حذف شد.');
      setIsDeleteOpen(false);
      setActiveItem(null);
      refetch();
    } catch {
      toast.error('خطا در حذف تصویر.');
    }
  };

  const handleToggleActive = async (img: GalleryImageItem) => {
    try {
      await updateMutation.mutateAsync({
        id: img.id,
        data: { is_active: !img.is_active },
      });
      toast.success(img.is_active ? 'تصویر غیرفعال شد.' : 'تصویر فعال و منتشر شد.');
      refetch();
    } catch {
      toast.error('خطا در تغییر وضعیت تصویر.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('admin.gallery') || 'مدیریت گالری تصاویر'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تصاویر گالری عمومی سایت را مدیریت، دسته‌بندی و ویرایش کنید.
          </p>
        </div>
        <Button
          onClick={() => {
            resetAddForm();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('admin.add_to_gallery') || 'افزودن تصویر به گالری'}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجو در عنوان، زیرنویس یا دسته‌بندی..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1 me-1">
                <Filter className="w-3.5 h-3.5" />
                دسته‌بندی:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                همه ({images.length})
              </button>
              {categories.map((cat) => {
                const count = images.filter((img) => img.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">{t('common.loading') || 'در حال بارگذاری تصاویر...'}</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-lg text-foreground mb-1">هیچ تصویری یافت نشد</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {search || selectedCategory !== 'all'
                ? 'هیچ تصویری با معیارهای جستجوی انتخاب‌شده مطابقت ندارد.'
                : 'هنوز تصویری به گالری اضافه نشده است.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetAddForm();
                setIsAddOpen(true);
              }}
            >
              <Plus className="w-4 h-4 me-1.5" />
              افزودن تصویر اول
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <Card
              key={img.id}
              className={`overflow-hidden group hover:shadow-md transition-all duration-200 flex flex-col ${
                !img.is_active ? 'opacity-70 border-dashed' : ''
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {img.image_url ? (
                  <img
                    src={img.image_url}
                    alt={img.alt_text || img.title || 'تصویر گالری'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    بدون تصویر
                  </div>
                )}

                {/* Status Badges Overlay */}
                <div className="absolute top-2 start-2 flex items-center gap-1.5">
                  <Badge
                    variant={img.is_active ? 'default' : 'secondary'}
                    className="text-[10px] px-1.5 py-0.5"
                  >
                    {img.is_active ? 'فعال' : 'پیش‌نویس'}
                  </Badge>
                  {img.category_title && (
                    <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-sm px-1.5 py-0.5">
                      {img.category_title}
                    </Badge>
                  )}
                </div>

                {/* Quick Preview Button */}
                {img.image_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(img)}
                    className="absolute bottom-2 end-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    title="پیش‌نمایش تصویر"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Info & Metadata */}
              <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1 mb-1" title={img.title}>
                    {img.title || 'بدون عنوان'}
                  </h4>
                  {img.caption && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {img.caption}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>ترتیب: {img.order}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(img)}
                      className={`p-1.5 rounded hover:bg-muted transition-colors ${
                        img.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}
                      title={img.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {img.is_active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(img)}
                      className="p-1.5 rounded hover:bg-muted text-foreground transition-colors"
                      title="ویرایش متادیتا"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(img)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                      title="حذف از گالری"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Image Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.add_to_gallery') || 'افزودن تصویر به گالری'}</DialogTitle>
            <DialogDescription>
              تصویر جدید را انتخاب یا بارگذاری کرده و مشخصات نمایشی آن را تعیین کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step 1: Image Selection / Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">انتخاب تصویر</Label>
              {addMediaPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                  <img src={addMediaPreview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 end-2 text-xs"
                    onClick={() => {
                      setAddMediaId('');
                      setAddMediaPreview('');
                    }}
                  >
                    حذف و انتخاب مجدد
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Direct Upload Button */}
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-primary/60 rounded-lg cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {isUploading ? 'در حال بارگذاری...' : 'بارگذاری از رایانه'}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WebP تا ۱۰ مگابایت</span>
                    </label>

                    {/* Choose from Library Button */}
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(!showMediaPicker)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
                        showMediaPicker
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-border/80 bg-card text-foreground'
                      }`}
                    >
                      <ImageIcon className="w-6 h-6 mb-2 text-primary" />
                      <span className="text-xs font-medium">انتخاب از کتابخانه رسانه</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {availableMedia.length} تصویر موجود
                      </span>
                    </button>
                  </div>

                  {/* Media Picker Subgrid */}
                  {showMediaPicker && (
                    <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">یک تصویر را انتخاب کنید:</p>
                      {availableMedia.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">هیچ تصویری در کتابخانه رسانه موجود نیست.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {availableMedia.map((media) => (
                            <button
                              key={media.id}
                              type="button"
                              onClick={() => {
                                setAddMediaId(media.id);
                                setAddMediaPreview(media.url);
                                if (!addTitle) setAddTitle(media.original_name.replace(/\.[^/.]+$/, ''));
                                if (!addAltText && media.alt_text) setAddAltText(media.alt_text);
                                setShowMediaPicker(false);
                              }}
                              className="aspect-square rounded border border-border overflow-hidden hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <img src={media.url} alt={media.original_name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Form Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-title" className="text-xs font-medium">
                  عنوان تصویر <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-title"
                  value={addTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddTitle(e.target.value)}
                  placeholder="مثال: نیروگاه خورشیدی ۵ مگاواتی اصفهان"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-category" className="text-xs font-medium">
                  دسته‌بندی گالری
                </Label>
                <select
                  id="add-category"
                  value={addCategoryId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAddCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">(بدون دسته‌بندی)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-order" className="text-xs font-medium">
                  ترتیب نمایش (عددی)
                </Label>
                <Input
                  id="add-order"
                  type="number"
                  value={addOrder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddOrder(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-alt" className="text-xs font-medium">
                  متن جایگزین (Alt Text جهت سئو و دسترس‌پذیری)
                </Label>
                <Input
                  id="add-alt"
                  value={addAltText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddAltText(e.target.value)}
                  placeholder="توضیح کوتاه تصویر برای موتورهای جستجو"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-caption" className="text-xs font-medium">
                  زیرنویس / توضیحات تکمیلی
                </Label>
                <Textarea
                  id="add-caption"
                  rows={2}
                  value={addCaption}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddCaption(e.target.value)}
                  placeholder="توضیحات اختیاری درباره پروژه یا مکان تصویر..."
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-active"
                  checked={addIsActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddIsActive(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                />
                <Label htmlFor="add-active" className="text-xs cursor-pointer">
                  انتشار عمومی (در گالری سایت نمایش داده شود)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !addMediaId || !addTitle.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              ثبت و افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Image Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.edit_gallery_image') || 'ویرایش مشخصات تصویر گالری'}</DialogTitle>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-4 py-2">
              {activeItem.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={activeItem.image_url} alt={activeItem.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-medium">
                  عنوان تصویر <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-category" className="text-xs font-medium">
                    دسته‌بندی
                  </Label>
                  <select
                    id="edit-category"
                    value={editCategoryId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditCategoryId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">(بدون دسته‌بندی)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-order" className="text-xs font-medium">
                    ترتیب نمایش
                  </Label>
                  <Input
                    id="edit-order"
                    type="number"
                    value={editOrder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-alt" className="text-xs font-medium">
                  متن جایگزین (Alt Text)
                </Label>
                <Input
                  id="edit-alt"
                  value={editAltText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditAltText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-caption" className="text-xs font-medium">
                  زیرنویس / توضیحات
                </Label>
                <Textarea
                  id="edit-caption"
                  rows={2}
                  value={editCaption}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editIsActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditIsActive(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                />
                <Label htmlFor="edit-active" className="text-xs cursor-pointer">
                  انتشار عمومی (فعال)
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editTitle.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف تصویر از گالری</DialogTitle>
            <DialogDescription>
              آیا از حذف این تصویر از گالری مطمئن هستید؟ فایل اصلی رسانه در کتابخانه حفظ خواهد شد.
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <div className="py-2 flex items-center gap-3">
              {activeItem.image_url && (
                <img
                  src={activeItem.image_url}
                  alt={activeItem.title}
                  className="w-16 h-16 rounded object-cover border border-border"
                />
              )}
              <div>
                <p className="font-semibold text-sm text-foreground">{activeItem.title || 'بدون عنوان'}</p>
                {activeItem.category_title && (
                  <p className="text-xs text-muted-foreground">{activeItem.category_title}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(open: boolean) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4 bg-background">
          {previewImage && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center max-h-[75vh]">
                <img
                  src={previewImage.image_url}
                  alt={previewImage.alt_text || previewImage.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
              <div className="px-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-foreground">{previewImage.title}</h3>
                  {previewImage.category_title && (
                    <Badge variant="outline">{previewImage.category_title}</Badge>
                  )}
                </div>
                {previewImage.caption && (
                  <p className="text-sm text-muted-foreground mt-1">{previewImage.caption}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

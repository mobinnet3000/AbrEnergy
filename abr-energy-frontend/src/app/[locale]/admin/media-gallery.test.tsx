import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminMediaPage from './media/page';
import AdminGalleryPage from './gallery/page';

const MOCK_MEDIA = [
  {
    id: 'm-1',
    url: 'http://localhost:8000/media/uploads/solar-panel.jpg',
    thumbnail_url: 'http://localhost:8000/media/uploads/solar-panel-thumb.jpg',
    original_name: 'solar-panel.jpg',
    file_type: 'image',
    file_size: 1048576, // 1 MB
    alt_text: 'پنل خورشیدی مونوکریستال',
    subfolder: 'general',
    uploaded_at: '2026-10-10T12:00:00Z',
  },
  {
    id: 'm-2',
    url: 'http://localhost:8000/media/uploads/catalog.pdf',
    original_name: 'catalog.pdf',
    file_type: 'document',
    file_size: 2097152, // 2 MB
    alt_text: '',
    subfolder: 'documents',
    uploaded_at: '2026-10-12T14:00:00Z',
  },
];

const MOCK_GALLERY = [
  {
    id: 'g-1',
    title: 'نیروگاه خورشیدی ۵ مگاواتی اصفهان',
    caption: 'نمای هوایی از چیدمان پنل‌ها',
    image_url: 'http://localhost:8000/media/uploads/solar-panel.jpg',
    category: 'cat-1',
    category_title: 'نیروگاه‌های مگاواتی',
    order: 1,
    is_active: true,
  },
  {
    id: 'g-2',
    title: 'سیستم ساپورت مدولار سقف سوله',
    caption: 'نصب بدون تخریب سقف',
    image_url: 'http://localhost:8000/media/uploads/roof.jpg',
    category: 'cat-2',
    category_title: 'سقف سوله',
    order: 2,
    is_active: false,
  },
];

const MOCK_CATEGORIES = [
  { id: 'cat-1', title: 'نیروگاه‌های مگاواتی', slug: 'megawatt-plants' },
  { id: 'cat-2', title: 'سقف سوله', slug: 'rooftop' },
];

const updateMediaMock = vi.fn();
const createGalleryMock = vi.fn();
const updateGalleryMock = vi.fn();
const deleteGalleryMock = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useAdminMediaList: ({ file_type, search }: { file_type?: string; search?: string } = {}) => {
    let filtered = MOCK_MEDIA;
    if (file_type && file_type !== 'all') {
      filtered = filtered.filter((m) => m.file_type === file_type);
    }
    if (search) {
      filtered = filtered.filter((m) => m.original_name.includes(search) || m.alt_text?.includes(search));
    }
    return { data: filtered, isLoading: false, refetch: vi.fn() };
  },
  useUpdateAdminMedia: () => ({
    mutate: updateMediaMock,
    mutateAsync: updateMediaMock,
    isPending: false,
  }),
  useAdminGalleryImages: () => ({
    data: MOCK_GALLERY,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAdminGalleryCategories: () => ({
    data: MOCK_CATEGORIES,
    isLoading: false,
  }),
  useCreateAdminGalleryImage: () => ({
    mutateAsync: createGalleryMock,
    isPending: false,
  }),
  useUpdateAdminGalleryImage: () => ({
    mutateAsync: updateGalleryMock,
    isPending: false,
  }),
  useDeleteAdminGalleryImage: () => ({
    mutateAsync: deleteGalleryMock,
    isPending: false,
  }),
}));

vi.mock('@/api', () => ({
  mediaApi: {
    upload: vi.fn().mockResolvedValue({ id: 'm-new', url: 'http://localhost:8000/media/new.jpg' }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'admin.media': 'مدیریت رسانه‌ها',
        'admin.gallery': 'مدیریت گالری تصاویر',
        'admin.add_to_gallery': 'افزودن تصویر به گالری',
        'admin.edit_media': 'ویرایش رسانه',
        'admin.alt_text_label': 'متن جایگزین (Alt Text)',
        'admin.edit_gallery_image': 'ویرایش مشخصات تصویر گالری',
        'admin.saved_successfully': 'تغییرات با موفقیت ذخیره شد',
        'admin.all_files': 'همه فایل‌ها',
        'admin.filter_all': 'همه فایل‌ها',
        'admin.images': 'تصاویر',
        'admin.filter_documents': 'اسناد (PDF)',
        'admin.upload_media': 'بارگذاری فایل جدید',
      };
      return dict[key] || key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

describe('Phase 12.20 — CMS Media and Gallery Management', () => {
  beforeEach(() => {
    updateMediaMock.mockClear();
    createGalleryMock.mockClear();
    updateGalleryMock.mockClear();
    deleteGalleryMock.mockClear();
  });

  describe('Admin Media Library (/admin/media)', () => {
    it('renders media library with files and supports filtering', () => {
      render(<AdminMediaPage />);

      expect(screen.getByText('مدیریت رسانه‌ها')).toBeInTheDocument();
      expect(screen.getByText('solar-panel.jpg')).toBeInTheDocument();
      expect(screen.getByText('catalog.pdf')).toBeInTheDocument();

      // Click documents filter
      const docFilter = screen.getByRole('button', { name: /اسناد \(PDF\)/i });
      fireEvent.click(docFilter);
    });

    it('opens alt text editor dialog on edit button click', () => {
      render(<AdminMediaPage />);

      const editButtons = screen.getAllByTitle('ویرایش متادیتا');
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('ویرایش رسانه')).toBeInTheDocument();
      expect(screen.getByText('متن جایگزین (Alt Text)')).toBeInTheDocument();
    });
  });

  describe('Admin Gallery (/admin/gallery)', () => {
    it('renders gallery images with categories and publication badges', () => {
      render(<AdminGalleryPage />);

      expect(screen.getByText('مدیریت گالری تصاویر')).toBeInTheDocument();
      expect(screen.getByText('نیروگاه خورشیدی ۵ مگاواتی اصفهان')).toBeInTheDocument();
      expect(screen.getByText('سیستم ساپورت مدولار سقف سوله')).toBeInTheDocument();

      // Active & Draft badges
      expect(screen.getByText('فعال')).toBeInTheDocument();
      expect(screen.getByText('پیش‌نویس')).toBeInTheDocument();

      // Category badge
      expect(screen.getByText('نیروگاه‌های مگاواتی')).toBeInTheDocument();
    });

    it('filters gallery images by search text', () => {
      render(<AdminGalleryPage />);

      const searchInput = screen.getByPlaceholderText('جستجو در عنوان، زیرنویس یا دسته‌بندی...');
      fireEvent.change(searchInput, { target: { value: 'اصفهان' } });

      expect(screen.getByText('نیروگاه خورشیدی ۵ مگاواتی اصفهان')).toBeInTheDocument();
      expect(screen.queryByText('سیستم ساپورت مدولار سقف سوله')).not.toBeInTheDocument();
    });

    it('toggles active status when toggle button is clicked', () => {
      render(<AdminGalleryPage />);

      const activeToggleBtn = screen.getByTitle('غیرفعال کردن');
      fireEvent.click(activeToggleBtn);

      expect(updateGalleryMock).toHaveBeenCalledWith({
        id: 'g-1',
        data: { is_active: false },
      });
    });

    it('opens delete confirmation modal and calls delete mutation', async () => {
      render(<AdminGalleryPage />);

      const deleteButtons = screen.getAllByTitle('حذف از گالری');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('حذف تصویر از گالری')).toBeInTheDocument();

      const confirmDelete = screen.getByRole('button', { name: 'حذف قطعی' });
      fireEvent.click(confirmDelete);

      await waitFor(() => {
        expect(deleteGalleryMock).toHaveBeenCalledWith('g-1');
      });
    });
  });
});

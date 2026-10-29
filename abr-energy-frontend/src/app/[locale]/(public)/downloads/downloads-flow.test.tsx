import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DownloadsClient from './downloads-client';
import type { PublicDocument } from '@/types';

const MOCK_DOCS: PublicDocument[] = [
  {
    id: 'doc-1',
    title: 'کاتالوگ جامع نیروگاه خورشیدی ابر انرژی',
    doc_type: 'catalog',
    description: 'مشخصات فنی پکیج‌ها و نیروگاه‌های خورشیدی متصل و منفصل از شبکه',
    url: 'http://localhost:8000/media/documents/solar_catalog.pdf',
    file_size: 5242880, // 5 MB
    original_name: 'solar_catalog.pdf',
    product_title: 'پکیج خورشیدی ۵ کیلووات',
    product_slug: 'solar-5kw',
    category_title: 'پکیج‌های خورشیدی',
    category_slug: 'solar-packages',
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'doc-2',
    title: 'راهنمای نصب سیستم ساپورت مدولار',
    doc_type: 'manual',
    description: 'دستورالعمل مهندسی نصب استراکچرهای مدولار گالوانیزه گرم',
    url: 'http://localhost:8000/media/documents/modular_manual.pdf',
    file_size: 2097152, // 2 MB
    original_name: 'modular_manual.pdf',
    product_title: 'ساپورت مدولار صنعتی',
    product_slug: 'modular-support-heavy',
    category_title: 'سیستم‌های ساپورت مدولار',
    category_slug: 'modular-supports',
    created_at: '2026-10-05T12:00:00Z',
  },
];

vi.mock('@/hooks/use-api', () => ({
  usePublicDocuments: () => ({
    data: MOCK_DOCS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/components/home/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'downloads.title': 'دانلودها و کاتالوگ‌ها',
        'downloads.subtitle': 'دریافت مستقیم کاتالوگ‌های فنی و اسناد مهندسی',
        'downloads.all_documents': 'همه اسناد',
        'downloads.solar_catalog': 'کاتالوگ نیروگاه خورشیدی',
        'downloads.modular_catalog': 'کاتالوگ سیستم ساپورت مدولار',
        'downloads.search_placeholder': 'جستجو در اسناد و کاتالوگ‌ها...',
        'downloads.empty_title': 'سندی یافت نشد',
        'downloads.download_file': 'دانلود سند',
      };
      return dict[key] || key;
    },
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
let currentQuery = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(currentQuery),
  usePathname: () => '/fa/downloads',
}));

describe('Phase 12.20 — Downloads Page Flow', () => {
  beforeEach(() => {
    currentQuery = '';
    pushMock.mockClear();
    replaceMock.mockClear();
  });

  it('renders real downloadable documents with valid URLs and metadata', () => {
    render(<DownloadsClient />);

    expect(screen.getByText('دانلودها و کاتالوگ‌ها')).toBeInTheDocument();
    expect(screen.getByText('کاتالوگ جامع نیروگاه خورشیدی ابر انرژی')).toBeInTheDocument();
    expect(screen.getByText('راهنمای نصب سیستم ساپورت مدولار')).toBeInTheDocument();

    const downloadLinks = screen.getAllByRole('link', { name: /دانلود سند/i });
    expect(downloadLinks).toHaveLength(2);
    expect(downloadLinks[0]).toHaveAttribute(
      'href',
      'http://localhost:8000/media/documents/solar_catalog.pdf',
    );
    expect(downloadLinks[1]).toHaveAttribute(
      'href',
      'http://localhost:8000/media/documents/modular_manual.pdf',
    );
  });

  it('filters documents when category pill is selected', () => {
    render(<DownloadsClient />);

    const solarPill = screen.getByRole('button', { name: /کاتالوگ نیروگاه خورشیدی/i });
    fireEvent.click(solarPill);

    expect(screen.getByText('کاتالوگ جامع نیروگاه خورشیدی ابر انرژی')).toBeInTheDocument();
    expect(screen.queryByText('راهنمای نصب سیستم ساپورت مدولار')).not.toBeInTheDocument();
  });

  it('filters documents by search query', () => {
    render(<DownloadsClient />);

    const searchInput = screen.getByPlaceholderText('جستجو در اسناد و کاتالوگ‌ها...');
    fireEvent.change(searchInput, { target: { value: 'ساپورت' } });

    expect(screen.queryByText('کاتالوگ جامع نیروگاه خورشیدی ابر انرژی')).not.toBeInTheDocument();
    expect(screen.getByText('راهنمای نصب سیستم ساپورت مدولار')).toBeInTheDocument();
  });

  it('shows honest empty state when no documents match and restores on reset', () => {
    render(<DownloadsClient />);

    const searchInput = screen.getByPlaceholderText('جستجو در اسناد و کاتالوگ‌ها...');
    fireEvent.change(searchInput, { target: { value: 'کلمه ناموجود' } });

    expect(screen.getByText('سندی یافت نشد')).toBeInTheDocument();
    expect(screen.queryByText('کاتالوگ جامع نیروگاه خورشیدی ابر انرژی')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('کاتالوگ جامع نیروگاه خورشیدی ابر انرژی')).toBeInTheDocument();
    expect(screen.getByText('راهنمای نصب سیستم ساپورت مدولار')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactPage from './page';
import axiosInstance from '@/api/axios';
import faLocale from '../../../../../locales/fa.json';

function getNestedTranslation(obj: unknown, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => getNestedTranslation(faLocale, key),
    locale: 'fa' as const,
    dir: 'rtl' as const,
    isRTL: true,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/fa/contact',
}));

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        phone_number: '021-88887777',
        email: 'info@abarenergy.ir',
        address: 'تهران، خیابان آزادی',
      },
    }),
    post: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({
      data: {
        phone_number: '021-88887777',
        email: 'info@abarenergy.ir',
        address: 'تهران، خیابان آزادی',
      },
    }),
  };
});

describe('Public Contact Form Flow (Phase 12.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact page with real contact details from settings', () => {
    render(<ContactPage />);

    expect(screen.getByText('021-88887777')).toBeInTheDocument();
    expect(screen.getByText('info@abarenergy.ir')).toBeInTheDocument();
    expect(screen.getByText('تهران، خیابان آزادی')).toBeInTheDocument();
  });

  it('submits contact form and normalizes Persian digits to ASCII', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: { id: 'c-new' } });

    render(<ContactPage />);

    const nameInput = screen.getByLabelText('نام و نام خانوادگی');
    const emailInput = screen.getByLabelText('ایمیل');
    const phoneInput = screen.getByLabelText('شماره تماس');
    const messageInput = screen.getByLabelText('پیام شما');

    fireEvent.change(nameInput, { target: { value: 'محمد رضایی' } });
    fireEvent.change(emailInput, { target: { value: 'mohammad@example.com' } });
    // User types Persian numerals
    fireEvent.change(phoneInput, { target: { value: '۰۹۱۲۳۴۵۶۷۸۹' } });
    fireEvent.change(messageInput, { target: { value: 'درخواست سیستم خورشیدی ویلا' } });

    const submitBtn = screen.getByRole('button', { name: /ارسال پیام/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/contact/',
        expect.objectContaining({
          full_name: 'محمد رضایی',
          email: 'mohammad@example.com',
          phone: '09123456789',
          message: 'درخواست سیستم خورشیدی ویلا',
        })
      );
    });
  });

  it('preserves user input when server returns an error', async () => {
    vi.mocked(axiosInstance.post).mockRejectedValueOnce({
      response: {
        data: {
          errors: {
            phone: ['شماره تماس نامعتبر است'],
          },
        },
      },
    });

    render(<ContactPage />);

    const nameInput = screen.getByLabelText('نام و نام خانوادگی');
    const emailInput = screen.getByLabelText('ایمیل');
    const phoneInput = screen.getByLabelText('شماره تماس');
    const messageInput = screen.getByLabelText('پیام شما');

    fireEvent.change(nameInput, { target: { value: 'حسین احمدی' } });
    fireEvent.change(emailInput, { target: { value: 'hossein@test.com' } });
    fireEvent.change(phoneInput, { target: { value: '09110001122' } });
    fireEvent.change(messageInput, { target: { value: 'پیام مهم با جزییات کافی' } });

    const submitBtn = screen.getByRole('button', { name: /ارسال پیام/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
    });

    // Inputs must be preserved and not wiped on error
    expect((nameInput as HTMLInputElement).value).toBe('حسین احمدی');
    expect((emailInput as HTMLInputElement).value).toBe('hossein@test.com');
    expect((phoneInput as HTMLInputElement).value).toBe('09110001122');
    expect((messageInput as HTMLTextAreaElement).value).toBe('پیام مهم با جزییات کافی');
  });
});

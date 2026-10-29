import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { LocaleContext } from '@/i18n/locale-context';
import type { Locale } from '@/i18n/config';

function renderWithLocale(ui: React.ReactElement, locale: Locale = 'fa') {
  return render(
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: vi.fn(),
        t: (k: string) => k,
        dir: locale === 'en' ? 'ltr' : 'rtl',
        isRTL: locale !== 'en',
      }}
    >
      {ui}
    </LocaleContext.Provider>
  );
}

describe('Select Component Localization & Enum Label Resolution', () => {
  it('renders Persian localized label for "draft" on initial render in FA locale', () => {
    renderWithLocale(
      <Select value="draft">
        <SelectTrigger aria-label="Status filter">
          <SelectValue placeholder="انتخاب وضعیت" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه</SelectItem>
          <SelectItem value="draft">پیش‌نویس</SelectItem>
          <SelectItem value="published">منتشر شده</SelectItem>
        </SelectContent>
      </Select>,
      'fa'
    );

    expect(screen.getByText('پیش‌نویس')).toBeInTheDocument();
  });

  it('renders English localized label for "draft" when in EN locale', () => {
    renderWithLocale(
      <Select value="draft">
        <SelectTrigger aria-label="Status filter">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
        </SelectContent>
      </Select>,
      'en'
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders Arabic localized label for "super_admin" when in AR locale', () => {
    renderWithLocale(
      <Select value="super_admin">
        <SelectTrigger aria-label="Role select">
          <SelectValue placeholder="اختر الدور" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="super_admin">المدير العام للنظام</SelectItem>
        </SelectContent>
      </Select>,
      'ar'
    );

    expect(screen.getByText('المدير العام للنظام')).toBeInTheDocument();
  });

  it('renders Persian localized battery type "lithium" on calculator select', () => {
    renderWithLocale(
      <Select value="lithium">
        <SelectTrigger aria-label="Battery select">
          <SelectValue placeholder="نوع باتری" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lithium">باتری لیتیوم-یون</SelectItem>
          <SelectItem value="lead_acid">باتری سرب-اسید</SelectItem>
        </SelectContent>
      </Select>,
      'fa'
    );

    expect(screen.getByText('باتری لیتیوم-یون')).toBeInTheDocument();
  });
});

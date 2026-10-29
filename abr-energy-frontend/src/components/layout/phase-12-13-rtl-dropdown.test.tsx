import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopNav } from '@/components/layout/header-nav';

vi.mock('@/i18n', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    locale: 'fa' as const,
    setLocale: () => {},
    dir: 'rtl' as const,
    isRTL: true,
  }),
  localeNames: { fa: 'FA', ar: 'AR', en: 'EN' },
  activeLocales: ['fa'],
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicProductCategories: () => ({
    data: [
      {
        id: 'parent-1', title: 'پکیج‌ها', slug: 'packages', parent: null,
        sort_order: 0, is_active: true, is_featured: false,
        children: [
          { id: 'child-1', title: 'آپارتمان', slug: 'apartment', parent: 'parent-1', sort_order: 0, is_active: true, is_featured: false },
        ],
      },
    ],
  }),
  useServices: () => ({ data: [] }),
  useProjects: () => ({ data: [] }),
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/fa' }));

beforeEach(() => vi.clearAllMocks());

describe('Phase 12.13 — RTL dropdown alignment', () => {
  it('anchors the desktop submenu with the RTL-safe inline-start edge (not end-0)', () => {
    render(<DesktopNav isActive={() => false} />);
    fireEvent.click(screen.getAllByLabelText('common.open_menu')[0]);
    const panel = document.querySelector('[id^="nav-panel-"]') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel?.className).toContain('start-0');
    expect(panel?.className).not.toContain('end-0');
  });

  it('renders product subcategory links inside the glass panel', () => {
    render(<DesktopNav isActive={() => false} />);
    fireEvent.click(screen.getAllByLabelText('common.open_menu')[0]);
    const panel = document.querySelector('[id^="nav-panel-"]') as HTMLElement;
    expect(panel.querySelector('a[href="/products/category/apartment"]')).toBeTruthy();
    expect(panel.className).toContain('backdrop-blur-2xl');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
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
  activeLocales: ['fa', 'ar', 'en'],
}));

// Live entity payloads are mutable so each test can set its own CMS content.
const state = vi.hoisted(() => ({
  services: [] as { id: string; title: string; slug: string; status: string }[],
  projects: [] as { id: string; title: string; slug: string }[],
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicProductCategories: () => ({ data: [] }),
  useServices: () => ({ data: state.services }),
  useProjects: () => ({ data: state.projects }),
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/fa' }));

function service(id: string, slug: string, status = 'active') {
  return { id, title: `خدمت ${id}`, slug, status };
}

beforeEach(() => {
  state.services = [];
  state.projects = [];
});

describe('Phase 12.11 — services / projects submenus link to real detail pages', () => {
  it('renders active services from the CMS with real /services/<slug> links', () => {
    state.services = [service('1', 'on-grid-system'), service('2', 'off-grid-system')];
    render(<DesktopNav isActive={() => false} />);

    screen.getAllByLabelText('common.open_menu').forEach((o) => fireEvent.click(o));

    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/services/on-grid-system');
    expect(hrefs).toContain('/services/off-grid-system');
  });

  it('excludes inactive services and links projects to their slug', () => {
    state.services = [service('1', 'on-grid-system', 'active'), service('9', 'draft-svc', 'inactive')];
    state.projects = [{ id: '7', title: 'نیروگاه', slug: '50kw-shiraz' }];
    render(<DesktopNav isActive={() => false} />);

    screen.getAllByLabelText('common.open_menu').forEach((o) => fireEvent.click(o));

    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/services/on-grid-system');
    expect(hrefs).not.toContain('/services/draft-svc');
    expect(hrefs).toContain('/projects/50kw-shiraz');
  });

  it('falls back to the configured section-index children when the API is empty', () => {
    render(<DesktopNav isActive={() => false} />);
    screen.getAllByLabelText('common.open_menu').forEach((o) => fireEvent.click(o));

    const serviceHrefs = Array.from(document.querySelectorAll('a'))
      .map((a) => a.getAttribute('href'))
      .filter((h): h is string => !!h && h.startsWith('/services'));
    expect(serviceHrefs.length).toBeGreaterThan(0);
    expect(serviceHrefs.every((h) => h === '/services')).toBe(true);
  });
});

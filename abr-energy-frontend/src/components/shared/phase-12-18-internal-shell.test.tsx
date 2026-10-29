import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InternalPageShell } from './internal-page-shell';
import { InternalPageHeader } from './internal-page-header';
import { BreadcrumbTrail } from './breadcrumb-trail';

describe('Phase 12.18 — InternalPageShell', () => {
  it('renders children with internal-page-shell, site-header-offset, and horizon line', () => {
    const { container } = render(
      <InternalPageShell className="custom-class">
        <div data-testid="child-content">محتوای صفحه داخلی</div>
      </InternalPageShell>,
    );

    const shell = container.firstChild as HTMLElement;
    expect(shell).toHaveClass('internal-page-shell');
    expect(shell).toHaveClass('site-header-offset');
    expect(shell).toHaveClass('custom-class');
    expect(container.querySelector('.internal-horizon-line')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('can omit site-header-offset when headerOffset is false', () => {
    const { container } = render(
      <InternalPageShell headerOffset={false}>
        <div>بدون فاصله سربرگ</div>
      </InternalPageShell>,
    );

    const shell = container.firstChild as HTMLElement;
    expect(shell).toHaveClass('internal-page-shell');
    expect(shell).not.toHaveClass('site-header-offset');
  });
});

describe('Phase 12.18 — InternalPageHeader', () => {
  it('renders title, subtitle, and eyebrow', () => {
    render(
      <InternalPageHeader
        eyebrow="خدمات تخصصی"
        title="طراحی نیروگاه خورشیدی"
        subtitle="ارائه راهکارهای جامع انرژی تجدیدپذیر"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'طراحی نیروگاه خورشیدی' })).toBeInTheDocument();
    expect(screen.getByText('خدمات تخصصی')).toBeInTheDocument();
    expect(screen.getByText('ارائه راهکارهای جامع انرژی تجدیدپذیر')).toBeInTheDocument();
  });

  it('renders breadcrumbs and actions when provided', () => {
    render(
      <InternalPageHeader
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'محصولات', href: '/products' },
          { label: 'پنل خورشیدی ۵۵۰ وات' },
        ]}
        title="پنل خورشیدی ۵۵۰ وات"
        actions={<button data-testid="header-action">ثبت سفارش</button>}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'خانه' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'محصولات' })).toHaveAttribute('href', '/products');
    expect(screen.getByText('پنل خورشیدی ۵۵۰ وات', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
    expect(screen.getByTestId('header-action')).toBeInTheDocument();
  });
});

describe('Phase 12.18 — BreadcrumbTrail', () => {
  it('renders RTL-aware chevrons and accessibility attributes', () => {
    const { container } = render(
      <BreadcrumbTrail
        trail={[
          { label: 'خانه', href: '/' },
          { label: 'پروژه‌ها', href: '/projects' },
          { label: 'نیروگاه ۱ مگاواتی سمنان' },
        ]}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeInTheDocument();

    // Check separator has RTL rotation class
    const separators = container.querySelectorAll('.rtl\\:rotate-180');
    expect(separators.length).toBe(2);

    // Check last item has aria-current="page"
    const currentPage = screen.getByText('نیروگاه ۱ مگاواتی سمنان');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('renders empty when trail array is empty', () => {
    const { container } = render(<BreadcrumbTrail trail={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

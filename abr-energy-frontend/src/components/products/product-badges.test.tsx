import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductStatusBadge, ProductVisibilityBadge, PriceStateBadge } from './product-status-badge';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

describe('ProductStatusBadge', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders each publishing state distinctly', () => {
    const { rerender } = render(<ProductStatusBadge status="draft" />);
    expect(screen.getByText('admin.status_draft')).toBeTruthy();
    rerender(<ProductStatusBadge status="published" />);
    expect(screen.getByText('admin.status_published')).toBeTruthy();
    rerender(<ProductStatusBadge status="archived" />);
    expect(screen.getByText('admin.status_archived')).toBeTruthy();
  });

  it('keeps status and visibility as separate concepts', () => {
    render(
      <div>
        <ProductStatusBadge status="published" />
        <ProductVisibilityBadge visibility="hidden" />
      </div>,
    );
    expect(screen.getByText('admin.status_published')).toBeTruthy();
    expect(screen.getByText('admin.visibility_hidden')).toBeTruthy();
  });
});

describe('PriceStateBadge', () => {
  it('renders all six backend price states', () => {
    const states = ['contact_for_price', 'regular', 'discounted', 'scheduled', 'expired', 'hidden'];
    for (const state of states) {
      document.body.innerHTML = '';
      render(<PriceStateBadge state={state} />);
      expect(document.body.textContent).toContain(`admin.price_state_${state === 'contact_for_price' ? 'contact' : state}`);
    }
  });

  it('shows the discounted state for discounted products', () => {
    document.body.innerHTML = '';
    render(<PriceStateBadge state="discounted" />);
    expect(screen.getByText('admin.price_state_discounted')).toBeTruthy();
  });
});

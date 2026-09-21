import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductPrice } from './ProductPrice';
import type { ProductListItem } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

type Price = ProductListItem['price'];

function price(overrides: Partial<Price>): Price {
  return { state: 'regular', currency: 'IRR', ...overrides };
}

describe('ProductPrice (backend effective state only)', () => {
  it('renders the regular backend price with Persian digits', () => {
    render(<ProductPrice price={price({ state: 'regular', regular_price: '10000000', final_price: '10000000' })} />);
    expect(screen.getByText((10000000).toLocaleString('fa-IR'), { exact: false })).toBeTruthy();
    expect(screen.getByText('products.currency_toman', { exact: false })).toBeTruthy();
  });

  it('renders discounted products with original line-through + prominent final price', () => {
    const { container } = render(
      <ProductPrice
        price={price({ state: 'discounted', regular_price: '20000000', sale_price: '15000000', final_price: '15000000' })}
      />,
    );
    // Final price from the backend is shown...
    expect(screen.getByText((15000000).toLocaleString('fa-IR'), { exact: false })).toBeTruthy();
    // ...original is struck through...
    const struck = container.querySelector('.line-through');
    expect(struck).toBeTruthy();
    expect(struck?.textContent).toContain((20000000).toLocaleString('fa-IR'));
    // ...and no discount percentage is calculated in React.
    expect(container.textContent).not.toMatch(/%/);
    expect(container.textContent).not.toMatch(/٪/);
  });

  it('renders the contact-for-price state without any numbers', () => {
    const { container } = render(<ProductPrice price={price({ state: 'contact_for_price' })} />);
    expect(screen.getByText('products.price_contact')).toBeTruthy();
    expect(container.textContent).not.toMatch(/[0-9۰-۹]/);
  });

  it('renders scheduled/expired notes without inventing prices', () => {
    const scheduled = render(
      <ProductPrice price={price({ state: 'scheduled', regular_price: '5000000', final_price: '5000000' })} />,
    );
    expect(scheduled.getByText('products.price_soon')).toBeTruthy();
    expect(scheduled.getByText((5000000).toLocaleString('fa-IR'), { exact: false })).toBeTruthy();

    const expired = render(
      <ProductPrice price={price({ state: 'expired', regular_price: '5000000', final_price: '5000000' })} />,
    );
    expect(expired.getByText('products.price_expired_note')).toBeTruthy();
  });

  it('renders nothing for hidden prices or missing price data', () => {
    const hidden = render(<ProductPrice price={price({ state: 'hidden' })} />);
    expect(hidden.container.textContent).toBe('');
    const missing = render(<ProductPrice price={null} />);
    expect(missing.container.textContent).toBe('');
  });
});

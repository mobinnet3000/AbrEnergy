import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySelector } from './category-selector';
import type { ProductCategory } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

// Radix/base-ui Select renders options in a portal; open the trigger first.
function openSelect() {
  fireEvent.click(screen.getByLabelText('admin.category_field'));
}
describe('CategorySelector', () => {
  const cats: ProductCategory[] = [
    { id: 'p1', title: 'والد', slug: 'parent', parent: null, sort_order: 0, is_active: true, is_featured: false },
    { id: 'c1', title: 'فرزند', slug: 'child', parent: 'p1', sort_order: 0, is_active: true, is_featured: false },
  ];

  it('renders the trigger with an accessible label', () => {
    render(<CategorySelector categories={cats} value="" onChange={() => undefined} />);
    expect(screen.getByLabelText('admin.category_field')).toBeTruthy();
  });

  it('supports an empty (no category) value', () => {
    render(<CategorySelector categories={cats} value="" onChange={() => undefined} />);
    openSelect();
    expect(screen.getByText('admin.no_category')).toBeTruthy();
  });

  it('keeps working when categories change (no hardcoded data)', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CategorySelector categories={[]} value="" onChange={onChange} />);
    openSelect();
    expect(screen.getByText('admin.no_category')).toBeTruthy();
    fireEvent.click(screen.getByText('admin.no_category'));
    expect(onChange).toHaveBeenCalledWith('');
    rerender(<CategorySelector categories={cats} value="c1" onChange={onChange} />);
    expect(screen.getByLabelText('admin.category_field')).toBeTruthy();
  });
});

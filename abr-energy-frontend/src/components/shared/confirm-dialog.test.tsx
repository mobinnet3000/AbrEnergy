import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

describe('ConfirmDialog', () => {
  it('renders Persian title/description and calls onConfirm', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="حذف دسته‌بندی"
        description="ادامه می‌دهید؟"
        confirmText="حذف"
        cancelText="انصراف"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('حذف دسته‌بندی')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'حذف' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onConfirm when cancelled', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        description="d"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductMediaManager } from './product-media-manager';
import { ProductSpecificationsEditor } from './product-specifications-editor';
import type { ProductImageFormItem, ProductSpecFormItem } from '@/lib/product-form';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

vi.mock('@/components/shared/media-upload', () => ({
  MediaUpload: ({ onUpload, label }: { onUpload: (url: string, id?: string) => void; label: string }) => (
    <button type="button" onClick={() => onUpload('http://x/new.png', 'media-new')}>{label}</button>
  ),
}));

vi.mock('@/components/shared/media-picker-dialog', () => ({
  ChooseMediaButton: ({ onSelect }: { onSelect: (items: { id: string; url: string; alt_text?: string }[]) => void }) => (
    <button type="button" onClick={() => onSelect([{ id: 'media-picked', url: 'http://x/picked.png', alt_text: '' }])}>
      admin.media_choose_existing
    </button>
  ),
}));

const img = (over: Partial<ProductImageFormItem> = {}): ProductImageFormItem => ({
  key: 'k1',
  media_file: 'm1',
  url: 'http://x/1.png',
  sort_order: 0,
  is_cover: true,
  alt_text: '',
  caption: '',
  ...over,
});

describe('ProductMediaManager', () => {
  it('shows an empty state with no images', () => {
    render(<ProductMediaManager images={[]} onChange={() => undefined} />);
    expect(screen.getByText('admin.media_empty')).toBeTruthy();
  });

  it('marks the cover image and edits alt text', () => {
    const onChange = vi.fn();
    render(<ProductMediaManager images={[img()]} onChange={onChange} />);
    expect(screen.getByText('admin.media_cover')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('admin.media_alt'), { target: { value: 'متن' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ alt_text: 'متن' })]);
  });

  it('reorders images with accessible controls', () => {
    const onChange = vi.fn();
    render(
      <ProductMediaManager
        images={[img({ key: 'a', sort_order: 0 }), img({ key: 'b', media_file: 'm2', url: 'u2', sort_order: 1, is_cover: false })]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByLabelText('admin.media_reorder_down')[0]);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ key: 'b', sort_order: 0 }),
      expect.objectContaining({ key: 'a', sort_order: 1 }),
    ]);
  });

  it('uploads into the product context', () => {
    const onChange = vi.fn();
    render(<ProductMediaManager images={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('admin.media_upload_images'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ media_file: 'media-new', is_cover: true }),
    ]);
  });

  it('Phase 9.5 — choose-existing appends picked ids as new rows (no new upload)', () => {
    const onChange = vi.fn();
    render(<ProductMediaManager images={[img()]} onChange={onChange} />);
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ media_file: 'm1' }),
      expect.objectContaining({ media_file: 'media-picked', url: 'http://x/picked.png', is_cover: false, sort_order: 1 }),
    ]);
  });

  it('Phase 9.5 — choose-existing skips already-attached ids', () => {
    const onChange = vi.fn();
    render(<ProductMediaManager images={[img({ media_file: 'media-picked' })]} onChange={onChange} />);
    fireEvent.click(screen.getByText('admin.media_choose_existing'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders nested API errors near the gallery', () => {
    render(<ProductMediaManager images={[]} onChange={() => undefined} errors={['bad image']} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});

const spec = (over: Partial<ProductSpecFormItem> = {}): ProductSpecFormItem => ({
  key: 's1',
  section: 'فنی',
  label: 'توان',
  value: '5',
  unit: 'kW',
  sort_order: 0,
  ...over,
});

describe('ProductSpecificationsEditor', () => {
  it('shows an empty state and adds rows', () => {
    const onChange = vi.fn();
    render(<ProductSpecificationsEditor specs={[]} onChange={onChange} />);
    expect(screen.getByText('admin.specs_empty')).toBeTruthy();
    fireEvent.click(screen.getByText('admin.specs_add'));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ label: '' })]);
  });

  it('groups rows by section and removes rows', () => {
    const onChange = vi.fn();
    render(
      <ProductSpecificationsEditor
        specs={[spec(), spec({ key: 's2', label: 'ولتاژ', value: '220', unit: 'V', sort_order: 1 })]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('فنی')).toBeTruthy();
    fireEvent.click(screen.getAllByLabelText('admin.delete')[0]);
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ key: 's2', sort_order: 0 })]);
  });
});

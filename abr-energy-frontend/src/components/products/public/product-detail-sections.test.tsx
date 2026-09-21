import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductSpecifications, groupPublicSpecs } from './ProductSpecifications';
import { ProductAttributes, renderAttributeDisplay } from './ProductAttributes';
import { ProductDocuments } from './ProductDocuments';
import type {
  ProductAttributeValueItem,
  ProductDocumentItem,
  ProductSpecificationItem,
} from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

function spec(overrides: Partial<ProductSpecificationItem> = {}): ProductSpecificationItem {
  return { id: `s-${Math.random()}`, section: '', label: 'برچسب', value: 'مقدار', unit: '', sort_order: 0, ...overrides };
}

function attr(overrides: Partial<ProductAttributeValueItem> = {}): ProductAttributeValueItem {
  return {
    id: `a-${Math.random()}`, code: 'c', name: 'نام', data_type: 'text', unit: '',
    value_text: '', value_number: null, value_boolean: null, display: '',
    ...overrides,
  };
}

describe('ProductSpecifications', () => {
  it('groups rows by section preserving backend order', () => {
    const specs = [
      spec({ id: 's1', section: 'الکتریکی', label: 'توان', value: '۵۵۰', unit: 'وات', sort_order: 1 }),
      spec({ id: 's2', section: 'الکتریکی', label: 'ولتاژ', value: '۴۰', unit: 'ولت', sort_order: 0 }),
      spec({ id: 's3', section: 'مکانیکی', label: 'وزن', value: '۲۸', unit: 'کیلوگرم' }),
    ];
    const groups = groupPublicSpecs(specs);
    expect(groups.map((g) => g.section)).toEqual(['الکتریکی', 'مکانیکی']);
    expect(groups[0].rows.map((r) => r.label)).toEqual(['ولتاژ', 'توان']);
  });

  it('renders section cards with label, value and unit', () => {
    render(
      <ProductSpecifications
        specs={[spec({ id: 's1', section: 'الکتریکی', label: 'توان', value: '۵۵۰', unit: 'وات' })]}
      />,
    );
    expect(screen.getByText('products.specs_title')).toBeTruthy();
    expect(screen.getByText('الکتریکی')).toBeTruthy();
    expect(screen.getByText('توان')).toBeTruthy();
    expect(screen.getByText('۵۵۰', { exact: false })).toBeTruthy();
    expect(screen.getByText('وات')).toBeTruthy();
  });

  it('renders nothing when there are no specifications', () => {
    const { container } = render(<ProductSpecifications specs={[]} />);
    expect(container.textContent).toBe('');
  });
});

describe('ProductAttributes (dynamic backend definitions)', () => {
  it('localizes boolean display values without hardcoding fields', () => {
    expect(renderAttributeDisplay(attr({ data_type: 'boolean', display: true }), 'بله', 'خیر')).toBe('بله');
    expect(renderAttributeDisplay(attr({ data_type: 'boolean', display: false }), 'بله', 'خیر')).toBe('خیر');
  });

  it('formats number values with Persian digits and backend unit', () => {
    expect(
      renderAttributeDisplay(attr({ data_type: 'number', value_number: '5.5', unit: 'kW' }), 'بله', 'خیر'),
    ).toBe(`${(5.5).toLocaleString('fa-IR')} kW`);
  });

  it('renders attribute rows from backend definitions', () => {
    render(
      <ProductAttributes
        values={[
          attr({ id: 'a1', name: 'توان نامی', data_type: 'number', value_number: '550', unit: 'W', display: '550 W' }),
          attr({ id: 'a2', name: 'ضد آب', data_type: 'boolean', display: true }),
        ]}
      />,
    );
    expect(screen.getByText('products.attributes_title')).toBeTruthy();
    expect(screen.getByText('توان نامی')).toBeTruthy();
    expect(screen.getByText('ضد آب')).toBeTruthy();
    expect(screen.getByText('products.boolean_yes')).toBeTruthy();
  });

  it('renders nothing when there are no attribute values', () => {
    const { container } = render(<ProductAttributes values={[]} />);
    expect(container.textContent).toBe('');
  });
});

describe('ProductDocuments', () => {
  const docs: ProductDocumentItem[] = [
    { id: 'd1', url: 'http://x/cat.pdf', media_file: 'm1', title: 'کاتالوگ', doc_type: 'catalog', sort_order: 0, is_active: true, description: '' },
    { id: 'd2', url: 'http://x/old.pdf', media_file: 'm2', title: 'قدیمی', doc_type: 'other', sort_order: 1, is_active: false, description: '' },
  ];

  it('lists only active documents supplied by the API', () => {
    render(<ProductDocuments documents={docs} />);
    expect(screen.getByText('products.documents_title')).toBeTruthy();
    expect(screen.getByText('کاتالوگ')).toBeTruthy();
    expect(screen.queryByText('قدیمی')).toBeNull();
  });

  it('exposes a download link with an accessible label', () => {
    render(<ProductDocuments documents={docs} />);
    const link = screen.getByLabelText('products.document_download: کاتالوگ');
    expect(link.getAttribute('href')).toBe('http://x/cat.pdf');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders nothing when there are no active documents', () => {
    const { container } = render(<ProductDocuments documents={[]} />);
    expect(container.textContent).toBe('');
  });
});

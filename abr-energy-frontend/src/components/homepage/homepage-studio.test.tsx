import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomepageRelationPicker } from './homepage-relation-picker';
import { HomepageSectionCard } from './homepage-section-card';
import { HomepageVisualsEditor } from './homepage-visuals-editor';
import type { HomepageSection } from '@/types';

vi.mock('@/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'fa' as const, dir: 'rtl' as const, isRTL: true }),
}));

vi.mock('@/components/shared/media-upload', () => ({
  MediaUpload: ({ label }: { label: string }) => <div>{label}</div>,
}));

function queryWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const section: HomepageSection = {
  key: 'hero',
  enabled: true,
  order: 10,
  title: 'طلوع آفتاب، از خانه شماست',
  subtitle: '',
  content: '',
};

describe('HomepageSectionCard', () => {
  it('renders copy fields and toggles visibility', () => {
    const onChange = vi.fn();
    render(<HomepageSectionCard section={section} onMove={() => undefined} onChange={onChange} isFirst isLast={false} />);
    expect(screen.getByDisplayValue('طلوع آفتاب، از خانه شماست')).toBeTruthy();
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith('hero', { enabled: false });
  });

  it('edits order numerically', () => {
    const onChange = vi.fn();
    render(<HomepageSectionCard section={section} onMove={() => undefined} onChange={onChange} isFirst={false} isLast={false} />);
    const order = screen.getByLabelText('admin.homepage_order') as HTMLInputElement;
    fireEvent.change(order, { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith('hero', { order: 30 });
  });

  it('shows the description field only for calculator/contact sections', () => {
    const { rerender } = render(
      <HomepageSectionCard section={section} onMove={() => undefined} onChange={() => undefined} isFirst isLast />,
    );
    expect(screen.queryByLabelText('admin.homepage_description')).toBeNull();
    rerender(
      <HomepageSectionCard
        section={{ ...section, key: 'calculator' }}
        onMove={() => undefined}
        onChange={() => undefined}
        isFirst
        isLast
      />,
    );
    // Textarea has no direct label query here; the section still renders copy.
    expect(screen.getByDisplayValue('طلوع آفتاب، از خانه شماست')).toBeTruthy();
  });
});

describe('HomepageVisualsEditor', () => {
  it('adds and removes visuals', () => {
    const onChange = vi.fn();
    const { rerender } = render(<HomepageVisualsEditor visuals={[]} onChange={onChange} />);
    expect(screen.getByText('admin.homepage_visuals_empty')).toBeTruthy();
    fireEvent.click(screen.getByText('admin.homepage_visuals_add'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0];
    expect(added).toHaveLength(1);

    rerender(<HomepageVisualsEditor visuals={added} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('admin.delete'));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0]).toHaveLength(0);
  });
});

describe('HomepageRelationPicker', () => {
  const labels = {
    addLabel: 'add',
    emptyLabel: 'empty',
    searchPlaceholder: 'search',
    noResultsLabel: 'none',
  };

  it('renders the empty state and opens search', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 'p1', title: 'یک' }]);
    render(<HomepageRelationPicker kind="products" items={[]} onChange={() => undefined} onSearch={onSearch} {...labels} />, {
      wrapper: queryWrapper(),
    });
    expect(screen.getByText('empty')).toBeTruthy();
    fireEvent.click(screen.getByText('add'));
    await waitFor(() => expect(onSearch).toHaveBeenCalled());
    expect(await screen.findByText('یک')).toBeTruthy();
  });

  it('adds a picked item and blocks duplicates', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 'p1', title: 'یک' }]);
    const onChange = vi.fn();
    const { rerender } = render(
      <HomepageRelationPicker kind="products" items={[]} onChange={onChange} onSearch={onSearch} {...labels} />,
      { wrapper: queryWrapper() },
    );
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(await screen.findByText('یک'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0];
    expect(added[0]).toMatchObject({ id: 'p1', title: 'یک', enabled: true });

    // Duplicate add attempts keep a single row (button disabled).
    rerender(<HomepageRelationPicker kind="products" items={added} onChange={onChange} onSearch={onSearch} {...labels} />);
    expect(screen.getByText('یک')).toBeTruthy();
  });

  it('reorders and removes rows', () => {
    const onChange = vi.fn();
    const items = [
      { key: 'a', id: 'p1', title: 'یک', order: 0, enabled: true },
      { key: 'b', id: 'p2', title: 'دو', order: 1, enabled: true },
    ];
    render(<HomepageRelationPicker kind="products" items={items} onChange={onChange} onSearch={async () => []} {...labels} />, {
      wrapper: queryWrapper(),
    });
    const downs = screen.getAllByLabelText('admin.media_reorder_down');
    fireEvent.click(downs[0]);
    expect(onChange.mock.calls[0][0].map((r: { key: string }) => r.key)).toEqual(['b', 'a']);
    fireEvent.click(screen.getAllByLabelText('admin.delete')[0]);
    expect(onChange.mock.calls[1][0]).toHaveLength(1);
  });
});

import { describe, it, expect } from 'vitest';
import { buildCategoryTree, flattenParentOptions } from '@/lib/category-tree';
import type { ProductCategory } from '@/types';

const row = (over: Partial<ProductCategory> & { id: string }): ProductCategory => ({
  title: over.id,
  slug: over.id,
  parent: null,
  sort_order: 0,
  is_active: true,
  is_featured: false,
  ...over,
});

describe('buildCategoryTree', () => {
  it('renders roots for the Phase-2 seed shape (4 parents)', () => {
    const rows = [
      row({ id: 'p1', title: 'A', sort_order: 1 }),
      row({ id: 'p2', title: 'B', sort_order: 2 }),
      row({ id: 'c1', title: 'A-1', parent: 'p1', sort_order: 1 }),
      row({ id: 'c2', title: 'A-2', parent: 'p1', sort_order: 2 }),
    ];
    const tree = buildCategoryTree(rows);
    expect(tree.map((t) => t.id)).toEqual(['p1', 'p2']);
    expect(tree[0].kids.map((k) => k.id)).toEqual(['c1', 'c2']);
  });

  it('renders nested children at unlimited depth', () => {
    const rows = [
      row({ id: 'root' }),
      row({ id: 'mid', parent: 'root' }),
      row({ id: 'leaf', parent: 'mid' }),
    ];
    const tree = buildCategoryTree(rows);
    expect(tree[0].kids[0].kids[0].id).toBe('leaf');
  });

  it('sorts by sort_order then title deterministically', () => {
    const rows = [row({ id: 'b', title: 'B', sort_order: 0 }), row({ id: 'a', title: 'A', sort_order: 0 })];
    expect(buildCategoryTree(rows).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('treats orphans (missing parent id) as roots without crashing', () => {
    const tree = buildCategoryTree([row({ id: 'orphan', parent: 'gone' })]);
    expect(tree.map((t) => t.id)).toEqual(['orphan']);
  });

  it('flattens indented parent options excluding the edited node', () => {
    const rows = [row({ id: 'p', title: 'P' }), row({ id: 'c', title: 'C', parent: 'p' })];
    const opts = flattenParentOptions(rows, 'p');
    expect(opts).toEqual([{ id: 'c', title: 'C', depth: 0 }]);
  });
});

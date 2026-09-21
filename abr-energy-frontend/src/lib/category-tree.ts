import type { ProductCategory } from '@/types';

export interface CategoryTreeNode extends ProductCategory {
  kids: CategoryTreeNode[];
}

// Builds a nested, deterministically sorted tree from a flat admin list.
// Orphans (parent id not present) become roots. Single pass, no extra requests.
export function buildCategoryTree(rows: ProductCategory[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, kids: [] }));
  const roots: CategoryTreeNode[] = [];
  byId.forEach((n) => {
    if (n.parent && byId.has(n.parent)) byId.get(n.parent)!.kids.push(n);
    else roots.push(n);
  });
  const sort = (xs: CategoryTreeNode[]) => {
    xs.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.title.localeCompare(b.title));
    xs.forEach((x) => sort(x.kids));
  };
  sort(roots);
  return roots;
}

// Flat indented options for the parent <Select>, excluding a given id (edit mode).
export function flattenParentOptions(
  rows: ProductCategory[],
  excludeId?: string,
): Array<{ id: string; title: string; depth: number }> {
  const tree = buildCategoryTree(rows.filter((r) => r.id !== excludeId));
  const out: Array<{ id: string; title: string; depth: number }> = [];
  const walk = (nodes: CategoryTreeNode[], depth: number) => {
    nodes.forEach((n) => {
      out.push({ id: n.id, title: n.title, depth });
      walk(n.kids, depth + 1);
    });
  };
  walk(tree, 0);
  return out;
}

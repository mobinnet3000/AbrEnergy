'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/i18n';
import { cn } from '@/lib/utils';
import { usePublicProductCategories, useServices, useProjects } from '@/hooks/use-api';
import { NavLinkDesktop, NavLinkMobile } from '@/components/shared/NavLink';
import { navigationConfig } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';
import type { ProductCategory, Project, Service } from '@/types';

interface ResolvedChild {
  key: string;
  label: string;
  href: string;
}
interface ResolvedGroup extends ResolvedChild {
  children: ResolvedChild[];
}
interface ResolvedItem {
  key: string;
  href: string;
  label: string;
  groups: ResolvedGroup[];
}

function normalizeCategories(data: unknown): ProductCategory[] {
  if (Array.isArray(data)) return data as ProductCategory[];
  const results = (data as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as ProductCategory[]) : [];
}

/** Public list endpoints may return a bare array or a DRF `{ results }` page. */
function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const results = (data as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as T[]) : [];
}

const byOrder = (a: ProductCategory, b: ProductCategory) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

function categoryRoots(categories: ProductCategory[]): ProductCategory[] {
  const hasRoots = categories.some((c) => !c.parent);
  const list = hasRoots ? categories.filter((c) => !c.parent) : categories;
  return [...list].sort(byOrder);
}

/**
 * Resolve navigation items. Product categories, services and projects come
 * from the live public API (real slugs, real titles → menu reflects CMS
 * content and links to real detail pages); when the live list is empty the
 * configured children are used so the menu never has broken links.
 */
function useResolvedNav(): ResolvedItem[] {
  const { t } = useLocale();
  const { data: productData } = usePublicProductCategories();
  const { data: serviceData } = useServices();
  const { data: projectData } = useProjects();
  const categories = useMemo(() => normalizeCategories(productData), [productData]);
  const services = useMemo(() => normalizeList<Service>(serviceData), [serviceData]);
  const projects = useMemo(() => normalizeList<Project>(projectData), [projectData]);

  return useMemo(
    () =>
      navigationConfig.map((item: NavItem) => {
        if (item.source === 'product-categories') {
          const roots = categoryRoots(categories);
          const groups: ResolvedGroup[] = roots.map((root) => ({
            key: root.id,
            label: root.title,
            href: `/products/category/${root.slug}`,
            children: [...(root.children ?? [])].sort(byOrder).map((child) => ({
              key: child.id,
              label: child.title,
              href: `/products/category/${child.slug}`,
            })),
          }));
          return { key: item.href, href: item.href, label: t(item.labelKey), groups };
        }

        // Live entities → real detail routes, falling back to the configured
        // locale-key children (section index) when the API has nothing yet.
        let live: ResolvedChild[] = [];
        if (item.source === 'published-services') {
          live = services
            .filter((s) => s.slug && s.status === 'active')
            .map((s) => ({ key: `service-${s.id}`, label: s.title, href: `/services/${s.slug}` }));
        } else if (item.source === 'published-projects') {
          live = projects
            .filter((p) => p.slug)
            .map((p) => ({ key: `project-${p.id}`, label: p.title, href: `/projects/${p.slug}` }));
        }

        const groups: ResolvedGroup[] = [];
        const children: ResolvedChild[] = live.length
          ? live
          : (item.children ?? []).map((child, i) => ({
              key: `${item.href}-${i}`,
              label: t(child.labelKey),
              href: child.href,
            }));
        if (children.length) {
          groups.push({ key: item.href, label: t(item.labelKey), href: item.href, children });
        }
        return { key: item.href, href: item.href, label: t(item.labelKey), groups };
      }),
    [categories, services, projects, t],
  );
}

export function DesktopNav({
  isActive,
  className,
}: {
  isActive: (href: string) => boolean;
  className?: string;
}) {
  const items = useResolvedNav();
  return (
    <nav className={cn('hidden items-center gap-1 md:flex', className)} aria-label="Main navigation">
      {items.map((item) => (
        <DesktopNavItem key={item.key} item={item} isActive={isActive(item.href)} />
      ))}
    </nav>
  );
}

function DesktopNavItem({ item, isActive }: { item: ResolvedItem; isActive: boolean }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasGroups = item.groups.length > 0;
  const panelId = `nav-panel-${item.href.replace(/\W+/g, '-') || 'home'}`;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!hasGroups) {
    return (
      <NavLinkDesktop href={item.href} isActive={isActive} scrolled>
        {item.label}
      </NavLinkDesktop>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <div className="flex items-center">
        <NavLinkDesktop href={item.href} isActive={isActive} scrolled className="pe-1">
          {item.label}
        </NavLinkDesktop>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={panelId}
          aria-label={t('common.open_menu')}
          className={cn(
            'rounded-md p-1 transition-colors',
            isActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
            className={cn(
              // `start-0` keeps the panel inside the viewport in both
              // directions: RTL → aligned to the item’s inline-start (right)
              // edge and opening leftwards toward the page centre; LTR → the
              // mirror. It replaces the old `end-0` which pushed RTL panels
              // off the right edge.
              'absolute start-0 top-full z-50 mt-3 overflow-hidden rounded-2xl p-2',
              'origin-top border border-neutral-900/10 ring-1 ring-black/5',
              'shadow-[0_24px_70px_-24px_rgba(0,0,0,0.5)]',
              // Glass surface: near-opaque so text behind the panel does not
              // bleed through; still blurred/saturated for the glass feel.
              'bg-white/95 backdrop-blur-2xl backdrop-saturate-150',
              'dark:border-white/10 dark:ring-white/5 dark:bg-neutral-950/95',
              'max-w-[min(56rem,calc(100vw-2rem))]',
              item.groups.length > 1 ? 'w-max' : 'w-[18rem]',
            )}
          >
            {/* top hairline accent (echoes the header edge) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
            />

            {item.groups.length > 1 ? (
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                {item.groups.map((group) => (
                  <div key={group.key} className="min-w-[12rem] p-1.5">
                    <Link
                      href={group.href}
                      className="mb-1.5 flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-neutral-900 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-white dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                    >
                      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                      {group.label}
                    </Link>
                    {group.children.length > 0 && (
                      <ul className="space-y-0.5 border-s border-neutral-900/10 ps-1 dark:border-white/10">
                        {group.children.map((child) => (
                          <li key={child.key}>
                            <Link
                              href={child.href}
                              className="block rounded-lg px-2.5 py-1.5 text-[13px] text-neutral-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-neutral-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <ul
                className={cn(
                  'grid gap-0.5 p-1',
                  item.groups[0].children.length > 3 ? 'grid-cols-2' : 'grid-cols-1',
                )}
              >
                {item.groups[0].children.map((child) => (
                  <li key={child.key}>
                    <Link
                      href={child.href}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-neutral-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                    >
                      <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-emerald-500/50" />
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {item.href === '/products' && (
              <div className="mt-2 border-t border-neutral-900/10 pt-2 dark:border-white/10">
                <Link
                  href="/products/category"
                  className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-emerald-500/10 hover:text-brand-strong dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <span>{t('products.view_all_categories')}</span>
                  <span className="rtl:rotate-180" aria-hidden>→</span>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav({
  isActive,
  onNavigate,
}: {
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const items = useResolvedNav();
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <MobileNavItem key={item.key} item={item} isActive={isActive(item.href)} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function MobileNavItem({
  item,
  isActive,
  onNavigate,
}: {
  item: ResolvedItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const hasGroups = item.groups.length > 0;

  if (!hasGroups) {
    return (
      <NavLinkMobile href={item.href} isActive={isActive} onClick={onNavigate}>
        {item.label}
      </NavLinkMobile>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <NavLinkMobile href={item.href} isActive={isActive} onClick={onNavigate} className="flex-1">
          {item.label}
        </NavLinkMobile>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={t('common.open_menu')}
          className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="my-1 ms-3 space-y-0.5 border-s border-neutral-900/10 ps-3 dark:border-white/10">
              {item.groups.map((group) => (
                <div key={group.key} className="py-1">
                  {item.groups.length > 1 && (
                    <Link
                      href={group.href}
                      onClick={onNavigate}
                      className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {group.label}
                    </Link>
                  )}
                  {group.children.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      onClick={onNavigate}
                      className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              {item.href === '/products' && (
                <div className="border-t border-neutral-900/10 pt-1 dark:border-white/10">
                  <Link
                    href="/products/category"
                    onClick={onNavigate}
                    className="block rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    {t('products.view_all_categories')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

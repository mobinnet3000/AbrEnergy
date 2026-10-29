export interface NavItem {
  href: string;
  labelKey: string;
  /** Optional: show only for authenticated users */
  requiresAuth?: boolean;
  /** Optional: show only for admin users */
  requiresAdmin?: boolean;
  /** Optional: external link */
  external?: boolean;
  /** Optional: children for dropdown navigation */
  children?: NavItem[];
  /**
   * Optional: dynamic children source, resolved from the live public API so
   * the menu reflects real CMS entities (real titles/slugs) without hardcoding:
   *  - `product-categories`: product category tree (roots + subcategories)
   *  - `published-services`: active services → `/services/<slug>` detail pages
   *  - `published-projects`: projects → `/projects/<slug>` detail pages
   * When the live list is empty the configured `children` remain as fallback
   * (built from locale keys + the section index), so links never break.
   */
  source?: 'product-categories' | 'published-services' | 'published-projects';
}

export const navigationConfig: NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/products', labelKey: 'nav.products', source: 'product-categories' },
  {
    href: '/services',
    labelKey: 'nav.services',
    source: 'published-services',
    children: [
      { href: '/services', labelKey: 'menu.svc_offgrid' },
      { href: '/services', labelKey: 'menu.svc_ongrid' },
      { href: '/services', labelKey: 'menu.svc_hybrid' },
      { href: '/services', labelKey: 'menu.svc_design' },
      { href: '/services', labelKey: 'menu.svc_inspection' },
      { href: '/services', labelKey: 'menu.svc_geotech' },
      { href: '/services', labelKey: 'menu.svc_modular' },
    ],
  },
  {
    href: '/projects',
    labelKey: 'nav.projects',
    source: 'published-projects',
    children: [
      { href: '/projects', labelKey: 'menu.prj_offgrid' },
      { href: '/projects', labelKey: 'menu.prj_ongrid' },
      { href: '/projects', labelKey: 'menu.prj_hybrid' },
      { href: '/projects', labelKey: 'menu.prj_modular' },
    ],
  },
  {
    href: '/articles',
    labelKey: 'nav.articles',
  },
  {
    href: '/gallery',
    labelKey: 'nav.gallery',
  },
  {
    href: '/downloads',
    labelKey: 'nav.downloads',
    children: [
      { href: '/downloads?category=solar-packages', labelKey: 'menu.dl_solar' },
      { href: '/downloads?category=modular-supports', labelKey: 'menu.dl_modular' },
    ],
  },
  { href: '/calculator', labelKey: 'nav.calculator_offgrid' },
  { href: '/contact', labelKey: 'nav.contact' },
];

export const adminNavItems: NavItem[] = [
  { href: '/admin', labelKey: 'admin.dashboard' },
  { href: '/admin/users', labelKey: 'admin.users' },
  { href: '/admin/articles', labelKey: 'admin.articles' },
  { href: '/admin/services', labelKey: 'admin.services' },
  { href: '/admin/projects', labelKey: 'admin.projects' },
  { href: '/admin/contacts', labelKey: 'admin.contacts' },
  { href: '/admin/gallery', labelKey: 'admin.gallery' },
  { href: '/admin/activity-log', labelKey: 'admin.activity_log' },
  { href: '/dashboard/notifications', labelKey: 'admin.notifications' },
];

export interface AdminNavEntry extends NavItem {
  roles?: import('@/types').UserRole[];
  disabled?: boolean;
}

export interface AdminNavSection {
  titleKey?: string;
  items: AdminNavEntry[];
}

// CMS information architecture. Only live routes are linked; future Phase 4+
// sections stay disabled so the sidebar never shows fake empty pages.
export const adminNavSections: AdminNavSection[] = [
  {
    items: [{ href: '/admin', labelKey: 'admin.dashboard' }],
  },
  {
    titleKey: 'admin.nav_products',
    items: [
      { href: '/admin/products', labelKey: 'admin.nav_all_products' },
      { href: '/admin/products/categories', labelKey: 'admin.nav_product_categories' },
      { href: '/admin/products/attributes', labelKey: 'admin.nav_attributes', disabled: true },
    ],
  },
  {
    titleKey: 'admin.nav_content',
    items: [
      { href: '/admin/content/homepage', labelKey: 'admin.homepage' },
      { href: '/admin/articles', labelKey: 'admin.articles' },
      { href: '/admin/services', labelKey: 'admin.services' },
      { href: '/admin/projects', labelKey: 'admin.projects' },
      { href: '/admin/gallery', labelKey: 'admin.gallery' },
      { href: '/admin/media', labelKey: 'admin.media' },
      { href: '/admin/categories', labelKey: 'admin.categories' },
      { href: '/admin/tags', labelKey: 'admin.tags' },
      { href: '/admin/seo', labelKey: 'admin.seo_dashboard', roles: ['super_admin', 'website_admin', 'seo_manager', 'content_manager', 'analyst'] },
    ],
  },
  {
    titleKey: 'admin.nav_requests',
    items: [
      { href: '/admin/contacts', labelKey: 'admin.contacts' },
      { href: '/admin/inquiries', labelKey: 'admin.inquiries' },
      { href: '/admin/notifications', labelKey: 'admin.notifications' },
    ],
  },
  {
    titleKey: 'admin.nav_access',
    items: [
      { href: '/admin/users', labelKey: 'admin.users', roles: ['super_admin'] },
      { href: '/admin/activity-log', labelKey: 'admin.activity_log', roles: ['super_admin', 'website_admin', 'analyst'] },
      { href: '/admin/settings', labelKey: 'admin.settings', roles: ['super_admin'] },
    ],
  },
];

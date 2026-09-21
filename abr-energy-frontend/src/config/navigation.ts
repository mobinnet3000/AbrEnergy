export interface NavItem {
  href: string;
  labelKey: string;
  /** Optional: show only for authenticated users */
  requiresAuth?: boolean;
  /** Optional: show only for admin users */
  requiresAdmin?: boolean;
  /** Optional: external link */
  external?: boolean;
  /** Optional: children for future dropdown support */
  children?: NavItem[];
}

export const navigationConfig: NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/products', labelKey: 'nav.products' },
  { href: '/services', labelKey: 'nav.services' },
  { href: '/projects', labelKey: 'nav.projects' },
  { href: '/articles', labelKey: 'nav.articles' },
  { href: '/calculator', labelKey: 'nav.calculator' },
  { href: '/gallery', labelKey: 'nav.gallery' },
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
    ],
  },
  {
    titleKey: 'admin.nav_requests',
    items: [
      { href: '/admin/contacts', labelKey: 'admin.contacts' },
      { href: '/admin/inquiries', labelKey: 'admin.inquiries' },
      { href: '/dashboard/notifications', labelKey: 'admin.notifications' },
    ],
  },
  {
    titleKey: 'admin.nav_access',
    items: [
      { href: '/admin/users', labelKey: 'admin.users', roles: ['super_admin', 'website_admin'] },
      { href: '/admin/activity-log', labelKey: 'admin.activity_log', roles: ['super_admin', 'website_admin'] },
      { href: '/admin/settings', labelKey: 'admin.settings', roles: ['super_admin'] },
    ],
  },
];

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

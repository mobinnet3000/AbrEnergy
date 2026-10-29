import type { UserRole } from '@/types';

// Staff / internal roles admitted into the Admin CMS shell
export const ADMIN_SHELL_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'content_manager',
  'product_manager',
  'support_manager',
  'seo_manager',
  'engineer',
  'analyst',
];

export const MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'content_manager',
  'product_manager',
  'support_manager',
  'seo_manager',
  'engineer',
  'analyst',
];

export const ADMIN_ONLY_ROLES: UserRole[] = ['super_admin', 'website_admin'];

export function canAccessAdminShell(role?: UserRole | null): boolean {
  if (!role) return false;
  return ADMIN_SHELL_ROLES.includes(role);
}

// Product management (products & categories)
export const PRODUCT_MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'content_manager',
  'product_manager',
];

export function canManageProductCategories(role?: UserRole | null): boolean {
  if (!role) return false;
  return PRODUCT_MANAGER_ROLES.includes(role);
}

// Products share the same gate
export function canManageProducts(role?: UserRole | null): boolean {
  return canManageProductCategories(role);
}

// Homepage Studio / Content
export const CONTENT_MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'content_manager',
  'seo_manager',
];

export function canManageHomepage(role?: UserRole | null): boolean {
  if (!role) return false;
  return CONTENT_MANAGER_ROLES.includes(role);
}

export function canManageContent(role?: UserRole | null): boolean {
  if (!role) return false;
  return CONTENT_MANAGER_ROLES.includes(role);
}

// Contacts & customer requests
export const SUPPORT_MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'support_manager',
];

export function canManageContacts(role?: UserRole | null): boolean {
  if (!role) return false;
  return SUPPORT_MANAGER_ROLES.includes(role);
}

// Inquiries (solar sizing / calculator / quotes)
export const INQUIRY_MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'website_admin',
  'support_manager',
  'engineer',
];

export function canManageInquiries(role?: UserRole | null): boolean {
  if (!role) return false;
  return INQUIRY_MANAGER_ROLES.includes(role);
}

// Site settings (logo/favicon/company/SEO defaults) - Super Admin only
export function canManageSiteSettings(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

// User management - Super Admin only
export function canManageUsers(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

// Activity Log viewing - Super Admin, Website Admin, and Analyst
export function canViewActivityLog(role?: UserRole | null): boolean {
  if (!role) return false;
  return ['super_admin', 'website_admin', 'analyst'].includes(role);
}

export function isReadOnlyAnalyst(role?: UserRole | null): boolean {
  return role === 'analyst';
}

export function canViewAdminItem(itemRoles: UserRole[] | undefined, role?: UserRole | null): boolean {
  if (!itemRoles) return true;
  if (!role) return false;
  return itemRoles.includes(role);
}

import type { UserRole } from '@/types';

// Backend remains authoritative (IsContentManager / IsSuperAdmin).
// These helpers only shape the CMS UI; every request is still gated server-side.
export const MANAGER_ROLES: UserRole[] = ['super_admin', 'website_admin', 'content_manager'];
export const ADMIN_ONLY_ROLES: UserRole[] = ['super_admin', 'website_admin'];

export function canAccessAdminShell(role?: UserRole | null): boolean {
  if (!role) return false;
  return MANAGER_ROLES.includes(role);
}

export function canManageProductCategories(role?: UserRole | null): boolean {
  if (!role) return false;
  return MANAGER_ROLES.includes(role);
}

// Products share the same backend content gate (IsContentManager) as categories.
export function canManageProducts(role?: UserRole | null): boolean {
  return canManageProductCategories(role);
}

// Homepage Studio shares the same backend content gate (IsContentManager).
// The backend remains authoritative; this only shapes the CMS UI.
export function canManageHomepage(role?: UserRole | null): boolean {
  return canManageProductCategories(role);
}

export function canViewAdminItem(itemRoles: UserRole[] | undefined, role?: UserRole | null): boolean {
  if (!itemRoles) return true;
  if (!role) return false;
  return itemRoles.includes(role);
}

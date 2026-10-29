'use client';

import { useState } from 'react';
import { useAdminUsers, useUpdateAdminUser, useCreateAdminUser } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLocale } from '@/i18n';
import { toast } from 'sonner';
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Edit2,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react';

interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { t, locale } = useLocale();
  const currentUser = useAuthStore((s) => s.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string> = {
    page: String(page),
  };
  if (searchTerm.trim()) queryParams.search = searchTerm.trim();
  if (roleFilter !== 'all') queryParams.role = roleFilter;
  if (statusFilter !== 'all') queryParams.is_active = statusFilter === 'active' ? 'true' : 'false';

  const { data, isLoading, error, refetch, isFetching } = useAdminUsers(queryParams);
  const updateMutation = useUpdateAdminUser();
  const createMutation = useCreateAdminUser();

  const users: AdminUserRecord[] = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];
  const totalCount = typeof data?.count === 'number' ? data.count : users.length;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Count active super admins in loaded dataset to aid client-side safeguard hints
  const activeSuperAdminsCount = users.filter((u) => u.role === 'super_admin' && u.is_active).length;

  // Edit dialog state
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [editRole, setEditRole] = useState<string>('customer');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [showConfirm, setShowConfirm] = useState(false);

  // Create user dialog state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<string>('customer');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) {
      toast.error('لطفاً فیلدهای الزامی را تکمیل کنید.');
      return;
    }
    createMutation.mutate(
      {
        email: newEmail.trim(),
        password: newPassword,
        full_name: newFullName.trim(),
        phone_number: newPhone.trim() || undefined,
        role: newRole,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast.success(t('admin.user_created') || 'کاربر جدید با موفقیت ایجاد شد.');
          setShowCreateModal(false);
          setNewEmail('');
          setNewPassword('');
          setNewFullName('');
          setNewPhone('');
          setNewRole('customer');
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: Record<string, string[] | string> } };
          const data = apiErr.response?.data;
          const msg = data && typeof data === 'object' ? Object.values(data).flat().join(' ') : 'خطا در ایجاد کاربر';
          toast.error(msg);
        },
      }
    );
  };

  const openEditModal = (u: AdminUserRecord) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditIsActive(u.is_active);
    setShowConfirm(false);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setShowConfirm(false);
  };

  const isSoleSuperAdmin = Boolean(
    selectedUser &&
    selectedUser.role === 'super_admin' &&
    selectedUser.is_active &&
    activeSuperAdminsCount <= 1
  );

  const handleSave = () => {
    if (!selectedUser) return;

    if (isSoleSuperAdmin && (editRole !== 'super_admin' || !editIsActive)) {
      toast.error(t('admin.last_super_admin_warning'));
      return;
    }

    updateMutation.mutate(
      {
        id: selectedUser.id,
        data: {
          role: editRole,
          is_active: editIsActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('admin.user_updated'));
          closeEditModal();
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { detail?: string } } };
          const detail = apiErr.response?.data?.detail;
          toast.error(detail || t('admin.user_update_failed'));
        },
      }
    );
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: t('admin.role_super_admin'), variant: 'default' as const };
      case 'website_admin':
        return { label: t('admin.role_website_admin'), variant: 'secondary' as const };
      case 'content_manager':
        return { label: t('admin.role_content_manager'), variant: 'outline' as const };
      case 'product_manager':
        return { label: t('admin.role_product_manager') || 'مدیر محصولات', variant: 'outline' as const };
      case 'support_manager':
        return { label: t('admin.role_support_manager') || 'مدیر پشتیبانی', variant: 'outline' as const };
      case 'seo_manager':
        return { label: t('admin.role_seo_manager') || 'مدیر سئو', variant: 'outline' as const };
      case 'engineer':
        return { label: t('admin.role_engineer'), variant: 'outline' as const };
      case 'analyst':
        return { label: t('admin.role_analyst') || 'تحلیل‌گر داده', variant: 'outline' as const };
      case 'customer':
        return { label: t('admin.role_customer'), variant: 'outline' as const };
      default:
        return { label: role, variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            {t('admin.users')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.all_users')} ({totalCount})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            افزودن کاربر جدید
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('admin.try_again')}
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('admin.search_placeholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
            </div>
            <div>
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.user_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.all')}</SelectItem>
                  <SelectItem value="super_admin">{t('admin.role_super_admin')}</SelectItem>
                  <SelectItem value="website_admin">{t('admin.role_website_admin')}</SelectItem>
                  <SelectItem value="content_manager">{t('admin.role_content_manager')}</SelectItem>
                  <SelectItem value="product_manager">{t('admin.role_product_manager') || 'مدیر محصولات'}</SelectItem>
                  <SelectItem value="support_manager">{t('admin.role_support_manager') || 'مدیر پشتیبانی'}</SelectItem>
                  <SelectItem value="seo_manager">{t('admin.role_seo_manager') || 'مدیر سئو'}</SelectItem>
                  <SelectItem value="engineer">{t('admin.role_engineer')}</SelectItem>
                  <SelectItem value="analyst">{t('admin.role_analyst') || 'تحلیل‌گر داده'}</SelectItem>
                  <SelectItem value="customer">{t('admin.role_customer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.account_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.all')}</SelectItem>
                  <SelectItem value="active">{t('admin.status_active')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.status_inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-emerald-600" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{t('admin.failed_load')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('admin.try_again')}
            </Button>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-base font-medium">{t('admin.show_none')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="text-base font-semibold">
              {t('admin.all_users')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-right">
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.name')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.email')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.phone')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.user_role')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.account_status')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.date')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground text-left">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => {
                    const roleInfo = formatRole(u.role);
                    const isSelf = Boolean(currentUser?.id && u.id === currentUser.id);
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {u.full_name || '-'}
                          {isSelf && (
                            <span className="text-[11px] text-emerald-600 font-normal mr-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              (شما)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                        <td className="py-3 px-4 text-muted-foreground dir-ltr text-right">{u.phone_number || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={u.is_active ? 'default' : 'secondary'}
                            className={u.is_active ? 'bg-emerald-600 text-white' : ''}
                          >
                            {u.is_active ? t('admin.status_active') : t('admin.status_inactive')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US') : '-'}
                        </td>
                        <td className="py-3 px-4 text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(u)}
                            className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            {t('admin.edit_role_status')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-xs text-muted-foreground">
                  صفحه {page} از {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    قبلی
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role & Status Edit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {t('admin.edit_role_status')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          {isSoleSuperAdmin && (
            <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{t('admin.last_super_admin_warning')}</p>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">{t('admin.user_role')}</label>
              <Select
                value={editRole}
                onValueChange={(val) => setEditRole(val || 'customer')}
                disabled={isSoleSuperAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">{t('admin.role_super_admin')}</SelectItem>
                  <SelectItem value="website_admin">{t('admin.role_website_admin')}</SelectItem>
                  <SelectItem value="content_manager">{t('admin.role_content_manager')}</SelectItem>
                  <SelectItem value="product_manager">{t('admin.role_product_manager') || 'مدیر محصولات'}</SelectItem>
                  <SelectItem value="support_manager">{t('admin.role_support_manager') || 'مدیر پشتیبانی'}</SelectItem>
                  <SelectItem value="seo_manager">{t('admin.role_seo_manager') || 'مدیر سئو'}</SelectItem>
                  <SelectItem value="engineer">{t('admin.role_engineer')}</SelectItem>
                  <SelectItem value="analyst">{t('admin.role_analyst') || 'تحلیل‌گر داده'}</SelectItem>
                  <SelectItem value="customer">{t('admin.role_customer')}</SelectItem>
                </SelectContent>
              </Select>
              {isSoleSuperAdmin && (
                <p className="text-[11px] text-muted-foreground">
                  {t('admin.last_super_admin_warning')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">{t('admin.account_status')}</label>
              <Select
                value={editIsActive ? 'active' : 'inactive'}
                onValueChange={(val) => setEditIsActive(val === 'active')}
                disabled={isSoleSuperAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      {t('admin.status_active')}
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-destructive" />
                      {t('admin.status_inactive')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {!showConfirm ? (
              <>
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  انصراف
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={updateMutation.isPending || (isSoleSuperAdmin && (editRole !== 'super_admin' || !editIsActive))}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {t('admin.save_changes')}
                </Button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
                  {t('admin.confirm_role_change_desc')}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                    انصراف
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    {t('admin.confirm')}
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                افزودن کاربر جدید
              </DialogTitle>
              <DialogDescription>
                اطلاعات حساب کاربری و سطح دسترسی را وارد نمایید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">نام و نام خانوادگی *</label>
                <Input
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="علی محمدی"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">ایمیل *</label>
                <Input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">کلمه عبور *</label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">شماره تماس</label>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09123456789"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">نقش کاربری *</label>
                <Select value={newRole} onValueChange={(val) => setNewRole(val || 'customer')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t('admin.role_customer')}</SelectItem>
                    <SelectItem value="engineer">{t('admin.role_engineer')}</SelectItem>
                    <SelectItem value="analyst">{t('admin.role_analyst') || 'تحلیل‌گر داده'}</SelectItem>
                    <SelectItem value="support_manager">{t('admin.role_support_manager') || 'مدیر پشتیبانی'}</SelectItem>
                    <SelectItem value="seo_manager">{t('admin.role_seo_manager') || 'مدیر سئو'}</SelectItem>
                    <SelectItem value="product_manager">{t('admin.role_product_manager') || 'مدیر محصولات'}</SelectItem>
                    <SelectItem value="content_manager">{t('admin.role_content_manager')}</SelectItem>
                    <SelectItem value="website_admin">{t('admin.role_website_admin')}</SelectItem>
                    <SelectItem value="super_admin">{t('admin.role_super_admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-3 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                ایجاد کاربر
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

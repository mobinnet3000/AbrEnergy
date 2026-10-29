'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminInquiries } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { Loader2, Search, Eye, RefreshCw, FolderKanban } from 'lucide-react';

export default function AdminInquiriesPage() {
  const { t, locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string> = {
    page: String(page),
  };
  if (searchTerm.trim()) queryParams.search = searchTerm.trim();
  if (statusFilter !== 'all') queryParams.status = statusFilter;
  if (typeFilter !== 'all') queryParams.project_type = typeFilter;

  const { data, isLoading, error, refetch, isFetching } = useAdminInquiries(queryParams);
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const totalCount = typeof data?.count === 'number' ? data.count : items.length;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatStatus = (status: string) => {
    switch (status) {
      case 'new':
        return { label: t('admin.inquiry_status_new'), variant: 'secondary' as const };
      case 'contacted':
        return { label: t('admin.inquiry_status_contacted'), variant: 'outline' as const };
      case 'in_design':
        return { label: t('admin.inquiry_status_in_design'), variant: 'secondary' as const };
      case 'quoted':
        return { label: t('admin.inquiry_status_quoted'), variant: 'outline' as const };
      case 'accepted':
        return { label: t('admin.inquiry_status_accepted'), variant: 'default' as const };
      case 'rejected':
        return { label: t('admin.inquiry_status_rejected'), variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const formatProjectType = (type: string) => {
    switch (type) {
      case 'on_grid':
        return t('admin.project_type_on_grid');
      case 'off_grid':
        return t('admin.project_type_off_grid');
      case 'hybrid':
        return t('admin.project_type_hybrid');
      case 'large_scale':
        return t('admin.project_type_large_scale');
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            {t('admin.project_inquiries')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.all_inquiries')} ({totalCount})
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('admin.try_again')}
        </Button>
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
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.filter_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.filter_all')}</SelectItem>
                  <SelectItem value="new">{t('admin.inquiry_status_new')}</SelectItem>
                  <SelectItem value="contacted">{t('admin.inquiry_status_contacted')}</SelectItem>
                  <SelectItem value="in_design">{t('admin.inquiry_status_in_design')}</SelectItem>
                  <SelectItem value="quoted">{t('admin.inquiry_status_quoted')}</SelectItem>
                  <SelectItem value="accepted">{t('admin.inquiry_status_accepted')}</SelectItem>
                  <SelectItem value="rejected">{t('admin.inquiry_status_rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.project_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.all')}</SelectItem>
                  <SelectItem value="on_grid">{t('admin.project_type_on_grid')}</SelectItem>
                  <SelectItem value="off_grid">{t('admin.project_type_off_grid')}</SelectItem>
                  <SelectItem value="hybrid">{t('admin.project_type_hybrid')}</SelectItem>
                  <SelectItem value="large_scale">{t('admin.project_type_large_scale')}</SelectItem>
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
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-base font-medium">{t('admin.no_inquiries')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="text-base font-semibold">
              {t('admin.project_inquiries')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-right">
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.name')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.phone')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.city')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.project_type')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.estimated_capacity')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.status')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground">{t('admin.date')}</th>
                    <th className="py-3.5 px-4 font-semibold text-muted-foreground text-left">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item: Record<string, unknown>) => {
                    const statusInfo = formatStatus(item.status as string || 'new');
                    return (
                      <tr key={item.id as string} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{item.name as string}</td>
                        <td className="py-3 px-4 text-muted-foreground dir-ltr text-right">{item.phone as string}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.city as string || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-muted px-2.5 py-1 rounded-md font-medium">
                            {formatProjectType(item.project_type as string)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                          {item.estimated_capacity ? `${item.estimated_capacity} kW` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {item.created_at ? new Date(item.created_at as string).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US') : '-'}
                        </td>
                        <td className="py-3 px-4 text-left">
                          <Link href={`/${locale}/admin/inquiries/${item.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                              <Eye className="h-3.5 w-3.5" />
                              {t('admin.view_details')}
                            </Button>
                          </Link>
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
    </div>
  );
}

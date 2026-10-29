'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminContact, useUpdateAdminContact } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/i18n';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Save,
  MessageSquare,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface ContactData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  request_type: string;
  status: string;
  admin_note?: string;
  created_at: string;
}

function ContactDetailContent({ contact }: { contact: ContactData }) {
  const { t, locale } = useLocale();
  const updateMutation = useUpdateAdminContact();

  const [statusVal, setStatusVal] = useState<string>(contact.status || 'pending');
  const [adminNote, setAdminNote] = useState<string>(contact.admin_note || '');

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: contact.id,
        data: {
          status: statusVal,
          admin_note: adminNote,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('admin.status_updated'));
        },
        onError: () => {
          toast.error(t('admin.status_update_failed'));
        },
      }
    );
  };

  const formatStatus = (s: string) => {
    switch (s) {
      case 'pending':
        return { label: t('admin.contact_status_pending'), variant: 'secondary' as const };
      case 'in_review':
        return { label: t('admin.contact_status_in_review'), variant: 'outline' as const };
      case 'completed':
        return { label: t('admin.contact_status_completed'), variant: 'default' as const };
      case 'rejected':
        return { label: t('admin.contact_status_rejected'), variant: 'destructive' as const };
      default:
        return { label: s, variant: 'outline' as const };
    }
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'contact':
        return t('admin.request_type_contact');
      case 'consultation':
        return t('admin.request_type_consultation');
      case 'design_request':
        return t('admin.request_type_design_request');
      default:
        return type;
    }
  };

  const currentStatusInfo = formatStatus(contact.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back and Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/admin/contacts`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-0 rotate-180" />
          {t('admin.back_to_contacts')}
        </Link>
        <Badge variant={currentStatusInfo.variant}>{currentStatusInfo.label}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details (Left 2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{contact.full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {contact.created_at
                      ? new Date(contact.created_at).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')
                      : '-'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                  <Tag className="h-3.5 w-3.5" />
                  {formatRequestType(contact.request_type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Contact Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('admin.phone')}</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm font-medium dir-ltr text-right hover:text-emerald-600 transition-colors block"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('admin.email')}</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm font-medium hover:text-emerald-600 transition-colors truncate block"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>

              {contact.subject && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('admin.title_label')}
                  </p>
                  <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border">
                    {contact.subject}
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  {t('admin.customer_message')}
                </p>
                <div className="p-4 rounded-lg border bg-background text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {contact.message}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Controls / Admin Notes (Right column) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {t('admin.status')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  {t('admin.status')}
                </label>
                <Select value={statusVal} onValueChange={(val) => setStatusVal(val || 'pending')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('admin.contact_status_pending')}</SelectItem>
                    <SelectItem value="in_review">{t('admin.contact_status_in_review')}</SelectItem>
                    <SelectItem value="completed">{t('admin.contact_status_completed')}</SelectItem>
                    <SelectItem value="rejected">{t('admin.contact_status_rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  {t('admin.internal_notes')}
                </label>
                <Textarea
                  rows={6}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={t('admin.internal_notes')}
                  className="text-xs leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t('admin.internal_notes_hint')}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('admin.save_changes')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const { t, locale } = useLocale();
  const { data: contact, isLoading, error, refetch } = useAdminContact(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-emerald-600" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <Card className="max-w-2xl mx-auto my-12 border-destructive/30">
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-destructive font-medium">{t('admin.not_found')}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('admin.try_again')}
            </Button>
            <Link href={`/${locale}/admin/contacts`}>
              <Button size="sm">{t('admin.back_to_contacts')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ContactDetailContent key={contact.id} contact={contact} />;
}

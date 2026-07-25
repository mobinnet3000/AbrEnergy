'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { useLocale } from '@/i18n';

const forgotSchema = z.object({ email: z.string().email() });
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await axiosInstance.post('/auth/password-reset/', { email: data.email });
      toast.success(t('auth.forgot_sent'));
      setSent(true);
    } catch {
      toast.error(t('auth.forgot_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Sun className="h-12 w-12 mx-auto mb-2 text-green-600" />
          <CardTitle className="text-2xl">{t('auth.forgot_title')}</CardTitle>
          <CardDescription>{t('auth.forgot_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t('auth.forgot_sent')}</p>
              <Link href="/login" className="text-sm text-green-600 hover:underline">{t('common.back')} to {t('common.login')}</Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>{t('auth.email_label')}</FormLabel><FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.forgot_cta')}
                </Button>
              </form>
            </Form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.has_account')}{' '}
            <Link href="/login" className="text-green-600 hover:underline">{t('auth.login_cta')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

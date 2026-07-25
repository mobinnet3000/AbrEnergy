'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/i18n';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  password_confirm: z.string().min(8),
  full_name: z.string().min(2),
}).refine((d) => d.password === d.password_confirm, { message: 'Passwords do not match', path: ['password_confirm'] });
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { email: '', password: '', password_confirm: '', full_name: '' } });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register/', data);
      setAuth(res.data.user, res.data.tokens);
      toast.success(t('auth.register_success'));
      router.push('/dashboard');
    } catch {
      toast.error(t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Sun className="h-12 w-12 mx-auto mb-2 text-green-600" />
          <CardTitle className="text-2xl">{t('auth.register_title')}</CardTitle>
          <CardDescription>{t('auth.register_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>{t('auth.full_name')}</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{t('auth.email_label')}</FormLabel><FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>{t('auth.password_label')}</FormLabel><FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password_confirm" render={({ field }) => (
                <FormItem><FormLabel>{t('auth.confirm_password')}</FormLabel><FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : t('auth.register_cta')}</Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground mt-6">{t('auth.has_account')} <Link href="/login" className="text-green-600 hover:underline">{t('auth.login_cta')}</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}

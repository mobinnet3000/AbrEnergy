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

const forgotSchema = z.object({ email: z.string().email() });
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await axiosInstance.post('/auth/password-reset/', { email: data.email });
      toast.success('Password reset link sent to your email');
      setSent(true);
    } catch {
      toast.error('Failed to send reset link. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Sun className="h-12 w-12 mx-auto mb-2 text-green-600" />
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Check your inbox for the password reset link.</p>
              <Link href="/login" className="text-sm text-green-600 hover:underline">Back to Login</Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-green-600 hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

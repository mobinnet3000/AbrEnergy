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

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login/', data);
      const { access, refresh, user } = res.data;
      setAuth(user, { access, refresh });
      toast.success('Welcome back!');
      if (user.role === 'super_admin' || user.role === 'website_admin') router.push('/admin');
      else router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Sun className="h-12 w-12 mx-auto mb-2 text-green-600" />
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your AbrEnergy account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Sign In'}</Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account? <Link href="/register" className="text-green-600 hover:underline">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

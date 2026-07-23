'use client';
import { useAuthStore } from '@/stores/auth-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useUpdateProfile } from '@/hooks/use-api';
import { toast } from 'sonner';

const profileSchema = z.object({ full_name: z.string().min(2), phone_number: z.string().optional(), bio: z.string().optional() });
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { full_name: user?.full_name || '', phone_number: user?.phone_number || '', bio: user?.bio || '' },
  });

  const onProfile = (data: ProfileForm) => {
    updateProfile.mutate(data, { onSuccess: () => toast.success('Profile updated'), onError: () => toast.error('Update failed') });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <Card className="mb-8">
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfile)} className="space-y-4">
              <FormField control={profileForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileForm.control} name="phone_number" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileForm.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={updateProfile.isPending}>Save Changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

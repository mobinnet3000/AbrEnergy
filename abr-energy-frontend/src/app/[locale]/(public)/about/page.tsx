'use client';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SiteSettings } from '@/types';

export default function AboutPage() {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => axiosInstance.get('/site-config/').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  if (!settings) return <div className="py-20 text-center text-muted-foreground">Could not load page</div>;

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">{settings.company_name}</h1>
        <p className="text-muted-foreground mb-8">{settings.company_name_en}</p>

        <div className="prose prose-green dark:prose-invert max-w-none mb-12">
          <p>{settings.about_us}</p>
        </div>

        {settings.about_us_en && (
          <div className="prose prose-green dark:prose-invert max-w-none mb-12 border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">About Us (English)</h2>
            <p>{settings.about_us_en}</p>
          </div>
        )}

        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {settings.phone_number && (
                <div><span className="font-medium">Phone:</span> {settings.phone_number}</div>
              )}
              {settings.phone_number_2 && (
                <div><span className="font-medium">Phone 2:</span> {settings.phone_number_2}</div>
              )}
              {settings.email && (
                <div><span className="font-medium">Email:</span> {settings.email}</div>
              )}
              {settings.address && (
                <div className="sm:col-span-2"><span className="font-medium">Address:</span> {settings.address}</div>
              )}
              <div className="sm:col-span-2 flex flex-wrap gap-4 mt-2">
                {settings.instagram && <Link href={settings.instagram} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Instagram</Link>}
                {settings.telegram && <Link href={settings.telegram} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Telegram</Link>}
                {settings.linkedin && <Link href={settings.linkedin} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</Link>}
                {settings.whatsapp && <Link href={settings.whatsapp} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp</Link>}
                {settings.youtube && <Link href={settings.youtube} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">YouTube</Link>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import type { Service } from '@/types';

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: ['service', slug],
    queryFn: () => axiosInstance.get(`/services/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error('Failed to load service'); }, [error]);
  if (error) return <div className="py-20 text-center text-muted-foreground">Failed to load service</div>;
  if (isLoading) return <div className="py-20 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!service) return <div className="py-20 text-center text-muted-foreground">Service not found</div>;

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-foreground">Services</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{service.title}</span>
        </nav>

        <Link href="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{service.title}</h1>

        {service.category_title && (
          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm rounded-full mb-6">
            {service.category_title}
          </span>
        )}

        <div className="prose prose-green dark:prose-invert max-w-none mb-10" dangerouslySetInnerHTML={{ __html: service.description }} />

        {service.features?.length > 0 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {service.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

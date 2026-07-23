'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useServices } from '@/hooks/use-api';

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const items = Array.isArray(services?.results) ? services.results : (Array.isArray(services) ? services : []);

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our <span className="text-green-600">Services</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Comprehensive solar energy solutions tailored to your needs</p>
        </div>
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No services available</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((s: Record<string, unknown>) => (
              <Link key={s.id as string} href={`/services/${s.slug}`}>
                <Card className="group hover:shadow-lg transition-all h-full hover:-translate-y-1">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-green-600 transition-colors">{s.title as string}</h3>
                    <p className="text-muted-foreground mb-4">{s.short_description as string}</p>
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">Learn More <ArrowRight className="h-4" /></span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

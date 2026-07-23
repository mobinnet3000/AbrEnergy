'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useProjects } from '@/hooks/use-api';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const items = Array.isArray(projects?.results) ? projects.results : (Array.isArray(projects) ? projects : []);

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our <span className="text-green-600">Projects</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Explore our portfolio of solar installations</p>
        </div>
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No projects yet</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((p: Record<string, unknown>) => (
              <Link key={p.id as string} href={`/projects/${p.slug}`}>
                <Card className="overflow-hidden group hover:shadow-lg transition-all">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800">
                    {(p as { cover_image?: string }).cover_image ? (
                      <img src={(p as { cover_image: string }).cover_image} alt={p.title as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <span className="text-xs font-medium text-green-600 uppercase">{p.project_type as string}</span>
                    <h3 className="font-semibold text-lg mt-1">{p.title as string}</h3>
                    <p className="text-sm text-muted-foreground">{p.location as string} | {(p as { capacity: number }).capacity}kW</p>
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


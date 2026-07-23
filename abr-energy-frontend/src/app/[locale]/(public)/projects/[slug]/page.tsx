'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Loader2, MapPin, Zap, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectDetail } from '@/types';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  planned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: project, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ['project', slug],
    queryFn: () => axiosInstance.get(`/projects/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => { if (error) toast.error('Failed to load project'); }, [error]);
  if (error) return <div className="py-20 text-center text-muted-foreground">Failed to load project</div>;
  if (isLoading) return <div className="py-20 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!project) return <div className="py-20 text-center text-muted-foreground">Project not found</div>;

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/projects" className="hover:text-foreground">Projects</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{project.title}</span>
        </nav>

        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-6">{project.title}</h1>

        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          {project.location && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {project.location}
            </span>
          )}
          {project.capacity && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-4 w-4" /> {project.capacity} kW
            </span>
          )}
          {project.project_type && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Ruler className="h-4 w-4" /> {project.project_type.replace('_', ' ')}
            </span>
          )}
          {project.status && (
            <Badge className={cn('capitalize', statusColors[project.status])}>
              {project.status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {project.cover_image && (

          <img src={project.cover_image} alt={project.title} className="w-full aspect-video object-cover rounded-xl mb-8" />
        )}

        <div className="prose prose-green dark:prose-invert max-w-none mb-12" dangerouslySetInnerHTML={{ __html: project.description }} />

        {project.images?.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Project Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.images.map((img) => (

                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.alt_text || project.title}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

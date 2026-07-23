'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useArticles } from '@/hooks/use-api';
import { PageHeader, TableLoading } from '@/components/shared';
import { Plus, Pencil, ExternalLink } from 'lucide-react';

const locales = [
  { code: 'fa', label: 'FA', color: 'text-green-600' },
  { code: 'ar', label: 'AR', color: 'text-red-500' },
  { code: 'en', label: 'EN', color: 'text-blue-600' },
];

export default function AdminArticlesPage() {
  const { data, isLoading, error } = useArticles();
  const articles = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <PageHeader title="Articles" description="Manage CMS articles and multilingual content">
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Create Article
        </Link>
      </PageHeader>

      {isLoading ? (
        <TableLoading rows={5} />
      ) : error ? (
        <div className="text-center py-12 text-destructive">Failed to load articles</div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No articles yet.</p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-4"
            >
              Create your first article
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Articles ({articles.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Languages</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Views</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a: Record<string, unknown>) => (
                    <tr key={a.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{a.title as string}</td>
                      <td className="py-3 px-4">
                        <Badge variant={a.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                          {a.status as string}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {locales.map((l) => (
                            <span key={l.code} className={`text-xs font-medium ${l.color}`}>
                              {l.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{(a as { category_title?: string }).category_title || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{(a as { view_count: number }).view_count}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(a.created_at as string).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/articles/${a.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/articles/${a.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8"
                            aria-label="View"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

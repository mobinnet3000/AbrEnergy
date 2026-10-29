'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  FileText,
  Download,
  Search,
  Calendar,
  HardDrive,
  ExternalLink,
  Tag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { usePublicDocuments } from '@/hooks/use-api';
import { CardLoading, InternalPageHeader, InternalPageShell } from '@/components/shared';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import type { PublicDocument } from '@/types';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'PDF';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadsClient() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('q') || '';

  const [search, setSearch] = useState(urlSearch);
  const [activeCategory, setActiveCategory] = useState(urlCategory);

  const { data, isLoading, isError, refetch } = usePublicDocuments();

  const documents: PublicDocument[] = useMemo(() => {
    if (!data) return [];
    const items = Array.isArray(data)
      ? data
      : (data as { results?: PublicDocument[] })?.results ?? [];
    return items;
  }, [data]);



  const updateUrlParams = (newCat: string, newSearch: string) => {
    const params = new URLSearchParams();
    if (newCat) params.set('category', newCat);
    if (newSearch.trim()) params.set('q', newSearch.trim());
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    updateUrlParams(slug, search);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    updateUrlParams(activeCategory, val);
  };

  // Predefined business categories alongside dynamically discovered ones
  const categories = useMemo(() => {
    const predefined = [
      { slug: '', label: t('downloads.all_documents') },
      { slug: 'solar-packages', label: t('downloads.solar_catalog') },
      { slug: 'modular-supports', label: t('downloads.modular_catalog') },
    ];

    const discoveredSlugs = new Set<string>();
    for (const doc of documents) {
      if (doc.category_slug && doc.category_slug !== 'solar-packages' && doc.category_slug !== 'modular-supports') {
        discoveredSlugs.add(doc.category_slug);
      }
    }

    const dynamic = Array.from(discoveredSlugs).map((slug) => {
      const doc = documents.find((d) => d.category_slug === slug);
      return {
        slug,
        label: doc?.category_title || slug,
      };
    });

    return [...predefined, ...dynamic];
  }, [documents, t]);

  // Filtered documents
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Category match: if activeCategory is set, check category_slug or related keywords
      if (activeCategory) {
        if (activeCategory === 'solar-packages') {
          const isSolar =
            doc.category_slug?.includes('solar') ||
            doc.title.includes('خورشیدی') ||
            doc.doc_type === 'catalog';
          if (!isSolar && doc.category_slug !== activeCategory) return false;
        } else if (activeCategory === 'modular-supports') {
          const isModular =
            doc.category_slug?.includes('modular') ||
            doc.title.includes('ساپورت') ||
            doc.title.includes('مدولار');
          if (!isModular && doc.category_slug !== activeCategory) return false;
        } else {
          if (doc.category_slug !== activeCategory) return false;
        }
      }

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const inTitle = doc.title.toLowerCase().includes(query);
        const inDesc = (doc.description || '').toLowerCase().includes(query);
        const inProd = (doc.product_title || '').toLowerCase().includes(query);
        const inCat = (doc.category_title || '').toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inProd && !inCat) return false;
      }

      return true;
    });
  }, [documents, activeCategory, search]);

  const docTypeLabel = (type: string) => {
    switch (type) {
      case 'catalog':
        return t('downloads.doc_type_catalog');
      case 'datasheet':
        return t('downloads.doc_type_datasheet');
      case 'installation_guide':
        return t('downloads.doc_type_installation_guide');
      case 'spec_sheet':
        return t('downloads.doc_type_spec_sheet');
      default:
        return t('downloads.doc_type_other');
    }
  };

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('nav.downloads') },
            ]}
            eyebrow={t('downloads.eyebrow')}
            title={t('downloads.title')}
            subtitle={t('downloads.subtitle')}
            centered
          />
        </div>
      </section>

      {/* Main Content Area */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page">
          {/* Controls: Category Filter Tabs & Search Bar */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    activeCategory === cat.slug
                      ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                      : 'border border-border/80 bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('downloads.search_placeholder')}
                className="w-full rounded-xl border border-input bg-background/80 py-2 pe-3 ps-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Loading, Error, Empty, and Results States */}
          {isLoading ? (
            <CardLoading count={4} />
          ) : isError ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-card/50 p-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive/80" />
              <p className="mb-4 text-sm font-semibold text-foreground">{t('common.error')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand-strong"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t('products.retry')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-16 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <h3 className="font-heading mb-1 text-base font-semibold text-foreground">
                {t('downloads.empty_title')}
              </h3>
              <p className="mx-auto max-w-md text-xs text-muted-foreground leading-relaxed">
                {t('downloads.empty_desc')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((doc, idx) => (
                <ScrollReveal key={doc.id} variant="slide-up" delay={idx * 0.05}>
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card/70">
                    <div>
                      {/* Top Bar: PDF Icon & Type Badge */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          {docTypeLabel(doc.doc_type)}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-heading mb-2 text-base font-semibold text-foreground line-clamp-2">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="mb-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      {/* Associated Details */}
                      {(doc.category_title || doc.product_title) && (
                        <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {doc.category_title && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                              <Tag className="h-3 w-3" /> {doc.category_title}
                            </span>
                          )}
                          {doc.product_title && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                              {doc.product_title}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: Metadata & Download Link */}
                    <div className="mt-4 border-t border-border/60 pt-4 dark:border-white/[0.06]">
                      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5" />
                          {formatFileSize(doc.file_size)}
                        </span>
                        {doc.created_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(doc.created_at).toLocaleDateString('fa-IR', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all duration-300 hover:bg-brand-strong active:scale-[0.98]"
                        >
                          <Download className="h-4 w-4" />
                          {t('downloads.download_file')}
                          <ExternalLink className="h-3 w-3 ms-1 opacity-70" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground opacity-60 cursor-not-allowed"
                        >
                          <Download className="h-4 w-4" />
                          {t('downloads.download_file')}
                        </button>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </InternalPageShell>
  );
}

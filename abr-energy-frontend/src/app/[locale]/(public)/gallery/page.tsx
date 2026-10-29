'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { InternalPageShell, InternalPageHeader } from '@/components/shared';
import { useLocale } from '@/i18n';
import type { GalleryImage } from '@/types';

export default function GalleryPage() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery<GalleryImage[] | { results: GalleryImage[] }>({
    queryKey: ['gallery'],
    queryFn: () => axiosInstance.get('/gallery/').then((r) => r.data),
  });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const images: GalleryImage[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data as { results: GalleryImage[] })?.results ?? [];
    // Ensure only image files are rendered (exclude PDFs if any were erroneously linked)
    return raw.filter((img) => img.image_url && !img.image_url.toLowerCase().endsWith('.pdf'));
  }, [data]);

  const categories = useMemo(() => {
    const cats = [...new Set(images.map((img) => img.category_title).filter(Boolean))];
    return ['All', ...cats];
  }, [images]);

  const filtered = useMemo(
    () => (activeCategory === 'All' ? images : images.filter((img) => img.category_title === activeCategory)),
    [activeCategory, images],
  );

  const openLightbox = useCallback((i: number) => setLightboxIdx(i), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIdx((prev) => (prev !== null ? Math.min(prev + 1, images.length - 1) : null));
      if (e.key === 'ArrowLeft') setLightboxIdx((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, closeLightbox, images.length]);

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('nav.gallery') },
            ]}
            eyebrow={t('gallery.visual_showcase')}
            title={t('nav.gallery')}
            subtitle={t('gallery.subtitle')}
            centered
          />
        </div>
      </section>

      {/* Main Grid */}
      <section className="pb-24 md:pb-32">
        <div className="container-page">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border/80 bg-card/40">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('gallery.not_found')}</p>
            </div>
          ) : (
            <>
              {/* Category Filters */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        activeCategory === cat
                          ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                          : 'bg-card/70 text-muted-foreground border border-border/80 hover:text-foreground hover:bg-card/90'
                      }`}
                    >
                      {cat === 'All' ? t('common.view_all') : cat}
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border/80 bg-card/40">
                  <p className="text-sm text-muted-foreground">{t('gallery.no_images_category')}</p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {filtered.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3) }}
                      className="break-inside-avoid rounded-2xl overflow-hidden border border-border/80 bg-card/70 hover:border-emerald-500/40 cursor-pointer group shadow-xs transition-all duration-300"
                      onClick={() => openLightbox(i)}
                    >
                      <div className="overflow-hidden bg-muted/40 aspect-[4/3] relative">
                        {!failedImages[img.id] ? (
                          <img
                            src={img.image_url}
                            alt={img.alt_text || img.title || 'تصویر گالری'}
                            loading="lazy"
                            onError={() => setFailedImages((prev) => ({ ...prev, [img.id]: true }))}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {img.title || t('gallery.title')}
                        </p>
                        {img.category_title && (
                          <p className="text-xs text-muted-foreground mt-0.5">{img.category_title}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIdx !== null && images[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors z-10"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxIdx > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(lightboxIdx - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors z-10"
                aria-label={t('common.previous')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {lightboxIdx < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(lightboxIdx + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors z-10"
                aria-label={t('common.next')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIdx].image_url}
                alt={images[lightboxIdx].alt_text || images[lightboxIdx].title}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
              <div className="mt-4 text-center text-white">
                <h3 className="font-heading text-lg font-semibold">{images[lightboxIdx].title}</h3>
                {images[lightboxIdx].caption && (
                  <p className="mt-1 text-sm text-white/70 max-w-xl">{images[lightboxIdx].caption}</p>
                )}
                {images[lightboxIdx].category_title && (
                  <p className="mt-1 text-xs text-emerald-400">{images[lightboxIdx].category_title}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </InternalPageShell>
  );
}

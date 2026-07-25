'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sun, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { ScrollReveal } from '@/components/home/ScrollReveal';
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

  const images: GalleryImage[] = Array.isArray(data) ? data : (data as { results: GalleryImage[] })?.results ?? [];
  const categories = useMemo(() => {
    const cats = [...new Set(images.map((img) => img.category_title).filter(Boolean))];
    return ['All', ...cats];
  }, [images]);
  const filtered = activeCategory === 'All' ? images : images.filter((img) => img.category_title === activeCategory);
  const openLightbox = useCallback((i: number) => setLightboxIdx(i), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIdx((prev) => prev !== null ? Math.min(prev + 1, images.length - 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIdx((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, closeLightbox, images.length]);

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">{t('gallery.visual_showcase')}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">{t('nav.gallery')}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">{t('gallery.subtitle')}</motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-28 md:pb-36">
        <div className="container-page">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 text-white/30">{t('gallery.not_found')}</div>
          ) : (
            <>
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      activeCategory === cat
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-white/30">{t('gallery.no_images_category')}</div>
              )}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filtered.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                  className="break-inside-avoid rounded-xl overflow-hidden border border-white/[0.04] bg-white/[0.02] cursor-pointer group"
                  onClick={() => openLightbox(i)}
                >
                  <img src={img.image_url} alt={img.alt_text || img.title} loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="p-3">
                    <p className="text-sm font-medium text-white/70 truncate">{img.title}</p>
                    {img.category_title && <p className="text-xs text-white/30 mt-0.5">{img.category_title}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && images[lightboxIdx] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"><X className="h-5 w-5" /></button>
            {lightboxIdx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10">
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {lightboxIdx < images.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10">
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
            <motion.div
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={images[lightboxIdx].image_url} alt={images[lightboxIdx].title} className="w-full h-full object-contain rounded-2xl" />
              <div className="text-center mt-4">
                <p className="text-sm text-white/70">{images[lightboxIdx].title}</p>
                {images[lightboxIdx].caption && <p className="text-xs text-white/40 mt-1">{images[lightboxIdx].caption}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

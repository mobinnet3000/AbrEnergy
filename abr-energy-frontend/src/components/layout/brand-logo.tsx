'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/i18n';
import { useSiteSettings } from '@/hooks/use-api';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

// Phase 12.29 — Official brand logo asset with resilient fallback.
export const DEFAULT_LOGO_SRC = '/abar-energy-logo.png';
export const LOGO_WIDTH = 607;
export const LOGO_HEIGHT = 246;

export function BrandLogo({
  className,
  nameClassName,
  priority = false,
}: {
  className?: string;
  nameClassName?: string;
  priority?: boolean;
}) {
  const { locale, t } = useLocale();
  const { data: settings } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  const cmsLogo = !imgError && settings?.logo ? resolveMediaUrl(settings.logo as string) : '';
  const src = cmsLogo || DEFAULT_LOGO_SRC;

  // Localized brand display name based on active locale
  const name =
    locale === 'en'
      ? settings?.company_name_en || 'AbarEnergy'
      : locale === 'ar'
        ? (settings as { company_name_ar?: string })?.company_name_ar || t('common.site_name') || 'أبر إنيرجي'
        : settings?.company_name || t('common.site_name') || 'ابر انرژی';

  return (
    <Link
      href={`/${locale}`}
      data-testid="brand-logo"
      className={cn(
        'group flex items-center gap-2.5 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        className,
      )}
    >
      {/* object-contain + intrinsic ratio: never stretch, crop, or blur.
          Adaptive light chip keeps dark-green mark legible on dark/light headers. */}
      <span className="flex shrink-0 items-center justify-center rounded-xl bg-white/90 p-1 ring-1 ring-black/5 shadow-xs dark:bg-white/95 dark:ring-white/10">
        <Image
          src={src}
          alt={name}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority={priority}
          onError={() => setImgError(true)}
          className="h-7 w-auto max-w-[6rem] object-contain sm:h-8 sm:max-w-[7rem]"
        />
      </span>
      <span
        aria-hidden
        className={cn('font-heading font-bold text-lg tracking-tight sm:text-xl select-none', nameClassName)}
      >
        {name}
      </span>
    </Link>
  );
}

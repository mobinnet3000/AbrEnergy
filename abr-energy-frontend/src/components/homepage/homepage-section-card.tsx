'use client';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/i18n';
import type { HomepageSection } from '@/types';

interface HomepageSectionCardProps {
  section: HomepageSection;
  onMove: (key: string, dir: -1 | 1) => void;
  onChange: (key: string, patch: Partial<HomepageSection>) => void;
  isFirst: boolean;
  isLast: boolean;
  errors?: string[];
}

/**
 * Phase 7 — per-section CMS card: visibility switch, numeric order (+
 * up/down), and the editable copy fields. Only the fields a section
 * genuinely needs are shown: `content` (description) is hidden for
 * sections that render title/subtitle only.
 */
export function HomepageSectionCard({ section, onMove, onChange, isFirst, isLast, errors }: HomepageSectionCardProps) {
  const { t } = useLocale();
  const name = t(`admin.homepage_section_${section.key}`);
  const showContent = section.key === 'calculator' || section.key === 'contact';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="flex-1">{name}</CardTitle>
          <button
            type="button"
            role="switch"
            aria-checked={section.enabled}
            aria-label={name}
            onClick={() => onChange(section.key, { enabled: !section.enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${section.enabled ? 'bg-primary' : 'bg-input'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${section.enabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
            />
          </button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              value={section.order}
              onChange={(e) => onChange(section.key, { order: Math.max(0, Number(e.target.value) || 0) })}
              className="w-20"
              dir="ltr"
              aria-label={t('admin.homepage_order')}
            />
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onMove(section.key, -1)} disabled={isFirst} aria-label={t('admin.media_reorder_up')}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onMove(section.key, 1)} disabled={isLast} aria-label={t('admin.media_reorder_down')}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.homepage_title')}</label>
          <Input value={section.title} onChange={(e) => onChange(section.key, { title: e.target.value })} dir="auto" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t('admin.homepage_subtitle')}</label>
          <Input value={section.subtitle} onChange={(e) => onChange(section.key, { subtitle: e.target.value })} dir="auto" />
        </div>
        {showContent && (
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.homepage_description')}</label>
            <Textarea value={section.content} onChange={(e) => onChange(section.key, { content: e.target.value })} dir="auto" rows={3} />
          </div>
        )}
        {errors && errors.length > 0 && (
          <ul className="text-sm text-destructive space-y-1" role="alert">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

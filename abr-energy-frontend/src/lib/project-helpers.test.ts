import { describe, it, expect } from 'vitest';
import { formatProjectType, formatProjectStatus } from './project-helpers';

describe('Project helpers localization (Phase 12.20)', () => {
  it('formats project types in Persian', () => {
    expect(formatProjectType('on_grid')).toBe('متصل به شبکه');
    expect(formatProjectType('off_grid')).toBe('منفصل از شبکه');
    expect(formatProjectType('hybrid')).toBe('هیبرید');
    expect(formatProjectType('large_scale')).toBe('مقیاس بزرگ');
    expect(formatProjectType('custom')).toBe('custom');
    expect(formatProjectType('')).toBe('');
    expect(formatProjectType(null)).toBe('');
  });

  it('formats project statuses in Persian', () => {
    expect(formatProjectStatus('planning')).toBe('در حال برنامه‌ریزی');
    expect(formatProjectStatus('in_progress')).toBe('در حال اجرا');
    expect(formatProjectStatus('completed')).toBe('تکمیل شده');
    expect(formatProjectStatus('on_hold')).toBe('متوقف شده');
    expect(formatProjectStatus('cancelled')).toBe('لغو شده');
    expect(formatProjectStatus('other')).toBe('other');
    expect(formatProjectStatus(null)).toBe('');
  });
});

export function formatProjectType(type?: string | null): string {
  switch (type) {
    case 'on_grid':
      return 'متصل به شبکه';
    case 'off_grid':
      return 'منفصل از شبکه';
    case 'hybrid':
      return 'هیبرید';
    case 'large_scale':
      return 'مقیاس بزرگ';
    default:
      return type || '';
  }
}

export function formatProjectStatus(status?: string | null): string {
  switch (status) {
    case 'planning':
      return 'در حال برنامه‌ریزی';
    case 'in_progress':
      return 'در حال اجرا';
    case 'completed':
      return 'تکمیل شده';
    case 'on_hold':
      return 'متوقف شده';
    case 'cancelled':
      return 'لغو شده';
    default:
      return status || '';
  }
}

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateProps {
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ title = 'No data found', message = 'There is nothing to display yet.', action, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <Info className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message = 'An error occurred while loading. Please try again.', action, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <AlertCircle className="h-12 w-12 text-destructive/60 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4" variant="outline" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function SuccessState({ title = 'Completed successfully', message, action, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <CheckCircle2 className="h-12 w-12 text-success/60 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-sm">{message}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NotFoundState({ title = 'Page not found', message = 'The page you are looking for does not exist.' }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-16 w-16 text-warning/60 mb-4" />
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

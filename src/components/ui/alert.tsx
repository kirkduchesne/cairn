import * as React from 'react';
import { cn } from '@/lib/utils';

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
      variant === 'destructive'
        ? 'border-destructive/30 bg-destructive/[0.06] text-destructive'
        : 'bg-card text-foreground',
      className,
    )}
    {...props}
  />
));
Alert.displayName = 'Alert';

export { Alert };

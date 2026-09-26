import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * shadcn/ui's NativeSelect: a styled platform <select>, so option lists stay
 * accessible, mobile-friendly, and scriptable like any form control.
 */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<'select'> & { wrapperClassName?: string }
>(({ className, wrapperClassName, children, ...props }, ref) => (
  <span className={cn('relative block', wrapperClassName)}>
    <select
      ref={ref}
      className={cn(
        'h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-card py-1 pl-3 pr-8 text-sm font-normal shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </span>
));
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };

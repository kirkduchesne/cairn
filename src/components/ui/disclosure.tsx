import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A card-styled native <details>, in the spirit of shadcn/ui's Collapsible.
 * Native details keeps content in the document and works without scripts.
 */
function Disclosure({
  summary,
  icon,
  hint,
  className,
  children,
  ...props
}: Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, 'summary'> & {
  summary: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <details
      className={cn(
        'group/disclosure rounded-xl border bg-card text-card-foreground shadow-[0_1px_2px_hsl(24_20%_20%/0.04)] [&[open]>summary_.chev]:rotate-90',
        className,
      )}
      {...props}
    >
      <summary className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent/60">
        {icon && (
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4"
          >
            {icon}
          </span>
        )}
        <span>{summary}</span>
        {hint && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'chev size-4 text-muted-foreground transition-transform',
            !hint && 'ml-auto',
          )}
        />
      </summary>
      <div className="border-t px-4 pb-4 pt-4">{children}</div>
    </details>
  );
}

export { Disclosure };

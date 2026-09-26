import { cn } from '@/lib/utils';

export const brandName = 'Cairn';

/** Three stacked stones; the top one carries the trail blaze. */
export function CairnMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('size-8', className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <ellipse cx="16" cy="24.2" rx="9.2" ry="3.6" className="fill-primary-foreground/90" />
      <ellipse cx="15.2" cy="17.6" rx="6.6" ry="3" className="fill-primary-foreground/75" />
      <ellipse cx="16.6" cy="11.9" rx="4.4" ry="2.5" className="fill-blaze" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <CairnMark />
      <span className="font-display text-xl font-semibold tracking-tight">
        {brandName}
      </span>
    </span>
  );
}

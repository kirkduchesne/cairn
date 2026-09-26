import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        blaze: 'border-blaze/20 bg-blaze-soft text-blaze',
        moss: 'border-moss/20 bg-moss-soft text-moss',
        dusk: 'border-dusk/20 bg-dusk-soft text-dusk',
        ochre: 'border-ochre/20 bg-ochre-soft text-ochre',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof badgeVariants> {
  as?: 'span' | 'p' | 'li';
}

function Badge({ className, variant, as: Tag = 'span', ...props }: BadgeProps) {
  return <Tag className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

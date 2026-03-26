import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-surface-700 bg-surface-800 text-text-300',
        success:
          'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
        warning: 'border border-amber-500/30 bg-amber-500/15 text-amber-400',
        danger: 'border border-danger-500/30 bg-danger-500/15 text-danger-500',
        accent: 'border border-accent-500/30 bg-accent-500/15 text-accent-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type TBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  className,
  variant,
  ...props
}: TBadgeProps): React.JSX.Element {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

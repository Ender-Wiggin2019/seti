import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Badge — small status / label chip.
 *
 * Instrumentation style: compact rectangular status tags from the Mission Hub
 * reference. Colors are semantic tints, not decorative badges.
 *
 * Variant colors reserved for:
 *   default → neutral label
 *   data    → plain white readout (no semantic color — pure data)
 *   accent  → anodized blue (active turn, focused state, CTA)
 *   success → mission accomplished / good signal
 *   warning → degraded signal / resource pressure
 *   danger  → destructive / end-of-game
 */
const badgeVariants = cva(
  [
    'inline-flex items-center',
    'rounded-[4px]',
    'px-2.5 py-1',
    'font-body text-xs font-medium',
    'whitespace-nowrap',
    'transition-colors duration-150',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[oklch(0.22_0.025_260)]',
          'border border-[color:var(--metal-edge-soft)]',
          'text-text-300',
        ],
        data: [
          'bg-transparent',
          'border border-[color:var(--metal-edge-soft)]',
          'text-text-100 tabular-nums',
        ],
        accent: [
          'bg-[oklch(0.32_0.07_240/0.35)]',
          'border border-[oklch(0.48_0.09_240/0.55)]',
          'text-[oklch(0.88_0.10_240)]',
        ],
        info: [
          'bg-[oklch(0.30_0.08_230/0.34)]',
          'border border-[oklch(0.50_0.10_230/0.55)]',
          'text-[oklch(0.88_0.10_230)]',
        ],
        success: [
          'bg-[oklch(0.35_0.09_160/0.30)]',
          'border border-[oklch(0.52_0.12_160/0.55)]',
          'text-[oklch(0.88_0.14_160)]',
        ],
        warning: [
          'bg-[oklch(0.35_0.10_75/0.32)]',
          'border border-[oklch(0.55_0.13_75/0.55)]',
          'text-[oklch(0.88_0.14_75)]',
        ],
        danger: [
          'bg-[oklch(0.35_0.13_28/0.32)]',
          'border border-[oklch(0.55_0.16_28/0.55)]',
          'text-[oklch(0.85_0.16_28)]',
        ],
        neutral: [
          'bg-[oklch(0.18_0.02_260/0.82)]',
          'border border-[color:var(--metal-edge-soft)]',
          'text-text-300',
        ],
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

export { badgeVariants };

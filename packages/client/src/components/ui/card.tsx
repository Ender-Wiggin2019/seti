import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Card — the panel system.
 *
 * Two visual levels, both dark surfaces framed in hairline metal:
 *  - `panel`      → the workhorse. Dark surface, hairline metal frame.
 *  - `instrument` → elevated. Slightly lighter surface, sharper frame,
 *                   soft contact shadow. Use when a panel needs to pull
 *                   focus (active turn, currently-resolving action).
 *
 * NOTE: This is NEVER a metal-face surface. Panels are dark; the metal
 * is only their frame. See `.impeccable.md` §Metal Surfaces.
 */
const cardVariants = cva(
  'relative overflow-hidden rounded-[6px] transition-colors',
  {
    variants: {
      variant: {
        panel: [
          'bg-surface-900/85 backdrop-blur-[2px]',
          'border border-[color:var(--metal-edge-soft)]',
          'shadow-hairline-inset',
        ],
        instrument: [
          'bg-surface-800/90',
          'border border-[color:var(--metal-edge)]',
          'shadow-instrument',
        ],
      },
    },
    defaultVariants: { variant: 'panel' },
  },
);

type TCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export function Card({
  className,
  variant,
  ...props
}: TCardProps): React.JSX.Element {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props} />
  );
}

type TCardSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({
  className,
  ...props
}: TCardSectionProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 px-5 py-4',
        'border-b border-[color:var(--metal-edge-soft)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  return (
    <h3
      className={cn(
        'font-display text-base font-medium text-text-100 leading-tight tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return (
    <p
      className={cn('text-sm text-text-500 leading-relaxed', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: TCardSectionProps): React.JSX.Element {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: TCardSectionProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-5 py-3',
        'border-t border-[color:var(--metal-edge-soft)]',
        className,
      )}
      {...props}
    />
  );
}

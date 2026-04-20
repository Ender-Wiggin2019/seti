import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Button — the interactive workhorse.
 * Three visual languages for three levels of intent:
 *  - `primary`  → metal-face (anodized blue). Player agency, CTAs.
 *  - `ghost`    → hairline metal (no fill). Secondary actions, filters, chips.
 *  - `danger`   → anodized-red metal face. Destructive / game-ending only.
 *  - `link`     → text-only, for inline or subtle nav.
 */
const buttonVariants = cva(
  [
    // Structural
    'relative inline-flex items-center justify-center gap-2',
    'font-body font-medium whitespace-nowrap select-none',
    'transition-[background,box-shadow,color,transform] duration-150',
    // Focus — custom ring from globals.css; keep an override for brand consistency
    'focus-visible:outline-none',
    'focus-visible:shadow-[0_0_0_2px_var(--bg-950),0_0_0_4px_oklch(0.68_0.11_240/0.9)]',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: [
          // The metal-face technique: gradient + bevel highlights + contact shadow.
          'text-[oklch(0.98_0.01_240)]',
          'bg-metal-face',
          'border border-[oklch(0.30_0.06_240)]',
          'shadow-metal-face',
          // Hover: brighten the gradient 4-6% in lightness, no color shift.
          'hover:bg-metal-face-hover',
          'hover:shadow-metal-face-hover',
          // Active: invert the gradient (light at bottom) and drop contact shadow.
          'active:bg-metal-face-pressed',
          'active:shadow-metal-face-active',
          'active:translate-y-px',
        ],
        ghost: [
          // Hairline metal frame, no fill. Hover reveals a soft tint.
          'text-text-100',
          'bg-transparent',
          'border border-[color:var(--metal-edge)]',
          'shadow-hairline-inset',
          'hover:bg-surface-800/60',
          'hover:border-[oklch(0.40_0.04_240)]',
          'active:bg-surface-800/80',
          'active:translate-y-px',
        ],
        danger: [
          'text-[oklch(0.98_0.02_28)]',
          'bg-metal-face-danger',
          'border border-[oklch(0.32_0.10_28)]',
          'shadow-[inset_0_1px_0_oklch(0.78_0.10_28/0.45),inset_0_-1px_0_oklch(0.24_0.08_28/0.6),0_1px_0_oklch(0.08_0.018_260/0.8)]',
          'hover:brightness-110',
          'active:translate-y-px',
        ],
        link: [
          'bg-transparent border-transparent shadow-none',
          'text-accent-400 hover:text-accent-500',
          'underline-offset-4 hover:underline',
          'px-0 py-0 h-auto',
        ],
      },
      size: {
        sm: 'h-8 px-3 rounded-[4px] text-xs',
        md: 'h-10 px-4 rounded-[5px] text-sm',
        lg: 'h-12 px-6 rounded-[6px] text-sm tracking-wide',
        icon: 'h-10 w-10 rounded-[5px] p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type TButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: TButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };

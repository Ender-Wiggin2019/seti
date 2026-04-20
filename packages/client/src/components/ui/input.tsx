import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Input — text field with the hairline metal frame treatment.
 * Inset top highlight catches the light; dark surface fills the face.
 * Uses the `readout`-ready mono font stack for numeric contexts
 * (coordinates, resource counts) via `data-mono`.
 */
type TInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** When true, use the monospace readout font (coordinates, numbers). */
  mono?: boolean;
};

export const Input = forwardRef<HTMLInputElement, TInputProps>(
  ({ className, mono, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // Structural
          'flex h-10 w-full px-3 py-2 text-sm',
          'rounded-[5px]',
          // Surface: dark fill, hairline metal border, inset top highlight
          'bg-[oklch(0.12_0.02_260)]',
          'border border-[color:var(--metal-edge)]',
          'shadow-hairline-inset',
          // Typography
          'text-text-100',
          'placeholder:text-text-500 placeholder:font-normal',
          // Interaction
          'transition-[box-shadow,border-color] duration-150',
          'hover:border-[oklch(0.40_0.04_240)]',
          'focus:outline-none',
          'focus:border-accent-500',
          'focus:shadow-[inset_0_1px_0_oklch(0.78_0.04_240/0.25),0_0_0_3px_oklch(0.68_0.11_240/0.25)]',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Mono (opt-in)
          mono && 'font-mono tracking-readout tabular-nums',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

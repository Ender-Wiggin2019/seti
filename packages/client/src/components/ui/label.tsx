import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Label — form field label.
 * Default renders as body text; pass `variant="micro"` for the
 * instrumentation-style mono micro-label used above readouts
 * ("SIGNAL STRENGTH", "COORDINATES").
 */
type TLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  variant?: 'default' | 'micro';
};

export const Label = forwardRef<HTMLLabelElement, TLabelProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          variant === 'micro'
            ? 'font-mono text-[0.6875rem] font-medium uppercase tracking-microlabel text-text-500'
            : 'text-sm font-medium text-text-300 leading-none',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = 'Label';

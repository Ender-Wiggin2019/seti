import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * ScrollArea — native scroll container with the system scrollbar palette.
 * The global scrollbar styling in globals.css already themes every
 * scrolling surface; this component is a thin passthrough that makes
 * the intent explicit (and exposes the scroll container for refs).
 */
type TScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export const ScrollArea = forwardRef<HTMLDivElement, TScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative overflow-auto', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';

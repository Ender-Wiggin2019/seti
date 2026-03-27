import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type TScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export const ScrollArea = forwardRef<HTMLDivElement, TScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-auto scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';

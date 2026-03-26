import { cn } from '@/lib/cn';

type TScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export function ScrollArea({
  className,
  children,
  ...props
}: TScrollAreaProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'overflow-auto scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

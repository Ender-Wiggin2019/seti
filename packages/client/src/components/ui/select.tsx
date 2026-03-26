import { cn } from '@/lib/cn';

type TSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  children,
  ...props
}: TSelectProps): React.JSX.Element {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

import { cn } from '@/lib/cn';

type TLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: TLabelProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'text-sm font-medium text-text-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}

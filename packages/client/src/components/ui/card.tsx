import { cn } from '@/lib/cn';

type TCardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: TCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border border-surface-700 bg-surface-900/70 shadow-panel',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: TCardProps): React.JSX.Element {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-5', className)}
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
        'text-lg font-semibold text-text-100 leading-none tracking-tight',
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
  return <p className={cn('text-sm text-text-500', className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: TCardProps): React.JSX.Element {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: TCardProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
  );
}

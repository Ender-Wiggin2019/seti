import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface IDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: IDialogProps): React.JSX.Element | null {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onOpenChange(false);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/85'
    >
      <div className='w-full max-w-lg' role='dialog' aria-modal='true'>
        {children}
      </div>
    </div>,
    document.body,
  );
}

type TDialogContentProps = React.HTMLAttributes<HTMLDivElement>;

export function DialogContent({
  className,
  ...props
}: TDialogContentProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-lg border border-surface-700 bg-background-900 p-6 shadow-panel',
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 mb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  return (
    <h2
      className={cn(
        'text-lg font-semibold text-text-100 leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('flex justify-end gap-2 mt-4', className)} {...props} />
  );
}

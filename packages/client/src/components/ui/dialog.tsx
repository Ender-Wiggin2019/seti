import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { GAME_Z_INDEX } from '@/styles/zIndex';

/**
 * Dialog — modal surface.
 *
 * The overlay settles the current view behind a raised mission surface.
 * Content owns its own max width so large player tools can breathe while
 * small confirms stay compact.
 */
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
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEsc);
    // Lock page scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      data-testid='dialog-overlay'
      style={{ zIndex: GAME_Z_INDEX.dialog }}
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        'bg-[oklch(0.05_0.015_260/0.86)]',
        'backdrop-blur-[2px]',
        'animate-overlay-fade-in',
      )}
    >
      <div
        className='w-full animate-panel-rise'
        role='dialog'
        aria-modal='true'
        data-dialog-surface='raised'
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

type TDialogContentProps = React.HTMLAttributes<HTMLDivElement>;

export function DialogContent({
  className,
  children,
  ...props
}: TDialogContentProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-lg overflow-hidden p-6',
        'rounded-[8px]',
        'bg-[var(--surface-raised)]/94',
        'backdrop-blur-md',
        'border border-[color:var(--metal-edge)]',
        'shadow-instrument',
        className,
      )}
      data-surface='raised'
      {...props}
    >
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-[color:var(--metal-edge-soft)]'
      />
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-5', className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  return (
    <h2
      className={cn(
        'font-display text-lg font-medium text-text-100 leading-tight tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return (
    <p
      className={cn('text-sm text-text-500 leading-relaxed', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

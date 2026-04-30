import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

/**
 * Dialog — modal surface.
 *
 * The overlay darkens the whole void with a soft radial vignette
 * (instrument spotlight) and the content surface is a hairline-metal
 * panel. Display font on the title sells the mission-control feel.
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
      className={cn(
        'fixed inset-0 z-[1000] flex items-center justify-center p-4',
        // Deep vignette: black pool at center, fades to edges.
        'bg-[radial-gradient(ellipse_at_center,oklch(0.03_0.01_260/0.92)_0%,oklch(0.05_0.015_260/0.88)_60%,oklch(0.05_0.015_260/0.80)_100%)]',
        'backdrop-blur-sm',
        'animate-overlay-fade-in',
      )}
    >
      <div
        className='w-full max-w-lg animate-panel-rise'
        role='dialog'
        aria-modal='true'
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
        'relative overflow-hidden p-6',
        'rounded-[8px]',
        'bg-surface-900',
        'border border-[color:var(--metal-edge)]',
        'shadow-instrument',
        className,
      )}
      {...props}
    >
      {/* Top highlight — the light catch */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.78_0.07_240/0.35)] to-transparent'
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

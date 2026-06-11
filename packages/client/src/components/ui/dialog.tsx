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

type TDialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Optional decorative sprite painted as a top header-band with a gradient
   * fade into the solid surface color. Matches the lobby card treatment so
   * dialogs feel cohesive with the page they were opened from.
   */
  scene?: string;
  /**
   * Height of the scene band in pixels. Defaults to 160 — wider/taller forms
   * may want 200 so the title still has a generous canvas to sit over.
   */
  sceneHeight?: number;
};

export function DialogContent({
  className,
  children,
  scene,
  sceneHeight = 160,
  ...props
}: TDialogContentProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-lg overflow-hidden p-6',
        'rounded-[8px]',
        'bg-[var(--surface-instrument)]',
        'border border-[color:var(--metal-edge)]',
        'shadow-instrument',
        className,
      )}
      data-surface='raised'
      data-dialog-scene={scene ? 'true' : 'false'}
      {...props}
    >
      {scene ? (
        <div
          aria-hidden
          data-testid='dialog-scene'
          className='pointer-events-none absolute inset-x-0 top-0 overflow-hidden'
          style={{ height: `${sceneHeight}px` }}
        >
          <img
            src={scene}
            alt=''
            className='h-full w-full select-none object-cover scale-[1.12] origin-center'
          />
          <span
            className='absolute inset-0'
            style={{
              backgroundImage:
                'linear-gradient(to bottom, color-mix(in oklab, var(--surface-instrument) 18%, transparent) 0%, color-mix(in oklab, var(--surface-instrument) 40%, transparent) 55%, var(--surface-instrument) 100%)',
            }}
          />
        </div>
      ) : null}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-[color:var(--metal-edge-soft)]'
      />
      <div className='relative'>{children}</div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      data-dialog-header
      className={cn('flex flex-col gap-1.5 mb-5', className)}
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
      data-dialog-title
      className={cn(
        'font-display text-lg font-medium text-text-100 leading-tight tracking-tight',
        '[[data-dialog-scene=true]_&]:[text-shadow:0_1px_10px_rgba(1,15,30,0.7)]',
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
      className={cn(
        'text-sm text-text-500 leading-relaxed',
        '[[data-dialog-scene=true]_&]:text-text-300',
        '[[data-dialog-scene=true]_&]:[text-shadow:0_1px_8px_rgba(1,15,30,0.6)]',
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
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

/**
 * Toast — ephemeral status messages, styled as mission-log entries.
 * Each toast is a hairline-metal panel with a single colored accent
 * stripe on the *bottom* (instrument underline; never a left stripe,
 * which is the #1 AI design tell and explicitly banned).
 */
interface IToast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  duration?: number;
}

interface IToastStore {
  toasts: IToast[];
  addToast: (toast: Omit<IToast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<IToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(opts: Omit<IToast, 'id'>): void {
  useToastStore.getState().addToast(opts);
}

const ACCENT_LINE: Record<NonNullable<IToast['variant']>, string> = {
  default: 'oklch(0.68 0.11 240)',
  success: 'oklch(0.75 0.16 160)',
  error: 'oklch(0.68 0.18 28)',
};

const ACCENT_TEXT: Record<NonNullable<IToast['variant']>, string> = {
  default: 'text-text-100',
  success: 'text-[oklch(0.90_0.12_160)]',
  error: 'text-[oklch(0.88_0.14_28)]',
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: IToast;
  onDismiss: () => void;
}): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(onDismiss, t.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [t.duration, onDismiss]);

  const variant = t.variant ?? 'default';

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'pointer-events-auto relative flex w-full max-w-sm items-start gap-3',
        'rounded-[6px] overflow-hidden',
        'bg-surface-900/95 backdrop-blur-sm',
        'border border-[color:var(--metal-edge)]',
        'shadow-instrument',
        'p-4',
        'animate-panel-rise',
      )}
    >
      {/* Bottom accent line — instrument underline (explicitly NOT a left stripe). */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-px'
        style={{
          background: `linear-gradient(to right, transparent 0%, ${ACCENT_LINE[variant]} 15%, ${ACCENT_LINE[variant]} 85%, transparent 100%)`,
        }}
      />
      <div className='flex-1 min-w-0'>
        <p
          className={cn(
            'font-body text-sm font-medium leading-snug',
            ACCENT_TEXT[variant],
          )}
        >
          {t.title}
        </p>
        {t.description && (
          <p className='mt-1 text-xs leading-relaxed text-text-500'>
            {t.description}
          </p>
        )}
      </div>
      <button
        type='button'
        onClick={onDismiss}
        className='-mr-1 -mt-1 flex h-6 w-6 items-center justify-center rounded-sm text-text-500 transition-colors hover:bg-surface-800 hover:text-text-100'
        aria-label='Dismiss'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='h-3.5 w-3.5'
        >
          <path d='M18 6 6 18' />
          <path d='m6 6 12 12' />
        </svg>
      </button>
    </div>
  );
}

export function Toaster(): React.JSX.Element | null {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className='fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none'>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

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

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-panel backdrop-blur-sm transition-all',
        t.variant === 'error'
          ? 'border-danger-500/30 bg-danger-500/10 text-danger-500'
          : t.variant === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-surface-700 bg-surface-900/95 text-text-100',
      )}
    >
      <div className='flex-1'>
        <p className='text-sm font-medium'>{t.title}</p>
        {t.description && (
          <p className='mt-1 text-xs opacity-80'>{t.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className='text-text-500 hover:text-text-100 transition'
        aria-label='Dismiss'
      >
        ✕
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

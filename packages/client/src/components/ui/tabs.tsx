import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tabs — instrumentation-style segmented control.
 * Inactive segments are muted text on dark; the active segment has
 * a soft lift (lighter surface + hairline) so the eye locks on.
 * A single under-line marker (anodized blue) confirms focus.
 */
interface ITabsContext {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<ITabsContext | null>(null);

function useTabsContext(): ITabsContext {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

interface ITabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: ITabsProps): React.JSX.Element {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const handleChange = (v: string): void => {
    setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface ITabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({
  children,
  className,
}: ITabsListProps): React.JSX.Element {
  return (
    <div
      role='tablist'
      className={cn(
        'inline-flex items-center gap-0.5 p-1',
        'rounded-[6px]',
        'bg-[oklch(0.13_0.02_260)]',
        'border border-[color:var(--metal-edge-soft)]',
        'shadow-hairline-inset',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ITabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({
  value,
  children,
  className,
}: ITabsTriggerProps): React.JSX.Element {
  const ctx = useTabsContext();
  const isActive = ctx.value === value;
  return (
    <button
      type='button'
      role='tab'
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap',
        'px-3 py-1.5',
        'rounded-[4px]',
        'font-body text-sm font-medium',
        'transition-[background,color] duration-150',
        'focus-visible:outline-none',
        'focus-visible:shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.8)]',
        isActive
          ? [
              'bg-surface-800 text-text-100',
              'border border-[color:var(--metal-edge-soft)]',
              'shadow-[inset_0_1px_0_oklch(0.78_0.04_240/0.22)]',
            ]
          : [
              'border border-transparent',
              'text-text-500 hover:text-text-300',
              'hover:bg-[oklch(0.18_0.025_260)]',
            ],
        className,
      )}
    >
      {children}
      {/* Active underline marker — a single anodized-blue instrument tick. */}
      {isActive && (
        <span
          aria-hidden
          className='pointer-events-none absolute bottom-[-2px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-[oklch(0.68_0.11_240)]'
        />
      )}
    </button>
  );
}

interface ITabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({
  value,
  children,
  className,
}: ITabsContentProps): React.JSX.Element | null {
  const ctx = useTabsContext();
  if (ctx.value !== value) return null;
  return (
    <div
      role='tabpanel'
      className={cn('mt-3 animate-instrument-fade-in', className)}
    >
      {children}
    </div>
  );
}

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/cn';

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
  const handleChange = (v: string) => {
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
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-surface-900 p-1 border border-surface-700',
        className,
      )}
      role='tablist'
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
      role='tab'
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-surface-800 text-text-100 shadow-sm'
          : 'text-text-500 hover:text-text-300 hover:bg-surface-800/50',
        className,
      )}
    >
      {children}
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
    <div role='tabpanel' className={cn('mt-2', className)}>
      {children}
    </div>
  );
}

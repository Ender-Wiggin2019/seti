import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/cn';

interface IEventSidebarDrawerProps {
  className?: string;
}

/**
 * EventSidebarDrawer — collapsible right-side intel drawer.
 *
 * Keeps event log / opponent intel outside the personal board so the
 * dashboard can stay focused. Opens from the right edge like a drawer.
 */
export function EventSidebarDrawer({
  className,
}: IEventSidebarDrawerProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <section
      className={cn('relative hidden h-full shrink-0 lg:block', className)}
      data-testid='event-sidebar-drawer'
    >
      <button
        type='button'
        className={cn(
          'absolute left-0 top-3 z-20 -translate-x-full',
          'rounded-l-[6px] rounded-r-none border border-r-0 border-[color:var(--metal-edge-soft)]',
          'bg-background-900/85 px-2.5 py-1.5 backdrop-blur-sm',
          'font-mono text-[10px] uppercase tracking-[0.14em] text-text-300',
          'transition-[background,border-color,color] hover:border-[oklch(0.40_0.04_240)] hover:bg-background-800/85 hover:text-text-100',
        )}
        aria-expanded={open}
        aria-controls='event-sidebar-panel'
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? t('client.common.close', { defaultValue: 'Close' })
          : t('client.event_log.title', { defaultValue: 'Event Log' })}
      </button>

      {open ? (
        <div id='event-sidebar-panel' className='h-full w-[320px] xl:w-[360px]'>
          <Sidebar className='h-full border-l border-[color:var(--metal-edge-soft)] bg-[oklch(0.13_0.022_260/0.5)] p-3' />
        </div>
      ) : null}
    </section>
  );
}

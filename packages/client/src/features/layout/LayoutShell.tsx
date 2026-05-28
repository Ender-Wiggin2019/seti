import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { LayoutDevPanel } from './devPanel/LayoutDevPanel';
import { useLayout } from './LayoutContext';
import { useLayoutStore } from './layoutStore';
import { MobileShell } from './shells/MobileShell';
import { PinnedLayer } from './shells/PinnedLayer';
import { TabShell } from './shells/TabShell';
import { WaterfallShell } from './shells/WaterfallShell';

/**
 * LayoutShell — the root render. Picks tab vs waterfall vs mobile and
 * layers in pinned chrome (TopBar / ActionBar / Hand).
 *
 * Mobile takes precedence over both tab and waterfall — at narrow widths
 * everything collapses into a single scrollable column regardless of mode.
 */
export function LayoutShell(): React.JSX.Element {
  const { layout, isMobile } = useLayout();
  const toggleDevPanel = useLayoutStore((s) => s.toggleDevPanel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isLayoutDevPanelShortcut(e)) {
        e.preventDefault();
        toggleDevPanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleDevPanel]);

  return (
    <div
      className={cn(
        'flex h-screen flex-col overflow-hidden',
        'bg-[var(--surface-void)] text-text-100',
      )}
    >
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />

      <PinnedLayer variant='sticky-top' />

      <div className='flex min-h-0 flex-1 flex-col'>
        {isMobile ? (
          <MobileShell />
        ) : layout.mode === 'tab' ? (
          <TabShell />
        ) : (
          <WaterfallShell />
        )}
      </div>

      <PinnedLayer variant='sticky-bottom' />
      <PinnedLayer variant='fixed' />

      <LayoutDevPanel />
    </div>
  );
}

export function isLayoutDevPanelShortcut(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l';
}

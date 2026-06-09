import { useEffect } from 'react';
import { EventSidebarDrawer } from '@/components/layout/EventSidebarDrawer';
import { cn } from '@/lib/cn';
import { GAME_Z_INDEX } from '@/styles/zIndex';
import { LayoutDevPanel } from './devPanel/LayoutDevPanel';
import { useLayout } from './LayoutContext';
import { useLayoutStore } from './layoutStore';
import { MobileShell } from './shells/MobileShell';
import { PinnedLayer } from './shells/PinnedLayer';
import { TabShell } from './shells/TabShell';
import { WaterfallShell } from './shells/WaterfallShell';

const GAME_SHELL_SCENE_IMAGE = '/assets/seti/sprites/terrain_02_02.webp';

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
        className='pointer-events-none fixed inset-0 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
        style={{ zIndex: GAME_Z_INDEX.background }}
        aria-hidden
      />
      <img
        src={GAME_SHELL_SCENE_IMAGE}
        alt=''
        aria-hidden
        className='pointer-events-none fixed inset-x-0 bottom-0 h-[38vh] w-full object-cover object-bottom opacity-[0.22]'
        style={{ zIndex: GAME_Z_INDEX.background }}
      />

      <PinnedLayer variant='sticky-top' />

      <div className='relative flex min-h-0 flex-1'>
        <div className='flex min-w-0 flex-1 flex-col'>
          {isMobile ? (
            <MobileShell />
          ) : layout.mode === 'tab' ? (
            <TabShell />
          ) : (
            <WaterfallShell />
          )}
        </div>
        <EventSidebarDrawer />
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

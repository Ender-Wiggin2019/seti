import { useEffect } from 'react';
import { EventSidebarDrawer } from '@/components/layout/EventSidebarDrawer';
import { cn } from '@/lib/cn';
import { LayoutDevPanel } from './devPanel/LayoutDevPanel';
import { GameSceneBackground } from './GameSceneBackground';
import { useGameSession } from './GameSessionContext';
import { useLayout } from './LayoutContext';
import { useLayoutStore } from './layoutStore';
import { MobileShell } from './shells/MobileShell';
import { HAND_COLLAPSED_HEIGHT, PinnedLayer } from './shells/PinnedLayer';
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
  const handExpanded = useGameSession().handExpanded;
  const fixedBottomReserve = getFixedBottomReserve(
    layout.sections,
    handExpanded,
  );

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
        // No opaque background here: GameSceneBackground (fixed, z = -10)
        // provides the void base. An opaque bg on this in-flow root would
        // paint *over* the negative-z scene layer and hide it entirely.
        'text-text-100',
      )}
    >
      <GameSceneBackground />

      <PinnedLayer variant='sticky-top' />

      <div
        className='relative flex min-h-0 flex-1'
        data-testid='layout-content-region'
        style={
          fixedBottomReserve ? { paddingBottom: fixedBottomReserve } : undefined
        }
      >
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

export function getFixedBottomReserve(
  sections: Array<{
    id?: string;
    pin?: string;
    visible?: boolean;
    size?: { height?: string };
  }>,
  handExpanded = true,
): string | undefined {
  const total = sections.reduce((sum, section) => {
    if (!section.visible || section.pin !== 'fixed-bottom') return sum;
    // A collapsed hand only reserves its rail height.
    if (section.id === 'hand' && !handExpanded) {
      return sum + (parsePx(HAND_COLLAPSED_HEIGHT) ?? 0);
    }
    const height = parsePx(section.size?.height);
    return height === null ? sum : sum + height;
  }, 0);

  return total > 0 ? `${total}px` : undefined;
}

function parsePx(value: string | undefined): number | null {
  if (!value?.endsWith('px')) return null;
  const parsed = Number(value.slice(0, -2));
  return Number.isFinite(parsed) ? parsed : null;
}

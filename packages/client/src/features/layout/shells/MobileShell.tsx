import { useEffect } from 'react';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { getSection } from '../sectionRegistry';
import type { ResolvedSection, Slot } from '../types';
import { SectionFrame } from './SectionFrame';

/**
 * MobileShell — single-column fallback used whenever the viewport is below
 * the configured breakpoint, regardless of mode.
 *
 * Order priority:
 *   1. explicit `mobileOrder`
 *   2. otherwise: slot priority (left → middle → right) + waterfall.order /
 *      tab.order, depending on mode
 */
const SLOT_PRIORITY: Record<Slot, number> = { left: 0, middle: 1, right: 2 };

function mobileSortKey(
  section: ResolvedSection,
  mode: 'tab' | 'waterfall',
): number {
  if (section.mobileOrder !== undefined) return section.mobileOrder;
  const placement = mode === 'tab' ? section.tab : section.waterfall;
  if (!placement) return Number.MAX_SAFE_INTEGER;
  // Build a composite key: slot priority * 1000 + order, so left always
  // beats middle which always beats right.
  return SLOT_PRIORITY[placement.slot] * 1000 + placement.order;
}

export function MobileShell(): React.JSX.Element {
  const { layout } = useLayout();
  const { registerFocusHandler } = useGameSession();

  useEffect(() => {
    return registerFocusHandler((id) => {
      requestAnimationFrame(() => {
        document.getElementById(`section-${id}`)?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }, [registerFocusHandler]);

  const ordered = layout.sections
    .filter(
      (s) =>
        s.visible &&
        (!s.pin || s.pin === 'none') &&
        // include section if it has any placement at all
        (s.tab || s.waterfall),
    )
    .slice()
    .sort(
      (a, b) => mobileSortKey(a, layout.mode) - mobileSortKey(b, layout.mode),
    );

  return (
    <div className='min-h-0 flex-1 overflow-y-auto p-3'>
      <div className='flex flex-col gap-3'>
        {ordered.map((section) => {
          const def = getSection(section.id);
          if (!def) return null;
          const Body = def.Component;
          return (
            <SectionFrame
              key={section.id}
              section={section}
              titleKey={def.titleKey}
              showHeader={def.showHeader ?? false}
            >
              <Body section={section} />
            </SectionFrame>
          );
        })}
      </div>
    </div>
  );
}

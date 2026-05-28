import { useEffect } from 'react';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { getSection } from '../sectionRegistry';
import type { ResolvedSection } from '../types';
import { ColumnGrid } from './ColumnGrid';
import { SectionFrame } from './SectionFrame';

/**
 * WaterfallShell — single scrollable canvas, three columns.
 *
 * No top tab strip. focusSection scrolls the requested anchor into view.
 * Mobile single-column rendering is handled by `<MobileShell />` higher up.
 */
export function WaterfallShell(): React.JSX.Element {
  const { layout } = useLayout();
  const { registerFocusHandler } = useGameSession();

  useEffect(() => {
    return registerFocusHandler((id) => {
      requestAnimationFrame(() => {
        document.getElementById(`section-${id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }, [registerFocusHandler]);

  return (
    <div className='min-h-0 flex-1 overflow-hidden p-3'>
      <ColumnGrid
        grid={layout.rootGrid}
        sections={layout.sections}
        pickSlot={(s) =>
          s.waterfall
            ? { slot: s.waterfall.slot, order: s.waterfall.order }
            : undefined
        }
        renderSection={renderSectionBody}
      />
    </div>
  );
}

function renderSectionBody(section: ResolvedSection): React.JSX.Element | null {
  const def = getSection(section.id);
  if (!def) return null;
  const Body = def.Component;
  return (
    <SectionFrame
      section={section}
      titleKey={def.titleKey}
      showHeader={def.showHeader ?? false}
    >
      <Body section={section} />
    </SectionFrame>
  );
}

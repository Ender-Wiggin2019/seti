import { useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { useLayoutStore } from '../layoutStore';
import { getSection } from '../sectionRegistry';
import type { ResolvedSection, Slot } from '../types';
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
  const panelLayouts = useLayoutStore((s) => s.panelLayouts);
  const setPanelLayout = useLayoutStore((s) => s.setPanelLayout);

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

  return (
    <div className='min-h-0 flex-1 overflow-hidden p-3'>
      <ResizableWaterfallGrid
        sections={layout.sections}
        panelLayouts={panelLayouts ?? {}}
        setPanelLayout={setPanelLayout}
      />
    </div>
  );
}

const SLOTS: Slot[] = ['left', 'middle', 'right'];
const COLUMN_GROUP_ID = 'waterfall-columns';
const DEFAULT_COLUMN_LAYOUT: Record<string, number> = {
  left: 43,
  middle: 37,
  right: 20,
};
const DEFAULT_SECTION_SIZE: Partial<Record<string, number>> = {
  solarSystem: 62,
  planetBoard: 28,
  endGame: 10,
  techBoard: 24,
  alienBoard: 50,
  cardRows: 26,
  playerBoard: 58,
  log: 42,
};

function ResizableWaterfallGrid({
  sections,
  panelLayouts,
  setPanelLayout,
}: {
  sections: ResolvedSection[];
  panelLayouts: Record<string, Record<string, number>>;
  setPanelLayout: (groupId: string, layout: Record<string, number>) => void;
}): React.JSX.Element {
  const buckets = bucketWaterfallSections(sections);
  const visibleSlots = SLOTS.filter((slot) => buckets[slot].length > 0);

  return (
    <ResizablePanelGroup
      id={COLUMN_GROUP_ID}
      orientation='horizontal'
      defaultLayout={panelLayouts[COLUMN_GROUP_ID] ?? DEFAULT_COLUMN_LAYOUT}
      onLayoutChanged={(next) => setPanelLayout(COLUMN_GROUP_ID, next)}
      className='h-full min-h-0 gap-2'
    >
      {visibleSlots.map((slot, index) => (
        <WaterfallColumnPanel
          key={slot}
          slot={slot}
          sections={buckets[slot]}
          panelLayouts={panelLayouts}
          setPanelLayout={setPanelLayout}
          showHandle={index < visibleSlots.length - 1}
        />
      ))}
    </ResizablePanelGroup>
  );
}

function WaterfallColumnPanel({
  slot,
  sections,
  panelLayouts,
  setPanelLayout,
  showHandle,
}: {
  slot: Slot;
  sections: ResolvedSection[];
  panelLayouts: Record<string, Record<string, number>>;
  setPanelLayout: (groupId: string, layout: Record<string, number>) => void;
  showHandle: boolean;
}): React.JSX.Element {
  const groupId = `waterfall-${slot}`;

  return (
    <>
      <ResizablePanel
        id={slot}
        defaultSize={DEFAULT_COLUMN_LAYOUT[slot]}
        minSize={slot === 'left' ? 28 : 18}
        className='min-h-0 min-w-0'
      >
        <ResizablePanelGroup
          id={groupId}
          orientation='vertical'
          defaultLayout={
            panelLayouts[groupId] ?? defaultSectionLayout(sections)
          }
          onLayoutChanged={(next) => setPanelLayout(groupId, next)}
          className='h-full min-h-0 gap-2'
        >
          {sections.map((section, index) => (
            <WaterfallSectionPanel
              key={section.id}
              section={section}
              showHandle={index < sections.length - 1}
            />
          ))}
        </ResizablePanelGroup>
      </ResizablePanel>
      {showHandle ? (
        <ResizableHandle handleOrientation='vertical' withHandle />
      ) : null}
    </>
  );
}

function WaterfallSectionPanel({
  section,
  showHandle,
}: {
  section: ResolvedSection;
  showHandle: boolean;
}): React.JSX.Element {
  return (
    <>
      <ResizablePanel
        id={section.id}
        defaultSize={DEFAULT_SECTION_SIZE[section.id] ?? 30}
        minSize={section.id === 'solarSystem' ? 30 : 12}
        className='min-h-0 overflow-hidden'
      >
        <div
          className='h-full min-h-0 overflow-auto pr-1'
          data-testid={`layout-panel-body-${section.id}`}
        >
          {renderSectionBody(section)}
        </div>
      </ResizablePanel>
      {showHandle ? (
        <ResizableHandle handleOrientation='horizontal' withHandle />
      ) : null}
    </>
  );
}

function bucketWaterfallSections(
  sections: ResolvedSection[],
): Record<Slot, ResolvedSection[]> {
  const buckets: Record<Slot, ResolvedSection[]> = {
    left: [],
    middle: [],
    right: [],
  };

  for (const section of sections) {
    if (!section.visible) continue;
    if (section.pin && section.pin !== 'none') continue;
    if (!section.waterfall) continue;
    buckets[section.waterfall.slot].push(section);
  }

  for (const slot of SLOTS) {
    buckets[slot].sort(
      (a, b) => (a.waterfall?.order ?? 0) - (b.waterfall?.order ?? 0),
    );
  }

  return buckets;
}

function defaultSectionLayout(
  sections: ResolvedSection[],
): Record<string, number> {
  const knownTotal = sections.reduce(
    (sum, section) => sum + (DEFAULT_SECTION_SIZE[section.id] ?? 0),
    0,
  );
  if (knownTotal > 0) {
    return Object.fromEntries(
      sections.map((section) => [
        section.id,
        DEFAULT_SECTION_SIZE[section.id] ?? 100 / sections.length,
      ]),
    );
  }
  return Object.fromEntries(
    sections.map((section) => [section.id, 100 / sections.length]),
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

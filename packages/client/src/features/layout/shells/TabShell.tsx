import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { useLayoutStore } from '../layoutStore';
import { getSection } from '../sectionRegistry';
import type { ResolvedSection, Slot } from '../types';
import { SectionFrame } from './SectionFrame';

/**
 * TabShell — the default in-game table. Each tab renders its own column grid
 * so users get focused board areas without losing pinned chrome.
 *
 * Auto-jump (alien input → aliens tab, planet input → planets tab) routes
 * through `focusSection`, registered here so the existing input pipeline
 * keeps working.
 */
export function TabShell(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { layout } = useLayout();
  const activeTab = useLayoutStore((s) => s.activeTab) ?? layout.defaultTab;
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const panelLayouts = useLayoutStore((s) => s.panelLayouts);
  const setPanelLayout = useLayoutStore((s) => s.setPanelLayout);
  const { registerFocusHandler } = useGameSession();

  // Map section id → containing tab so focusSection(id) can pick the right tab.
  const sectionToTab = new Map<string, string>();
  for (const s of layout.sections) {
    if (s.tab) sectionToTab.set(s.id, s.tab.container);
  }

  useEffect(() => {
    return registerFocusHandler((id) => {
      const tab = sectionToTab.get(id);
      if (tab) setActiveTab(tab);
      // Defer scroll until after the tab content swap.
      requestAnimationFrame(() => {
        document.getElementById(`section-${id}`)?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
    // sectionToTab is rebuilt every render but the closure only reads it at
    // call-time, so the dependency surface is just registerFocusHandler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerFocusHandler, layout]);

  return (
    <Tabs
      defaultValue={layout.defaultTab}
      value={activeTab}
      onValueChange={(v) => setActiveTab(v)}
      className='flex min-h-0 flex-1 flex-col'
    >
      <div className='relative shrink-0 overflow-x-auto bg-[var(--surface-deep)]/60 px-3 py-2'>
        <TabsList className='w-max'>
          {layout.tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className='min-h-0 flex-1 overflow-hidden p-3'>
        {layout.tabs.map((tab) => {
          const tabSections = layout.sections.filter(
            (s) => s.tab?.container === tab.id,
          );
          return (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className='mt-0 h-full data-[state=inactive]:hidden'
            >
              <ResizableTabGrid
                tabId={tab.id}
                sections={tabSections}
                panelLayouts={panelLayouts ?? {}}
                setPanelLayout={setPanelLayout}
              />
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}

const SLOTS: Slot[] = ['left', 'middle', 'right'];
const DEFAULT_TAB_SECTION_SIZE: Partial<Record<string, number>> = {
  playerBoard: 58,
  log: 42,
};

function ResizableTabGrid({
  tabId,
  sections,
  panelLayouts,
  setPanelLayout,
}: {
  tabId: string;
  sections: ResolvedSection[];
  panelLayouts: Record<string, Record<string, number>>;
  setPanelLayout: (groupId: string, layout: Record<string, number>) => void;
}): React.JSX.Element {
  const buckets = bucketTabSections(sections);
  const visibleSlots = SLOTS.filter((slot) => buckets[slot].length > 0);
  const groupId = `tab-${tabId}-columns`;

  return (
    <ResizablePanelGroup
      id={groupId}
      orientation='horizontal'
      defaultLayout={
        panelLayouts[groupId] ?? defaultTabColumnLayout(visibleSlots)
      }
      onLayoutChanged={(next) => setPanelLayout(groupId, next)}
      className='h-full min-h-0 gap-2'
    >
      {visibleSlots.map((slot, index) => (
        <TabColumnPanel
          key={slot}
          tabId={tabId}
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

function TabColumnPanel({
  tabId,
  slot,
  sections,
  panelLayouts,
  setPanelLayout,
  showHandle,
}: {
  tabId: string;
  slot: Slot;
  sections: ResolvedSection[];
  panelLayouts: Record<string, Record<string, number>>;
  setPanelLayout: (groupId: string, layout: Record<string, number>) => void;
  showHandle: boolean;
}): React.JSX.Element {
  const groupId = `tab-${tabId}-${slot}`;

  return (
    <>
      <ResizablePanel id={slot} minSize={18} className='min-h-0 min-w-0'>
        <ResizablePanelGroup
          id={groupId}
          orientation='vertical'
          defaultLayout={
            panelLayouts[groupId] ?? defaultTabSectionLayout(sections)
          }
          onLayoutChanged={(next) => setPanelLayout(groupId, next)}
          className='h-full min-h-0 gap-2'
        >
          {sections.map((section, index) => (
            <TabSectionPanel
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

function TabSectionPanel({
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
        defaultSize={DEFAULT_TAB_SECTION_SIZE[section.id] ?? 100}
        minSize={12}
        className='min-h-0 overflow-y-auto'
      >
        <div className='min-h-full pr-1'>{renderSectionBody(section)}</div>
      </ResizablePanel>
      {showHandle ? (
        <ResizableHandle handleOrientation='horizontal' withHandle />
      ) : null}
    </>
  );
}

function bucketTabSections(
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
    if (!section.tab) continue;
    buckets[section.tab.slot].push(section);
  }

  for (const slot of SLOTS) {
    buckets[slot].sort((a, b) => (a.tab?.order ?? 0) - (b.tab?.order ?? 0));
  }

  return buckets;
}

function defaultTabColumnLayout(slots: Slot[]): Record<string, number> {
  if (slots.length === 1 && slots[0]) return { [slots[0]]: 100 };
  if (slots.includes('middle') && slots.includes('right')) {
    return { middle: 72, right: 28 };
  }
  return Object.fromEntries(slots.map((slot) => [slot, 100 / slots.length]));
}

function defaultTabSectionLayout(
  sections: ResolvedSection[],
): Record<string, number> {
  return Object.fromEntries(
    sections.map((section) => [
      section.id,
      DEFAULT_TAB_SECTION_SIZE[section.id] ?? 100 / sections.length,
    ]),
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

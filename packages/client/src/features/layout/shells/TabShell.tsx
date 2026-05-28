import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { useLayoutStore } from '../layoutStore';
import { getSection } from '../sectionRegistry';
import type { ResolvedSection } from '../types';
import { ColumnGrid } from './ColumnGrid';
import { SectionFrame } from './SectionFrame';

/**
 * TabShell — legacy in-game UX wrapped around the layout DSL. Each tab
 * renders its own `<ColumnGrid>` so users get the inner 3-column layout
 * inside any tab they like.
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
        document.getElementById(`section-${id}`)?.scrollIntoView({
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
              <ColumnGrid
                grid={tab.grid}
                sections={tabSections}
                pickSlot={(s) =>
                  s.tab ? { slot: s.tab.slot, order: s.tab.order } : undefined
                }
                renderSection={(s) => renderSectionBody(s)}
              />
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
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

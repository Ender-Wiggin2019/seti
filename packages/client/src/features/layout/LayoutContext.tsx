import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useResponsiveMode } from './hooks/useResponsiveMode';
import { useLayoutStore } from './layoutStore';
import { getPreset } from './presets';
import { resolveLayout } from './resolveLayout';
import type { LayoutMode, ResolvedLayout, SectionId } from './types';

interface ILayoutContext {
  layout: ResolvedLayout;
  isMobile: boolean;
  mode: LayoutMode;
  /** Single map for fast lookup by id. */
  bySection: Map<SectionId, ResolvedLayout['sections'][number]>;
}

const LayoutCtx = createContext<ILayoutContext | null>(null);

export function LayoutProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const mode = useLayoutStore((s) => s.mode);
  const overrides = useLayoutStore((s) => s.overrides);
  const collapsed = useLayoutStore((s) => s.collapsed);
  const rootColumns = useLayoutStore((s) => s.rootColumns);
  const tabColumns = useLayoutStore((s) => s.tabColumns);
  const panelLayouts = useLayoutStore((s) => s.panelLayouts);

  // Compute breakpoint from preset (constant per mode) so the responsive hook
  // doesn't itself depend on the resolved layout.
  const breakpoint = getPreset(mode).options?.mobileBreakpoint ?? 1024;
  const isMobile = useResponsiveMode(breakpoint);

  const value = useMemo<ILayoutContext>(() => {
    const preset = getPreset(mode);
    const layout = resolveLayout({
      preset,
      snapshot: {
        mode,
        overrides,
        collapsed,
        rootColumns,
        tabColumns,
        panelLayouts,
      },
      isMobile,
    });
    const bySection = new Map(layout.sections.map((s) => [s.id, s]));
    return { layout, isMobile, mode, bySection };
  }, [
    mode,
    overrides,
    collapsed,
    rootColumns,
    tabColumns,
    panelLayouts,
    isMobile,
  ]);

  return <LayoutCtx.Provider value={value}>{children}</LayoutCtx.Provider>;
}

export function useLayout(): ILayoutContext {
  const ctx = useContext(LayoutCtx);
  if (!ctx) throw new Error('useLayout must be used within <LayoutProvider />');
  return ctx;
}

export function useLayoutSection(
  id: SectionId,
): ResolvedLayout['sections'][number] | undefined {
  return useLayout().bySection.get(id);
}

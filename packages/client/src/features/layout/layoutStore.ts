import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutMode, SectionId, SectionPlacement } from './types';

/**
 * Layout store — orthogonal to gameViewStore (which keeps gameplay UI state
 * like activeTab/zoom). Persists user customisations across sessions so
 * the dev panel's edits stick.
 */

export type SectionOverrides = Partial<
  Omit<SectionPlacement, 'id' | 'responsive'>
>;

export interface LayoutSnapshot {
  /** Enables the configurable V2 game layout instead of the legacy layout. */
  enabled: boolean;
  mode: LayoutMode;
  /** Per-section overrides keyed by section id; merged onto the active preset. */
  overrides: Partial<Record<SectionId, SectionOverrides>>;
  /** Per-section collapsed state (independent of `defaultCollapsed`). */
  collapsed: Partial<Record<SectionId, boolean>>;
  /** Root-grid column-width overrides. */
  rootColumns?: { left?: string; middle?: string; right?: string };
  /** Per-tab grid column overrides keyed by tab id. */
  tabColumns?: Record<
    string,
    { left?: string; middle?: string; right?: string }
  >;
  /** Resizable panel group layouts keyed by group id. Values are percentages. */
  panelLayouts?: Record<string, Record<string, number>>;
}

export interface LayoutStoreState extends LayoutSnapshot {
  devPanelOpen: boolean;
  activeTab: string | null;
  setEnabled: (enabled: boolean) => void;
  setMode: (mode: LayoutMode) => void;
  setActiveTab: (tab: string) => void;
  patchSection: (id: SectionId, overrides: SectionOverrides) => void;
  resetSection: (id: SectionId) => void;
  toggleCollapsed: (id: SectionId) => void;
  setRootColumn: (key: 'left' | 'middle' | 'right', width: string) => void;
  setTabColumn: (
    tab: string,
    key: 'left' | 'middle' | 'right',
    width: string,
  ) => void;
  setPanelLayout: (groupId: string, layout: Record<string, number>) => void;
  toggleDevPanel: () => void;
  setDevPanelOpen: (open: boolean) => void;
  resetAll: () => void;
  importSnapshot: (snapshot: Partial<LayoutSnapshot>) => void;
  exportSnapshot: () => LayoutSnapshot;
}

const INITIAL_SNAPSHOT: LayoutSnapshot = {
  enabled: false,
  mode: 'tab',
  overrides: {},
  collapsed: {},
  rootColumns: undefined,
  tabColumns: undefined,
  panelLayouts: undefined,
};

export const useLayoutStore = create<LayoutStoreState>()(
  persist(
    (set, get) => ({
      ...INITIAL_SNAPSHOT,
      devPanelOpen: false,
      activeTab: null,
      setEnabled: (enabled) => set({ enabled }),
      setMode: (mode) => set({ mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      patchSection: (id, overrides) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [id]: { ...(s.overrides[id] ?? {}), ...overrides },
          },
        })),
      resetSection: (id) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[id];
          return { overrides: next };
        }),
      toggleCollapsed: (id) =>
        set((s) => ({
          collapsed: { ...s.collapsed, [id]: !s.collapsed[id] },
        })),
      setRootColumn: (key, width) =>
        set((s) => ({
          rootColumns: { ...(s.rootColumns ?? {}), [key]: width },
        })),
      setTabColumn: (tab, key, width) =>
        set((s) => ({
          tabColumns: {
            ...(s.tabColumns ?? {}),
            [tab]: { ...(s.tabColumns?.[tab] ?? {}), [key]: width },
          },
        })),
      setPanelLayout: (groupId, layout) =>
        set((s) => ({
          panelLayouts: { ...(s.panelLayouts ?? {}), [groupId]: layout },
        })),
      toggleDevPanel: () => set((s) => ({ devPanelOpen: !s.devPanelOpen })),
      setDevPanelOpen: (devPanelOpen) => set({ devPanelOpen }),
      resetAll: () => set({ ...INITIAL_SNAPSHOT }),
      importSnapshot: (snapshot) =>
        set({
          enabled: snapshot.enabled ?? get().enabled,
          mode: snapshot.mode ?? get().mode,
          overrides: snapshot.overrides ?? {},
          collapsed: snapshot.collapsed ?? {},
          rootColumns: snapshot.rootColumns,
          tabColumns: snapshot.tabColumns,
          panelLayouts: snapshot.panelLayouts,
        }),
      exportSnapshot: () => ({
        enabled: get().enabled,
        mode: get().mode,
        overrides: get().overrides,
        collapsed: get().collapsed,
        rootColumns: get().rootColumns,
        tabColumns: get().tabColumns,
        panelLayouts: get().panelLayouts,
      }),
    }),
    {
      name: 'seti-layout-v1',
      partialize: (s): LayoutSnapshot => ({
        enabled: s.enabled,
        mode: s.mode,
        overrides: s.overrides,
        collapsed: s.collapsed,
        rootColumns: s.rootColumns,
        tabColumns: s.tabColumns,
        panelLayouts: s.panelLayouts,
      }),
    },
  ),
);

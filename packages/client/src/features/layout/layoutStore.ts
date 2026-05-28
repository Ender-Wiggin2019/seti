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
}

export interface LayoutStoreState extends LayoutSnapshot {
  devPanelOpen: boolean;
  activeTab: string | null;
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
  toggleDevPanel: () => void;
  setDevPanelOpen: (open: boolean) => void;
  resetAll: () => void;
  importSnapshot: (snapshot: Partial<LayoutSnapshot>) => void;
  exportSnapshot: () => LayoutSnapshot;
}

const INITIAL_SNAPSHOT: LayoutSnapshot = {
  mode: 'tab',
  overrides: {},
  collapsed: {},
  rootColumns: undefined,
  tabColumns: undefined,
};

export const useLayoutStore = create<LayoutStoreState>()(
  persist(
    (set, get) => ({
      ...INITIAL_SNAPSHOT,
      devPanelOpen: false,
      activeTab: null,
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
      toggleDevPanel: () => set((s) => ({ devPanelOpen: !s.devPanelOpen })),
      setDevPanelOpen: (devPanelOpen) => set({ devPanelOpen }),
      resetAll: () => set({ ...INITIAL_SNAPSHOT }),
      importSnapshot: (snapshot) =>
        set({
          mode: snapshot.mode ?? get().mode,
          overrides: snapshot.overrides ?? {},
          collapsed: snapshot.collapsed ?? {},
          rootColumns: snapshot.rootColumns,
          tabColumns: snapshot.tabColumns,
        }),
      exportSnapshot: () => ({
        mode: get().mode,
        overrides: get().overrides,
        collapsed: get().collapsed,
        rootColumns: get().rootColumns,
        tabColumns: get().tabColumns,
      }),
    }),
    {
      name: 'seti-layout-v1',
      partialize: (s): LayoutSnapshot => ({
        mode: s.mode,
        overrides: s.overrides,
        collapsed: s.collapsed,
        rootColumns: s.rootColumns,
        tabColumns: s.tabColumns,
      }),
    },
  ),
);

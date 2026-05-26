import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { IHotspotGeometryOverride } from '@/features/hotspots/hotspotConfig';

type THotspotOverrides = Record<
  string,
  Record<string, IHotspotGeometryOverride>
>;

/**
 * Debug settings store.
 *
 * Currently hosts the `textMode` switch, which substitutes rendered
 * artwork (board wheels, sector tiles, card art, player board backdrop)
 * with plain text labels for debugging and TUI-like inspection.
 *
 * The text mode is intentionally decoupled from gameplay state — feature
 * views consult `useTextMode()` and conditionally skip image layers while
 * keeping their data/interaction paths untouched.
 */
interface IDebugStoreState {
  textMode: boolean;
  hotspotDebug: boolean;
  showInteractiveHotspots: boolean;
  showAnchorHotspots: boolean;
  hotspotOverrides: THotspotOverrides;
  hotspotDraftOverrides: THotspotOverrides;
  setTextMode: (enabled: boolean) => void;
  toggleTextMode: () => void;
  setHotspotDebug: (enabled: boolean) => void;
  toggleHotspotDebug: () => void;
  setShowInteractiveHotspots: (enabled: boolean) => void;
  setShowAnchorHotspots: (enabled: boolean) => void;
  setHotspotDraftOverride: (
    sceneId: string,
    hotspotId: string,
    override: IHotspotGeometryOverride,
  ) => void;
  saveHotspotOverrides: (sceneId?: string) => void;
  resetHotspotOverrides: (sceneId?: string) => void;
}

const memoryStorage = new Map<string, string>();

function getSafeStorage(): Storage {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function' &&
      typeof window.localStorage.setItem === 'function' &&
      typeof window.localStorage.removeItem === 'function'
    ) {
      return window.localStorage;
    }
  } catch {
    // Fall through to in-memory storage.
  }

  return {
    get length() {
      return memoryStorage.size;
    },
    clear() {
      memoryStorage.clear();
    },
    getItem(key: string) {
      return memoryStorage.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(memoryStorage.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memoryStorage.delete(key);
    },
    setItem(key: string, value: string) {
      memoryStorage.set(key, value);
    },
  };
}

export const useDebugStore = create<IDebugStoreState>()(
  persist(
    (set, get) => ({
      textMode: false,
      hotspotDebug: false,
      showInteractiveHotspots: true,
      showAnchorHotspots: true,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
      setTextMode: (enabled) => set({ textMode: enabled }),
      toggleTextMode: () => set({ textMode: !get().textMode }),
      setHotspotDebug: (enabled) => set({ hotspotDebug: enabled }),
      toggleHotspotDebug: () => set({ hotspotDebug: !get().hotspotDebug }),
      setShowInteractiveHotspots: (enabled) =>
        set({ showInteractiveHotspots: enabled }),
      setShowAnchorHotspots: (enabled) => set({ showAnchorHotspots: enabled }),
      setHotspotDraftOverride: (sceneId, hotspotId, override) =>
        set((state) => ({
          hotspotDraftOverrides: {
            ...state.hotspotDraftOverrides,
            [sceneId]: {
              ...(state.hotspotDraftOverrides[sceneId] ?? {}),
              [hotspotId]: {
                ...(state.hotspotOverrides[sceneId]?.[hotspotId] ?? {}),
                ...(state.hotspotDraftOverrides[sceneId]?.[hotspotId] ?? {}),
                ...override,
              },
            },
          },
        })),
      saveHotspotOverrides: (sceneId) =>
        set((state) => {
          if (sceneId) {
            const sceneDraft = state.hotspotDraftOverrides[sceneId];
            if (!sceneDraft) {
              return {};
            }
            const { [sceneId]: _removed, ...nextDraftOverrides } =
              state.hotspotDraftOverrides;
            return {
              hotspotOverrides: {
                ...state.hotspotOverrides,
                [sceneId]: {
                  ...(state.hotspotOverrides[sceneId] ?? {}),
                  ...sceneDraft,
                },
              },
              hotspotDraftOverrides: nextDraftOverrides,
            };
          }

          return {
            hotspotOverrides: Object.entries(
              state.hotspotDraftOverrides,
            ).reduce<THotspotOverrides>(
              (nextOverrides, [draftSceneId, sceneDraft]) => ({
                ...nextOverrides,
                [draftSceneId]: {
                  ...(nextOverrides[draftSceneId] ?? {}),
                  ...sceneDraft,
                },
              }),
              { ...state.hotspotOverrides },
            ),
            hotspotDraftOverrides: {},
          };
        }),
      resetHotspotOverrides: (sceneId) =>
        set((state) => {
          if (!sceneId) {
            return { hotspotOverrides: {}, hotspotDraftOverrides: {} };
          }
          const { [sceneId]: _removedOverride, ...nextOverrides } =
            state.hotspotOverrides;
          const { [sceneId]: _removedDraft, ...nextDraftOverrides } =
            state.hotspotDraftOverrides;
          return {
            hotspotOverrides: nextOverrides,
            hotspotDraftOverrides: nextDraftOverrides,
          };
        }),
    }),
    {
      name: 'seti-debug',
      storage: createJSONStorage(getSafeStorage),
      partialize: (state) => ({
        textMode: state.textMode,
        hotspotDebug: state.hotspotDebug,
        showInteractiveHotspots: state.showInteractiveHotspots,
        showAnchorHotspots: state.showAnchorHotspots,
        hotspotOverrides: state.hotspotOverrides,
      }),
    },
  ),
);

/** Read-only selector hook for the text-mode flag. */
export function useTextMode(): boolean {
  return useDebugStore((state) => state.textMode);
}

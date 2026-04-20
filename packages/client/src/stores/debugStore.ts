import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  setTextMode: (enabled: boolean) => void;
  toggleTextMode: () => void;
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
      setTextMode: (enabled) => set({ textMode: enabled }),
      toggleTextMode: () => set({ textMode: !get().textMode }),
    }),
    {
      name: 'seti-debug',
      storage: createJSONStorage(getSafeStorage),
      partialize: (state) => ({ textMode: state.textMode }),
    },
  ),
);

/** Read-only selector hook for the text-mode flag. */
export function useTextMode(): boolean {
  return useDebugStore((state) => state.textMode);
}

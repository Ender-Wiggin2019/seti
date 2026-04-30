import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
}

interface IAuthStoreState {
  token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: IAuthUser) => void;
  setUser: (user: IAuthUser) => void;
  logout: () => void;
}

const INITIAL_STATE = {
  token: null,
  user: null,
  isAuthenticated: false,
} as const;

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
    // Fall through to in-memory storage when localStorage is unavailable.
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

export const useAuthStore = create<IAuthStoreState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      login: (token, user) => {
        if (!token) {
          set(INITIAL_STATE);
          return;
        }
        set({ token, user, isAuthenticated: true });
      },
      setUser: (user) => {
        set((state) => ({ ...state, user }));
      },
      logout: () => {
        set(INITIAL_STATE);
      },
    }),
    {
      name: 'seti-auth',
      storage: createJSONStorage(getSafeStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

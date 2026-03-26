import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  logout: () => void;
}

const INITIAL_STATE = {
  token: null,
  user: null,
  isAuthenticated: false,
} as const;

export const useAuthStore = create<IAuthStoreState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        set(INITIAL_STATE);
      },
    }),
    {
      name: 'seti-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

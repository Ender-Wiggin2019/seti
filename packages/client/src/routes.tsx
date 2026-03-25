import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    throw redirect({ to: isAuthenticated ? '/lobby' : '/auth' });
  },
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: () => (
    <section className='rounded-2xl border border-surface-700 bg-surface-900/70 p-6 shadow-panel'>
      <h1 className='font-display text-3xl text-text-100'>Authentication</h1>
      <p className='mt-2 text-sm text-text-300'>
        Auth screens are implemented in Stage 5.
      </p>
    </section>
  ),
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lobby',
  component: () => (
    <ProtectedRoute>
      <section className='rounded-2xl border border-surface-700 bg-surface-900/70 p-6 shadow-panel'>
        <h1 className='font-display text-3xl text-text-100'>Lobby</h1>
        <p className='mt-2 text-sm text-text-300'>
          TanStack Router is wired and ready for page expansion.
        </p>
      </section>
    </ProtectedRoute>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, authRoute, lobbyRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

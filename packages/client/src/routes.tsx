import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/pages/auth/AuthPage';
import { GamePage, SpectatePage } from '@/pages/game/GamePage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { RoomPage } from '@/pages/lobby/RoomPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { useAuthStore } from '@/stores/authStore';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    throw redirect({ to: isAuthenticated ? '/lobby' : '/auth' });
  },
});

const authRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/auth',
  component: AuthPage,
});

const lobbyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/lobby',
  component: () => (
    <ProtectedRoute>
      <LobbyPage />
    </ProtectedRoute>
  ),
});

const roomRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/room/$roomId',
  component: () => (
    <ProtectedRoute>
      <RoomPage />
    </ProtectedRoute>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$gameId',
  component: () => (
    <ProtectedRoute>
      <GamePage />
    </ProtectedRoute>
  ),
});

const spectateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$gameId/spectate',
  component: () => (
    <ProtectedRoute>
      <SpectatePage />
    </ProtectedRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    authRoute,
    lobbyRoute,
    roomRoute,
    profileRoute,
  ]),
  gameRoute,
  spectateRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

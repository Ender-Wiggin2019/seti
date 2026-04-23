import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/pages/auth/AuthPage';
import { DebugReplayPage } from '@/pages/game/DebugReplayPage';
import { GameDebugPage } from '@/pages/game/GameDebugPage';
import { GamePage, SpectatePage } from '@/pages/game/GamePage';
import { ServerDebugPage } from '@/pages/game/ServerDebugPage';
import { SolarDebugPage } from '@/pages/game/SolarDebugPage';
import { HomePage } from '@/pages/home/HomePage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { RoomPage } from '@/pages/lobby/RoomPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

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
  component: HomePage,
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

const gameDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/game',
  component: GameDebugPage,
});

const debugAlienRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/alien',
  component: DebugReplayPage,
});

const debugReplayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/replay',
  component: DebugReplayPage,
});

const solarDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/solar',
  component: SolarDebugPage,
});

const serverDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/server',
  component: ServerDebugPage,
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
  gameDebugRoute,
  debugAlienRoute,
  debugReplayRoute,
  solarDebugRoute,
  serverDebugRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('redirects unauthenticated users to auth page', async () => {
    const rootRoute = createRootRoute({ component: Outlet });
    const authRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/auth',
      component: () => <p>Auth Page</p>,
    });
    const lobbyRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/lobby',
      component: () => (
        <ProtectedRoute>
          <p>Lobby Page</p>
        </ProtectedRoute>
      ),
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([authRoute, lobbyRoute]),
      history: createMemoryHistory({ initialEntries: ['/lobby'] }),
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Auth Page')).toBeInTheDocument();
  });
});

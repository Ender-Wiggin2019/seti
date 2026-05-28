import { render, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/providers/AppProviders';
import { useDebugStore } from '@/stores/debugStore';

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  RouterProvider: () => <div data-testid='router-provider' />,
}));

vi.mock('@/components/ui/toast', () => ({
  Toaster: () => <div data-testid='toaster' />,
}));

vi.mock('@/routes', () => ({
  router: {},
}));

vi.mock('@/features/hotspots/hotspotOverridesApi', () => ({
  loadHotspotOverridesFile: vi.fn(async () => ({
    'solar-system:image': {
      'ring-1-cell-0': { x: 120, y: 88, width: 32, height: 32 },
    },
  })),
}));

describe('AppProviders hotspot overrides', () => {
  beforeEach(() => {
    useDebugStore.setState({
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
  });

  it('loads shared hotspot overrides for normal app routes', async () => {
    render(<AppProviders />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotOverrides).toEqual({
        'solar-system:image': {
          'ring-1-cell-0': { x: 120, y: 88, width: 32, height: 32 },
        },
      });
    });
  });
});

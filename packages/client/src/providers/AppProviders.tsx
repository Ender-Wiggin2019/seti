import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from '@/components/ui/toast';
import { loadHotspotOverridesFile } from '@/features/hotspots/hotspotOverridesApi';
import i18n from '@/i18n';
import { router } from '@/routes';
import { useDebugStore } from '@/stores/debugStore';

const queryClient = new QueryClient();

function HotspotOverridesLoader(): null {
  const setHotspotOverrides = useDebugStore(
    (state) => state.setHotspotOverrides,
  );

  useEffect(() => {
    let active = true;
    loadHotspotOverridesFile()
      .then((overrides) => {
        if (active) setHotspotOverrides(overrides);
      })
      .catch(() => {
        // Missing or stale calibration files should not block normal gameplay.
      });
    return () => {
      active = false;
    };
  }, [setHotspotOverrides]);

  return null;
}

export function AppProviders(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <HotspotOverridesLoader />
        <RouterProvider router={router} />
        <Toaster />
      </I18nextProvider>
    </QueryClientProvider>
  );
}

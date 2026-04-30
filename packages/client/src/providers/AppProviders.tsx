import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from '@/components/ui/toast';
import i18n from '@/i18n';
import { router } from '@/routes';

const queryClient = new QueryClient();

export function AppProviders(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
        <Toaster />
      </I18nextProvider>
    </QueryClientProvider>
  );
}

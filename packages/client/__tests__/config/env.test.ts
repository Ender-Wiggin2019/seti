import { describe, expect, it } from 'vitest';

describe('client debug route env defaults', () => {
  it('defaults debug routes to disabled when the env flag is absent', async () => {
    vi.resetModules();

    const previousApiUrl = import.meta.env.VITE_API_URL;
    const previousWsUrl = import.meta.env.VITE_WS_URL;
    const previousEnableDebugRoutes = import.meta.env.VITE_ENABLE_DEBUG_ROUTES;

    import.meta.env.VITE_API_URL = 'http://localhost:3000';
    import.meta.env.VITE_WS_URL = 'http://localhost:3000';
    delete import.meta.env.VITE_ENABLE_DEBUG_ROUTES;

    const { CLIENT_ENV } = await import('@/config/env');

    expect(CLIENT_ENV.VITE_ENABLE_DEBUG_ROUTES).toBe(false);

    import.meta.env.VITE_API_URL = previousApiUrl;
    import.meta.env.VITE_WS_URL = previousWsUrl;
    import.meta.env.VITE_ENABLE_DEBUG_ROUTES = previousEnableDebugRoutes;
  });
});

import type { Page } from '@playwright/test';

/**
 * Inject auth credentials into the browser's localStorage
 * to bypass the login UI. The Zustand auth store persists
 * under the `seti-auth` key.
 */
export async function injectAuth(
  page: Page,
  token: string,
  user: { id: string; name: string; email: string },
): Promise<void> {
  const storePayload = JSON.stringify({
    state: {
      token,
      user,
      isAuthenticated: true,
    },
    version: 0,
  });

  await page.addInitScript((payload) => {
    window.localStorage.setItem('seti-auth', payload);
  }, storePayload);
}

/**
 * Clear auth from the browser localStorage.
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('seti-auth');
  });
}

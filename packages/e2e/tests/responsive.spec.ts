import { expect, test, type Page } from '@playwright/test';
import { createUser, registerByUi, type IUserCred } from '../helpers/real-flow';
import { waitForServerReady } from '../helpers/server-ready';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

async function expectAuthPage(page: Page): Promise<void> {
  await page.goto('/auth');
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#login-password')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('auth-login-submit')).toBeVisible({
    timeout: 10_000,
  });
}

async function expectLobbyAfterRegistration(
  page: Page,
  user: IUserCred,
): Promise<void> {
  await registerByUi(page, user);
  await expect(page).toHaveURL(/\/lobby$/);
  await expect(page.getByTestId('lobby-new-mission')).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('Responsive browser layout @real-ui @responsive', () => {
  test.beforeEach(async ({ request }) => {
    await waitForServerReady(request);
  });

  for (const viewport of VIEWPORTS) {
    test(`renders auth and lobby at ${viewport.name} viewport`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await expectAuthPage(page);
      await expectLobbyAfterRegistration(
        page,
        createUser(`responsive-${viewport.name}`),
      );
    });
  }
});

import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  resolveCardPromptIfVisible,
} from '../helpers/real-flow';
import { waitForServerReady } from '../helpers/server-ready';

async function openRegisteredPage(
  browser: Browser,
  name: string,
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerByUi(page, createUser(name));
  return page;
}

async function readDashboardState(page: Page): Promise<{
  resourceText: string;
  handCount: number;
}> {
  const resourceBar = page.getByTestId('resource-bar');
  await expect(resourceBar).toBeVisible({ timeout: 15_000 });

  const resourceText = ((await resourceBar.textContent()) ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const handCount = await page.locator('[data-testid^="hand-card-"]').count();
  return { resourceText, handCount };
}

test.describe('Reconnection and state recovery @real-ui @reconnect', () => {
  test.beforeEach(async ({ request }) => {
    await waitForServerReady(request);
  });

  test('reloads a real game page back into the same dashboard state', async ({
    browser,
  }) => {
    const hostPage = await openRegisteredPage(browser, 'reconnect-host');
    const guestPage = await openRegisteredPage(browser, 'reconnect-guest');

    try {
      const roomId = await createRoomByUi(
        hostPage,
        `Reconnect ${Date.now()}`,
        2,
      );
      await joinRoomByUi(guestPage, roomId);

      const gameId = await launchGameByUi(hostPage, roomId);
      const guestGameId = await enterGameByUi(guestPage, roomId);
      expect(guestGameId).toBe(gameId);

      await expect(hostPage).toHaveURL(new RegExp(`/game/${gameId}$`));
      await expect(hostPage.getByTestId('bottom-dashboard')).toBeVisible({
        timeout: 15_000,
      });
      await expect(hostPage.getByTestId('bottom-actions')).toBeVisible({
        timeout: 15_000,
      });

      const beforeReload = await readDashboardState(hostPage);

      await hostPage.reload({ waitUntil: 'domcontentloaded' });
      await expect(hostPage).toHaveURL(new RegExp(`/game/${gameId}$`));
      await resolveCardPromptIfVisible(hostPage);
      await expect(hostPage.getByTestId('bottom-dashboard')).toBeVisible({
        timeout: 15_000,
      });
      await expect(hostPage.getByTestId('bottom-actions')).toBeVisible({
        timeout: 15_000,
      });

      await expect
        .poll(async () => readDashboardState(hostPage), {
          timeout: 15_000,
          message: 'dashboard state should recover after reload',
        })
        .toEqual(beforeReload);
    } finally {
      await hostPage.context().close();
      await guestPage.context().close();
    }
  });
});

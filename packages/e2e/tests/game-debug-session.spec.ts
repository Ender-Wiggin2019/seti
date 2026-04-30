import { expect, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test.describe('Game Session E2E (No Debug Bypass)', () => {
  test('host can start a real session and view core game panels', async ({
    browser,
    request,
  }) => {
    await waitForServerReady(request);

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const host = createUser('session-host');
    const guest = createUser('session-guest');

    try {
      await registerByUi(hostPage, host);
      await registerByUi(guestPage, guest);

      const roomId = await createRoomByUi(
        hostPage,
        `Session Room ${Date.now()}`,
        2,
      );
      await joinRoomByUi(guestPage, roomId);
      await launchGameByUi(hostPage, roomId);

      await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(hostPage.locator(sel.bottomHand)).toBeVisible({
        timeout: 15_000,
      });
      await expect(hostPage.locator(sel.bottomActions)).toBeVisible({
        timeout: 15_000,
      });

      await hostPage.click(sel.boardTab('Cards'));
      await expect(
        hostPage.locator('[data-testid^="card-row-"]').first(),
      ).toBeVisible();

      await hostPage.click(sel.boardTab('Tech'));
      await expect(
        hostPage.locator('[data-testid^="tech-stack-"]').first(),
      ).toBeVisible();
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

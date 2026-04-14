import { expect, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test.describe('Game Flow E2E (Real UI Path Only)', () => {
  test('host + guest complete real flow to in-game interaction', async ({
    browser,
    request,
  }) => {
    test.setTimeout(150_000);
    await waitForServerReady(request);

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const host = createUser('flow-host');
    const guest = createUser('flow-guest');

    try {
      await registerByUi(hostPage, host);
      await registerByUi(guestPage, guest);

      const roomId = await createRoomByUi(
        hostPage,
        `Flow Room ${Date.now()}`,
        2,
      );
      await joinRoomByUi(guestPage, roomId);

      const hostGameId = await launchGameByUi(hostPage, roomId);
      const guestGameId = await enterGameByUi(guestPage, roomId);
      expect(guestGameId).toBe(hostGameId);

      await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });
      await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 15_000,
      });

      await hostPage.click(sel.boardTab('Board'));
      await expect(hostPage.locator(sel.wheelLayerRing(1))).toBeVisible();
      await hostPage.click(sel.boardTab('Cards'));
      await expect(
        hostPage.locator('[data-testid^="card-row-"]').first(),
      ).toBeVisible();
      await hostPage.click(sel.boardTab('Tech'));
      await expect(
        hostPage.locator('[data-testid^="tech-stack-"]').first(),
      ).toBeVisible();

      const { actor: firstActive, other: firstPassive } =
        await waitForActionOwner(hostPage, guestPage, 'PASS');
      await clickPassAndWaitForLogSync(firstActive, firstPassive);
      await expect(firstActive.locator(sel.bottomActions)).toBeVisible({
        timeout: 10_000,
      });
      await expect(firstPassive.locator(sel.bottomActions)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

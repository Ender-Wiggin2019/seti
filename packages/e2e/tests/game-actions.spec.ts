import { type Browser, expect, type Page, test } from '@playwright/test';
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

async function setupTwoPlayerGame(browser: Browser): Promise<{
  hostContext: Awaited<ReturnType<Browser['newContext']>>;
  guestContext: Awaited<ReturnType<Browser['newContext']>>;
  hostPage: Page;
  guestPage: Page;
  roomId: string;
  gameId: string;
}> {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('actions-host');
  const guest = createUser('actions-guest');

  await registerByUi(hostPage, host);
  await registerByUi(guestPage, guest);

  const roomId = await createRoomByUi(
    hostPage,
    `Actions Room ${Date.now()}`,
    2,
  );
  await joinRoomByUi(guestPage, roomId);

  const gameId = await launchGameByUi(hostPage, roomId);
  const guestGameId = await enterGameByUi(guestPage, roomId);
  expect(guestGameId).toBe(gameId);

  await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
  await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });

  return { hostContext, guestContext, hostPage, guestPage, roomId, gameId };
}

test.describe('Action E2E (Real Flow Only)', () => {
  test('pass action is performed via UI and syncs event log across players', async ({
    browser,
    request,
  }) => {
    await waitForServerReady(request);
    const { hostContext, guestContext, hostPage, guestPage } =
      await setupTwoPlayerGame(browser);

    try {
      const { actor: activePage, other: passivePage } =
        await waitForActionOwner(hostPage, guestPage, 'PASS');

      await clickPassAndWaitForLogSync(activePage, passivePage);
      await expect(activePage.locator(sel.eventLog)).toBeVisible({
        timeout: 10_000,
      });
      await expect(passivePage.locator(sel.eventLog)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('main action menu renders through UI-only game setup', async ({
    browser,
    request,
  }) => {
    await waitForServerReady(request);
    const { hostContext, guestContext, hostPage, guestPage } =
      await setupTwoPlayerGame(browser);

    try {
      const { actor: activePage } = await waitForActionOwner(
        hostPage,
        guestPage,
        'PASS',
      );
      await expect(activePage.locator(sel.bottomActions)).toBeVisible();
      await expect(activePage.locator(sel.actionMenu('PASS'))).toBeVisible();
      await expect(
        activePage.locator(sel.actionMenu('PLAY_CARD')),
      ).toBeVisible();
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

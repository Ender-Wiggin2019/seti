import { expect, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createStartedGameByUi,
  openEventLog,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test.describe('Action E2E @actions @real-ui', () => {
  test('pass action is performed via UI and syncs event log across players', async ({
    browser,
    request,
  }) => {
    await waitForServerReady(request);
    const game = await createStartedGameByUi(browser, {
      roomName: `Actions Room ${Date.now()}`,
      userPrefix: 'actions',
    });
    const [hostPage, guestPage] = game.pages;

    try {
      const { actor: activePage, other: passivePage } =
        await waitForActionOwner(hostPage, guestPage, 'PASS');

      await clickPassAndWaitForLogSync(activePage, passivePage);
      await openEventLog(activePage);
      await openEventLog(passivePage);
    } finally {
      await game.close();
    }
  });

  test('main action menu renders through UI-only game setup', async ({
    browser,
    request,
  }) => {
    await waitForServerReady(request);
    const game = await createStartedGameByUi(browser, {
      roomName: `Actions Room ${Date.now()}`,
      userPrefix: 'actions',
    });
    const [hostPage, guestPage] = game.pages;

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
      await game.close();
    }
  });
});

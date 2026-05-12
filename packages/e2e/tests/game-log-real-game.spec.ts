import { expect, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createStartedGameByUi,
  openEventLog,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test.describe('Game log real game verification @real-ui', () => {
  test('creates a real game and renders readable logs in drawer and compact board area', async ({
    browser,
    request,
  }, testInfo) => {
    test.setTimeout(120_000);
    await waitForServerReady(request);

    const started = await createStartedGameByUi(browser, {
      playerCount: 2,
      roomName: `Real Log Room ${Date.now()}`,
      userPrefix: 'real-log',
    });

    try {
      const { actor, other } = await waitForActionOwner(
        started.host.page,
        started.guests[0].page,
        'PASS',
      );

      await clickPassAndWaitForLogSync(actor, other);

      await openEventLog(other);
      await expect(other.locator(sel.eventLog)).toContainText(/used Pass/i, {
        timeout: 10_000,
      });

      await other.setViewportSize({ width: 390, height: 900 });
      const compactLog = other.getByTestId('event-log-compact');
      await expect(compactLog).toBeVisible({ timeout: 10_000 });
      await expect(compactLog).toContainText(/Pass/i);

      await compactLog.click();
      await expect(other.getByRole('dialog')).toContainText(/Event Log/i);
      await expect(other.getByRole('dialog')).toContainText(/used Pass/i);

      await testInfo.attach('real-game-log-mobile', {
        body: await other.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    } finally {
      await started.close();
    }
  });
});

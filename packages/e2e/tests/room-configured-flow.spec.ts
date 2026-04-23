import { expect, test } from '@playwright/test';
import {
  clickPassAndWaitForLogSync,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  openEventLog,
  registerByUi,
  waitForActionHandoff,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test('configured room flow e2e: create custom room settings, join, launch, and hand off turn', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('configured-host');
  const guest = createUser('configured-guest');
  const roomName = `Configured Room ${Date.now()}`;

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(hostPage, roomName, 2);

    await expect(hostPage.locator('[data-testid="game-setting-value-players"]')).toHaveText('2');
    await expect(
      hostPage.locator('[data-testid="game-setting-alien-modules"] [role="switch"]'),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(hostPage.locator('[data-testid="game-setting-value-undo"]')).toContainText(/allowed/i);
    await expect(hostPage.locator('[data-testid="game-setting-value-turn-timer"]')).toContainText(/off/i);

    await joinRoomByUi(guestPage, roomId);

    await expect(guestPage.locator('[data-testid="game-setting-value-players"]')).toHaveText('2');
    await expect(guestPage.locator('[data-testid="game-setting-value-alien-modules"]')).toContainText(/on/i);
    await expect(guestPage.locator('[data-testid="game-setting-value-undo"]')).toContainText(/allowed/i);
    await expect(guestPage.locator('[data-testid="game-setting-value-turn-timer"]')).toContainText(/off/i);

    const hostGameId = await launchGameByUi(hostPage, roomId);
    const guestGameId = await enterGameByUi(guestPage, roomId);
    expect(guestGameId).toBe(hostGameId);

    await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });

    const { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
    );
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });

    await clickPassAndWaitForLogSync(actor, other);
    await waitForActionHandoff(actor, other, 'PASS');

    await expect(other.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });

    await openEventLog(actor);
    await openEventLog(other);

    await expect(actor.locator(sel.eventLog)).toBeVisible({ timeout: 10_000 });
    await expect(other.locator(sel.eventLog)).toBeVisible({ timeout: 10_000 });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

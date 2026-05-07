import { expect, test } from '@playwright/test';
import {
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

async function handCount(page: import('@playwright/test').Page) {
  const text = await page
    .locator('[data-testid="hand-dock"]')
    .locator('text=/\\d+ cards?/')
    .first()
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

test('@actions @real-ui card corner free action e2e: active player discards a hand card through real UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('corner-host');
  const guest = createUser('corner-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Card Corner Room ${Date.now()}`,
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

    const { actor } = await waitForActionOwner(hostPage, guestPage, 'PASS');
    const initialHandCount = await handCount(actor);
    expect(initialHandCount).toBeGreaterThan(1);

    await actor.locator(sel.freeActionToggle).click();
    const corner = actor.locator(sel.freeAction('USE_CARD_CORNER'));
    await expect(corner).toBeVisible({ timeout: 10_000 });
    await expect(corner).toBeEnabled({ timeout: 10_000 });
    await corner.click();

    await expect(actor.locator('[data-testid="hand-dock"]')).toHaveAttribute(
      'data-expanded',
      'true',
      { timeout: 10_000 },
    );

    const firstHandCard = actor
      .locator('[data-testid="bottom-hand"] [data-testid^="hand-card-"]')
      .first();
    await expect(firstHandCard).toBeVisible({ timeout: 10_000 });
    await firstHandCard.click();

    await expect
      .poll(() => handCount(actor), { timeout: 15_000 })
      .toBe(initialHandCount - 1);
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

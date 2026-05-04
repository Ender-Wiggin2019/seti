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

test('buy card free action e2e: active player buys from deck through real UI before main action', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('buy-card-host');
  const guest = createUser('buy-card-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Buy Card Room ${Date.now()}`,
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

    const { actor, other } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
    );

    const handDock = actor.locator('[data-testid="hand-dock"]');
    const initialHandText = await handDock
      .locator('text=/\\d+ cards?/')
      .first()
      .textContent();
    const initialHandCount = Number(initialHandText?.match(/\d+/)?.[0] ?? 0);
    expect(initialHandCount).toBeGreaterThan(0);

    await actor.locator(sel.freeActionToggle).click();
    const buyCard = actor.locator(sel.freeAction('BUY_CARD'));
    await expect(buyCard).toBeVisible({ timeout: 10_000 });
    await expect(buyCard).toBeEnabled({ timeout: 10_000 });
    await buyCard.click();

    await actor.getByRole('button', { name: /deck/i }).click();

    await expect
      .poll(
        async () => {
          const text = await handDock
            .locator('text=/\\d+ cards?/')
            .first()
            .textContent();
          return Number(text?.match(/\d+/)?.[0] ?? 0);
        },
        { timeout: 15_000 },
      )
      .toBe(initialHandCount + 1);

    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
    await expect(actor.locator(sel.bottomActions)).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

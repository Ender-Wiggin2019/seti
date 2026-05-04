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

async function resourceValue(page: import('@playwright/test').Page, id: string) {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

test('exchange resources free action e2e: active player exchanges credits into energy through real UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('exchange-host');
  const guest = createUser('exchange-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Exchange Room ${Date.now()}`,
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
    const creditsBefore = await resourceValue(actor, 'credit');
    const energyBefore = await resourceValue(actor, 'energy');
    expect(creditsBefore).toBeGreaterThanOrEqual(2);

    await actor.locator(sel.freeActionToggle).click();
    const exchange = actor.locator(sel.freeAction('EXCHANGE_RESOURCES'));
    await expect(exchange).toBeVisible({ timeout: 10_000 });
    await expect(exchange).toBeEnabled({ timeout: 10_000 });
    await exchange.click();

    await actor.getByRole('button', { name: /credit.*energy/i }).click();

    await expect
      .poll(() => resourceValue(actor, 'credit'), { timeout: 15_000 })
      .toBe(creditsBefore - 2);
    await expect
      .poll(() => resourceValue(actor, 'energy'), { timeout: 15_000 })
      .toBe(energyBefore + 1);
    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

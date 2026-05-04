import { expect, test } from '@playwright/test';
import {
  clickEndTurn,
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  resolveScanSubActions,
  waitForActionHandoff,
  waitForActionOwner,
  waitForInputPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function dataPoolCount(page: import('@playwright/test').Page) {
  const text = await page
    .locator('[data-testid="data-pool-view"] .readout')
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

test('place data free action e2e: scan gains data, place into computer, then end turn', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('place-data-host');
  const guest = createUser('place-data-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Place Data Room ${Date.now()}`,
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

    const { actor: launchActor, other: scanActor } = await waitForActionOwner(
      hostPage,
      guestPage,
      'LAUNCH_PROBE',
    );

    await clickMainAction(launchActor, 'LAUNCH_PROBE');
    await clickEndTurn(launchActor);
    await waitForActionHandoff(launchActor, scanActor, 'SCAN', 20_000);

    await clickMainAction(scanActor, 'SCAN');
    const hasPrompt = await waitForInputPrompt(scanActor, 10_000);
    expect(hasPrompt).toBe(true);
    await resolveScanSubActions(scanActor);

    const poolBeforePlace = await dataPoolCount(scanActor);
    expect(poolBeforePlace).toBeGreaterThan(0);

    await scanActor.locator(sel.freeActionToggle).click();
    const placeData = scanActor.locator(sel.freeAction('PLACE_DATA'));
    await expect(placeData).toBeVisible({ timeout: 10_000 });
    await expect(placeData).toBeEnabled({ timeout: 10_000 });

    const firstTopSlot = scanActor.locator(sel.computerSlotTop(0));
    await expect(firstTopSlot).toBeEnabled({ timeout: 10_000 });
    await firstTopSlot.click();

    await expect
      .poll(() => dataPoolCount(scanActor), { timeout: 15_000 })
      .toBe(poolBeforePlace - 1);
    await expect(firstTopSlot).toBeDisabled({ timeout: 10_000 });

    await clickEndTurn(scanActor);
    await waitForActionHandoff(scanActor, launchActor, 'PASS', 20_000);
    await expect(launchActor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

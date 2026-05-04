import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  clickEndTurn,
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionHandoff,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function expandFreeActions(page: Page): Promise<void> {
  const toggle = page.locator(sel.freeActionToggle);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  const convert = page.locator(sel.freeAction('CONVERT_ENERGY_TO_MOVEMENT'));
  if (!(await convert.isVisible().catch(() => false))) {
    await toggle.click();
  }
  await expect(convert).toBeVisible({ timeout: 10_000 });
}

async function convertOneEnergyToMovement(page: Page): Promise<void> {
  await expandFreeActions(page);
  const convert = page.locator(sel.freeAction('CONVERT_ENERGY_TO_MOVEMENT'));
  await expect(convert).toBeEnabled({ timeout: 10_000 });
  await convert.click();
  await page.getByRole('button', { name: /^1\s*⚡?\s*→?\s*MOV/i }).click();
  await expect(page.locator(sel.freeAction('MOVEMENT'))).toContainText(/\(1\)/, {
    timeout: 10_000,
  });
}

async function firstProbe(page: Page): Promise<Locator> {
  const probe = page.locator('[data-testid^="solar-probe-"]').first();
  await expect(probe).toBeVisible({ timeout: 10_000 });
  return probe;
}

async function firstReachableSpace(page: Page): Promise<Locator> {
  const reachableIndicator = page
    .locator('[data-reachable-indicator="true"]')
    .first();
  await expect(reachableIndicator).toBeVisible({ timeout: 10_000 });
  return reachableIndicator.locator('xpath=ancestor::button[1]');
}

test('free movement e2e: launch probe, convert energy, move via board UI, then end turn', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('movement-host');
  const guest = createUser('movement-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Movement Room ${Date.now()}`,
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
      'LAUNCH_PROBE',
    );

    await clickMainAction(actor, 'LAUNCH_PROBE');
    await expect(actor.locator('[data-testid^="solar-probe-"]')).toHaveCount(1, {
      timeout: 10_000,
    });

    const probe = await firstProbe(actor);
    const startSpaceId = await probe.getAttribute('data-space-id');
    expect(startSpaceId).toBeTruthy();

    await convertOneEnergyToMovement(actor);

    const move = actor.locator(sel.freeAction('MOVEMENT'));
    await expect(move).toBeEnabled({ timeout: 10_000 });
    await move.click();
    await expect(actor.locator('[data-testid="movement-mode-hint"]')).toBeVisible({
      timeout: 10_000,
    });

    const startSpace = actor.locator(`[data-testid="solar-space-${startSpaceId}"]`);
    await startSpace.click();
    const targetSpace = await firstReachableSpace(actor);
    const targetSpaceTestId = await targetSpace.getAttribute('data-testid');
    expect(targetSpaceTestId).toBeTruthy();
    const targetSpaceId = targetSpaceTestId?.replace('solar-space-', '');
    expect(targetSpaceId).toBeTruthy();
    expect(targetSpaceId).not.toBe(startSpaceId);

    await targetSpace.click();

    await expect
      .poll(async () => (await firstProbe(actor)).getAttribute('data-space-id'), {
        timeout: 15_000,
      })
      .toBe(targetSpaceId);

    await clickEndTurn(actor);
    await waitForActionHandoff(actor, other, 'PASS', 20_000);
    await expect(other.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

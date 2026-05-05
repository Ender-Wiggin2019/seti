import { expect, type Page, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForAndResolveCardPrompt,
  waitForActionOwner,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function getPassState(page: Page): Promise<'enabled' | 'disabled' | 'hidden'> {
  const pass = page.locator(sel.actionMenu('PASS'));
  const visible = await pass.isVisible().catch(() => false);
  if (!visible) return 'hidden';
  const enabled = await pass.isEnabled().catch(() => false);
  return enabled ? 'enabled' : 'disabled';
}

async function expectPassNotEnabled(page: Page): Promise<void> {
  await expect.poll(() => getPassState(page), {
    timeout: 10_000,
    message: 'Expected PASS to be unavailable for a non-active player',
  }).not.toBe('enabled');
}

async function passWithEndOfRoundSelection(page: Page): Promise<void> {
  const pass = page.locator(sel.actionMenu('PASS'));
  await expect(pass).toBeVisible({ timeout: 10_000 });
  await expect(pass).toBeEnabled({ timeout: 10_000 });
  await pass.click();
  const resolved = await waitForAndResolveCardPrompt(page, 10_000);
  expect(resolved).toBe(true);
}

test('end-of-round e2e: both players pass, pick end-of-round cards, and next round begins', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('eor-host');
  const guest = createUser('eor-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(hostPage, `EOR Room ${Date.now()}`, 2);
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

    const { actor: firstActor, other: secondActor } = await waitForActionOwner(
      hostPage,
      guestPage,
      'PASS',
      20_000,
    );

    await passWithEndOfRoundSelection(firstActor);
    await expectPassNotEnabled(firstActor);
    await expect(secondActor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });

    await passWithEndOfRoundSelection(secondActor);

    await expect(
      secondActor.locator(
        '[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]',
      ),
    ).toHaveCount(0, {
      timeout: 15_000,
    });

    await expect(secondActor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });
    await expectPassNotEnabled(firstActor);

    await expect(secondActor.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 10_000,
    });
    await expect(firstActor.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

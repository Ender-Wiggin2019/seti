import { expect, type Page, test } from '@playwright/test';
import {
  clickMainAction,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  openEventLog,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const SCENARIO_PRESET = 'spend-signal-token';

async function resourceValue(page: Page, id: string): Promise<number> {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function createRoomByUiWithScenario(
  page: Page,
  roomName: string,
  scenarioPreset: string,
): Promise<string> {
  await page.goto('/lobby');
  await page.getByTestId('lobby-new-mission').click();
  await expect(page.getByTestId('create-room-dialog')).toBeVisible({
    timeout: 10_000,
  });
  await page.locator('#room-name').fill(roomName);

  await page.route('**/lobby/rooms', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = JSON.parse(route.request().postData() ?? '{}') as {
      options?: Record<string, unknown>;
    };
    await route.continue({
      postData: JSON.stringify({
        ...body,
        options: {
          ...(body.options ?? {}),
          scenarioPreset,
        },
      }),
    });
  });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/lobby/rooms') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  const dialog = page.getByTestId('create-room-dialog');
  await dialog.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const submitButton = page.getByTestId('create-room-submit');
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click();
  const response = await responsePromise;
  await page.unroute('**/lobby/rooms');
  expect(response.ok()).toBe(true);

  const room = (await response.json()) as { id?: string };
  expect(room.id).toBeTruthy();
  await page.waitForURL(new RegExp(`/room/${room.id as string}$`), {
    timeout: 15_000,
  });
  return room.id as string;
}

test('spend signal token free action e2e: scenario enters real scan pool, spends token, and returns to scan flow', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('signal-token-host');
  const guest = createUser('signal-token-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUiWithScenario(
      hostPage,
      `Signal Token Room ${Date.now()}`,
      SCENARIO_PRESET,
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

    const signalBefore = await resourceValue(hostPage, 'signal-token');
    expect(signalBefore).toBeGreaterThan(0);
    await expect(hostPage.locator(sel.actionMenu('SCAN'))).toBeEnabled({
      timeout: 15_000,
    });
    await clickMainAction(hostPage, 'SCAN');
    await hostPage.locator(sel.freeActionToggle).click();
    await expect(
      hostPage.locator(sel.freeAction('SPEND_SIGNAL_TOKEN')),
    ).toBeEnabled({
      timeout: 15_000,
    });

    await openEventLog(hostPage);
    const hostLog = hostPage.locator('[data-testid^="event-entry-"]');
    const logBefore = await hostLog.count();

    await hostPage.locator(sel.freeAction('SPEND_SIGNAL_TOKEN')).click();
    await expect
      .poll(() => resourceValue(hostPage, 'signal-token'), { timeout: 15_000 })
      .toBe(signalBefore - 1);

    const cardPrompt = hostPage
      .locator('[data-testid="bottom-actions"] [data-testid^="hand-card-"]')
      .first();
    await expect(cardPrompt).toBeVisible({ timeout: 10_000 });
    await cardPrompt.click();
    await hostPage
      .locator('[data-testid="bottom-actions"]')
      .getByRole('button', { name: /confirm/i })
      .click();
    const sectorOption = hostPage
      .locator('[data-testid^="input-option-sector-"]')
      .first();
    await expect(sectorOption).toBeVisible({
      timeout: 15_000,
    });
    await sectorOption.click();

    await expect
      .poll(() => hostLog.count(), { timeout: 15_000 })
      .toBeGreaterThan(logBefore);
    await expect(
      hostPage.locator(sel.freeAction('SPEND_SIGNAL_TOKEN')),
    ).toBeDisabled({
      timeout: 15_000,
    });
    await expect(
      hostPage.locator(sel.inputOption('mark-card-row')),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(hostPage.locator(sel.inputOption('mark-earth'))).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

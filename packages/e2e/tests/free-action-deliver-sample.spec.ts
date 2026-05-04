import { expect, type Page, test } from '@playwright/test';
import {
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const SCENARIO_PRESET = 'deliver-sample';

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
          alienModulesEnabled: [false, false, false, true, true],
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

test('deliver sample free action e2e: scenario exposes real deliver button and resolves through UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('deliver-sample-host');
  const guest = createUser('deliver-sample-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUiWithScenario(
      hostPage,
      `Deliver Sample Room ${Date.now()}`,
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

    await hostPage.getByRole('tab', { name: /aliens/i }).click();
    await expect(
      hostPage.locator('[data-testid*="-mascamites-capsule-"]'),
    ).toHaveCount(1, {
      timeout: 15_000,
    });
    await hostPage.locator(sel.freeActionToggle).click();
    await expect(
      hostPage.locator(sel.freeAction('DELIVER_SAMPLE')),
    ).toBeEnabled({
      timeout: 15_000,
    });

    await hostPage.locator(sel.freeAction('DELIVER_SAMPLE')).click();
    await expect(
      hostPage.locator('[data-testid*="-mascamites-capsule-"]'),
    ).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(
      hostPage.locator('[data-testid*="-mascamites-delivered-"]'),
    ).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(
      hostPage.locator(sel.freeAction('DELIVER_SAMPLE')),
    ).toBeDisabled({
      timeout: 15_000,
    });
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

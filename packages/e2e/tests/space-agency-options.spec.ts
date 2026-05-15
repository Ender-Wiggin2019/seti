import { expect, type Page, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  joinRoomByUi,
  registerByUi,
} from '../helpers/real-flow';
import { waitForServerReady } from '../helpers/server-ready';

async function clickRoomOptionSwitch(
  page: Page,
  roomId: string,
  switchId: string,
  checked: boolean,
): Promise<void> {
  const toggle = page.locator(`#${switchId}`);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toBeEnabled({ timeout: 10_000 });

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/lobby/rooms/${roomId}/options`) &&
      res.request().method() === 'PATCH',
    { timeout: 15_000 },
  );
  await toggle.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  await expect(toggle).toHaveAttribute(
    'aria-checked',
    checked ? 'true' : 'false',
    { timeout: 10_000 },
  );
}

test('@real-ui Space Agency room options update through host UI and render read-only for guests', async ({
  browser,
  request,
}) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('space-agency-host');
  const guest = createUser('space-agency-guest');

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(
      hostPage,
      `Space Agency Room ${Date.now()}`,
      2,
    );

    await expect(hostPage.locator('#space-agency-enabled')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(hostPage.locator('#space-agency-agencies')).toBeDisabled();
    await expect(hostPage.locator('#space-agency-quick-start')).toBeDisabled();

    await clickRoomOptionSwitch(hostPage, roomId, 'space-agency-enabled', true);
    await expect(hostPage.locator('#space-agency-agencies')).toBeEnabled();
    await expect(hostPage.locator('#space-agency-new-deck')).toBeEnabled();
    await expect(hostPage.locator('#space-agency-new-aliens')).toBeEnabled();

    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-agencies',
      true,
    );
    await expect(hostPage.locator('#space-agency-quick-start')).toBeEnabled();
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-quick-start',
      true,
    );

    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-agencies',
      false,
    );
    await expect(hostPage.locator('#space-agency-quick-start')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(hostPage.locator('#space-agency-quick-start')).toBeDisabled();

    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-new-aliens',
      true,
    );
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-new-aliens',
      false,
    );

    await registerByUi(guestPage, guest);
    await joinRoomByUi(guestPage, roomId);

    await expect(
      guestPage.getByTestId('game-setting-value-space-agency'),
    ).toContainText(/on/i);
    await expect(guestPage.locator('#space-agency-enabled')).toHaveCount(0);
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

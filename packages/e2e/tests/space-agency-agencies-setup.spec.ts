import { expect, type Page, type TestInfo, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
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

async function attachScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

async function chooseFirstOrganization(page: Page): Promise<string> {
  const option = page.locator('[data-testid^="input-option-"]').first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  const testId = await option.getAttribute('data-testid');
  if (!testId?.startsWith('input-option-')) {
    throw new Error('Expected an organization option test id');
  }
  const organizationId = testId.slice('input-option-'.length);
  await option.click();
  return organizationId;
}

async function chooseFirstQuickStartCards(
  page: Page,
  count = 2,
): Promise<string[]> {
  const selectedIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const option = page.locator('[data-testid^="input-option-SR."]').first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    const testId = await option.getAttribute('data-testid');
    if (!testId?.startsWith('input-option-')) {
      throw new Error('Expected a Quick Start option test id');
    }
    const cardId = testId.slice('input-option-'.length);
    selectedIds.push(cardId);
    await option.click();
    await expect(page.getByTestId(`input-option-${cardId}`)).toHaveCount(0, {
      timeout: 15_000,
    });
  }
  return selectedIds;
}

test('@real-ui Space Agency agencies + Quick Start setup enters game', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('sa-agency-host');
  const guest = createUser('sa-agency-guest');

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(
      hostPage,
      `SA Agencies ${Date.now()}`,
      2,
    );

    await clickRoomOptionSwitch(hostPage, roomId, 'space-agency-enabled', true);
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-agencies',
      true,
    );
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-quick-start',
      true,
    );
    await attachScreenshot(
      hostPage,
      testInfo,
      'space-agency-agencies-01-room-options',
    );

    await registerByUi(guestPage, guest);
    await joinRoomByUi(guestPage, roomId);

    const hostGameId = await launchGameByUi(hostPage, roomId);
    const guestGameId = await enterGameByUi(guestPage, roomId);
    expect(guestGameId).toBe(hostGameId);

    await expect(hostPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });
    await attachScreenshot(
      hostPage,
      testInfo,
      'space-agency-agencies-02-host-setup-choice',
    );
    await attachScreenshot(
      guestPage,
      testInfo,
      'space-agency-agencies-02-guest-setup-choice',
    );

    const hostOrganizationId = await chooseFirstOrganization(hostPage);
    const hostQuickStartIds = await chooseFirstQuickStartCards(hostPage);
    const guestOrganizationId = await chooseFirstOrganization(guestPage);
    const guestQuickStartIds = await chooseFirstQuickStartCards(guestPage);

    await expect(hostPage.locator(sel.playerDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.locator(sel.playerDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      hostPage.getByTestId(`organization-badge-${hostOrganizationId}`),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      guestPage.getByTestId(`organization-badge-${guestOrganizationId}`),
    ).toBeVisible({ timeout: 15_000 });
    await attachScreenshot(
      hostPage,
      testInfo,
      'space-agency-agencies-03-host-organization-surface',
    );
    await attachScreenshot(
      guestPage,
      testInfo,
      'space-agency-agencies-03-guest-organization-surface',
    );
    for (const cardId of hostQuickStartIds) {
      await expect(
        hostPage.getByTestId(`quick-start-card-thumbnail-${cardId}`),
      ).toBeVisible({ timeout: 15_000 });
    }
    for (const cardId of guestQuickStartIds) {
      await expect(
        guestPage.getByTestId(`quick-start-card-thumbnail-${cardId}`),
      ).toBeVisible({ timeout: 15_000 });
    }
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

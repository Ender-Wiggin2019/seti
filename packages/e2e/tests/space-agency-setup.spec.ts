import { expect, type Page, test } from '@playwright/test';
import {
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForAndResolveCardPrompt,
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

async function chooseFirstOrganization(page: Page): Promise<string> {
  const option = page.locator('[data-testid^="input-option-"]').first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  const testId = await option.getAttribute('data-testid');
  if (!testId?.startsWith('input-option-')) {
    throw new Error('Expected an organization option test id');
  }
  await option.click();
  return testId.slice('input-option-'.length);
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

async function openCardsTab(page: Page): Promise<void> {
  const handDock = page.getByTestId('hand-dock');
  if ((await handDock.getAttribute('data-expanded')) === 'true') {
    const toggle = page.getByTestId('hand-dock-toggle');
    await expect(toggle).toBeEnabled({ timeout: 10_000 });
    await toggle.click();
    await expect(handDock).toHaveAttribute('data-expanded', 'false', {
      timeout: 10_000,
    });
  }

  const cardsTab = page.getByRole('tab', { name: /cards/i });
  await expect(cardsTab).toBeVisible({ timeout: 15_000 });
  await cardsTab.click();
  await expect(cardsTab).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
}

async function resolveSetupPrompts(
  hostPage: Page,
  guestPage: Page,
): Promise<void> {
  for (let step = 0; step < 6; step += 1) {
    const hostResolved = await waitForAndResolveCardPrompt(hostPage, 5_000);
    const guestResolved = await waitForAndResolveCardPrompt(guestPage, 5_000);
    if (!hostResolved && !guestResolved) {
      return;
    }
  }
}

async function roundStackCardCount(page: Page, index: number): Promise<number> {
  const text = await page
    .locator(sel.roundStack(index))
    .locator('p')
    .last()
    .textContent();
  const match = text?.match(/(\d+)\s+cards/i);
  if (!match) {
    throw new Error(`Could not read card count for round stack ${index}`);
  }
  return Number(match[1]);
}

test('@real-ui Space Agency setup resolves agencies and Quick Start through production UI', async ({
  browser,
  request,
}) => {
  test.setTimeout(240_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('sa-setup-host');
  const guest = createUser('sa-setup-guest');

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(hostPage, `SA Setup ${Date.now()}`, 2);

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

    await registerByUi(guestPage, guest);
    await joinRoomByUi(guestPage, roomId);
    await expect(
      guestPage.getByTestId('game-setting-value-space-agency'),
    ).toContainText(/on/i);

    const hostGameId = await launchGameByUi(hostPage, roomId);
    const guestGameId = await enterGameByUi(guestPage, roomId);
    expect(guestGameId).toBe(hostGameId);

    await expect(hostPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.getByTestId('setup-choice-shell')).toBeVisible({
      timeout: 15_000,
    });

    const hostOrganizationId = await chooseFirstOrganization(hostPage);
    const hostQuickStartIds = await chooseFirstQuickStartCards(hostPage);
    const guestOrganizationId = await chooseFirstOrganization(guestPage);
    const guestQuickStartIds = await chooseFirstQuickStartCards(guestPage);

    await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      hostPage.getByTestId(`organization-badge-${hostOrganizationId}`),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      guestPage.getByTestId(`organization-badge-${guestOrganizationId}`),
    ).toBeVisible({ timeout: 15_000 });

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

    await resolveSetupPrompts(hostPage, guestPage);
    await openCardsTab(hostPage);
    await expect(hostPage.locator('[data-testid^="round-stack-"]')).toHaveCount(
      3,
    );
    await expect
      .poll(() => roundStackCardCount(hostPage, 0), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => roundStackCardCount(hostPage, 1))
      .toBeGreaterThan(0);
    await expect
      .poll(() => roundStackCardCount(hostPage, 2))
      .toBeGreaterThan(0);
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

import { type Browser, expect, type Page, test } from '@playwright/test';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionOwner,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const IMMEDIATELY_USABLE_POWER_ORGANIZATIONS = [
  EOrganizationId.COSMOS_STRATEGY_GROUP,
  EOrganizationId.STRATUS_CORE,
] as const;

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

async function chooseFirstOrganization(page: Page): Promise<EOrganizationId> {
  const option = page.locator('[data-testid^="input-option-"]').first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  const testId = await option.getAttribute('data-testid');
  if (!testId?.startsWith('input-option-')) {
    throw new Error('Expected an organization option test id');
  }
  await option.click();
  return testId.slice('input-option-'.length) as EOrganizationId;
}

async function chooseUsablePowerOrganizationIfVisible(
  page: Page,
): Promise<EOrganizationId | undefined> {
  for (const organizationId of IMMEDIATELY_USABLE_POWER_ORGANIZATIONS) {
    const option = page.getByTestId(`input-option-${organizationId}`);
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return organizationId;
    }
  }

  return undefined;
}

async function expandFreeActions(page: Page): Promise<void> {
  const toggle = page.locator(sel.freeActionToggle);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  const organizationPower = page.locator(
    '[data-testid^="organization-power-"]',
  );
  if (
    !(await organizationPower
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    await toggle.click();
  }
  await expect(organizationPower.first()).toBeVisible({ timeout: 10_000 });
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

async function runOrganizationPowerAttempt(
  browser: Browser,
  attempt: number,
): Promise<boolean> {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser(`sa-org-power-host-${attempt}`);
  const guest = createUser(`sa-org-power-guest-${attempt}`);

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(
      hostPage,
      `SA Organization Power ${Date.now()}`,
      2,
    );

    await clickRoomOptionSwitch(hostPage, roomId, 'space-agency-enabled', true);
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-agencies',
      true,
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

    const hostPowerOrganizationId =
      await chooseUsablePowerOrganizationIfVisible(hostPage);
    const hostOrganizationId =
      hostPowerOrganizationId ?? (await chooseFirstOrganization(hostPage));
    const guestPowerOrganizationId =
      await chooseUsablePowerOrganizationIfVisible(guestPage);
    if (guestPowerOrganizationId === undefined) {
      await chooseFirstOrganization(guestPage);
    }
    const powerOrganizationId =
      hostPowerOrganizationId ?? guestPowerOrganizationId;
    const powerPage =
      hostPowerOrganizationId !== undefined ? hostPage : guestPage;

    if (powerOrganizationId === undefined) {
      return false;
    }

    await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      hostPage
        .locator(sel.bottomDashboard)
        .getByTestId(`organization-card-${hostOrganizationId}`),
    ).toBeVisible({ timeout: 15_000 });

    await resolveSetupPrompts(hostPage, guestPage);

    let actor: Page | undefined;
    let other: Page | undefined;
    for (let passCount = 0; passCount < 4; passCount += 1) {
      ({ actor, other } = await waitForActionOwner(
        hostPage,
        guestPage,
        'PASS',
        20_000,
      ));
      if (actor === powerPage) {
        break;
      }
      await clickMainAction(actor, 'PASS');
      await waitForAndResolveCardPrompt(actor, 5_000);
      await waitForAndResolveCardPrompt(other, 5_000);
    }

    if (actor !== powerPage || other === undefined) {
      return false;
    }

    await expandFreeActions(actor);
    const organizationPower = actor.getByTestId(
      `organization-power-${powerOrganizationId}`,
    );
    if (!(await organizationPower.isEnabled({ timeout: 10_000 }))) {
      return false;
    }
    await organizationPower.click();
    await expect(organizationPower).toBeDisabled({ timeout: 15_000 });

    await expect(actor.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 10_000,
    });
    await expect(other.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    return true;
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
}

test('@real-ui Space Agency organization power can be used after setup', async ({
  browser,
  request,
}) => {
  test.setTimeout(420_000);
  await waitForServerReady(request);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await runOrganizationPowerAttempt(browser, attempt)) {
      return;
    }
  }

  throw new Error(
    'No immediately usable organization power candidate appeared after 8 real setup attempts',
  );
});

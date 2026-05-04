import { type Browser, expect, type Page, test } from '@playwright/test';
import {
  clickEndTurn,
  clickMainAction,
  clickPassAndWaitForLogSync,
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

async function expandFreeActions(page: Page): Promise<void> {
  const toggle = page.locator(sel.freeActionToggle);
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  const convert = page.locator(sel.freeAction('CONVERT_ENERGY_TO_MOVEMENT'));
  if (!(await convert.isVisible().catch(() => false))) {
    await toggle.click();
  }
  await expect(convert).toBeVisible({ timeout: 10_000 });
}

async function convertEnergyToMovement(
  page: Page,
  amount: 1 | 2,
): Promise<void> {
  await expandFreeActions(page);
  const convert = page.locator(sel.freeAction('CONVERT_ENERGY_TO_MOVEMENT'));
  await expect(convert).toBeEnabled({ timeout: 10_000 });
  await convert.click();
  await page.getByRole('button', { name: new RegExp(`^${amount}\\s`) }).click();
  await expect(page.locator(sel.freeAction('MOVEMENT'))).toContainText(
    new RegExp(`\\(${amount}\\)`),
    { timeout: 10_000 },
  );
}

async function firstProbeSpaceId(page: Page): Promise<string> {
  const probe = page.locator('[data-testid^="solar-probe-"]').first();
  await expect(probe).toBeVisible({ timeout: 10_000 });
  const spaceId = await probe.getAttribute('data-space-id');
  expect(spaceId).toBeTruthy();
  return spaceId as string;
}

async function moveProbeToFirstReachablePlanet(
  page: Page,
): Promise<{ planet: string; spaceId: string }> {
  const move = page.locator(sel.freeAction('MOVEMENT'));
  await expect(move).toBeEnabled({ timeout: 10_000 });
  await move.click();
  await expect(page.locator('[data-testid="movement-mode-hint"]')).toBeVisible({
    timeout: 10_000,
  });

  const planetTarget = page
    .locator(
      '[data-reachable-indicator="true"]' +
        ' >> xpath=ancestor::button[@data-planet and @data-planet!="earth"][1]',
    )
    .first();
  await expect(planetTarget).toBeVisible({ timeout: 10_000 });

  const planet = await planetTarget.getAttribute('data-planet');
  const targetSpaceTestId = await planetTarget.getAttribute('data-testid');
  expect(planet).toBeTruthy();
  expect(targetSpaceTestId).toBeTruthy();

  await planetTarget.click();
  const targetSpaceId = targetSpaceTestId?.replace('solar-space-', '');
  expect(targetSpaceId).toBeTruthy();

  await expect
    .poll(async () => firstProbeSpaceId(page), { timeout: 15_000 })
    .toBe(targetSpaceId);

  return { planet: planet as string, spaceId: targetSpaceId as string };
}

async function executePlanetAction(
  page: Page,
  actionType: 'ORBIT' | 'LAND',
): Promise<string> {
  await clickMainAction(page, actionType);
  await expect(page.getByRole('tab', { name: 'Planets' })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 10_000 },
  );

  const enabledTarget = page
    .locator('[data-testid^="planet-target-"]:not([disabled])')
    .first();
  await expect(enabledTarget).toBeVisible({ timeout: 10_000 });
  const testId = await enabledTarget.getAttribute('data-testid');
  expect(testId).toBeTruthy();
  const planet = testId?.replace('planet-target-', '');
  expect(planet).toBeTruthy();
  await enabledTarget.click();
  return planet as string;
}

async function hasEnabledMainAction(
  page: Page,
  actionType: 'ORBIT' | 'LAND',
): Promise<boolean> {
  const action = page.locator(sel.actionMenu(actionType));
  const visible = await action.isVisible().catch(() => false);
  if (!visible) {
    return false;
  }
  return action.isEnabled().catch(() => false);
}

async function advanceRealTurnsUntilActionEnabled(
  actorPage: Page,
  firstPage: Page,
  secondPage: Page,
  actionType: 'ORBIT' | 'LAND',
  maxPasses = 6,
): Promise<void> {
  for (let step = 0; step < maxPasses; step += 1) {
    if (await hasEnabledMainAction(actorPage, actionType)) {
      return;
    }

    const passOwner = await waitForActionOwner(
      firstPage,
      secondPage,
      'PASS',
      20_000,
    );
    await clickPassAndWaitForLogSync(passOwner.actor, passOwner.other);
  }

  throw new Error(
    `Timed out advancing real turns until ${actionType} became enabled`,
  );
}

async function expectPlanetToken(
  page: Page,
  planet: string,
  sectionName: 'Orbit' | 'Landing',
): Promise<void> {
  const card = page.locator(sel.planetCard(planet));
  await expect(card).toBeVisible({ timeout: 10_000 });
  const section = card.locator('section', { hasText: sectionName });
  await expect(section.locator('[aria-label^="token-"]').first()).toBeVisible({
    timeout: 10_000,
  });
}

async function resolveVisibleInput(page: Page): Promise<boolean> {
  const scopedPrompt = page.locator('[data-testid="bottom-actions"]');

  const card = scopedPrompt
    .locator(
      '[data-testid^="input-eor-card-"], [data-testid^="hand-card-"], [data-testid^="select-card-"]',
    )
    .first();
  if (await card.isVisible().catch(() => false)) {
    await card.click();
    const confirm = scopedPrompt.getByRole('button', { name: /^confirm$/i });
    if (await confirm.isVisible().catch(() => false)) {
      await expect(confirm).toBeEnabled({ timeout: 5_000 });
      await confirm.click();
    }
    return true;
  }

  const option = scopedPrompt.locator('[data-testid^="input-option-"]').first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
    return true;
  }

  return false;
}

async function resolveInputsUntilEndTurn(page: Page): Promise<void> {
  const endTurn = page.locator('[data-testid="action-menu-end-turn"]');
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (await endTurn.isVisible().catch(() => false)) {
      await expect(endTurn).toBeEnabled({ timeout: 5_000 });
      return;
    }

    if (await resolveVisibleInput(page)) {
      continue;
    }

    await page.waitForTimeout(150);
  }

  throw new Error('Timed out resolving post-action inputs until End Turn');
}

async function createStartedTwoPlayerGame(browser: Browser) {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const host = createUser('planet-host');
  const guest = createUser('planet-guest');

  await registerByUi(hostPage, host);
  await registerByUi(guestPage, guest);

  const roomId = await createRoomByUi(hostPage, `Planet Room ${Date.now()}`, 2);
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

  return { hostContext, guestContext, hostPage, guestPage };
}

test.describe('Main action planet targeting', () => {
  test('orbit e2e: move a launched probe to a planet and select the planet through UI', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const { hostContext, guestContext, hostPage, guestPage } =
      await createStartedTwoPlayerGame(browser);

    try {
      const { actor, other } = await waitForActionOwner(
        hostPage,
        guestPage,
        'LAUNCH_PROBE',
      );

      await clickMainAction(actor, 'LAUNCH_PROBE');
      await expect(actor.locator('[data-testid^="solar-probe-"]')).toHaveCount(
        1,
        { timeout: 10_000 },
      );

      await convertEnergyToMovement(actor, 2);
      const { planet } = await moveProbeToFirstReachablePlanet(actor);

      await clickEndTurn(actor);
      await clickPassAndWaitForLogSync(other, actor);
      await expect
        .poll(() => hasEnabledMainAction(actor, 'ORBIT'), { timeout: 20_000 })
        .toBe(true);

      const selectedPlanet = await executePlanetAction(actor, 'ORBIT');
      expect(selectedPlanet).toBe(planet);
      await expectPlanetToken(actor, selectedPlanet, 'Orbit');

      await resolveInputsUntilEndTurn(actor);
      await clickEndTurn(actor);
      await expect(actor.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
      await expect(other.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await hostContext.close().catch(() => undefined);
      await guestContext.close().catch(() => undefined);
    }
  });

  test('land e2e: move a launched probe to a planet and select landing target through UI', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const { hostContext, guestContext, hostPage, guestPage } =
      await createStartedTwoPlayerGame(browser);

    try {
      const { actor, other } = await waitForActionOwner(
        hostPage,
        guestPage,
        'LAUNCH_PROBE',
      );

      await clickMainAction(actor, 'LAUNCH_PROBE');
      await expect(actor.locator('[data-testid^="solar-probe-"]')).toHaveCount(
        1,
        { timeout: 10_000 },
      );

      await convertEnergyToMovement(actor, 2);
      const { planet } = await moveProbeToFirstReachablePlanet(actor);

      await clickEndTurn(actor);
      await advanceRealTurnsUntilActionEnabled(
        actor,
        hostPage,
        guestPage,
        'LAND',
      );

      const selectedPlanet = await executePlanetAction(actor, 'LAND');
      expect(selectedPlanet).toBe(planet);
      await expectPlanetToken(actor, selectedPlanet, 'Landing');

      await resolveInputsUntilEndTurn(actor);
      await clickEndTurn(actor);
      await expect(actor.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
      await expect(other.locator(sel.bottomDashboard)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await hostContext.close().catch(() => undefined);
      await guestContext.close().catch(() => undefined);
    }
  });
});

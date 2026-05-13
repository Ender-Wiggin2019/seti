import { expect, type Page, test } from '@playwright/test';
import {
  clickEndTurn,
  clickMainAction,
  clickPassAndWaitForLogSync,
  createStartedGameByUi,
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
  if (await card.isVisible().catch(() => false)) {
    const section = card.locator('section', { hasText: sectionName });
    await expect(section.locator('[aria-label^="token-"]').first()).toBeVisible(
      {
        timeout: 10_000,
      },
    );
    return;
  }

  const planetLabel = `${planet.charAt(0).toUpperCase()}${planet.slice(1)}`;
  const slotKind = sectionName === 'Orbit' ? 'orbit' : 'planet';
  await expect(
    page.locator(`[title^="${planetLabel} ${slotKind}"]`).first(),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe('Main action planet targeting @actions @real-ui', () => {
  test('orbit e2e: move a launched probe to a planet and select the planet through UI', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const game = await createStartedGameByUi(browser, {
      roomName: `Planet Room ${Date.now()}`,
      userPrefix: 'planet',
    });
    const [hostPage, guestPage] = game.pages;

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
    } finally {
      await game.close();
    }
  });

  test('land e2e: move a launched probe to a planet and select landing target through UI', async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);
    await waitForServerReady(request);

    const game = await createStartedGameByUi(browser, {
      roomName: `Planet Room ${Date.now()}`,
      userPrefix: 'planet',
    });
    const [hostPage, guestPage] = game.pages;

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
    } finally {
      await game.close();
    }
  });
});

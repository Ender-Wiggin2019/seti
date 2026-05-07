import { expect, type Page, test } from '@playwright/test';
import { ALL_CARDS } from '@seti/common/data/index';
import { EResource } from '@seti/common/types/element';
import {
  clickEndTurn,
  clickInputOptionById,
  clickMainAction,
  createStartedGameByUi,
  ECoreAlienType,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const OUMUAMUA_SEED = 'alien-discovery-e2e-1624';
const OUMUAMUA_ALIEN_INDEX = 1;
const CARD_BY_ID = new Map(ALL_CARDS.map((card) => [card.id, card]));

async function openTab(
  page: Page,
  name: 'Board' | 'Aliens' | 'Cards',
): Promise<void> {
  const tab = page.getByRole('tab', { name });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
}

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
  amount: number,
  expectedMovementTotal = amount,
): Promise<void> {
  await expandFreeActions(page);
  const convert = page.locator(sel.freeAction('CONVERT_ENERGY_TO_MOVEMENT'));
  await expect(convert).toBeEnabled({ timeout: 10_000 });
  await convert.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog
    .getByRole('button', { name: new RegExp(`^${amount}\\b.*mov`, 'i') })
    .click();
  await expectMovementTotal(page, expectedMovementTotal);
}

async function expectMovementTotal(
  page: Page,
  expectedMovementTotal: number,
): Promise<void> {
  await expandFreeActions(page);
  await expect(page.locator(sel.freeAction('MOVEMENT'))).toContainText(
    new RegExp(`\\(${expectedMovementTotal}\\)`),
    { timeout: 10_000 },
  );
}

async function playHandCard(page: Page, cardId: string): Promise<void> {
  await clickMainAction(page, 'PLAY_CARD');
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  const card = page.locator(sel.handCard(cardId));
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
}

async function playTraceCard(
  page: Page,
  cardId: string,
  traceSlotId: string,
): Promise<void> {
  await playHandCard(page, cardId);
  await clickInputOptionById(page, traceSlotId);
}

async function prepareOumuamuaDiscoveredGame(
  p1: Page,
  p2: Page,
): Promise<void> {
  await clickMainAction(p1, 'LAUNCH_PROBE');
  await convertEnergyToMovement(p1, 2);
  await moveProbeToFirstReachablePlanet(p1);
  await clickEndTurn(p1);

  await playTraceCard(p2, '75', traceSlotId('red'));
  await clickEndTurn(p2);

  await playHandCard(p1, '12');
  await clickInputOptionById(p1, 'land-venus');
  await clickInputOptionById(p1, traceSlotId('yellow'));
  await clickEndTurn(p1);

  await passAndResolveEndOfRoundPrompt(p2);
  await passAndResolveEndOfRoundPrompt(p1);
  await passAndResolveEndOfRoundPrompt(p2);

  await playHandCard(p1, '37');
  await expect.poll(() => dataPoolCount(p1), { timeout: 15_000 }).toBe(4);
  await useDataCardCorner(p1, '118');
  await useDataCardCorner(p1, '95');
  await expect.poll(() => dataPoolCount(p1), { timeout: 15_000 }).toBe(6);
  await placeDataInTopSlots(p1, 6);
  await clickEndTurn(p1);

  await clickMainAction(p1, 'ANALYZE_DATA');
  await clickInputOptionById(p1, traceSlotId('blue'));
  await clickEndTurn(p1);
  await expectOumuamuaDiscovered(p1);
  await expectOumuamuaDiscovered(p2);

  await expect(p1.locator(sel.actionMenu('SCAN'))).toBeEnabled({
    timeout: 20_000,
  });
}

function traceSlotId(color: 'red' | 'yellow' | 'blue'): string {
  return `alien-${OUMUAMUA_ALIEN_INDEX}-discovery-${color}-trace`;
}

async function firstProbeSpaceId(page: Page): Promise<string> {
  const probe = page.locator('[data-testid^="solar-probe-"]').first();
  await expect(probe).toBeVisible({ timeout: 10_000 });
  const spaceId = await probe.getAttribute('data-space-id');
  expect(spaceId).toBeTruthy();
  return spaceId as string;
}

async function moveProbeToFirstReachablePlanet(page: Page): Promise<void> {
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

  const targetSpaceTestId = await planetTarget.getAttribute('data-testid');
  expect(targetSpaceTestId).toBeTruthy();
  await planetTarget.click();

  const targetSpaceId = targetSpaceTestId?.replace('solar-space-', '');
  expect(targetSpaceId).toBeTruthy();
  await expect
    .poll(async () => firstProbeSpaceId(page), { timeout: 15_000 })
    .toBe(targetSpaceId);
}

async function passAndResolveEndOfRoundPrompt(page: Page): Promise<void> {
  await clickMainAction(page, 'PASS');
  await waitForAndResolveCardPrompt(page, 15_000);
}

async function dataPoolCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="data-pool-view"] .readout')
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function useDataCardCorner(page: Page, cardId: string): Promise<void> {
  const card = CARD_BY_ID.get(cardId);
  expect(
    card?.freeAction?.some(
      (reward) => reward.type === EResource.DATA && reward.value > 0,
    ),
  ).toBe(true);

  await expandFreeActions(page);
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  await expect(corner).toBeEnabled({ timeout: 10_000 });
  const dataBefore = await dataPoolCount(page);
  await corner.click();
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  await page.locator(sel.handCard(cardId)).click();
  await expect
    .poll(() => dataPoolCount(page), { timeout: 15_000 })
    .toBe(dataBefore + 1);
}

async function placeDataInTopSlots(page: Page, count: number): Promise<void> {
  for (let slotIndex = 0; slotIndex < count; slotIndex += 1) {
    const poolBefore = await dataPoolCount(page);
    const slot = page.locator(sel.computerSlotTop(slotIndex));
    await expect(slot).toBeEnabled({ timeout: 10_000 });
    await slot.click();
    await expect
      .poll(() => dataPoolCount(page), { timeout: 15_000 })
      .toBe(poolBefore - 1);
    await waitForAndResolveCardPrompt(page, 2_000);
    await expect(slot).toBeDisabled({ timeout: 10_000 });
  }
}

async function playFirstOumuamuaCard(page: Page): Promise<string> {
  await clickMainAction(page, 'PLAY_CARD');
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  const preferredCardIds = [
    'ET.29',
    'ET.26',
    'ET.23',
    'ET.30',
    'ET.25',
    'ET.27',
    'ET.21',
    'ET.22',
    'ET.28',
    'ET.24',
  ];
  for (const cardId of preferredCardIds) {
    const preferred = page.locator(sel.handCard(cardId));
    if (await preferred.isVisible().catch(() => false)) {
      await preferred.click();
      return cardId;
    }
  }

  const card = page.locator('[data-testid^="hand-card-ET."]').first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  const testId = await card.getAttribute('data-testid');
  expect(testId).toBeTruthy();
  await card.click();
  return (testId as string).replace('hand-card-', '');
}

async function resolveOumuamuaTilePromptIfVisible(page: Page): Promise<void> {
  const option = page.locator(sel.inputOption('oumuamua-tile'));
  if (await option.isVisible().catch(() => false)) {
    await option.click();
    return;
  }

  await waitForAndResolveCardPrompt(page, 2_000);
}

async function resolveCardPromptFullyIfVisible(
  page: Page,
  timeoutMs = 8_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const scopedPrompt = page.locator('[data-testid="bottom-actions"]');

  while (Date.now() < deadline) {
    const cards = scopedPrompt.locator(
      '[data-testid^="input-eor-card-"], [data-testid^="hand-card-"], [data-testid^="select-card-"]',
    );
    if (
      !(await cards
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await page.waitForTimeout(150);
      continue;
    }

    const confirm = scopedPrompt.getByRole('button', { name: /^confirm$/i });
    const count = await cards.count();
    for (let index = 0; index < count; index += 1) {
      if (
        (await confirm.isVisible().catch(() => false)) &&
        (await confirm.isEnabled().catch(() => false))
      ) {
        await confirm.click();
        return true;
      }

      const card = cards.nth(index);
      if (await card.isVisible().catch(() => false)) {
        await card.click();
        await page.waitForTimeout(100);
      }
    }

    if (await confirm.isVisible().catch(() => false)) {
      await expect(confirm).toBeEnabled({ timeout: 5_000 });
      await confirm.click();
    }
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

    const oumuamuaTile = page.locator(sel.inputOption('oumuamua-tile'));
    if (await oumuamuaTile.isVisible().catch(() => false)) {
      await oumuamuaTile.click();
      continue;
    }

    const option = page
      .locator(
        '[data-testid^="input-option-"]:not([data-testid="input-option-done"])',
      )
      .first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      continue;
    }

    if (await resolveCardPromptFullyIfVisible(page, 300)) {
      continue;
    }

    const done = page.locator(sel.inputOption('done'));
    if (await done.isVisible().catch(() => false)) {
      await done.click();
      continue;
    }

    await page.waitForTimeout(150);
  }

  throw new Error('Timed out resolving post-action inputs until End Turn');
}

async function expectOumuamuaDiscovered(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page.getByTestId(`alien-${OUMUAMUA_ALIEN_INDEX}-oumuamua-board`),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByTestId(`alien-${OUMUAMUA_ALIEN_INDEX}-hidden-board`),
  ).toHaveCount(0);
  await openTab(page, 'Board');
  await expect(page.getByTestId('solar-oumuamua-data-list')).toBeVisible({
    timeout: 10_000,
  });
}

async function expectOumuamuaTileMarkers(
  page: Page,
  count: number,
): Promise<void> {
  await openTab(page, 'Board');
  await expect
    .poll(
      async () =>
        page
          .locator('[data-testid^="solar-oumuamua-data-slot-"]')
          .evaluateAll(
            (slots) =>
              slots.filter(
                (slot) => slot.getAttribute('data-signal-type') === 'player',
              ).length,
          ),
      { timeout: 10_000 },
    )
    .toBe(count);
}

async function moveProbeToOumuamua(page: Page): Promise<void> {
  await openTab(page, 'Board');
  await expandFreeActions(page);
  const movement = page.locator(sel.freeAction('MOVEMENT'));
  await expect(movement).toBeEnabled({ timeout: 10_000 });
  await movement.click();

  const target = page.locator('button[data-planet="oumuamua"]').first();
  await expect(target.locator('[data-reachable-indicator="true"]')).toBeVisible(
    { timeout: 10_000 },
  );
  const targetTestId = await target.getAttribute('data-testid');
  expect(targetTestId).toBeTruthy();
  const targetSpaceId = targetTestId?.replace('solar-space-', '');
  expect(targetSpaceId).toBeTruthy();
  await target.click();

  await expect
    .poll(
      async () =>
        page
          .locator(
            `[data-testid^="solar-probe-"][data-space-id="${targetSpaceId}"]`,
          )
          .count(),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);
}

async function chooseCardRowCardForSector(
  page: Page,
  sectorColor: string,
): Promise<string> {
  await openTab(page, 'Cards');
  await expect(page.locator('[data-testid^="card-row-"]').first()).toBeVisible({
    timeout: 10_000,
  });
  const cardIds = await page
    .locator('[data-testid^="card-row-"]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute('data-testid') ?? '')
        .map((testId) => testId.replace(/^card-row-/, ''))
        .filter(Boolean),
    );
  const cardId = cardIds.find(
    (candidate) => CARD_BY_ID.get(candidate)?.sector === sectorColor,
  );
  expect(
    cardId,
    `Expected card row to contain a ${sectorColor} card for Oumuamua scan`,
  ).toBeTruthy();
  await page.locator(sel.cardRow(cardId as string)).click();
  return cardId as string;
}

async function visibleCardRowIds(page: Page): Promise<string[]> {
  await openTab(page, 'Cards');
  await expect(page.locator('[data-testid^="card-row-"]').first()).toBeVisible({
    timeout: 10_000,
  });
  return page.locator('[data-testid^="card-row-"]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute('data-testid') ?? '')
      .map((testId) => testId.replace(/^card-row-/, ''))
      .filter(Boolean),
  );
}

async function buyCardRowCard(page: Page, cardId: string): Promise<void> {
  await expandFreeActions(page);
  const buy = page.locator(sel.freeAction('BUY_CARD'));
  await expect(buy).toBeVisible({ timeout: 10_000 });
  await expect(buy).toBeEnabled({ timeout: 10_000 });
  await buy.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^buy from row$/i })
    .click();
  await openTab(page, 'Cards');
  await page.locator(sel.cardRow(cardId)).click();
  await expect(page.locator(sel.cardRow(cardId))).toHaveCount(0, {
    timeout: 10_000,
  });
}

async function ensureCardRowHasSectorCard(
  page: Page,
  sectorColor: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cardIds = await visibleCardRowIds(page);
    if (
      cardIds.some((cardId) => CARD_BY_ID.get(cardId)?.sector === sectorColor)
    ) {
      return;
    }

    const refillCandidate = cardIds[0];
    expect(
      refillCandidate,
      'Expected at least one card row card to buy',
    ).toBeTruthy();
    await buyCardRowCard(page, refillCandidate as string);
  }

  const cardIds = await visibleCardRowIds(page);
  expect(
    cardIds.find((cardId) => CARD_BY_ID.get(cardId)?.sector === sectorColor),
    `Expected card row to refill a ${sectorColor} card for Oumuamua scan`,
  ).toBeTruthy();
}

async function markOumuamuaTileThroughScan(page: Page): Promise<void> {
  const { sectorId, sectorColor } = await getOumuamuaSectorInfo(page);
  const markersBefore = await oumuamuaTileMarkerCount(page);
  await ensureCardRowHasSectorCard(page, sectorColor);

  await clickMainAction(page, 'SCAN');
  await clickInputOptionById(page, 'mark-earth');
  const tileOption = page.locator(sel.inputOption('oumuamua-tile'));
  if (await tileOption.isVisible().catch(() => false)) {
    await tileOption.click();
    await clickInputOptionById(page, 'done');
    await expectOumuamuaTileMarkers(page, markersBefore + 1);
    return;
  }

  await clickInputOptionById(page, 'mark-card-row');
  await chooseCardRowCardForSector(page, sectorColor);
  await clickInputOptionById(page, sectorId);
  await clickInputOptionById(page, 'oumuamua-tile');
  const done = page.locator(sel.inputOption('done'));
  if (await done.isVisible().catch(() => false)) {
    await done.click();
  } else {
    await expect(
      page.locator('[data-testid="action-menu-end-turn"]'),
    ).toBeVisible({ timeout: 10_000 });
  }
  await expectOumuamuaTileMarkers(page, markersBefore + 1);
}

async function oumuamuaTileMarkerCount(page: Page): Promise<number> {
  await openTab(page, 'Board');
  return page
    .locator('[data-testid^="solar-oumuamua-data-slot-"]')
    .evaluateAll(
      (slots) =>
        slots.filter(
          (slot) => slot.getAttribute('data-signal-type') === 'player',
        ).length,
    );
}

async function getOumuamuaSectorInfo(
  page: Page,
): Promise<{ sectorId: string; sectorColor: string }> {
  await openTab(page, 'Board');
  const dataList = page.getByTestId('solar-oumuamua-data-list');
  await expect(dataList).toBeVisible({ timeout: 10_000 });
  const sectorId = await dataList.getAttribute('data-sector-id');
  expect(sectorId).toBeTruthy();

  const sectorButton = page
    .getByLabel(new RegExp(`\\(${sectorId}\\) sector$`))
    .first();
  await expect(sectorButton).toBeAttached({ timeout: 10_000 });
  const ariaLabel = await sectorButton.getAttribute('aria-label');
  const sectorColor = ariaLabel
    ?.replace(/^Mark\s+/, '')
    .replace(/\s+\(.+$/, '');
  expect(sectorColor).toBeTruthy();
  return { sectorId: sectorId as string, sectorColor: sectorColor as string };
}

async function hasEnabledMainAction(
  page: Page,
  actionType: string,
): Promise<boolean> {
  const action = page.locator(sel.actionMenu(actionType));
  if (!(await action.isVisible().catch(() => false))) {
    return false;
  }
  return action.isEnabled().catch(() => false);
}

async function passAndResolveVisiblePrompts(
  actor: Page,
  other: Page,
): Promise<void> {
  await clickMainAction(actor, 'PASS');
  await Promise.all([
    resolveCardPromptFullyIfVisible(actor, 5_000),
    resolveCardPromptFullyIfVisible(other, 5_000),
  ]);
}

async function advanceUntilActionEnabled(
  target: Page,
  other: Page,
  actionType: string,
  maxPasses = 8,
): Promise<void> {
  let passCount = 0;
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline && passCount < maxPasses) {
    await Promise.all([
      resolveCardPromptFullyIfVisible(target, 300),
      resolveCardPromptFullyIfVisible(other, 300),
    ]);

    if (await hasEnabledMainAction(target, actionType)) {
      return;
    }

    if (await hasEnabledMainAction(target, 'PASS')) {
      await passAndResolveVisiblePrompts(target, other);
      passCount += 1;
      continue;
    }

    if (await hasEnabledMainAction(other, 'PASS')) {
      await passAndResolveVisiblePrompts(other, target);
      passCount += 1;
      continue;
    }

    await target.waitForTimeout(250);
  }

  throw new Error(
    `Timed out advancing turns until target page enabled ${actionType}`,
  );
}

async function launchAndMoveProbeToOumuamua(
  actor: Page,
  other: Page,
  nextAction: 'ORBIT' | 'LAND',
): Promise<void> {
  await advanceUntilActionEnabled(actor, other, 'LAUNCH_PROBE');
  await clickMainAction(actor, 'LAUNCH_PROBE');
  await clickEndTurn(actor);
  await advanceUntilActionEnabled(actor, other, 'PASS');
  await convertEnergyToMovement(actor, 4, 4);
  await moveProbeToOumuamua(actor);
  await expect(actor.locator(sel.actionMenu(nextAction))).toBeEnabled({
    timeout: 10_000,
  });
}

async function selectOumuamuaForMainAction(
  page: Page,
  action: 'ORBIT' | 'LAND',
): Promise<void> {
  await clickMainAction(page, action);
  await openTab(page, 'Aliens');
  const target = page.getByTestId('planet-target-oumuamua');
  await expect(target).toBeVisible({ timeout: 10_000 });
  await expect(target).toBeEnabled({ timeout: 10_000 });
  await target.click();
}

test.describe('Oumuamua real UI smoke @actions @real-ui @slow', () => {
  test('scan/card e2e: discovered Oumuamua tile can be marked through real Scan UI, then an Oumuamua card is played', async ({
    browser,
    request,
  }) => {
    test.setTimeout(360_000);
    await waitForServerReady(request);

    const game = await createStartedGameByUi(browser, {
      roomName: `Oumuamua Scan ${Date.now()}`,
      userPrefix: 'oumuamua-scan',
      roomOptions: {
        alienTypes: [ECoreAlienType.OUMUAMUA, ECoreAlienType.ANOMALIES],
        seed: OUMUAMUA_SEED,
      },
    });
    const [p1, p2] = game.pages;

    try {
      await prepareOumuamuaDiscoveredGame(p1, p2);

      await markOumuamuaTileThroughScan(p1);
      await clickEndTurn(p1);
      await advanceUntilActionEnabled(p2, p1, 'PLAY_CARD');

      await playFirstOumuamuaCard(p2);
      await resolveOumuamuaTilePromptIfVisible(p2);
      await resolveInputsUntilEndTurn(p2);
    } finally {
      await game.close();
    }
  });

  test('orbit e2e: launched probe moves to Oumuamua and orbits through the Aliens board target', async ({
    browser,
    request,
  }) => {
    test.setTimeout(360_000);
    await waitForServerReady(request);

    const game = await createStartedGameByUi(browser, {
      roomName: `Oumuamua Orbit ${Date.now()}`,
      userPrefix: 'oumuamua-orbit',
      roomOptions: {
        alienTypes: [ECoreAlienType.OUMUAMUA, ECoreAlienType.ANOMALIES],
        seed: OUMUAMUA_SEED,
      },
    });
    const [p1, p2] = game.pages;

    try {
      await prepareOumuamuaDiscoveredGame(p1, p2);

      await launchAndMoveProbeToOumuamua(p2, p1, 'ORBIT');
      await selectOumuamuaForMainAction(p2, 'ORBIT');

      await openTab(p2, 'Aliens');
      await expect(
        p2
          .getByTestId(`alien-${OUMUAMUA_ALIEN_INDEX}-oumuamua-orbit-area`)
          .locator('[aria-label^="oumuamua-orbit-"]'),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await game.close();
    }
  });

  test('land e2e: launched probe moves to Oumuamua and lands through the Aliens board target', async ({
    browser,
    request,
  }) => {
    test.setTimeout(360_000);
    await waitForServerReady(request);

    const game = await createStartedGameByUi(browser, {
      roomName: `Oumuamua Land ${Date.now()}`,
      userPrefix: 'oumuamua-land',
      roomOptions: {
        alienTypes: [ECoreAlienType.OUMUAMUA, ECoreAlienType.ANOMALIES],
        seed: OUMUAMUA_SEED,
      },
    });
    const [p1, p2] = game.pages;

    try {
      await prepareOumuamuaDiscoveredGame(p1, p2);

      await launchAndMoveProbeToOumuamua(p2, p1, 'LAND');
      await selectOumuamuaForMainAction(p2, 'LAND');

      await openTab(p2, 'Aliens');
      await expect(
        p2
          .getByTestId(`alien-${OUMUAMUA_ALIEN_INDEX}-oumuamua-landing-cells`)
          .locator('[aria-label^="oumuamua-landing-"]'),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await game.close();
    }
  });
});

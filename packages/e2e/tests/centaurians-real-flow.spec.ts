import { expect, type Page, test } from '@playwright/test';
import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import {
  clickEndTurn,
  clickInputOptionById,
  clickMainAction,
  createRoomByUi,
  createUser,
  enterGameByUi,
  ECoreAlienType,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  resolveScanSubActions,
  waitForActionOwner,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const CENTAURIANS_SEED = 'alien-discovery-e2e-1624';
const CENTAURIANS_ALIEN_INDEX = 1;
const BASE_CARD_BY_ID = new Map(baseCards.map((card) => [card.id, card]));

function traceSlotId(color: 'red' | 'yellow' | 'blue'): string {
  return `alien-${CENTAURIANS_ALIEN_INDEX}-discovery-${color}-trace`;
}

async function openTab(page: Page, name: 'Board' | 'Aliens'): Promise<void> {
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

async function convertEnergyToMovement(page: Page, amount: 2): Promise<void> {
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

async function dataPoolCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="data-pool-view"] .readout')
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function resourceValue(
  page: Page,
  resourceId: 'score' | 'energy',
): Promise<number> {
  const text = await page
    .locator(`[data-testid="resource-${resourceId}"] .readout`)
    .textContent();
  return Number(text?.match(/-?\d+/)?.[0] ?? 0);
}

async function useDataCardCorner(page: Page, cardId: string): Promise<void> {
  const card = BASE_CARD_BY_ID.get(cardId);
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

async function useScoreCardCorner(page: Page, cardId: string): Promise<void> {
  await expandFreeActions(page);
  const corner = page.locator(sel.freeAction('USE_CARD_CORNER'));
  await expect(corner).toBeEnabled({ timeout: 10_000 });
  const scoreBefore = await resourceValue(page, 'score');
  await corner.click();
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  await page.locator(sel.handCard(cardId)).click();
  await expect
    .poll(() => resourceValue(page, 'score'), { timeout: 15_000 })
    .toBe(scoreBefore + 1);
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

async function passAndResolveEndOfRoundPrompt(page: Page): Promise<void> {
  await clickMainAction(page, 'PASS');
  await waitForAndResolveCardPrompt(page, 15_000);
}

async function expectTraceOccupant(page: Page, slotId: string): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(page.getByTestId(`trace-slot-${slotId}-occupant-0`)).toBeVisible(
    { timeout: 10_000 },
  );
}

async function expectCentauriansDiscovered(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page.getByTestId(
      `alien-${CENTAURIANS_ALIEN_INDEX}-centaurians-board`,
    ),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId(`alien-${CENTAURIANS_ALIEN_INDEX}-hidden-board`),
  ).toHaveCount(0);
  await expect(
    page.getByTestId(`alien-${CENTAURIANS_ALIEN_INDEX}-deck-panel`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByTestId(`alien-${CENTAURIANS_ALIEN_INDEX}-deck-face-up-card`),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator(
      `[data-testid^="alien-${CENTAURIANS_ALIEN_INDEX}-centaurians-message-"]`,
    ),
  ).toHaveCount(2, { timeout: 10_000 });
  await expect(
    page.getByTestId(
      `alien-${CENTAURIANS_ALIEN_INDEX}-centaurians-reward-score-8`,
    ),
  ).toContainText('open');
}

async function playFirstCentaurianMessage(page: Page): Promise<void> {
  const energyBefore = await resourceValue(page, 'energy');
  await playHandCard(page, 'ET.31');
  await expect.poll(() => resourceValue(page, 'energy')).toBeLessThan(
    energyBefore,
  );
}

async function researchProbeTech(page: Page): Promise<void> {
  await clickMainAction(page, 'RESEARCH_TECH');
  const probeStack = page.locator(sel.techStack('probe-tech', 0));
  await expect(probeStack).toBeVisible({ timeout: 10_000 });
  await expect(probeStack).toHaveAttribute('role', 'button', {
    timeout: 10_000,
  });
  await probeStack.click();
  await expect(page.locator('[data-testid="action-menu-end-turn"]')).toBeVisible(
    { timeout: 10_000 },
  );
}

async function playCard61(page: Page): Promise<void> {
  await playHandCard(page, '61');
  await page.locator(sel.techStack('computer-tech', 0)).click();
  await clickInputOptionById(page, 'col-0');
}

async function scanThroughCardRow(
  page: Page,
  expectedCardId: string,
  sectorId: string,
  traceSlotId?: string,
): Promise<void> {
  await clickMainAction(page, 'SCAN');
  await clickInputOptionById(page, 'mark-earth');
  await clickInputOptionById(page, 'mark-card-row');
  await page.locator(sel.inputSelectCard(expectedCardId)).click();
  await page
    .locator('[data-testid="bottom-actions"]')
    .getByRole('button', { name: /^confirm$/i })
    .click();
  await clickInputOptionById(page, sectorId);
  if (traceSlotId) {
    await clickInputOptionById(page, traceSlotId);
  }
  await resolveScanSubActions(page, 5);
  await expect(page.locator('[data-testid="action-menu-end-turn"]')).toBeVisible(
    { timeout: 10_000 },
  );
}

async function buyRowCard(page: Page, cardId: string): Promise<void> {
  await expandFreeActions(page);
  const buy = page.locator(sel.freeAction('BUY_CARD'));
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

async function endTurnAndClaimCentauriansScoreReward(
  page: Page,
): Promise<void> {
  await clickEndTurn(page);
  await clickInputOptionById(page, 'claim-centaurians:score-8');
}

async function expectCentauriansScoreRewardClaimed(
  page: Page,
): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page.getByTestId(
      `alien-${CENTAURIANS_ALIEN_INDEX}-centaurians-reward-score-8`,
    ),
  ).not.toContainText('open', { timeout: 10_000 });
}

async function expectPendingCentaurianMessage(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page
      .locator(
        `[data-testid^="alien-${CENTAURIANS_ALIEN_INDEX}-centaurians-message-"]`,
      )
      .filter({ hasText: /\/ 1\b/ })
      .first(),
  ).toBeVisible({ timeout: 10_000 });
}

test('@slow @real-ui centaurians e2e: real UI discovers Centaurians, queues a message milestone, and claims a reward', async ({
  browser,
  request,
}) => {
  test.setTimeout(600_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('centaurians-host');
  const guest = createUser('centaurians-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Centaurians Room ${Date.now()}`,
      2,
      {
        alienTypes: [ECoreAlienType.ANOMALIES, ECoreAlienType.CENTAURIANS],
        seed: CENTAURIANS_SEED,
      },
    );
    await joinRoomByUi(guestPage, roomId);

    const hostGameId = await launchGameByUi(hostPage, roomId);
    const guestGameId = await enterGameByUi(guestPage, roomId);
    expect(guestGameId).toBe(hostGameId);

    const { actor: p1Page, other: p2Page } = await waitForActionOwner(
      hostPage,
      guestPage,
      'LAUNCH_PROBE',
      20_000,
    );

    await clickMainAction(p1Page, 'LAUNCH_PROBE');
    await convertEnergyToMovement(p1Page, 2);
    await moveProbeToFirstReachablePlanet(p1Page);
    await clickEndTurn(p1Page);

    await playHandCard(p2Page, '75');
    await clickInputOptionById(p2Page, traceSlotId('red'));
    await expectTraceOccupant(p2Page, traceSlotId('red'));
    await clickEndTurn(p2Page);

    await playHandCard(p1Page, '12');
    await clickInputOptionById(p1Page, 'land-venus');
    await clickInputOptionById(p1Page, traceSlotId('yellow'));
    await expectTraceOccupant(p1Page, traceSlotId('yellow'));
    await clickEndTurn(p1Page);

    await passAndResolveEndOfRoundPrompt(p2Page);
    await passAndResolveEndOfRoundPrompt(p1Page);
    await passAndResolveEndOfRoundPrompt(p2Page);

    await playHandCard(p1Page, '37');
    await expect.poll(() => dataPoolCount(p1Page), { timeout: 15_000 }).toBe(4);
    await useDataCardCorner(p1Page, '118');
    await useDataCardCorner(p1Page, '95');
    await expect.poll(() => dataPoolCount(p1Page), { timeout: 15_000 }).toBe(6);
    await placeDataInTopSlots(p1Page, 6);
    await clickEndTurn(p1Page);

    await clickMainAction(p1Page, 'ANALYZE_DATA');
    await clickInputOptionById(p1Page, traceSlotId('blue'));
    await expectTraceOccupant(p1Page, traceSlotId('blue'));
    await clickEndTurn(p1Page);

    await expectCentauriansDiscovered(p1Page);
    await expectCentauriansDiscovered(p2Page);

    await expect(p1Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playFirstCentaurianMessage(p1Page);
    await expectPendingCentaurianMessage(p1Page);
    await expectPendingCentaurianMessage(p2Page);

    await clickEndTurn(p1Page);
    await passAndResolveEndOfRoundPrompt(p1Page);

    await researchProbeTech(p1Page);
    await clickEndTurn(p1Page);

    let { actor: scoreMilestonePage } = await waitForActionOwner(
      p1Page,
      p2Page,
      'PLAY_CARD',
      20_000,
    );
    await playCard61(scoreMilestonePage);
    await clickEndTurn(scoreMilestonePage);

    const { actor: passPage } = await waitForActionOwner(
      p1Page,
      p2Page,
      'PASS',
      20_000,
    );
    await passAndResolveEndOfRoundPrompt(passPage);

    ({ actor: scoreMilestonePage } = await waitForActionOwner(
      p1Page,
      p2Page,
      'SCAN',
      20_000,
    ));
    await scanThroughCardRow(scoreMilestonePage, '25', 'sector-1');
    await clickEndTurn(scoreMilestonePage);

    ({ actor: scoreMilestonePage } = await waitForActionOwner(
      p1Page,
      p2Page,
      'SCAN',
      20_000,
    ));
    await scanThroughCardRow(scoreMilestonePage, 'SE EN 02', 'sector-0');
    await clickEndTurn(scoreMilestonePage);

    ({ actor: scoreMilestonePage } = await waitForActionOwner(
      p1Page,
      p2Page,
      'SCAN',
      20_000,
    ));
    await scanThroughCardRow(
      scoreMilestonePage,
      '85',
      'sector-1',
      'alien-0-discovery-red-trace',
    );
    await clickEndTurn(scoreMilestonePage);

    await buyRowCard(scoreMilestonePage, '32');
    await playHandCard(scoreMilestonePage, '32');
    await useScoreCardCorner(scoreMilestonePage, 'ET.32');
    await endTurnAndClaimCentauriansScoreReward(scoreMilestonePage);

    await expectCentauriansScoreRewardClaimed(p1Page);
    await expectCentauriansScoreRewardClaimed(p2Page);
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

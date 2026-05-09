import { expect, type Page, test } from '@playwright/test';
import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import {
  clickEndTurn,
  clickInputOptionById,
  clickMainAction,
  createStartedGameByUi,
  ECoreAlienType,
  waitForActionOwner,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const DISCOVERY_SEED = 'alien-discovery-e2e-1624';
const TARGET_ALIEN_INDEX = 1;
const BASE_CARD_BY_ID = new Map(baseCards.map((card) => [card.id, card]));

const ALIEN_SETTLEMENT_CASES = [
  {
    name: 'Mascamites',
    roomPrefix: 'mascamites-settlement',
    alienTypes: [ECoreAlienType.ANOMALIES, ECoreAlienType.MASCAMITES] as const,
    expectSettlement: expectMascamitesSettlement,
  },
  {
    name: 'Exertians',
    roomPrefix: 'exertians-settlement',
    alienTypes: [ECoreAlienType.ANOMALIES, ECoreAlienType.EXERTIANS] as const,
    expectSettlement: expectExertiansSettlement,
  },
] as const;

function traceSlotId(color: 'red' | 'yellow' | 'blue'): string {
  return `alien-${TARGET_ALIEN_INDEX}-discovery-${color}-trace`;
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

async function discoverTargetAlien(p1Page: Page, p2Page: Page): Promise<void> {
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
}

async function expectMascamitesSettlement(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-mascamites-board`),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-hidden-board`),
  ).toHaveCount(0);
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-mascamites-jupiter`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-mascamites-saturn`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-mascamites-public`),
  ).toBeVisible();
  await expectTraceColumns(page, 'mascamites-trace');
}

async function expectExertiansSettlement(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-exertians-board`),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-hidden-board`),
  ).toHaveCount(0);
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-exertians-milestone-0`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-exertians-milestone-1`),
  ).toBeVisible();
  await expectTraceColumns(page, 'exertians-trace');
}

async function expectTraceColumns(page: Page, area: string): Promise<void> {
  for (const color of ['red-trace', 'yellow-trace', 'blue-trace']) {
    await expect(
      page.getByTestId(`alien-${TARGET_ALIEN_INDEX}-${area}-column-${color}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(
        `alien-${TARGET_ALIEN_INDEX}-${area}-column-${color}-slots`,
      ),
    ).toBeVisible();
  }
}

test.describe('Alien settlement real UI @real-ui @slow', () => {
  for (const alienCase of ALIEN_SETTLEMENT_CASES) {
    test(`discovers ${alienCase.name} and renders its settlement board through real UI`, async ({
      browser,
      request,
    }) => {
      test.setTimeout(420_000);
      await waitForServerReady(request);

      const game = await createStartedGameByUi(browser, {
        roomName: `${alienCase.name} Settlement ${Date.now()}`,
        userPrefix: alienCase.roomPrefix,
        roomOptions: {
          alienTypes: alienCase.alienTypes,
          seed: DISCOVERY_SEED,
        },
      });
      const [hostPage, guestPage] = game.pages;

      try {
        const { actor: p1Page, other: p2Page } = await waitForActionOwner(
          hostPage,
          guestPage,
          'LAUNCH_PROBE',
          20_000,
        );

        await discoverTargetAlien(p1Page, p2Page);
        await alienCase.expectSettlement(p1Page);
        await alienCase.expectSettlement(p2Page);
      } finally {
        await game.close();
      }
    });
  }
});

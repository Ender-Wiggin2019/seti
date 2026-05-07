import {
  expect,
  type Locator,
  type Page,
  test,
  type TestInfo,
} from '@playwright/test';
import { baseCards } from '@seti/common/data/baseCards';
import { EResource } from '@seti/common/types/element';
import {
  clickEndTurn,
  clickInputOptionById,
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

const DISCOVERY_SEED = 'alien-discovery-e2e-1624';

const BASE_CARD_BY_ID = new Map(baseCards.map((card) => [card.id, card]));

async function collapseHandIfExpanded(page: Page): Promise<void> {
  const dock = page.getByTestId('hand-dock');
  const expanded = await dock.getAttribute('data-expanded').catch(() => null);
  if (expanded !== 'true') return;

  const toggle = page.getByTestId('hand-dock-toggle');
  if (!(await toggle.isEnabled().catch(() => false))) return;

  await toggle.click();
  await expect(dock).toHaveAttribute('data-expanded', 'false', {
    timeout: 5_000,
  });
}

async function attachScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  anchor?: Locator,
): Promise<void> {
  await collapseHandIfExpanded(page);
  await anchor?.scrollIntoViewIfNeeded().catch(() => undefined);
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
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

async function moveProbeToFirstReachablePlanet(page: Page): Promise<string> {
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

  return targetSpaceId as string;
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

async function expandedAnomaliesHandCardCount(page: Page): Promise<number> {
  await expect(page.locator('[data-testid="hand-dock"]')).toHaveAttribute(
    'data-expanded',
    'true',
    { timeout: 10_000 },
  );
  return page.locator('[data-testid^="hand-card-ET."]').count();
}

async function playFloodingTheMediaSpaceAndExpectDraw(
  page: Page,
): Promise<void> {
  await clickMainAction(page, 'PLAY_CARD');
  const anomalyCardsBefore = await expandedAnomaliesHandCardCount(page);
  expect(anomalyCardsBefore).toBeGreaterThanOrEqual(1);

  const card = page.locator(sel.handCard('ET.16'));
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  await expect
    .poll(() => page.locator('[data-testid^="hand-card-ET."]').count(), {
      timeout: 15_000,
    })
    .toBe(anomalyCardsBefore + 2);
}

async function dataPoolCount(page: Page): Promise<number> {
  const text = await page
    .locator('[data-testid="data-pool-view"] .readout')
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

async function resourceValue(
  page: Page,
  resourceId: 'publicity' | 'score',
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

async function expectAnomaliesDiscovered(page: Page): Promise<void> {
  await openTab(page, 'Aliens');
  await expect(page.getByTestId('alien-0-anomalies-board')).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId('alien-0-hidden-board')).toHaveCount(0);
  await expect(page.getByTestId('alien-0-deck-panel')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('alien-0-deck-face-up-card')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByTestId('alien-0-anomaly-column-red-trace'),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByTestId('alien-0-anomaly-column-yellow-trace'),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByTestId('alien-0-anomaly-column-blue-trace'),
  ).toBeVisible({ timeout: 10_000 });

  await openTab(page, 'Board');
  await expect(
    page.locator('[data-testid^="solar-alien-token-1-"]'),
  ).toHaveCount(3, { timeout: 10_000 });
}

test('@slow @real-ui alien discovery e2e: real UI marks traces, reveals Anomalies, and applies alien rules', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(420_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('alien-discovery-host');
  const guest = createUser('alien-discovery-guest');

  try {
    await registerByUi(hostPage, host);
    await registerByUi(guestPage, guest);

    const roomId = await createRoomByUi(
      hostPage,
      `Alien Discovery Room ${Date.now()}`,
      2,
      { seed: DISCOVERY_SEED },
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

    await expect(p2Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playHandCard(p2Page, '75');
    const p2PublicityBeforeRedTrace = await resourceValue(p2Page, 'publicity');
    await clickInputOptionById(p2Page, 'alien-0-discovery-red-trace');
    await expect
      .poll(() => resourceValue(p2Page, 'publicity'), { timeout: 15_000 })
      .toBe(p2PublicityBeforeRedTrace + 1);
    await expectTraceOccupant(p2Page, 'alien-0-discovery-red-trace');
    await attachScreenshot(
      p2Page,
      testInfo,
      '01-red-trace-marked',
      p2Page.getByTestId('trace-slot-alien-0-discovery-red-trace-occupant-0'),
    );
    await clickEndTurn(p2Page);

    await expect(p1Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playHandCard(p1Page, '12');
    await clickInputOptionById(p1Page, 'land-venus');
    const p1PublicityBeforeYellowTrace = await resourceValue(
      p1Page,
      'publicity',
    );
    await clickInputOptionById(p1Page, 'alien-0-discovery-yellow-trace');
    await expect
      .poll(() => resourceValue(p1Page, 'publicity'), { timeout: 15_000 })
      .toBe(p1PublicityBeforeYellowTrace + 1);
    await expectTraceOccupant(p1Page, 'alien-0-discovery-yellow-trace');
    await attachScreenshot(
      p1Page,
      testInfo,
      '02-yellow-trace-marked',
      p1Page.getByTestId(
        'trace-slot-alien-0-discovery-yellow-trace-occupant-0',
      ),
    );
    await clickEndTurn(p1Page);

    await passAndResolveEndOfRoundPrompt(p2Page);
    await expect(p1Page.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });
    await passAndResolveEndOfRoundPrompt(p1Page);
    await expect(p2Page.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });
    await passAndResolveEndOfRoundPrompt(p2Page);

    await expect(p1Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playHandCard(p1Page, '37');
    await expect.poll(() => dataPoolCount(p1Page), { timeout: 15_000 }).toBe(4);

    await useDataCardCorner(p1Page, '118');
    await useDataCardCorner(p1Page, '95');
    await expect.poll(() => dataPoolCount(p1Page), { timeout: 15_000 }).toBe(6);
    await placeDataInTopSlots(p1Page, 6);
    await attachScreenshot(
      p1Page,
      testInfo,
      '03-computer-filled',
      p1Page.getByTestId('computer-row'),
    );
    await clickEndTurn(p1Page);

    await expect(p1Page.locator(sel.actionMenu('ANALYZE_DATA'))).toBeEnabled({
      timeout: 20_000,
    });
    await clickMainAction(p1Page, 'ANALYZE_DATA');
    const p1PublicityBeforeBlueTrace = await resourceValue(p1Page, 'publicity');
    await clickInputOptionById(p1Page, 'alien-0-discovery-blue-trace');
    await expect
      .poll(() => resourceValue(p1Page, 'publicity'), { timeout: 15_000 })
      .toBe(p1PublicityBeforeBlueTrace + 1);
    await expectTraceOccupant(p1Page, 'alien-0-discovery-blue-trace');
    await attachScreenshot(
      p1Page,
      testInfo,
      '04-blue-trace-marked',
      p1Page.getByTestId('trace-slot-alien-0-discovery-blue-trace-occupant-0'),
    );
    await clickEndTurn(p1Page);

    await expectAnomaliesDiscovered(p1Page);
    await attachScreenshot(
      p1Page,
      testInfo,
      '05-anomaly-tokens-board-p1',
      p1Page.locator('[data-testid^="solar-alien-token-1-"]').first(),
    );
    await openTab(p1Page, 'Aliens');
    await attachScreenshot(
      p1Page,
      testInfo,
      '06-anomalies-revealed-p1',
      p1Page.getByTestId('alien-0-anomalies-board'),
    );
    await expectAnomaliesDiscovered(p2Page);
    await openTab(p2Page, 'Aliens');
    await attachScreenshot(
      p2Page,
      testInfo,
      '07-anomalies-revealed-p2',
      p2Page.getByTestId('alien-0-anomalies-board'),
    );

    await expect(p1Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playFloodingTheMediaSpaceAndExpectDraw(p1Page);
    await openTab(p1Page, 'Aliens');
    await attachScreenshot(
      p1Page,
      testInfo,
      '08-anomalies-card-settled-p1',
      p1Page.getByTestId('alien-0-anomalies-board'),
    );
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

import { expect, type Page, type TestInfo, test } from '@playwright/test';
import { EAlienType } from '@seti/common/types/BaseCard';
import {
  clickEndTurn,
  clickInputOptionById,
  clickMainAction,
  createRoomByUi,
  createUser,
  ECoreAlienType,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
  waitForActionOwner,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const AMOEBA_REVEAL_SEED = 'alien-discovery-e2e-1624';

interface IRoomOptionsResponse {
  options?: {
    alienModulesEnabled?: Record<string, boolean>;
    spaceAgencyOptions?: {
      enabled?: boolean;
      newAlienSpecies?: boolean;
    };
  };
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

async function clickRoomOptionSwitch(
  page: Page,
  roomId: string,
  switchId: string,
  checked: boolean,
): Promise<IRoomOptionsResponse> {
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
  return (await response.json()) as IRoomOptionsResponse;
}

async function openAliensTab(page: Page): Promise<void> {
  const aliensTab = page.getByRole('tab', { name: /aliens/i });
  await expect(aliensTab).toBeVisible({ timeout: 15_000 });
  await aliensTab.click();
  await expect(aliensTab).toHaveAttribute('aria-selected', 'true', {
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

async function expectTraceOccupant(
  page: Page,
  traceSlotId: string,
): Promise<void> {
  await openAliensTab(page);
  await expect(
    page.getByTestId(`trace-slot-${traceSlotId}-occupant-0`),
  ).toBeVisible({ timeout: 10_000 });
}

test('@real-ui Space Agency new aliens can reveal the Amoeba board', async ({
  browser,
  request,
}, testInfo) => {
  test.setTimeout(420_000);
  await waitForServerReady(request);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const host = createUser('sa-new-alien-host');
  const guest = createUser('sa-new-alien-guest');

  try {
    await registerByUi(hostPage, host);
    const roomId = await createRoomByUi(
      hostPage,
      `SA New Alien ${Date.now()}`,
      2,
      {
        alienTypes: [
          ECoreAlienType.ANOMALIES,
          ECoreAlienType.CENTAURIANS,
          ECoreAlienType.EXERTIANS,
          ECoreAlienType.MASCAMITES,
          ECoreAlienType.OUMUAMUA,
        ],
        seed: AMOEBA_REVEAL_SEED,
      },
    );

    await clickRoomOptionSwitch(hostPage, roomId, 'space-agency-enabled', true);
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      'space-agency-new-aliens',
      true,
    );
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      `space-agency-alien-${EAlienType.GLYPHIDS}`,
      true,
    );
    await clickRoomOptionSwitch(
      hostPage,
      roomId,
      `space-agency-alien-${EAlienType.AMOEBA}`,
      true,
    );
    const finalOptionsResponse = await clickRoomOptionSwitch(
      hostPage,
      roomId,
      `space-agency-alien-${EAlienType.ARKHOS}`,
      true,
    );
    expect(finalOptionsResponse.options?.spaceAgencyOptions?.enabled).toBe(
      true,
    );
    expect(
      finalOptionsResponse.options?.spaceAgencyOptions?.newAlienSpecies,
    ).toBe(true);
    expect(
      finalOptionsResponse.options?.alienModulesEnabled?.[EAlienType.AMOEBA],
    ).toBe(true);
    await attachScreenshot(
      hostPage,
      testInfo,
      'space-agency-new-aliens-01-room-options',
    );

    await registerByUi(guestPage, guest);
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

    await openAliensTab(hostPage);
    await expect(hostPage.getByTestId('alien-0-hidden-board')).toBeVisible({
      timeout: 15_000,
    });
    await attachScreenshot(
      hostPage,
      testInfo,
      'space-agency-new-aliens-02-hidden-board',
    );

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
    await clickInputOptionById(p2Page, 'alien-0-discovery-red-trace');
    await expectTraceOccupant(p2Page, 'alien-0-discovery-red-trace');
    await clickEndTurn(p2Page);

    await expect(p1Page.locator(sel.actionMenu('PLAY_CARD'))).toBeEnabled({
      timeout: 20_000,
    });
    await playHandCard(p1Page, '12');
    await clickInputOptionById(p1Page, 'land-venus');
    await clickInputOptionById(p1Page, 'alien-0-discovery-yellow-trace');
    await expectTraceOccupant(p1Page, 'alien-0-discovery-yellow-trace');
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
    await clickEndTurn(p1Page);

    await expect(p1Page.locator(sel.actionMenu('ANALYZE_DATA'))).toBeEnabled({
      timeout: 20_000,
    });
    await clickMainAction(p1Page, 'ANALYZE_DATA');
    await clickInputOptionById(p1Page, 'alien-0-discovery-blue-trace');
    await clickEndTurn(p1Page);

    await expect(p1Page.getByTestId('alien-0-amoeba-board')).toBeVisible({
      timeout: 15_000,
    });
    await expect(p1Page.getByTestId('alien-0-amoeba-cell-8')).toBeVisible({
      timeout: 10_000,
    });
    await attachScreenshot(
      p1Page,
      testInfo,
      'space-agency-new-aliens-03-amoeba-board-actor',
    );
    await openAliensTab(p2Page);
    await expect(p2Page.getByTestId('alien-0-amoeba-board')).toBeVisible({
      timeout: 15_000,
    });
    await expect(p2Page.getByTestId('alien-0-amoeba-cell-8')).toBeVisible({
      timeout: 10_000,
    });
    await attachScreenshot(
      p2Page,
      testInfo,
      'space-agency-new-aliens-03-amoeba-board-other',
    );
  } finally {
    await hostContext.close().catch(() => undefined);
    await guestContext.close().catch(() => undefined);
  }
});

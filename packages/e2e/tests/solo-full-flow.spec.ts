import { expect, type Page, test } from '@playwright/test';
import {
  clickMainAction,
  createRoomByUi,
  createUser,
  launchGameByUi,
  registerByUi,
  waitForAndResolveCardPrompt,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const ROUND_TRANSITION_SEED = 'solo-round-transition-e2e';
const DISCOVERY_SEED = 'solo-discovery-1147';

async function openTab(
  page: Page,
  name: 'Board' | 'Cards' | 'Aliens',
): Promise<void> {
  const tab = page.getByRole('tab', { name });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
}

async function getRivalPanelSnapshot(page: Page): Promise<string> {
  const [progress, draw, discard, currentCard] = await Promise.all([
    page.getByTestId('rival-progress').textContent(),
    page.getByTestId('rival-deck-draw').textContent(),
    page.getByTestId('rival-deck-discard').textContent(),
    page.getByTestId('rival-current-card').textContent(),
  ]);

  return [progress, draw, discard, currentCard].join('|');
}

async function passAndWaitForSoloReturn(page: Page): Promise<void> {
  const rivalPanelBefore = await getRivalPanelSnapshot(page);
  await clickMainAction(page, 'PASS');

  await expect
    .poll(
      async () => {
        await waitForAndResolveCardPrompt(page, 750);
        const pass = page.locator(sel.actionMenu('PASS'));
        const passReady =
          (await pass.isVisible().catch(() => false)) &&
          (await pass.isEnabled().catch(() => false));
        const rivalPanelAfter = await getRivalPanelSnapshot(page);
        return passReady && rivalPanelAfter !== rivalPanelBefore;
      },
      { timeout: 45_000 },
    )
    .toBe(true);
}

async function currentRoundStackIndex(page: Page): Promise<number> {
  await openTab(page, 'Cards');
  for (let index = 0; index < 4; index += 1) {
    const className = await page.locator(sel.roundStack(index)).getAttribute(
      'class',
    );
    if (className?.includes('border-accent-500')) {
      return index;
    }
  }
  return -1;
}

async function createSoloGame(
  page: Page,
  seed: string,
  roomName: string,
): Promise<void> {
  await registerByUi(page, createUser(roomName));
  const roomId = await createRoomByUi(page, `${roomName} ${Date.now()}`, 2, {
    isSoloMode: true,
    soloDifficulty: 3,
    seed,
  });
  await launchGameByUi(page, roomId);
  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId('rival-panel')).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Solo full flow @real-ui', () => {
  test('advances through a solo round transition with only one human player', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await waitForServerReady(request);
    await createSoloGame(page, ROUND_TRANSITION_SEED, 'solo-round-host');

    const startingRoundStack = await currentRoundStackIndex(page);
    expect(startingRoundStack).toBe(0);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await openTab(page, 'Board');
      await passAndWaitForSoloReturn(page);
      if ((await currentRoundStackIndex(page)) > startingRoundStack) {
        break;
      }
    }

    expect(await currentRoundStackIndex(page)).toBeGreaterThan(
      startingRoundStack,
    );
    await expect(page.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });
  });

  test('lets the rival contribute a discovery trace through server-side automation', async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);
    await waitForServerReady(request);
    await createSoloGame(page, DISCOVERY_SEED, 'solo-discovery-host');
    await openTab(page, 'Aliens');

    const rivalDiscoveryTrace = page
      .locator(
        '[data-testid^="trace-slot-alien-"]' +
          '[data-testid*="-discovery-"]' +
          '[data-testid$="-occupant-0"]' +
          '[title^="rival:"]',
      )
      .first();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await openTab(page, 'Aliens');
      if (
        await rivalDiscoveryTrace
          .isVisible()
          .catch(() => false)
      ) {
        break;
      }
      await openTab(page, 'Board');
      await passAndWaitForSoloReturn(page);
    }

    await openTab(page, 'Aliens');
    await expect(rivalDiscoveryTrace).toBeVisible({ timeout: 10_000 });
    await expect(rivalDiscoveryTrace).toHaveAttribute('title', /rival:/);
  });
});

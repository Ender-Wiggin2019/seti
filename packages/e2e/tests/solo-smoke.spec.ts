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

async function getRivalPanelSnapshot(page: Page): Promise<string> {
  const [progress, draw, discard, currentCard] = await Promise.all([
    page.getByTestId('rival-progress').textContent(),
    page.getByTestId('rival-deck-draw').textContent(),
    page.getByTestId('rival-deck-discard').textContent(),
    page.getByTestId('rival-current-card').textContent(),
  ]);

  return [progress, draw, discard, currentCard].join('|');
}

test.describe('Solo @smoke @real-ui', () => {
  test('creates and starts a solo rival game with one human player', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await waitForServerReady(request);

    await registerByUi(page, createUser('solo-smoke-host'));

    const roomId = await createRoomByUi(
      page,
      `Solo Smoke Room ${Date.now()}`,
      2,
      { isSoloMode: true, soloDifficulty: 3 },
    );

    await expect(page.getByTestId('game-setting-value-players')).toHaveText(
      '1',
    );
    await expect(
      page.getByTestId('game-setting-value-solo-difficulty'),
    ).toContainText('3');

    await launchGameByUi(page, roomId);

    await expect(page.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(sel.bottomActions)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('rival-panel')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('rival-objectives')).toBeVisible();
    await expect(page.getByTestId('rival-deck-draw')).toBeVisible();

    const rivalPanelBefore = await getRivalPanelSnapshot(page);

    await clickMainAction(page, 'PASS');

    await expect
      .poll(
        async () => {
          await waitForAndResolveCardPrompt(page, 750);
          return getRivalPanelSnapshot(page);
        },
        { timeout: 30_000 },
      )
      .not.toBe(rivalPanelBefore);
    await expect(page.locator(sel.actionMenu('PASS'))).toBeEnabled({
      timeout: 20_000,
    });
  });
});

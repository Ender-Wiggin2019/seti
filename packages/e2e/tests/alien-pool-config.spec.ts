import { expect, test, type Page } from '@playwright/test';
import {
  createRoomByUiWithDetails,
  createUser,
  ECoreAlienType,
  enterGameByUi,
  joinRoomByUi,
  launchGameByUi,
  registerByUi,
} from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

const ALIEN_CASES = [
  {
    name: 'anomalies + centaurians',
    enabled: [ECoreAlienType.ANOMALIES, ECoreAlienType.CENTAURIANS] as const,
    flags: [true, true, false, false, false],
  },
  {
    name: 'exertians + mascamites',
    enabled: [ECoreAlienType.EXERTIANS, ECoreAlienType.MASCAMITES] as const,
    flags: [false, false, true, true, false],
  },
  {
    name: 'oumuamua + anomalies',
    enabled: [ECoreAlienType.OUMUAMUA, ECoreAlienType.ANOMALIES] as const,
    flags: [true, false, false, false, true],
  },
] as const;

async function openAliensTab(page: Page): Promise<void> {
  const aliensTab = page.getByRole('tab', { name: /aliens/i });
  await expect(aliensTab).toBeVisible({ timeout: 15_000 });
  await aliensTab.click();
}

async function expectTwoHiddenAlienBoards(page: Page): Promise<void> {
  await openAliensTab(page);
  await expect(page.locator('[data-testid="alien-board-grid"]')).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.locator('[data-testid^="alien-"][data-testid$="-card"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-testid^="alien-"][data-testid$="-hidden-board"]'),
  ).toHaveCount(2);
}

test.describe('Alien pool room config (real flow only)', () => {
  for (const alienCase of ALIEN_CASES) {
    test(`real UI room config locks the game to ${alienCase.name}`, async ({
      browser,
      request,
    }) => {
      test.setTimeout(240_000);
      await waitForServerReady(request);

      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();
      const hostPage = await hostContext.newPage();
      const guestPage = await guestContext.newPage();

      const host = createUser(`alien-host-${alienCase.name.replaceAll(' ', '-')}`);
      const guest = createUser(`alien-guest-${alienCase.name.replaceAll(' ', '-')}`);

      try {
        await registerByUi(hostPage, host);
        await registerByUi(guestPage, guest);

        const room = await createRoomByUiWithDetails(
          hostPage,
          `Alien Pool ${alienCase.name} ${Date.now()}`,
          2,
          { alienTypes: alienCase.enabled },
        );
        expect(room.options?.alienModulesEnabled).toEqual(alienCase.flags);
        const roomId = room.id;

        await expect(
          hostPage.locator('[data-testid="game-setting-value-players"]'),
        ).toHaveText('2');
        await expect(
          hostPage.locator('[data-testid="game-setting-alien-modules"] [role="switch"]'),
        ).toHaveAttribute('aria-checked', 'true');

        await joinRoomByUi(guestPage, roomId);
        await expect(
          guestPage.locator('[data-testid="game-setting-value-alien-modules"]'),
        ).toContainText(/on/i);

        const hostGameId = await launchGameByUi(hostPage, roomId);
        const guestGameId = await enterGameByUi(guestPage, roomId);
        expect(guestGameId).toBe(hostGameId);

        await expect(hostPage.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        });
        await expect(guestPage.locator(sel.bottomDashboard)).toBeVisible({
          timeout: 15_000,
        });

        await expectTwoHiddenAlienBoards(hostPage);
        await expectTwoHiddenAlienBoards(guestPage);
      } finally {
        await hostContext.close().catch(() => undefined);
        await guestContext.close().catch(() => undefined);
      }
    });
  }
});

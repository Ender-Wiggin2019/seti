import { expect, test } from '@playwright/test';
import { waitForServerReady } from '../helpers/server-ready';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

test.describe('Debug Snapshot Replay', () => {
  test('can load a game from DB snapshot and render the game UI', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);

    const sessionResponse = await request.post(
      `${SERVER_URL}/debug/server/session`,
    );
    expect(sessionResponse.ok()).toBe(true);
    const session = await sessionResponse.json();
    const sourceGameId: string = session.gameId;

    await page.goto('/debug/replay');

    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });

    const gameIdInput = page.getByTestId('debug-snapshot-game-id');
    await expect(gameIdInput).toBeVisible();
    await gameIdInput.fill(sourceGameId);

    const snapshotResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/snapshot-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-snapshot-start').click();
    expect((await snapshotResponse).ok()).toBe(true);

    await expect(page.locator('[data-testid="bottom-dashboard"]')).toBeVisible({
      timeout: 15_000,
    });
  });
});

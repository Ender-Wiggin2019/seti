import { expect, type Page } from '@playwright/test';
import { sel } from './selectors';

export async function startDebugReplay(
  page: Page,
  options: {
    presetName: RegExp;
    checkpointName: RegExp;
  },
): Promise<void> {
  await page.goto('/debug/replay');
  await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId('debug-replay-preset').click();
  await page.getByRole('option', { name: options.presetName }).click();

  await page.getByTestId('debug-replay-checkpoint').click();
  await page.getByRole('option', { name: options.checkpointName }).click();

  const replayResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/debug/server/replay-session') &&
      response.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('debug-replay-start').click();
  expect((await replayResponse).ok()).toBe(true);

  await expect(page.locator(sel.bottomDashboard)).toBeVisible({
    timeout: 15_000,
  });
}

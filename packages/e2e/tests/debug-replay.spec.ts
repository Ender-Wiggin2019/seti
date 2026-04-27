import { expect, test } from '@playwright/test';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test.describe('Debug Replay Page', () => {
  test('can start the anomaly replay and resolve discovery through the real UI', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);

    await page.goto('/debug/replay');

    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('debug-replay-field-alienType').click();
    await page.getByRole('option', { name: /anomalies/i }).click();

    const replayResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/replay-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-replay-start').click();
    expect((await replayResponse).ok()).toBe(true);

    await expect(page.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });

    const endTurnButton = page.getByTestId('action-menu-end-turn');
    await expect(endTurnButton).toBeVisible({ timeout: 15_000 });
    await endTurnButton.click();

    await page.click(sel.boardTab('Aliens'));
    await expect(page.getByRole('heading', { name: /anomalies/i })).toBeVisible(
      {
        timeout: 15_000,
      },
    );
  });

  test('can start the anomaly trigger replay and fire the reward via PASS', async ({
    page,
    request,
  }) => {
    await waitForServerReady(request);

    await page.goto('/debug/replay');

    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('debug-replay-preset').click();
    await page.getByRole('option', { name: /anomaly trigger replay/i }).click();

    await page.getByTestId('debug-replay-field-alienType').click();
    await page.getByRole('option', { name: /anomalies/i }).click();

    const replayResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/replay-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-replay-start').click();
    expect((await replayResponse).ok()).toBe(true);

    const passButton = page.getByRole('button', { name: /^pass$/i });
    await expect(passButton).toBeVisible({ timeout: 15_000 });
    await passButton.click();

    await page.click(sel.boardTab('Aliens'));
    await expect(page.getByRole('heading', { name: /anomalies/i })).toBeVisible(
      {
        timeout: 15_000,
      },
    );
  });

  test('updates fields after switching preset', async ({ page, request }) => {
    await waitForServerReady(request);

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByTestId('debug-replay-field-alienType'),
    ).toBeVisible();

    await page.getByTestId('debug-replay-preset').click();
    await page.getByRole('option', { name: /oumuamua replay/i }).click();

    await expect(page.getByTestId('debug-replay-field-alienType')).toHaveCount(
      0,
    );

    await page.getByTestId('debug-replay-preset').click();
    await page.getByRole('option', { name: /anomaly trigger replay/i }).click();

    await expect(
      page.getByTestId('debug-replay-field-alienType'),
    ).toBeVisible();
    await page.getByTestId('debug-replay-field-alienType').click();
    await expect(
      page.getByRole('option', { name: /anomalies/i }),
    ).toBeVisible();
  });

  test('New Replay returns to the preset form', async ({ page, request }) => {
    await waitForServerReady(request);

    await page.goto('/debug/replay');
    await expect(page.getByTestId('debug-replay-preset')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('debug-replay-field-alienType').click();
    await page.getByRole('option', { name: /anomalies/i }).click();

    const replayResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/debug/server/replay-session') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('debug-replay-start').click();
    expect((await replayResponse).ok()).toBe(true);

    await expect(page.locator(sel.bottomDashboard)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'New Replay' }).click();

    await expect(page.getByTestId('debug-replay-start')).toBeVisible();
    await expect(page.locator(sel.bottomDashboard)).toHaveCount(0);
  });
});

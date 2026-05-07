import { expect, type Page, test } from '@playwright/test';
import { startDebugReplay } from '../helpers/debug-replay';
import { clickMainAction, openEventLog } from '../helpers/real-flow';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

async function resourceValue(page: Page, id: string): Promise<number> {
  const text = await page
    .locator(`[data-testid="resource-${id}"] .readout`)
    .textContent();
  return Number(text?.match(/\d+/)?.[0] ?? 0);
}

test('@actions @debug spend signal token free action e2e: replay enters real scan pool, spends token, and returns to scan flow', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);
  await startDebugReplay(page, {
    presetName: /free action replay/i,
    checkpointName: /spend signal token/i,
  });

  const signalBefore = await resourceValue(page, 'signal-token');
  expect(signalBefore).toBeGreaterThan(0);
  await expect(page.locator(sel.actionMenu('SCAN'))).toBeEnabled({
    timeout: 15_000,
  });

  await clickMainAction(page, 'SCAN');
  await page.locator(sel.freeActionToggle).click();
  await expect(page.locator(sel.freeAction('SPEND_SIGNAL_TOKEN'))).toBeEnabled({
    timeout: 15_000,
  });

  await openEventLog(page);
  const eventEntries = page.locator('[data-testid^="event-entry-"]');
  const logBefore = await eventEntries.count();

  await page.locator(sel.freeAction('SPEND_SIGNAL_TOKEN')).click();
  await expect
    .poll(() => resourceValue(page, 'signal-token'), { timeout: 15_000 })
    .toBe(signalBefore - 1);

  const cardPrompt = page
    .locator(
      '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
        '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
    )
    .first();
  await expect(cardPrompt).toBeVisible({ timeout: 10_000 });
  await cardPrompt.click();
  await page
    .locator('[data-testid="bottom-actions"]')
    .getByRole('button', { name: /^confirm$/i })
    .click();

  const sectorOption = page
    .locator('[data-testid^="input-option-sector-"]')
    .first();
  await expect(sectorOption).toBeVisible({ timeout: 15_000 });
  await sectorOption.click();

  await expect
    .poll(() => eventEntries.count(), { timeout: 15_000 })
    .toBeGreaterThan(logBefore);
  await expect(page.locator(sel.freeAction('SPEND_SIGNAL_TOKEN'))).toBeDisabled(
    {
      timeout: 15_000,
    },
  );
  await expect(page.locator(sel.inputOption('mark-card-row'))).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(sel.inputOption('mark-earth'))).toBeVisible({
    timeout: 15_000,
  });
});

import { expect, test } from '@playwright/test';
import { startDebugReplay } from '../helpers/debug-replay';
import { sel } from '../helpers/selectors';
import { waitForServerReady } from '../helpers/server-ready';

test('@actions @debug deliver sample free action e2e: replay exposes real deliver button and resolves through UI', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  await waitForServerReady(request);
  await startDebugReplay(page, {
    presetName: /free action replay/i,
    checkpointName: /deliver sample/i,
  });

  await page.click(sel.boardTab('Aliens'));
  await expect(
    page.locator('[data-testid*="-mascamites-capsule-"]'),
  ).toHaveCount(1, {
    timeout: 15_000,
  });

  await page.locator(sel.freeActionToggle).click();
  await expect(page.locator(sel.freeAction('DELIVER_SAMPLE'))).toBeEnabled({
    timeout: 15_000,
  });

  await page.locator(sel.freeAction('DELIVER_SAMPLE')).click();
  await expect(
    page.locator('[data-testid*="-mascamites-capsule-"]'),
  ).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(
    page.locator('[data-testid*="-mascamites-delivered-"]'),
  ).toHaveCount(1, {
    timeout: 15_000,
  });
  await expect(page.locator(sel.freeAction('DELIVER_SAMPLE'))).toBeDisabled({
    timeout: 15_000,
  });
});

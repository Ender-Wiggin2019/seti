import { expect, type Page } from '@playwright/test';
import { sel } from './selectors';

export async function resolveCardPromptIfVisible(
  page: Page,
  timeoutMs = 8_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const eorCardPrompt = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]',
      )
      .first();
    const eorVisible = await eorCardPrompt.isVisible().catch(() => false);

    if (eorVisible) {
      await eorCardPrompt.click();
      return true;
    }

    const cardPrompt = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first();
    const visible = await cardPrompt.isVisible().catch(() => false);

    if (visible) {
      await cardPrompt.click();
      const confirmBtn = page
        .locator('[data-testid="bottom-actions"]')
        .getByRole('button', { name: /^confirm$/i });
      await confirmBtn.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
      await confirmBtn.click();
      return true;
    }

    const anyAction = page.locator('[data-testid^="action-menu-"]').first();
    const anyActionVisible = await anyAction.isVisible().catch(() => false);
    if (anyActionVisible) {
      return false;
    }

    await page.waitForTimeout(150);
  }

  return false;
}

export async function waitForAndResolveCardPrompt(
  page: Page,
  timeoutMs = 10_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const eorCardPrompt = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]',
      )
      .first();
    const eorVisible = await eorCardPrompt.isVisible().catch(() => false);

    if (eorVisible) {
      await eorCardPrompt.click();
      return true;
    }

    const cardPrompt = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first();
    const visible = await cardPrompt.isVisible().catch(() => false);

    if (visible) {
      await cardPrompt.click();
      const confirmBtn = page
        .locator('[data-testid="bottom-actions"]')
        .getByRole('button', { name: /^confirm$/i });
      const confirmVisible = await confirmBtn.isVisible().catch(() => false);
      if (confirmVisible) {
        await confirmBtn.scrollIntoViewIfNeeded().catch(() => undefined);
        await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
        await confirmBtn.click();
      }
      return true;
    }

    await page.waitForTimeout(150);
  }

  return false;
}

export async function waitForInputPrompt(
  page: Page,
  timeout = 10_000,
): Promise<boolean> {
  try {
    await page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-"],' +
          '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="input-eor-card-"]',
      )
      .first()
      .waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

export async function clickFirstInputOption(
  page: Page,
  partialId?: string,
): Promise<void> {
  const selector = partialId
    ? `[data-testid*="input-option-"][data-testid*="${partialId}"]`
    : '[data-testid^="input-option-"]';
  const option = page.locator(selector).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

export async function clickInputOptionById(
  page: Page,
  optionId: string,
): Promise<void> {
  const option = page.locator(sel.inputOption(optionId));
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

export async function clickFirstSelectCard(page: Page): Promise<void> {
  const card = page
    .locator('[data-testid^="hand-card-"], [data-testid^="select-card-"]')
    .first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
}

async function waitForAnyPrompt(page: Page, timeout = 5_000): Promise<boolean> {
  try {
    await page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="input-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="hand-card-"]',
      )
      .first()
      .waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

export async function resolveScanSubActions(
  page: Page,
  maxSteps = 10,
): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    const hasPrompt = await waitForAnyPrompt(page, 5_000);
    if (!hasPrompt) return;

    const realOption = page
      .locator(
        '[data-testid^="input-option-"]:not([data-testid="input-option-done"])',
      )
      .first();
    const hasRealOption = await realOption.isVisible().catch(() => false);
    if (hasRealOption) {
      await realOption.click();
      await page.waitForTimeout(500);
      continue;
    }

    const actionCard = page
      .locator(
        '[data-testid="bottom-actions"] [data-testid^="hand-card-"],' +
          '[data-testid="bottom-actions"] [data-testid^="select-card-"]',
      )
      .first();
    const isActionCardVisible = await actionCard.isVisible().catch(() => false);
    if (isActionCardVisible) {
      await actionCard.click();
      const actionConfirm = page
        .locator('[data-testid="bottom-actions"]')
        .getByRole('button', { name: 'Confirm', exact: true });
      await actionConfirm.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(actionConfirm).toBeEnabled({ timeout: 5_000 });
      await actionConfirm.click();
      await page.waitForTimeout(500);
      continue;
    }

    const handCard = page
      .locator('[data-testid="bottom-hand"] [data-testid^="hand-card-"]')
      .first();
    const isHandCardVisible = await handCard.isVisible().catch(() => false);
    if (isHandCardVisible) {
      await handCard.click();
      const handConfirm = page
        .locator('[data-testid="bottom-hand"]')
        .getByRole('button', { name: /^confirm$/i });
      await handConfirm.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(handConfirm).toBeEnabled({ timeout: 5_000 });
      await handConfirm.click();
      await page.waitForTimeout(500);
      continue;
    }

    const doneBtn = page.locator('[data-testid="input-option-done"]');
    const isDoneVisible = await doneBtn.isVisible().catch(() => false);
    if (isDoneVisible) {
      await doneBtn.click();
      return;
    }

    return;
  }
}

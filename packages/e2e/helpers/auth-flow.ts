import { expect, type Page } from '@playwright/test';

export interface IUserCred {
  name: string;
  email: string;
  password: string;
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createUser(prefix: string): IUserCred {
  const suffix = uniqueSuffix();
  return {
    name: `${prefix}-${suffix}`,
    email: `${prefix.toLowerCase()}-${suffix}@e2e.test`,
    password: 'password123',
  };
}

export async function registerByUi(page: Page, user: IUserCred): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab').nth(1).click();
  await expect(page.locator('#reg-name')).toBeVisible({ timeout: 10_000 });
  await page.locator('#reg-name').fill(user.name);
  await page.locator('#reg-email').fill(user.email);
  await page.locator('#reg-password').fill(user.password);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/register') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('auth-register-submit').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  await page.waitForURL('**/lobby', { timeout: 15_000 });
}

export async function loginByUi(page: Page, user: IUserCred): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab').nth(0).click();
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/auth/login') && res.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await page.getByTestId('auth-login-submit').click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  await page.waitForURL('**/lobby', { timeout: 15_000 });
}

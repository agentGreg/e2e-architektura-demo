import { test, expect, FIXED_ADMIN, FIXED_USER } from '@demo/test-core';
import type { Page } from '@playwright/test';

async function login(page: Page, login: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(login);
  await page.getByLabel('Hasło').fill(password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

const NEW_PRODUCT = 'Nowy produkt';

test.describe('panel admina', () => {
  test.afterEach(async ({ shopApi }) => {
    await shopApi.login(FIXED_ADMIN.login, FIXED_ADMIN.password);
    await shopApi.deleteProducts(NEW_PRODUCT);
  });

  test('admin dodaje produkt', async ({ page }) => {
    await login(page, FIXED_ADMIN.login, FIXED_ADMIN.password);
    await page.goto('/admin');
    await page.getByLabel('Nazwa').fill(NEW_PRODUCT);
    await page.getByLabel('Stan').fill('3');
    await page.getByRole('button', { name: 'Dodaj produkt' }).click();
    await expect(page.getByTestId('flash')).toHaveText(`Dodano produkt: ${NEW_PRODUCT}`);
    await expect(page.getByTestId('admin-product-row').filter({ hasText: NEW_PRODUCT })).toHaveCount(1);
  });

  test('użytkownik bez roli admin nie wchodzi do panelu', async ({ page }) => {
    await login(page, FIXED_USER.login, FIXED_USER.password);
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(403);
    await expect(page.getByRole('heading', { name: 'Brak uprawnień' })).toBeVisible();
  });
});

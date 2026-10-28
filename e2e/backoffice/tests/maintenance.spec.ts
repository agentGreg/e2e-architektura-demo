// Tryb konserwacji to jedno globalne ustawienie: zasób, którego nie da się partycjonować.
// Stan "przed": dwa testy zmieniają je równocześnie i nawzajem psują sobie wynik.
import { test, expect, FIXED_ADMIN, SHOP_URL } from '@demo/test-core';
import type { Page } from '@playwright/test';

async function loginAsOperator(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_ADMIN.login);
  await page.getByLabel('Hasło').fill(FIXED_ADMIN.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

test.describe('tryb konserwacji', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page);
  });

  test.afterEach(async ({ backofficeApi }) => {
    await backofficeApi.login(FIXED_ADMIN.login, FIXED_ADMIN.password);
    await backofficeApi.setMaintenance(false);
  });

  test('włączony tryb konserwacji blokuje sklep', async ({ page, browser }) => {
    await page.goto('/settings');
    await page.getByLabel('Tryb konserwacji sklepu').check();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: włączony');

    const shop = await browser.newPage();
    const response = await shop.goto(SHOP_URL + '/');
    expect(response?.status()).toBe(503);
    await expect(shop.getByRole('heading', { name: 'Tryb konserwacji' })).toBeVisible();
    await shop.close();
  });

  test('wyłączony tryb konserwacji pokazuje produkty', async ({ page, browser }) => {
    await page.goto('/settings');
    await page.getByLabel('Tryb konserwacji sklepu').uncheck();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: wyłączony');

    const shop = await browser.newPage();
    const response = await shop.goto(SHOP_URL + '/');
    expect(response?.status()).toBe(200);
    await expect(shop.getByRole('heading', { name: 'Produkty' })).toBeVisible();
    await shop.close();
  });
});

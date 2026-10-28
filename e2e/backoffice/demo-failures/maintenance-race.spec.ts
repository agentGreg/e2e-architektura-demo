// Kategoria: kolizja danych na zasobie globalnym. Dwa testy przełączają tryb konserwacji
// bez `lock`; przy 4 workerach jeden widzi stan ustawiony przez drugiego.
import { test, expect, FIXED_ADMIN, SHOP_URL } from '@demo/test-core';
import type { Page } from '@playwright/test';

async function loginAsOperator(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_ADMIN.login);
  await page.getByLabel('Hasło').fill(FIXED_ADMIN.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

test.describe('tryb konserwacji bez blokady', { tag: '@demo' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

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
    const shop = await browser.newPage({ storageState: undefined });
    expect((await shop.goto(SHOP_URL + '/'))?.status()).toBe(503);
    await shop.close();
  });

  test('wyłączony tryb konserwacji pokazuje produkty', async ({ page, browser }) => {
    await page.goto('/settings');
    await page.getByLabel('Tryb konserwacji sklepu').uncheck();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: wyłączony');
    const shop = await browser.newPage({ storageState: undefined });
    expect((await shop.goto(SHOP_URL + '/'))?.status()).toBe(200);
    await shop.close();
  });
});

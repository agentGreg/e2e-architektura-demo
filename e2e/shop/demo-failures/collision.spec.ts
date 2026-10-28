// Kategoria: kolizja danych. Dwa testy na jednym koncie i jednym koszyku, z `afterEach`,
// które czyści koszyk także drugiemu workerowi. Wzorzec "przed" z ćwiczenia 2A, zachowany tu
// celowo, żeby generator raportów dawał tę kategorię także na gałęziach z rozwiązaniem.
import { test, expect, FIXED_USER } from '@demo/test-core';
import type { Page } from '@playwright/test';

async function loginAsSharedUser(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
}

test.describe('koszyk na wspólnym koncie', { tag: '@demo' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.afterEach(async ({ shopApi }) => {
    await shopApi.login(FIXED_USER.login, FIXED_USER.password);
    await shopApi.clearCart();
  });

  test('po dodaniu Szamponu koszyk ma jedną pozycję', async ({ page }) => {
    await loginAsSharedUser(page);
    await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-item-name')).toHaveText(['Szampon']);
  });

  test('po dodaniu Mydła koszyk ma jedną pozycję', async ({ page }) => {
    await loginAsSharedUser(page);
    await page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-item-name')).toHaveText(['Mydło']);
  });
});

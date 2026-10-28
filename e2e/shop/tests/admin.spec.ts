import { test, expect } from '@demo/test-core';
import { ADMIN_STATE } from '../playwright.config';

test.describe('panel admina', { tag: '@shop' }, () => {
  test.describe('jako admin', () => {
    // Rola z projektu setup: plik storageState admina, logowanie przez UI raz na uruchomienie.
    test.use({ storageState: ADMIN_STATE });

    test('admin dodaje produkt', async ({ page, prefix, adminApi }) => {
      const name = `${prefix}admin_${Date.now()}`;
      await page.goto('/admin');
      await page.getByLabel('Nazwa').fill(name);
      await page.getByLabel('Stan').fill('3');
      await page.getByRole('button', { name: 'Dodaj produkt' }).click();
      await expect(page.getByTestId('flash')).toHaveText(`Dodano produkt: ${name}`);
      await expect(page.getByTestId('admin-product-row').filter({ hasText: name })).toHaveCount(1);
      await adminApi.deleteProducts(name);
    });
  });

  test('użytkownik bez roli admin nie wchodzi do panelu', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(403);
    await expect(page.getByRole('heading', { name: 'Brak uprawnień' })).toBeVisible();
  });
});

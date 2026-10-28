import { test, expect, seedShop, FIXED_USER, FIXED_PRODUCTS } from '@demo/test-core';
import { openDb } from '@demo/test-core/db';

test.describe('zamówienia klienta', () => {
  test.beforeAll(() => {
    const db = openDb();
    seedShop(db);
    db.close();
  });

  test('zamówienie złożone przez API widać na liście', async ({ page, shopApi }) => {
    await shopApi.login(FIXED_USER.login, FIXED_USER.password);
    const order = await shopApi.placeOrder({ product_name: FIXED_PRODUCTS[1], qty: 1 });

    await page.goto('/login');
    await page.getByLabel('Login').fill(FIXED_USER.login);
    await page.getByLabel('Hasło').fill(FIXED_USER.password);
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await page.goto('/orders');

    const row = page.getByTestId('order-row').filter({ hasText: order.number });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('order-status')).toHaveText('Nowe');
    // Stan magazynowy po jednym zamówieniu: seed dał 10, więc jest 9.
    const products = await shopApi.products(FIXED_PRODUCTS[1]);
    expect(products[0].stock).toBe(9);
  });
});

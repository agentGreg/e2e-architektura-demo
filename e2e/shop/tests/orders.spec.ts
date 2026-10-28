import { test, expect, FIXED_STOCK } from '@demo/test-core';

test.describe('zamówienia klienta', { tag: '@shop' }, () => {
  test('zamówienie złożone przez API widać na liście', async ({ page, order, product, shopApi }) => {
    await page.goto('/orders');
    const row = page.getByTestId('order-row').filter({ hasText: order.number });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('order-status')).toHaveText('Nowe');

    const [after] = await shopApi.products(product.name);
    expect(after.stock).toBe(FIXED_STOCK - 1);
  });

  test('pula zasobów: worker dostaje własny slot', async ({ poolSlot }, testInfo) => {
    // parallelIndex -> slot z puli; po restarcie workera ten sam slot wraca do użycia.
    expect(poolSlot).toBe(`sklep-${String(testInfo.parallelIndex + 1).padStart(2, '0')}`);
  });
});

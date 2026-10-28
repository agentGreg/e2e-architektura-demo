// Rozwiązanie 2A: każdy test dostaje własne zamówienie (fixture `order`), więc anulowanie
// w jednym workerze nie dotyka listy w drugim.
import { test, expect, FIXED_STOCK } from '../fixtures';

test.describe('zamówienia w backoffice', { tag: '@backoffice' }, () => {
  test('lista pokazuje nowe zamówienie', async ({ page, order }) => {
    await page.goto(`/orders?q=${encodeURIComponent(order.number)}`);
    const row = page.getByTestId('order-row').filter({ hasText: order.number });
    await expect(row.getByTestId('order-status')).toHaveText('Nowe');
  });

  test('operator anuluje zamówienie i stan magazynowy wraca', async ({ page, order, product, shopApi }) => {
    await page.goto(`/orders?q=${encodeURIComponent(order.number)}`);
    await page.getByRole('button', { name: `Anuluj: ${order.number}` }).click();
    await expect(page.getByTestId('flash')).toHaveText(`Anulowano zamówienie ${order.number}`);
    await page.goto(`/orders?q=${encodeURIComponent(order.number)}`);
    await expect(page.getByTestId('order-row').getByTestId('order-status')).toHaveText('Anulowane');

    const [after] = await shopApi.products(product.name);
    expect(after.stock).toBe(FIXED_STOCK);
  });

  test('anulowanego zamówienia nie da się anulować drugi raz', async ({ page, order, operatorApi }) => {
    await operatorApi.cancelOrder(order.number);
    await page.goto(`/orders?q=${encodeURIComponent(order.number)}`);
    await expect(page.getByRole('button', { name: `Anuluj: ${order.number}` })).toHaveCount(0);
  });
});

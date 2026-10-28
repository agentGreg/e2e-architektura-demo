// Kategoria: bug w aplikacji. Z SHOP_BUG_TOTAL=1 sklep liczy sumę koszyka bez ilości.
// Pada powtarzalnie, niezależnie od workerów i retry.
import { test, expect, FIXED_USER } from '@demo/test-core';

test('suma koszyka uwzględnia ilość', { tag: '@demo' }, async ({ page, shopApi }) => {
  await shopApi.login(FIXED_USER.login, FIXED_USER.password);
  await shopApi.clearCart();
  const [product] = await shopApi.products('Mydło');
  await shopApi.addToCart(product.id, 3);

  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await page.goto('/cart');

  const expected = ((product.price_cents * 3) / 100).toFixed(2).replace('.', ',') + ' zł';
  await expect(page.getByTestId('cart-total')).toHaveText(expected);
  await shopApi.clearCart();
});

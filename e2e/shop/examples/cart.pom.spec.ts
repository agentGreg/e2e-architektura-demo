// Wariant 1: Page Object Model.
// Zmiana nagłówka: CartPage/ProductsPage. Zmiana logowania: LoginPage. Nowa rola: nowy test
// od logowania, bo "kto jest zalogowany" jest sekwencją kroków, nie stanem.
import { test, expect, FIXED_USER } from '@demo/test-core';
import { LoginPage, ProductsPage } from './pom/pages';

test.afterEach(async ({ shopApi }) => {
  await shopApi.login(FIXED_USER.login, FIXED_USER.password);
  await shopApi.clearCart();
});

test('POM: użytkownik dodaje produkt do koszyka', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(FIXED_USER.login, FIXED_USER.password);

  const products = new ProductsPage(page);
  await products.goto();
  await products.addToCart('Szampon');

  const cart = await products.openCart();
  await expect(cart.count()).toHaveText('1');
  await expect(cart.itemNames()).toHaveText(['Szampon']);
});

// Wariant 3: komponenty.
// Zmiana nagłówka: klasa Header (jedno miejsce, choć nagłówek jest na każdej stronie).
// Zmiana logowania: LoginForm. Nowa rola: nadal sekwencja kroków w teście, jak w POM.
import { test, expect, FIXED_USER } from '@demo/test-core';
import { Header, LoginForm, ProductCard, CartTable } from './components';

test.afterEach(async ({ shopApi }) => {
  await shopApi.login(FIXED_USER.login, FIXED_USER.password);
  await shopApi.clearCart();
});

test('komponenty: użytkownik dodaje produkt do koszyka', async ({ page }) => {
  await page.goto('/');
  const header = new Header(page);
  await header.goToLogin();
  await new LoginForm(page).submit(FIXED_USER.login, FIXED_USER.password);
  await expect(header.currentUser()).toContainText('user');

  await ProductCard.byName(page, 'Szampon').addToCart();
  await header.goToCart();

  const cart = new CartTable(page);
  await expect(cart.count()).toHaveText('1');
  await cart.expectItems(['Szampon']);
});

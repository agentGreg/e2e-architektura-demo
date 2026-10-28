// Wariant 2: fixtures-first. Test czyta się jak scenariusz; nie ma w nim selektora ani logowania.
// Zmiana nagłówka: fixture `cart`. Zmiana logowania: fixture `loggedInAs`. Nowa rola: `test.use({ role })`.
import { test, expect } from './fixtures/test';

test('fixtures: użytkownik dodaje produkt do koszyka', async ({ cart }) => {
  await cart.add('Szampon');
  await cart.open();
  expect(await cart.count()).toBe(1);
  expect(await cart.itemNames()).toEqual(['Szampon']);
});

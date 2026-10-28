// Kategoria: uprawnienia. Test używa konta `user` do operacji, która wymaga roli admin.
// Sygnał w raporcie: 403 / "Brak uprawnień", nie błąd aplikacji.
import { test, expect, FIXED_USER } from '@demo/test-core';

test('dodanie produktu z panelu admina', { tag: ['@demo', '@demo-red'] }, async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  await page.goto('/admin');
  await page.getByLabel('Nazwa').fill('Produkt z demo');
  await page.getByRole('button', { name: 'Dodaj produkt' }).click();
  await expect(page.getByTestId('flash')).toHaveText('Dodano produkt: Produkt z demo');
});

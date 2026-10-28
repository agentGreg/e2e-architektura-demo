// Kategoria: uprawnienia. Konto klienta (rola user) próbuje zmienić ustawienia backoffice.
// Backoffice odsyła na /login, więc test nie znajduje formularza ustawień.
import { test, expect, FIXED_USER } from '@demo/test-core';

test('klient zmienia tryb konserwacji', { tag: ['@demo', '@demo-red'] }, async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  await page.goto('/settings');
  await page.getByLabel('Tryb konserwacji sklepu').check();
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: włączony');
});

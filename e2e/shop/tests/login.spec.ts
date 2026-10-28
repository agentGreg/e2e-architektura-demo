import { test, expect, FIXED_USER } from '@demo/test-core';

test.describe('logowanie', () => {
  test('poprawne dane logują użytkownika', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Login').fill(FIXED_USER.login);
    await page.getByLabel('Hasło').fill(FIXED_USER.password);
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByTestId('current-user')).toHaveText(/Zalogowano jako user/);
  });

  test('błędne hasło pokazuje komunikat', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Login').fill(FIXED_USER.login);
    await page.getByLabel('Hasło').fill('zle-haslo');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy login lub hasło');
  });
});

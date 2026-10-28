import { test, expect, FIXED_USER } from '@demo/test-core';

// Testy logowania startują bez sesji: nadpisujemy domyślny storageState workera.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('logowanie', { tag: '@shop' }, () => {
  test('poprawne dane logują użytkownika', async ({ page, workerUser }) => {
    await page.goto('/login');
    await page.getByLabel('Login').fill(workerUser.login);
    await page.getByLabel('Hasło').fill(workerUser.password);
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByTestId('current-user')).toContainText(`Zalogowano jako ${workerUser.login}`);
  });

  test('błędne hasło pokazuje komunikat', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Login').fill(FIXED_USER.login);
    await page.getByLabel('Hasło').fill('zle-haslo');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy login lub hasło');
  });
});

import { test, expect, FIXED_USER } from '@demo/test-core';

test('konto bez roli operatora nie loguje się do backoffice', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByRole('alert')).toContainText('brak roli operatora');
});

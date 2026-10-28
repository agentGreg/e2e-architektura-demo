import { test, expect } from '../fixtures';

test.use({ storageState: { cookies: [], origins: [] } });

test('konto bez roli operatora nie loguje się do backoffice', { tag: '@backoffice' }, async ({ page, workerUser }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(workerUser.login);
  await page.getByLabel('Hasło').fill(workerUser.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByRole('alert')).toContainText('brak roli operatora');
});

import { test as setup, expect } from '@playwright/test';
import { FIXED_ADMIN } from '@demo/test-core';
import { OPERATOR_STATE } from '../playwright.config';

setup('zaloguj operatora', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_ADMIN.login);
  await page.getByLabel('Hasło').fill(FIXED_ADMIN.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toContainText('admin');
  await page.context().storageState({ path: OPERATOR_STATE });
});

// Stan "przed": zamówienia o stałych numerach (ORD-E2E-1, ORD-E2E-2) wstawiane w beforeAll.
// Dwa workery (albo --repeat-each=2) anulują to samo zamówienie: drugi nie znajdzie przycisku.
import { test, expect, seedOrders, FIXED_ADMIN } from '@demo/test-core';
import { openDb } from '@demo/test-core/db';
import type { Page } from '@playwright/test';

async function loginAsOperator(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_ADMIN.login);
  await page.getByLabel('Hasło').fill(FIXED_ADMIN.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

test.describe('zamówienia w backoffice', () => {
  test.beforeAll(() => {
    const db = openDb();
    seedOrders(db);
    db.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page);
  });

  test('lista pokazuje nowe zamówienie', async ({ page }) => {
    await page.goto('/orders?q=ORD-E2E-1');
    const row = page.getByTestId('order-row').filter({ hasText: 'ORD-E2E-1' });
    await expect(row.getByTestId('order-status')).toHaveText('Nowe');
  });

  test('operator anuluje zamówienie', async ({ page }) => {
    await page.goto('/orders?q=ORD-E2E-2');
    await page.getByRole('button', { name: 'Anuluj: ORD-E2E-2' }).click();
    await expect(page.getByTestId('flash')).toHaveText('Anulowano zamówienie ORD-E2E-2');
    await page.goto('/orders?q=ORD-E2E-2');
    await expect(page.getByTestId('order-row').getByTestId('order-status')).toHaveText('Anulowane');
  });
});

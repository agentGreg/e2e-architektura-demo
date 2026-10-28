// Kategoria: kolizja danych. Zamówienie o stałym numerze, seedowane w beforeAll tylko wtedy,
// gdy go nie ma ("rekord od zawsze"). Przy 4 workerach: jeden worker anuluje ORD-DEMO-1, a każdy
// następny test w innych workerach oczekuje statusu "Nowe" albo przycisku "Anuluj", którego już nie ma.
// Przy 1 workerze przechodzi (lista przed anulowaniem).
import { test, expect, FIXED_ADMIN, FIXED_USER, FIXED_PRODUCTS, BackofficeApi, ShopApi } from '@demo/test-core';
import type { Page } from '@playwright/test';

const ORDER = 'ORD-DEMO-1';

async function loginAsOperator(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_ADMIN.login);
  await page.getByLabel('Hasło').fill(FIXED_ADMIN.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

test.describe('zamówienie o stałym numerze', { tag: '@demo' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async () => {
    const backoffice = new BackofficeApi();
    await backoffice.login(FIXED_ADMIN.login, FIXED_ADMIN.password);
    const existing = await backoffice.orders(ORDER);
    if (existing.some((o) => o.status === 'new')) return;
    await backoffice.deleteOrders(ORDER);
    const shop = new ShopApi();
    await shop.login(FIXED_USER.login, FIXED_USER.password);
    await shop.placeOrder({ product_name: FIXED_PRODUCTS[0], qty: 1, number: ORDER });
  });

  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page);
  });

  test('lista pokazuje zamówienie jako nowe', async ({ page }) => {
    await page.goto(`/orders?q=${ORDER}`);
    await expect(page.getByTestId('order-row').filter({ hasText: ORDER }).getByTestId('order-status')).toHaveText('Nowe');
    await expect(page.getByRole('button', { name: `Anuluj: ${ORDER}` })).toBeVisible();
  });

  test('operator anuluje zamówienie', async ({ page }) => {
    await page.goto(`/orders?q=${ORDER}`);
    await page.getByRole('button', { name: `Anuluj: ${ORDER}` }).click();
    await expect(page.getByTestId('flash')).toHaveText(`Anulowano zamówienie ${ORDER}`);
  });
});

// spec: specs/koszyk-seed-test-core.md
// seed: tests/seed-test-core.spec.ts

import { test, expect } from '@demo/test-core';

test.describe('Koszyk', () => {
  test('Złożenie zamówienia z produktem z fixture', { tag: ['@shop'] }, async ({ page, product }) => {
    const cartLink = page.getByRole('link', { name: 'Koszyk' });
    const placeOrderButton = page.getByRole('button', { name: 'Złóż zamówienie' });

    // 1. Dodaj produkt z fixture (product.name) do koszyka i otwórz koszyk.
    await page.goto('/');
    await page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` }).click();
    await expect(page).toHaveURL(`/?added=${encodeURIComponent(product.name)}`);
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart$/);

    const cartRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: product.name, exact: true }) });
    await expect(cartRow).toHaveCount(1);
    await expect(cartRow.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expect(placeOrderButton).toBeEnabled();

    // 2. Kliknij przycisk „Złóż zamówienie”.
    await placeOrderButton.click();
    await expect(page).toHaveURL(/\/orders\?placed=ORD-\d+$/);
    await expect(page.getByRole('heading', { name: 'Twoje zamówienia' })).toBeVisible();
    const orderNumber = new URL(page.url()).searchParams.get('placed')!;

    // 3. Sprawdź tabelę zamówień (kolumny: Numer, Produkt, Ilość, Status).
    for (const header of ['Numer', 'Produkt', 'Ilość', 'Status']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
    const orderRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: orderNumber, exact: true }) });
    await expect(orderRow).toHaveCount(1);
    await expect(orderRow.getByRole('cell', { name: product.name, exact: true })).toBeVisible();
    await expect(orderRow.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expect(orderRow.getByRole('cell', { name: 'Nowe', exact: true })).toBeVisible();

    // 4. Otwórz ponownie koszyk (/cart).
    await page.goto('/cart');
    await expect(page.getByText('Pozycji: 0')).toBeVisible();
    await expect(page.getByRole('cell', { name: product.name, exact: true })).toHaveCount(0);
  });
});

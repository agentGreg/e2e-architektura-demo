// spec: specs/koszyk-seed-test-core.md
// seed: tests/seed-test-core.spec.ts

import { test, expect } from '@demo/test-core';

test.describe('Koszyk', () => {
  test('Dodanie produktu z fixture do koszyka', { tag: ['@shop'] }, async ({ page, product }) => {
    const addButton = page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` });
    const expectedPrice = `${(product.price_cents / 100).toFixed(2).replace('.', ',')} zł`;

    // 1. Przejdź na stronę listy produktów (/) jako zalogowany użytkownik workera (seed).
    await page.goto('/');
    await expect(addButton).toBeVisible();

    // 2. Kliknij przycisk „Dodaj do koszyka” w wierszu produktu z fixture (product.name).
    await addButton.click();
    await expect(page).toHaveURL(`/?added=${encodeURIComponent(product.name)}`);

    // 3. Przejdź do koszyka (link „Koszyk” w nawigacji).
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page).toHaveURL(/\/cart$/);

    const rows = page.getByRole('row').filter({ has: page.getByRole('button', { name: /^Usuń:/ }) });
    await expect(rows).toHaveCount(1);
    const row = rows.first();
    await expect(row.getByRole('cell', { name: product.name, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: expectedPrice, exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: `Usuń: ${product.name}` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeVisible();
  });
});

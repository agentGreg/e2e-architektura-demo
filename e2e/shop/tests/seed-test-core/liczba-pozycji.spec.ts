// spec: specs/koszyk-seed-test-core.md
// seed: tests/seed-test-core.spec.ts

import { test, expect } from '@demo/test-core';

test.describe('Koszyk', () => {
  test('Liczba pozycji i suma w koszyku po wielokrotnym dodaniu produktu', { tag: ['@shop'] }, async ({ page, product }) => {
    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} zł`;
    const addButton = page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` });
    const cartLink = page.getByRole('link', { name: 'Koszyk' });
    const productsLink = page.getByRole('link', { name: 'Produkty' });
    const productRows = page.getByRole('row').filter({ has: page.getByRole('cell', { name: product.name, exact: true }) });

    // 1. Otwórz koszyk (/cart) przy pustym koszyku.
    await page.goto('/cart');
    await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
    await expect(productRows).toHaveCount(0);

    // 2. Na liście produktów dodaj produkt z fixture (product.name) do koszyka jeden raz, a następnie otwórz koszyk.
    await productsLink.click();
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(page).toHaveURL(`/?added=${encodeURIComponent(product.name)}`);
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(`Pozycji: 1, razem: ${formatPrice(product.price_cents)}`)).toBeVisible();
    await expect(productRows).toHaveCount(1);

    // 3. Wróć na listę produktów, dodaj ten sam produkt z fixture (product.name) ponownie i otwórz koszyk.
    await productsLink.click();
    await addButton.click();
    await expect(page).toHaveURL(`/?added=${encodeURIComponent(product.name)}`);
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(`Pozycji: 1, razem: ${formatPrice(product.price_cents * 2)}`)).toBeVisible();
    await expect(productRows).toHaveCount(1);
    await expect(productRows.first().getByRole('cell', { name: '2', exact: true })).toBeVisible();
    await expect(productRows.first().getByRole('cell', { name: formatPrice(product.price_cents * 2), exact: true })).toBeVisible();
  });
});

// spec: specs/koszyk-seed-test-core.md
// seed: tests/seed-test-core.spec.ts

import { test, expect } from '@demo/test-core';

test.describe('Koszyk', () => {
  test('Usunięcie pozycji z koszyka', { tag: ['@shop'] }, async ({ page, product }) => {
    const addButton = page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` });
    const removeButton = page.getByRole('button', { name: `Usuń: ${product.name}` });
    const productCell = page.getByRole('cell', { name: product.name, exact: true });

    // 1. Dodaj produkt z fixture (product.name) do koszyka i otwórz koszyk.
    await page.goto('/');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(productCell).toBeVisible();
    await expect(removeButton).toBeVisible();

    // 2. Kliknij przycisk „Usuń” przy produkcie z fixture (product.name).
    await removeButton.click();
    await expect(productCell).toHaveCount(0);
    await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
    await expect(productCell).toHaveCount(0);
  });
});

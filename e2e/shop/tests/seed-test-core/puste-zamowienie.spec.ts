// spec: specs/koszyk-seed-test-core.md
// seed: tests/seed-test-core.spec.ts

import { test, expect } from '@demo/test-core';

test.describe('Koszyk', () => {
  test('Brak możliwości złożenia zamówienia przy pustym koszyku (negatywny)', { tag: ['@shop'] }, async ({ page, product }) => {
    const placeOrderButton = page.getByRole('button', { name: 'Złóż zamówienie' });

    // 1. Otwórz koszyk (/cart) przy pustym koszyku użytkownika workera (produkt z fixture nie został dodany).
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('Pozycji: 0')).toBeVisible();
    await expect(page.getByRole('cell', { name: product.name, exact: true })).toHaveCount(0);

    // 2. Spróbuj złożyć zamówienie: przycisk „Złóż zamówienie” jest nieaktywny, więc sprawdzamy ten stan.
    await expect(placeOrderButton).toBeVisible();
    await expect(placeOrderButton).toBeDisabled();

    // Zamówienie nie zostaje utworzone: brak przekierowania i brak wierszy w tabeli zamówień.
    await expect(page).toHaveURL(/\/cart$/);
    await page.goto('/orders');
    await expect(page).not.toHaveURL(/placed=/);
    await expect(page.getByRole('heading', { name: 'Twoje zamówienia' })).toBeVisible();
    await expect(page.getByRole('cell', { name: product.name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: /^ORD-\d+$/ })).toHaveCount(0);
  });
});

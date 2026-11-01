// spec: specs/koszyk-seed-domyslny.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Koszyk (seed domyślny)', () => {
  test('Negatywny: pusty koszyk i koszyk bez logowania', { tag: ['@shop'] }, async ({ page }) => {
    // 1. Zaloguj się jako `user` (świeży stan, pusty koszyk) i otwórz /cart.
    await page.goto('http://localhost:4100/login');
    await page.getByRole('textbox', { name: 'Login' }).fill('user');
    await page.getByRole('textbox', { name: 'Hasło' }).fill('user123');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByText('Zalogowano jako user (user)')).toBeVisible();

    await page.goto('http://localhost:4100/orders');
    const ordersBefore = await page.getByRole('row').count();

    await page.goto('http://localhost:4100/cart');
    await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
    // tabela bez wierszy danych (tylko nagłówek)
    await expect(page.getByRole('row')).toHaveCount(1);
    const placeOrder = page.getByRole('button', { name: 'Złóż zamówienie' });
    await expect(placeOrder).toBeDisabled();
    await placeOrder.click({ force: true });
    await expect(page).toHaveURL(/\/cart$/);

    await page.goto('http://localhost:4100/orders');
    await expect(page.getByRole('row')).toHaveCount(ordersBefore);

    // 2. Wyloguj się („Wyloguj”) i spróbuj kliknąć „Dodaj do koszyka: Mydło” jako niezalogowany użytkownik, następnie otwórz /cart.
    await page.getByRole('button', { name: 'Wyloguj' }).click();
    await expect(page.getByRole('link', { name: 'Zaloguj' })).toBeVisible();

    await page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' }).click();
    // Obserwacja: aplikacja przekierowuje niezalogowanego do /login, nie dodaje produktu
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Logowanie' })).toBeVisible();

    await page.goto('http://localhost:4100/cart');
    // Obserwacja: /cart bez logowania również przekierowuje do /login (brak 500)
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Logowanie' })).toBeVisible();
  });
});

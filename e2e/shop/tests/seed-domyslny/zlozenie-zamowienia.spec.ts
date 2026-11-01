// spec: specs/koszyk-seed-domyslny.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { clearCart } from './helpers';

test.describe('Koszyk (seed domyślny)', () => {
  test('Złożenie zamówienia z koszyka', { tag: ['@shop'] }, async ({ page }) => {
    // 1. Zaloguj się jako `user`, dodaj do koszyka Szampon (1 sztuka) i przejdź do /cart.
    await page.goto('http://localhost:4100/login');
    await page.getByRole('textbox', { name: 'Login' }).fill('user');
    await page.getByRole('textbox', { name: 'Hasło' }).fill('user123');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByText('Zalogowano jako user (user)')).toBeVisible();

    await clearCart(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
    await expect(page).toHaveURL(/\/\?added=Szampon$/);
    await page.goto('/cart');
    await expect(page.getByText('Pozycji: 1, razem: 12,99 zł')).toBeVisible();

    // 2. Kliknij „Złóż zamówienie”.
    await page.getByRole('button', { name: 'Złóż zamówienie' }).click();
    await expect(page).toHaveURL(/\/orders\?placed=ORD-\d+/);
    await expect(page.getByRole('heading', { name: 'Twoje zamówienia' })).toBeVisible();
    await expect(page).toHaveTitle(/Twoje zamówienia/);

    // 3. Sprawdź tabelę zamówień (kolumny: Numer, Produkt, Ilość, Status).
    const placed = new URL(page.url()).searchParams.get('placed')!;
    const firstRow = page.getByRole('row').nth(1);
    await expect(firstRow.getByRole('cell').nth(0)).toHaveText(placed);
    await expect(firstRow.getByRole('cell').nth(1)).toHaveText('Szampon');
    await expect(firstRow.getByRole('cell').nth(2)).toHaveText('1');
    await expect(firstRow.getByRole('cell').nth(3)).toHaveText('Nowe');

    // 4. Wróć do /cart.
    await page.goto('http://localhost:4100/cart');
    await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeDisabled();
  });
});

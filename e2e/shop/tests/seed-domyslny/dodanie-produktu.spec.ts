// spec: specs/koszyk-seed-domyslny.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Koszyk (seed domyślny)', () => {
  test('Dodanie produktu do koszyka', { tag: ['@smoke', '@shop'] }, async ({ page }) => {
    // 1. Zaloguj się jako `user` / `user123` (strona /login), a następnie przejdź na stronę główną /.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Login' }).fill('user');
    await page.getByRole('textbox', { name: 'Hasło' }).fill('user123');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await page.goto('/');

    await expect(page.getByRole('cell', { name: 'Mydło', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pasta do zębów' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Szampon' })).toBeVisible();
    await expect(page.getByText('Zalogowano jako user (user)')).toBeVisible();

    // 2. Kliknij przycisk „Dodaj do koszyka: Mydło”.
    await page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' }).click();

    await expect(page).toHaveURL(/\/\?added=Myd%C5%82o$/);
    await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();

    // 3. Przejdź do koszyka (link „Koszyk”).
    await page.getByRole('link', { name: 'Koszyk' }).click();

    await expect(page.getByText('Pozycji: 1, razem: 4,99 zł')).toBeVisible();
    const rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByRole('cell').nth(0)).toHaveText('Mydło');
    await expect(rows.first().getByRole('cell').nth(1)).toHaveText('1');
    await expect(rows.first().getByRole('cell').nth(2)).toHaveText('4,99 zł');
    await expect(page.getByRole('button', { name: 'Usuń: Mydło' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeEnabled();
  });
});

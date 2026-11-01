// spec: specs/koszyk-seed-domyslny.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { clearCart } from './helpers';

test.describe('Koszyk (seed domyślny)', () => {
  test(
    'Wielokrotne dodanie tego samego produktu zwiększa ilość, a nie liczbę pozycji',
    { tag: ['@smoke', '@shop'] },
    async ({ page }) => {
      // 1. Zaloguj się jako `user` i na liście produktów dwukrotnie kliknij „Dodaj do koszyka: Mydło”.
      await page.goto('/login');
      await page.getByRole('textbox', { name: 'Login' }).fill('user');
      await page.getByRole('textbox', { name: 'Hasło' }).fill('user123');
      await page.getByRole('button', { name: 'Zaloguj' }).click();
      await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
      await clearCart(page);
      await page.goto('/');

      const addSoap = page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' });
      await addSoap.click();
      await expect(page).toHaveURL(/\/\?added=Myd%C5%82o$/);
      await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
      await addSoap.click();
      await expect(page).toHaveURL(/\/\?added=Myd%C5%82o$/);
      await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();

      // 2. Dodaj jeden raz „Szampon” i przejdź do koszyka.
      await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
      await expect(page).toHaveURL(/\/\?added=Szampon$/);
      await page.getByRole('link', { name: 'Koszyk' }).click();

      const summary = page.getByText('Pozycji: 2, razem: 22,97 zł');
      const soapRow = page.getByRole('row', { name: /^Mydło/ });
      const shampooRow = page.getByRole('row', { name: /^Szampon/ });

      await expect(summary).toBeVisible();
      await expect(soapRow.getByRole('cell').nth(1)).toHaveText('2');
      await expect(soapRow.getByRole('cell').nth(2)).toHaveText('9,98 zł');
      await expect(shampooRow.getByRole('cell').nth(1)).toHaveText('1');
      await expect(shampooRow.getByRole('cell').nth(2)).toHaveText('12,99 zł');

      // 3. Odśwież stronę koszyka (F5).
      await page.keyboard.press('F5');

      await expect(summary).toBeVisible();
      await expect(soapRow.getByRole('cell').nth(1)).toHaveText('2');
      await expect(soapRow.getByRole('cell').nth(2)).toHaveText('9,98 zł');
      await expect(shampooRow.getByRole('cell').nth(1)).toHaveText('1');
      await expect(shampooRow.getByRole('cell').nth(2)).toHaveText('12,99 zł');
    }
  );
});

// spec: specs/koszyk-seed-domyslny.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { clearCart } from './helpers';

test.describe('Koszyk (seed domyślny)', () => {
  test(
    'Usunięcie pozycji z koszyka',
    { tag: ['@smoke', '@shop'] },
    async ({ page }) => {
      // 1. Zaloguj się jako `user`, dodaj do koszyka Mydło (2 razy) i Szampon (1 raz), przejdź do /cart.
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
      await addSoap.click();
      await expect(page).toHaveURL(/\/\?added=Myd%C5%82o$/);
      await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
      await expect(page).toHaveURL(/\/\?added=Szampon$/);
      await page.getByRole('link', { name: 'Koszyk' }).click();
      await expect(page).toHaveURL(/\/cart$/);

      await expect(page.getByText('Pozycji: 2, razem: 22,97 zł')).toBeVisible();

      // 2. Kliknij „Usuń: Mydło”.
      await page.getByRole('button', { name: 'Usuń: Mydło' }).click();

      const soapRow = page.getByRole('row', { name: /^Mydło/ });
      const shampooRow = page.getByRole('row', { name: /^Szampon/ });

      await expect(page.getByText('Pozycji: 1, razem: 12,99 zł')).toBeVisible();
      await expect(soapRow).toHaveCount(0);
      await expect(shampooRow.getByRole('cell').nth(1)).toHaveText('1');

      // 3. Kliknij „Usuń: Szampon”.
      await page.getByRole('button', { name: 'Usuń: Szampon' }).click();

      await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
      await expect(shampooRow).toHaveCount(0);
      await expect(page.getByRole('row')).toHaveCount(1); // tylko nagłówek tabeli
      await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeDisabled();
    }
  );
});

// Stan "przed" (ćwiczenie 2A): wszystkie testy na jednym koncie `user` i na produktach
// o stałych nazwach, seed w beforeAll, sprzątanie ręczne w afterEach.
// Przy --workers=1 przechodzi. Przy --workers=4 workery dzielą koszyk i stany magazynowe.
import { test, expect, seedShop, FIXED_USER, FIXED_STOCK, type Db } from '@demo/test-core';
import { openDb } from '@demo/test-core/db';
import type { Page } from '@playwright/test';

async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await expect(page.getByTestId('current-user')).toBeVisible();
}

test.describe('koszyk', () => {
  let db: Db;

  test.beforeAll(() => {
    db = openDb();
    seedShop(db);
  });
  test.afterAll(() => db.close());

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test.afterEach(async ({ shopApi }) => {
    // Sprzątanie ręczne: czyścimy koszyk wspólnego konta.
    await shopApi.login(FIXED_USER.login, FIXED_USER.password);
    await shopApi.clearCart();
  });

  test('dodanie produktu pokazuje go w koszyku', async ({ page }) => {
    await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
    await expect(page.getByTestId('flash')).toHaveText('Dodano do koszyka: Szampon');
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-item-name')).toHaveText(['Szampon']);
  });

  test('dwa różne produkty dają dwie pozycje', async ({ page }) => {
    await page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' }).click();
    await page.getByRole('button', { name: 'Dodaj do koszyka: Pasta do zębów' }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });

  test('usunięcie pozycji opróżnia koszyk', async ({ page }) => {
    await page.getByRole('button', { name: 'Dodaj do koszyka: Mydło' }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await page.getByRole('button', { name: 'Usuń: Mydło' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeDisabled();
  });

  test('złożenie zamówienia zmniejsza stan magazynowy', async ({ page }) => {
    await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await page.getByRole('button', { name: 'Złóż zamówienie' }).click();
    await expect(page.getByTestId('flash')).toHaveText(/Złożono zamówienie: ORD-/);
    await expect(page.getByTestId('order-status').first()).toHaveText('Nowe');

    await page.goto('/?prefix=Szampon');
    await expect(page.getByTestId('product-stock')).toHaveText(String(FIXED_STOCK - 1));
    // Odtworzenie stanu: ręcznie, bo seed zna tylko stałe nazwy.
    seedShop(db);
  });
});

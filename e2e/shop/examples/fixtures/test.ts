// Wariant 2: fixtures-first. Test dostaje gotowy stan (`loggedInAs`) i język domeny (`cart`).
// Selektory siedzą w fixture sterującym, nie w teście i nie w fixture domenowym.
import { test as base, expect, FIXED_USER, FIXED_ADMIN, type ShopApi } from '@demo/test-core';
import type { Page } from '@playwright/test';

type Role = 'user' | 'admin';
const CREDENTIALS: Record<Role, { login: string; password: string }> = { user: FIXED_USER, admin: FIXED_ADMIN };

export interface Cart {
  add(productName: string): Promise<void>;
  open(): Promise<void>;
  itemNames(): Promise<string[]>;
  count(): Promise<number>;
}

export const test = base.extend<{ role: Role; loggedInAs: Page; cart: Cart }>({
  // Opcja: `test.use({ role: 'admin' })` zmienia rolę dla pliku/grupy bez zmiany testu.
  role: ['user', { option: true }],

  loggedInAs: async ({ page, role }, use) => {
    const creds = CREDENTIALS[role];
    await page.goto('/login');
    await page.getByLabel('Login').fill(creds.login);
    await page.getByLabel('Hasło').fill(creds.password);
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByTestId('current-user')).toBeVisible();
    await use(page);
  },

  cart: async ({ loggedInAs: page, shopApi, role }, use) => {
    const cart: Cart = {
      async add(productName) {
        await page.goto('/');
        await page.getByRole('button', { name: `Dodaj do koszyka: ${productName}` }).click();
        await expect(page.getByTestId('flash')).toHaveText(`Dodano do koszyka: ${productName}`);
      },
      async open() {
        await page.goto('/cart');
      },
      itemNames: () => page.getByTestId('cart-item-name').allTextContents(),
      count: async () => Number(await page.getByTestId('cart-count').textContent()),
    };
    await use(cart);
    // Sprzątanie należy do fixture, nie do testu.
    const creds = CREDENTIALS[role];
    await shopApi.login(creds.login, creds.password);
    await shopApi.clearCart();
  },
});

export { expect };
export type { ShopApi };

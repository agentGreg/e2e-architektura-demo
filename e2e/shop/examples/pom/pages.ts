// Wariant 1: Page Object Model. Każdy ekran to klasa; test składa wywołania metod.
import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}
  async goto() {
    await this.page.goto('/login');
  }
  async login(login: string, password: string) {
    await this.page.getByLabel('Login').fill(login);
    await this.page.getByLabel('Hasło').fill(password);
    await this.page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(this.page.getByTestId('current-user')).toBeVisible();
  }
}

export class ProductsPage {
  constructor(private readonly page: Page) {}
  async goto() {
    await this.page.goto('/');
  }
  async addToCart(productName: string) {
    await this.page.getByRole('button', { name: `Dodaj do koszyka: ${productName}` }).click();
    await expect(this.page.getByTestId('flash')).toHaveText(`Dodano do koszyka: ${productName}`);
  }
  async openCart() {
    await this.page.getByRole('link', { name: 'Koszyk' }).click();
    return new CartPage(this.page);
  }
}

export class CartPage {
  constructor(private readonly page: Page) {}
  itemNames() {
    return this.page.getByTestId('cart-item-name');
  }
  count() {
    return this.page.getByTestId('cart-count');
  }
}

// Wariant 3: komponenty. Klasa odpowiada fragmentowi ekranu, który deweloperzy też nazywają
// komponentem (nagłówek, karta produktu, tabela koszyka). Strona = złożenie komponentów.
import { expect, type Locator, type Page } from '@playwright/test';

export class Header {
  readonly root: Locator;
  constructor(page: Page) {
    this.root = page.locator('header');
  }
  currentUser() {
    return this.root.getByTestId('current-user');
  }
  async goToCart() {
    await this.root.getByRole('link', { name: 'Koszyk' }).click();
  }
  async goToLogin() {
    await this.root.getByRole('link', { name: 'Zaloguj' }).click();
  }
}

export class LoginForm {
  constructor(private readonly page: Page) {}
  async submit(login: string, password: string) {
    await this.page.getByLabel('Login').fill(login);
    await this.page.getByLabel('Hasło').fill(password);
    await this.page.getByRole('button', { name: 'Zaloguj' }).click();
  }
}

export class ProductCard {
  constructor(readonly root: Locator) {}
  static byName(page: Page, name: string) {
    return new ProductCard(page.getByTestId('product-row').filter({ has: page.getByTestId('product-name').getByText(name, { exact: true }) }));
  }
  stock() {
    return this.root.getByTestId('product-stock');
  }
  async addToCart() {
    await this.root.getByRole('button', { name: /Dodaj do koszyka/ }).click();
  }
}

export class CartTable {
  readonly root: Locator;
  constructor(page: Page) {
    this.root = page.locator('main');
  }
  count() {
    return this.root.getByTestId('cart-count');
  }
  itemNames() {
    return this.root.getByTestId('cart-item-name');
  }
  async expectItems(names: string[]) {
    await expect(this.itemNames()).toHaveText(names);
  }
}

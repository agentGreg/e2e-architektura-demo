// Rozwiązanie 2A: `page` jest zalogowana jako użytkownik workera, produkty przychodzą z fixture
// (`product`, `products`), sprzątanie jest w teardown fixture. W pliku nie ma literału danych ani SQL.
import { test, expect, FIXED_STOCK } from '@demo/test-core';

test.describe('koszyk', { tag: '@shop' }, () => {
  test('dodanie produktu pokazuje go w koszyku', async ({ page, product }) => {
    await page.goto('/');
    await page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` }).click();
    await expect(page.getByTestId('flash')).toHaveText(`Dodano do koszyka: ${product.name}`);
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-item-name')).toHaveText([product.name]);
  });

  test('dwa różne produkty dają dwie pozycje', async ({ page, products }) => {
    await page.goto('/');
    for (const p of products) await page.getByRole('button', { name: `Dodaj do koszyka: ${p.name}` }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });

  test('usunięcie pozycji opróżnia koszyk', async ({ page, product }) => {
    await page.goto('/');
    await page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await page.getByRole('button', { name: `Usuń: ${product.name}` }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    await expect(page.getByRole('button', { name: 'Złóż zamówienie' })).toBeDisabled();
  });

  test('złożenie zamówienia zmniejsza stan magazynowy', async ({ page, product }) => {
    await page.goto('/');
    await page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` }).click();
    await page.getByRole('link', { name: 'Koszyk' }).click();
    await page.getByRole('button', { name: 'Złóż zamówienie' }).click();
    await expect(page.getByTestId('flash')).toHaveText(/Złożono zamówienie: ORD-/);
    await expect(page.getByTestId('order-status').first()).toHaveText('Nowe');

    await page.goto(`/?prefix=${encodeURIComponent(product.name)}`);
    await expect(page.getByTestId('product-stock')).toHaveText(String(FIXED_STOCK - 1));
  });

  test('produkt bez stanu nie da się dodać do koszyka', async ({ page, adminApi, product }) => {
    await adminApi.upsertProduct({ name: product.name, price_cents: product.price_cents, stock: 0 });
    await page.goto(`/?prefix=${encodeURIComponent(product.name)}`);
    await expect(page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` })).toBeDisabled();
  });
});

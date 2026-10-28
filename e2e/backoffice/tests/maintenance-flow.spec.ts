// Drabina decyzyjna, szczebel (3): zasób jest jeden, a test długi i ryzykowny -> tag @exclusive,
// osobny projekt `serial-resources` z `workers: 1`, poza główną macierzą (główny projekt ma grepInvert).
// Ten sam zasób co w maintenance.spec.ts; `lock` też by zadziałał, ale długi test trzymałby lock
// i blokował krótkie testy z głównego projektu.
import { test, expect, SHOP_URL } from '../fixtures';

test(
  'pełny cykl konserwacji: sklep i API zablokowane, backoffice działa, po wyłączeniu klient kończy zakup',
  { tag: ['@backoffice', '@exclusive'], lock: 'maintenance' },
  async ({ page, browser, maintenance, shopApi, product }) => {
    await maintenance.set(true);

    const shop = await browser.newPage({ storageState: undefined });
    expect((await shop.goto(SHOP_URL + '/cart'))?.status()).toBe(503);
    await expect(shopApi.addToCart(product.id)).rejects.toThrow(/503/);

    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Zamówienia' })).toBeVisible();

    await maintenance.set(false);
    await shopApi.addToCart(product.id);
    const { numbers } = await (async () => {
      const res = await fetch(SHOP_URL + '/api/checkout', { method: 'POST', headers: { authorization: `Bearer ${shopApi.authToken}` } });
      return (await res.json()) as { numbers: string[] };
    })();
    expect(numbers).toHaveLength(1);
    await page.goto(`/orders?q=${encodeURIComponent(numbers[0])}`);
    await expect(page.getByTestId('order-row').getByTestId('order-status')).toHaveText('Nowe');
    await shop.close();
  },
);

// Seed dla agentów Playwright w wersji z architekturą z dnia: `test` z pakietu wspólnego.
// `page` jest zalogowana jako użytkownik workera (storageState z fixture), `product` to świeży
// produkt z prefiksem workera; sprzątanie robią fixtures. Planner uruchamia ten test przed
// eksploracją, a generator traktuje go jako wzór dla nowych testów.
import { test, expect } from '@demo/test-core';

test.describe('Seed', () => {
  test('seed', async ({ page, product }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` })).toBeVisible();
    // generate code here.
  });
});

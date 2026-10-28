import { test, expect } from '@demo/test-core';

test('strona główna pokazuje produkty bazowe', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
  await expect(page.getByTestId('product-row')).not.toHaveCount(0);
  await expect(page.getByTestId('product-name').filter({ hasText: 'Szampon' })).toBeVisible();
});

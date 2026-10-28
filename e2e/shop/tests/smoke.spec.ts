import { test, expect } from '@demo/test-core';

test.use({ storageState: { cookies: [], origins: [] } });

test('strona główna pokazuje produkty', { tag: ['@smoke', '@shop'] }, async ({ page, product }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
  await expect(page.getByTestId('product-name').filter({ hasText: product.name })).toBeVisible();
});

import { expect, type Page } from '@playwright/test';

// Koszyk konta `user` jest współdzielony i trwały po stronie serwera, więc każdy test
// sam ustala stan początkowy: po zalogowaniu usuwa przez UI wszystkie pozycje.
export async function clearCart(page: Page) {
  await page.goto('/cart');
  const removeButtons = page.getByRole('button', { name: /^Usuń: / });
  let left = await removeButtons.count();
  while (left > 0) {
    await removeButtons.first().click();
    left -= 1;
    await expect(removeButtons).toHaveCount(left);
  }
  await expect(page.getByText('Pozycji: 0, razem: 0,00 zł')).toBeVisible();
}

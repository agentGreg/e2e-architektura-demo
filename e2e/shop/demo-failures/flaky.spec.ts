// Kategoria: flaky. Komunikat znika po losowym czasie (1–2 s), test czeka stałe 1,5 s.
// Przechodzi mniej więcej w połowie uruchomień; `--repeat-each=5` pokazuje to od razu.
import { test, expect, FIXED_USER } from '@demo/test-core';

test('komunikat o dodaniu do koszyka znika po 1,5 s', { tag: '@demo' }, async ({ page, shopApi }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(FIXED_USER.login);
  await page.getByLabel('Hasło').fill(FIXED_USER.password);
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  await page.getByRole('button', { name: 'Dodaj do koszyka: Szampon' }).click();
  await expect(page.getByTestId('flash')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('flash'), 'komunikat powinien już zniknąć').toBeHidden({ timeout: 100 });

  await shopApi.login(FIXED_USER.login, FIXED_USER.password);
  await shopApi.clearCart();
});

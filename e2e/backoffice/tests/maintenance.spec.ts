// Tryb konserwacji to jedno globalne ustawienie: nie da się go partycjonować per worker.
// Drabina decyzyjna: (1) partycjonuj -> nie da się; (2) zasób jeden, test krótki -> `lock` (1.63/1.64):
// testy z tą samą nazwą locka nigdy nie biegną równocześnie, między plikami, workerami i projektami,
// reszta zestawu biegnie dalej równolegle. Fixture `maintenance` przywraca stan po teście.
import { test, expect, SHOP_URL } from '../fixtures';

test.describe('tryb konserwacji', { tag: '@backoffice', lock: 'maintenance' }, () => {
  test('włączony tryb konserwacji blokuje sklep', async ({ page, browser, maintenance }) => {
    await maintenance.set(false);
    await page.goto('/settings');
    await page.getByLabel('Tryb konserwacji sklepu').check();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: włączony');

    const shop = await browser.newPage({ storageState: undefined });
    const response = await shop.goto(SHOP_URL + '/');
    expect(response?.status()).toBe(503);
    await expect(shop.getByRole('heading', { name: 'Tryb konserwacji' })).toBeVisible();
    await shop.close();
  });

  test('wyłączony tryb konserwacji pokazuje produkty', async ({ page, browser, maintenance }) => {
    await maintenance.set(true);
    await page.goto('/settings');
    await page.getByLabel('Tryb konserwacji sklepu').uncheck();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByTestId('maintenance-state')).toHaveText('Stan: wyłączony');

    const shop = await browser.newPage({ storageState: undefined });
    const response = await shop.goto(SHOP_URL + '/');
    expect(response?.status()).toBe(200);
    await expect(shop.getByRole('heading', { name: 'Produkty' })).toBeVisible();
    await shop.close();
  });
});

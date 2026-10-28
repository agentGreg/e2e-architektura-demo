// Kategoria: środowisko. Test woła backoffice, którego konfiguracja e2e/shop nie uruchamia
// (ECONNREFUSED). W pipeline odpowiednik: brak serwisu, zły URL, brak sieci do środowiska.
import { test, expect, BACKOFFICE_URL } from '@demo/test-core';

test('backoffice odpowiada na /health', { tag: '@demo' }, async ({ request }) => {
  const response = await request.get(BACKOFFICE_URL + '/health');
  expect(response.ok()).toBe(true);
});

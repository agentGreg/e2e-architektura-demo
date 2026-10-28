// Kategoria: środowisko. Adres usługi raportowej, której nikt nie uruchamia (ECONNREFUSED).
import { test, expect } from '@demo/test-core';

const REPORTS_URL = process.env.REPORTS_URL ?? 'http://localhost:4300';

test('usługa raportów odpowiada na /health', { tag: ['@demo', '@demo-red'] }, async ({ request }) => {
  const response = await request.get(REPORTS_URL + '/health');
  expect(response.ok()).toBe(true);
});

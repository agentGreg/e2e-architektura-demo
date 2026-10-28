// Fixtures projektu backoffice: rozszerzają @demo/test-core o operatora i tryb konserwacji.
// Dane (użytkownik workera, produkt, zamówienie) nadal przychodzą z pakietu wspólnego.
import { test as base, expect, BackofficeApi, FIXED_ADMIN } from '@demo/test-core';
import { OPERATOR_STATE } from './playwright.config';

export interface Maintenance {
  set(enabled: boolean): Promise<void>;
}

export const test = base.extend<{ operatorApi: BackofficeApi; maintenance: Maintenance }>({
  // W backoffice każda `page` jest operatorem (plik z projektu setup), nie użytkownikiem workera.
  storageState: OPERATOR_STATE,

  operatorApi: async ({}, use) => {
    const api = new BackofficeApi();
    await api.login(FIXED_ADMIN.login, FIXED_ADMIN.password);
    await use(api);
  },

  // Zasób globalny: fixture gwarantuje stan wyjściowy po teście, `lock` w teście gwarantuje
  // wyłączność w czasie testu. Jedno bez drugiego nie wystarcza.
  maintenance: async ({ operatorApi }, use) => {
    await use({ set: async (enabled) => void (await operatorApi.setMaintenance(enabled)) });
    await operatorApi.setMaintenance(false);
  },
});

export { expect };
export { SHOP_URL, FIXED_STOCK } from '@demo/test-core';

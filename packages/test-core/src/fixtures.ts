// Fixtures w stanie "przed": tylko dostęp do bazy i klienta API. Logowanie przez UI
// w beforeEach, sprzątanie ręczne w afterEach, dane o stałych nazwach z seed.ts.
import { test as base } from '@playwright/test';
import { openDb, type Db } from './db';
import { ShopApi, BackofficeApi } from './api-client';

export interface CoreFixtures {
  db: Db;
  shopApi: ShopApi;
  backofficeApi: BackofficeApi;
}

export const test = base.extend<CoreFixtures>({
  db: async ({}, use) => {
    const db = openDb();
    await use(db);
    db.close();
  },
  shopApi: async ({}, use) => {
    await use(new ShopApi());
  },
  backofficeApi: async ({}, use) => {
    await use(new BackofficeApi());
  },
});

export { expect } from '@playwright/test';

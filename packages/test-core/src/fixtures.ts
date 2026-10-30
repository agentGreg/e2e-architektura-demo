// Fixtures z izolacją danych (rozwiązanie 2A).
// Zasięg worker: adminApi, workerUser (użytkownik e2e_<run>_s<shard>_w<n>_user), workerStorageState.
// Zasięg test: shopApi (jako workerUser), product/products/order (własne dane per test), db.
import { test as base } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { openDb, type Db } from './db';
import { ShopApi, BackofficeApi, type Product, type Order, SHOP_URL } from './api-client';
import { FIXED_ADMIN, seedWorkerUser, seedProduct, cleanupPrefix, type WorkerUser } from './seed';
import { workerPrefix } from './run-id';
import { pickFromPool } from './pool';

export interface WorkerFixtures {
  /** Prefiks danych tego workera: e2e_<run>_s<shard>_w<workerIndex>_ */
  prefix: string;
  /** Klient API zalogowany jako admin (konto bazowe), do tworzenia i sprzątania danych. */
  adminApi: ShopApi;
  /** Użytkownik utworzony dla tego workera; teardown usuwa wszystko z prefiksem. */
  workerUser: WorkerUser;
  /** Plik storageState zalogowanego workerUser; `page` dostaje go domyślnie. */
  workerStorageState: string;
  /** Zasób z puli przygotowanej z góry (np. sklep testowy), wybrany po parallelIndex. */
  poolSlot: string;
}

export interface TestFixtures {
  db: Db;
  /** Klient API zalogowany jako workerUser. */
  shopApi: ShopApi;
  backofficeApi: BackofficeApi;
  /** Świeży produkt na ten test (stan 10). */
  product: Product;
  /** Dwa świeże produkty na ten test. */
  products: [Product, Product];
  /** Zamówienie workerUser na `product`, numer z prefiksem. */
  order: Order;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  prefix: [
    async ({}, use, workerInfo) => {
      await use(workerPrefix(workerInfo.workerIndex, workerInfo.config.shard?.current));
    },
    { scope: 'worker' },
  ],

  adminApi: [
    async ({}, use) => {
      const api = new ShopApi();
      await api.login(FIXED_ADMIN.login, FIXED_ADMIN.password);
      await use(api);
    },
    { scope: 'worker' },
  ],

  workerUser: [
    async ({ adminApi, prefix }, use) => {
      // Idempotentnie: po restarcie workera nowy workerIndex -> nowy prefiks; po padnięciu
      // teardownu zostają rekordy e2e_<run>_..., które wykrywa `pnpm seed:check`.
      const user = await seedWorkerUser(adminApi, prefix);
      await use(user);
      await cleanupPrefix(adminApi, prefix);
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ workerUser }, use, workerInfo) => {
      // Jedno konto na worker, logowanie raz: token z API wkładamy jako cookie sesji do pliku
      // storageState w outputDir projektu (Playwright czyści go przed uruchomieniem).
      const shard = workerInfo.config.shard?.current ?? 0;
      const file = path.join(workerInfo.project.outputDir, '.auth', `shard-${shard}-worker-${workerInfo.workerIndex}.json`);
      if (!fs.existsSync(file)) {
        const api = new ShopApi();
        const { token } = await api.login(workerUser.login, workerUser.password);
        const { hostname } = new URL(SHOP_URL);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(
          file,
          JSON.stringify({
            cookies: [{ name: 'sid', value: token, domain: hostname, path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' }],
            origins: [],
          }),
        );
      }
      await use(file);
    },
    { scope: 'worker' },
  ],

  poolSlot: [
    async ({}, use, workerInfo) => {
      // Pula demo: 16 "sklepów testowych". Przy --workers=20 fixture rzuca czytelny błąd zamiast kolizji.
      const pool = Array.from({ length: 16 }, (_, i) => `sklep-${String(i + 1).padStart(2, '0')}`);
      await use(pickFromPool(pool, workerInfo.parallelIndex, workerInfo.config.workers));
    },
    { scope: 'worker' },
  ],

  // Nadpisanie wbudowanej opcji: każda `page` startuje zalogowana jako użytkownik workera.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  db: async ({}, use) => {
    const db = openDb();
    await use(db);
    db.close();
  },

  shopApi: async ({ workerUser }, use) => {
    const api = new ShopApi();
    await api.login(workerUser.login, workerUser.password);
    await use(api);
  },

  backofficeApi: async ({}, use) => {
    await use(new BackofficeApi());
  },

  product: async ({ adminApi, prefix }, use) => {
    const product = await seedProduct(adminApi, prefix);
    await use(product);
    await adminApi.deleteProducts(product.name);
  },

  products: async ({ adminApi, prefix }, use) => {
    const pair: [Product, Product] = [await seedProduct(adminApi, prefix), await seedProduct(adminApi, prefix)];
    await use(pair);
    for (const p of pair) await adminApi.deleteProducts(p.name);
  },

  order: async ({ shopApi, product, prefix }, use) => {
    const order = await shopApi.placeOrder({ product_id: product.id, qty: 1, number: `${prefix}ORD-${product.id}` });
    await use(order);
    // Zamówienie znika kaskadowo z produktem (teardown `product`) i z użytkownikiem workera.
  },
});

export { expect } from '@playwright/test';

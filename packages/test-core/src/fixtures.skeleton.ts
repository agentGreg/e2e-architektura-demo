// Szkielet do ćwiczenia 2A (instrukcja: docs/cwiczenia/cw2a-fixtures-dane.md).
// Start ćwiczenia: skopiuj ten plik na fixtures.ts (nadpisz) i uzupełnij miejsca TODO.
//
// Nazwy fixtures są takie same jak w rozwiązaniu wzorcowym (gałąź solution/2a).
// Fixtures z pliku "przed" (db, shopApi, backofficeApi) zostają bez zmian: używają ich
// orders.spec.ts, admin.spec.ts i testy backoffice, których w tym ćwiczeniu nie przepisujesz.
import { test as base } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { openDb, type Db } from './db';
import { ShopApi, BackofficeApi, SHOP_URL, type Product } from './api-client';
import { FIXED_ADMIN } from './seed';

export interface WorkerFixtures {
  /** Prefiks danych tego workera: e2e_<runId>_s<shard>_w<workerIndex>_ */
  prefix: string;
  /** Klient API zalogowany jako admin, jeden na worker. Tworzy i sprząta dane. */
  adminApi: ShopApi;
  /** Własne konto workera. */
  workerUser: { login: string; password: string };
  /** Plik storageState zalogowanego workerUser. */
  workerStorageState: string;
}

export interface TestFixtures {
  // Bez zmian względem stanu "przed".
  db: Db;
  shopApi: ShopApi;
  backofficeApi: BackofficeApi;
  // Nowe.
  /** Świeży produkt dla jednego testu. */
  product: Product;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  prefix: [
    async ({}, use, workerInfo) => {
      // runId ustawia playwright.config.ts w procesie głównym (E2E_RUN_ID = numer buildu
      // na CI, znacznik czasu lokalnie), żeby wszystkie workery miały tę samą wartość.
      const runId = process.env.E2E_RUN_ID;
      if (!runId) throw new Error('Brak E2E_RUN_ID: playwright.config.ts projektu musi go ustawić w procesie głównym (wzór: e2e/shop/playwright.config.ts).');
      const shard = workerInfo.config.shard?.current ?? 0; // na CI shardy mają ten sam runId
      // TODO 1: zbuduj prefiks z runId, shard i workerInfo.workerIndex.
      //         Musi zaczynać się od "e2e_" (tego szuka `pnpm seed:check`).
      const prefix = '';
      // Bezpiecznik: pusty prefiks w teardown (TODO 3) usunąłby wszystkie produkty i konta.
      if (!prefix.startsWith('e2e_')) throw new Error(`TODO 1: prefiks "${prefix}" nie zaczyna się od "e2e_" (shard ${shard}).`);
      await use(prefix);
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
    async ({ prefix, adminApi }, use) => {
      const user = { login: `${prefix}user`, password: 'test123' };
      // TODO 2: utwórz konto przez adminApi (upsert: drugie wywołanie nie może się wywrócić).
      await use(user);
      // TODO 3: sprzątanie całego workera po prefiksie: produkty i użytkownicy.
      //         Jeśli usuwanie rzuca błąd klucza obcego, zmień kolejność.
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ workerUser }, use, workerInfo) => {
      // Jedno logowanie na worker: token z API zapisany jako ciasteczko sesji `sid`.
      const shard = workerInfo.config.shard?.current ?? 0;
      const file = path.join(workerInfo.project.outputDir, '.auth', `shard-${shard}-worker-${workerInfo.workerIndex}.json`);
      if (!fs.existsSync(file)) {
        const { token } = await new ShopApi().login(workerUser.login, workerUser.password);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(
          file,
          JSON.stringify({
            cookies: [
              { name: 'sid', value: token, domain: new URL(SHOP_URL).hostname, path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' },
            ],
            origins: [],
          }),
        );
      }
      await use(file);
    },
    { scope: 'worker' },
  ],

  // Nadpisanie wbudowanej opcji: każda `page` startuje zalogowana jako użytkownik workera.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Bez zmian względem stanu "przed".
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

  product: async ({ prefix, adminApi }, use) => {
    // TODO 4: nazwa unikalna także między testami tego samego workera
    //         i między powtórzeniami (--repeat-each).
    const name = `${prefix}`;
    const product = await adminApi.upsertProduct({ name, stock: 10 });
    await use(product);
    // TODO 5: sprzątanie tego produktu po teście. Czy jest potrzebne, skoro
    //         workerUser sprząta cały prefiks? Kiedy tak, kiedy nie?
  },
});

export { expect } from '@playwright/test';

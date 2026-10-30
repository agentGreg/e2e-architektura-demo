# Ćwiczenie 2A. Fixture, który przygotowuje i sprząta dane

Blok 2.2, 11:05–11:35 (30 min). Praca indywidualna, trener chodzi po sali.

## Cel

Zastępujesz ręczne sprzątanie (`afterEach`, `afterAll`, `try/finally`, skrypt naprawczy uruchamiany po fakcie) jednym wzorcem: fixture tworzy dane z prefiksem uruchomienia i workera, test dostaje gotowe dane, a fixture sprząta po prefiksie w teardown. Przy 4 workerach testy koszyka przestają sobie nawzajem psuć dane.

Wzorzec przenosisz potem do swojego projektu bez zmian w idei: inna baza i inne API, ten sam prefiks i to samo sprzątanie.

## Materiał wejściowy

Repo demo, gałąź `main`:

- `e2e/shop/tests/cart.spec.ts`: stan „przed”. Wszystkie testy na jednym koncie `user`, produkty o stałych nazwach, seed w `beforeAll`, logowanie przez formularz w `beforeEach`, sprzątanie w `afterEach`.
- `packages/test-core/src/fixtures.ts`: fixtures „przed” (`db`, `shopApi`, `backofficeApi`).
- `packages/test-core/src/fixtures.skeleton.ts`: szkielet do ćwiczenia. Ma te same `db`, `shopApi`, `backofficeApi` i nowe fixtures z miejscami `TODO 1`–`TODO 5`. Nazwy fixtures są takie same jak w rozwiązaniu wzorcowym (`solution/2a`).
- `packages/test-core/src/api-client.ts`: klient API. Potrzebne metody: `login`, `upsertUser`, `deleteUsers(prefix)`, `upsertProduct`, `deleteProducts(prefix)`. Tworzenie użytkowników i produktów wymaga zalogowania jako admin (`FIXED_ADMIN` z `seed.ts`).
- `e2e/shop/playwright.config.ts`: ustawia `E2E_RUN_ID` w procesie głównym (numer buildu na CI, znacznik czasu lokalnie). Workery dziedziczą go przez `process.env`, więc wszystkie mają ten sam `runId`. Gdyby każdy worker liczył `Date.now()` sam, każdy miałby inny.
- Sklep trzyma sesję w ciasteczku `sid`. Token z `api.login(...)` zapisany jako `storageState` zastępuje formularz logowania.

## Kroki

PowerShell, z katalogu głównego repo.

1. **Stan wyjściowy.** Uruchom oba polecenia i zapisz, które testy padają przy 4 workerach i dlaczego (wskazówka: wspólny koszyk i wspólny stan magazynowy):
   ```powershell
   pnpm --filter e2e-shop exec playwright test tests/cart.spec.ts --workers=1
   pnpm --filter e2e-shop exec playwright test tests/cart.spec.ts --workers=4 --repeat-each=3
   ```
   Pierwsze przechodzi. W drugim kolizje są losowe: zwykle pada od 3 do 7 z 12 uruchomień. Jeśli wszystko przeszło, powtórz polecenie.
2. **Szkielet na miejsce fixtures.**
   ```powershell
   Copy-Item packages/test-core/src/fixtures.skeleton.ts packages/test-core/src/fixtures.ts -Force
   pnpm typecheck
   ```
   ```bash
   cp packages/test-core/src/fixtures.skeleton.ts packages/test-core/src/fixtures.ts && pnpm typecheck
   ```
   Typecheck przechodzi. Dopóki `TODO 1` nie jest uzupełnione, każdy test z `page` pada z komunikatem `TODO 1: prefiks "" nie zaczyna się od "e2e_"`. To bezpiecznik: pusty prefiks w sprzątaniu usunąłby wszystkie produkty i konta.
3. **Uzupełnij `TODO 1`–`TODO 5`** w `packages/test-core/src/fixtures.ts`.
4. **Przepisz `e2e/shop/tests/cart.spec.ts`** tak, żeby:
   - test dostawał produkt z fixture `product`, a `page` była zalogowana przez `storageState` workera,
   - nie było `beforeAll`, `beforeEach`, `afterEach` ani `try/finally` do danych,
   - nie było literału z nazwą produktu ani SQL.
5. **Uruchom kryteria „gotowe”** w podanej kolejności.
6. **Pokaż trenerowi dwa miejsca w kodzie:** gdzie powstaje prefiks i gdzie jest sprzątanie. Dotyczy także kodu wygenerowanego przez Claude Code.

Claude Code wolno używać. Warunek z kroku 6 obowiązuje. Hook w repo blokuje zapis do `packages/test-core/**` (warstwa wspólna wymaga review). Na czas ćwiczenia uruchom Claude Code ze zmienną:

```powershell
$env:ALLOW_CORE_EDIT = "1"; claude
```

```bash
ALLOW_CORE_EDIT=1 claude
```

Przykład testu po zmianie (pozostałe trzy dokończ sam):

```ts
import { test, expect } from '@demo/test-core';

test('dodanie produktu pokazuje go w koszyku', { tag: '@shop' }, async ({ page, product }) => {
  await page.goto('/');
  await page.getByRole('button', { name: `Dodaj do koszyka: ${product.name}` }).click();
  await page.getByRole('link', { name: 'Koszyk' }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await expect(page.getByTestId('cart-item-name')).toHaveText([product.name]);
});
```

Przed `TODO 1`: prefiks opiera się na `workerIndex`. Worker restartuje po każdym błędzie testu. `workerIndex` dostaje wtedy nową wartość, `parallelIndex` zostaje ten sam. Dane tworzone na żądanie (jak tutaj) wiąż z `workerIndex`. Pula gotowych zasobów (np. 4 stałe konta) to przypadek dla `parallelIndex`.

## Kryterium „gotowe”

1. Trzy razy z rzędu przechodzi (0 failed, 0 flaky):
   ```powershell
   pnpm --filter e2e-shop exec playwright test tests/cart.spec.ts --workers=4 --repeat-each=2
   ```
2. Przechodzi z losową kolejnością:
   ```powershell
   pnpm --filter e2e-shop exec playwright test tests/cart.spec.ts --workers=4 --repeat-each=2 --shuffle
   ```
3. Po uruchomieniu w bazie nie ma danych testowych:
   ```powershell
   pnpm seed:check
   ```
   Oczekiwany wynik: `OK: brak rekordów z prefiksem "e2e_".`
4. W `cart.spec.ts` nie ma literału z nazwą produktu, SQL, `afterEach`, `afterAll` ani `try/finally`.
5. `pnpm typecheck` przechodzi, a pozostałe testy sklepu działają na 1 workerze:
   ```powershell
   pnpm --filter e2e-shop exec playwright test --workers=1
   ```

Kryteria dotyczą tylko `cart.spec.ts`. `orders.spec.ts` i `admin.spec.ts` zostają w stanie „przed”, więc przy 4 workerach nadal mogą padać.

## Zadanie dodatkowe dla szybkich

1. Przepisz `e2e/shop/tests/orders.spec.ts` i `e2e/shop/tests/admin.spec.ts` na fixtures z prefiksem: produkt z `product`, nowy produkt admina z nazwą z `prefix`, logowanie admina przez `storageState` zamiast formularza. Potem cały projekt:
   ```powershell
   pnpm --filter e2e-shop exec playwright test --workers=4 --repeat-each=2
   ```
2. Fixture `order` dla `e2e/backoffice` z tym samym prefiksem (numer zamówienia `<prefix>ORD-...`, sprzątanie przez `backofficeApi.deleteOrders(prefix)`).

## Artefakt do zabrania

Wzorzec fixture’a z prefiksem i sprzątaniem (`fixtures.ts` po ćwiczeniu) oraz lista miejsc w Twoim projekcie, które zastąpi: pliki z `afterEach`, `afterAll`, `try/finally` i skrypty naprawcze danych.

## Rozwiązanie wzorcowe

Gałąź `solution/2a`. Pokazujemy je po ćwiczeniu (5 min).

```powershell
git fetch origin
git diff main origin/solution/2a -- packages/test-core e2e/shop
```

---
name: analiza-buildu
description: Analiza nieudanego buildu E2E sklepu: czyta raport Playwright, klasyfikuje porażki i proponuje działania. Użyj po czerwonym buildzie e2e-shop.
argument-hint: [ścieżka do katalogu z raportem, np. demo-runs/failed]
allowed-tools: Read, Glob, Grep, Bash(node *), Bash(pnpm exec playwright *)
---

# Analiza nieudanego buildu E2E (sklep)

Stan „przed” (ćwiczenie 3A): wszystko w jednym pliku, szczegóły projektu wpisane na sztywno.
Działa w `e2e/shop`; w backoffice albo w innym projekcie zgaduje i myli się.

## Środowisko i konta

- Aplikacja: http://localhost:4100 (sklep). Health: http://localhost:4100/health.
- Konta testowe: `user` / `user123` (rola user), `admin` / `admin123` (rola admin). Panel admina: http://localhost:4100/admin.
- Produkty bazowe: Szampon, Mydło, Pasta do zębów, stan 10 każdy. Zamówienia `ORD-NNNNN`.
- Konfiguracja: `e2e/shop/playwright.config.ts`, projekty `chromium` (główny), `examples`, `demo-failures`.

## Skąd raporty

- Lokalnie: `e2e/shop/playwright-report/index.html`, `e2e/shop/test-results/<test>/error-context.md` i `trace.zip`.
- Z generatora: `e2e/shop/demo-runs/ok/` (próba udana) i `e2e/shop/demo-runs/failed/` (nieudana); w każdym `results.json`, `junit.xml`, `playwright-report/`, `test-results/`.
- Z pipeline’u: artefakt `playwright-report` po `merge-reports`; `junit.xml` w tym samym katalogu.

Argument: `$ARGUMENTS` (katalog z raportem; jeśli pusty, użyj `demo-runs/failed`).

## Proces

1. Wczytaj `results.json` z katalogu raportu. Jeśli go nie ma, wczytaj `junit.xml`. Zbierz testy ze statusem `failed`, `timedOut` i `flaky` (retry).
2. Dla każdej porażki przeczytaj `test-results/<nazwa>/error-context.md` (snapshot strony) i komunikat błędu.
3. Jeśli jest katalog `../ok/` z tą samą nazwą testu, porównaj: ten sam test przeszedł na 1 workerze → podejrzenie kolizji danych albo flaky.
4. Zaklasyfikuj:
   - **kolizja danych**: `toHaveText`/`toHaveCount` z wartością inną o 1–2 niż oczekiwana, rekord „już anulowany” / „nie znaleziono”, test przechodzi na 1 workerze; typowo `tests/cart.spec.ts` (wspólne konto `user`, produkty Szampon/Mydło/Pasta).
   - **flaky**: `waitForTimeout`, `toBeHidden`/`toBeVisible` z krótkim timeoutem, przechodzi przy `--repeat-each`; typowo `demo-failures/flaky.spec.ts`.
   - **bug**: ta sama porażka w każdej próbie i na 1 workerze, wartość w aplikacji policzona źle (np. `cart-total` bez ilości).
   - **uszkodzone dane**: seed nie wrócił do stanu wyjściowego (stan magazynowy inny niż 10 przed testem).
   - **uprawnienia**: 401/403, nagłówek „Brak uprawnień”, test na koncie `user` wchodzi do `/admin`.
   - **środowisko**: `ECONNREFUSED`, `net::ERR_CONNECTION_REFUSED`, timeout na `/health`; typowo `BACKOFFICE_URL` (port 4200) nieuruchomiony.
5. Dla każdej kategorii jedno działanie: kolizja → fixture z prefiksem per worker (`packages/test-core`); flaky → asercja z auto-wait zamiast `waitForTimeout`, potem `--repeat-each=10`; bug → zgłoszenie do deweloperów z trace; uszkodzone dane → `pnpm db:reset` i naprawa seedu; uprawnienia → poprawna rola przez `storageState`; środowisko → `webServer` w konfiguracji / zgłoszenie do DevOpsów.

## Wynik

Tabela `test | kategoria | dowód (cytat z błędu, ścieżka trace) | działanie | właściciel`, potem 3 zdania podsumowania dla kierownika sekcji. Nie zmieniaj plików.

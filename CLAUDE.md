# e2e-architektura-demo

Monorepo demo do warsztatu „Architektura automatyzacji testów i agenci AI w skali zespołu”. Dwie małe aplikacje (sklep, backoffice) i testy Playwright, które je ćwiczą.

## Układ

- `apps/shop`, `apps/backoffice`: system pod testem (node:http + HTML, bez zależności). Nie zmieniaj ich w ramach ćwiczeń.
- `packages/test-core`: wspólna warstwa testowa (fixtures, klient API, seed, adapter bazy). Zmiany tu dotykają wszystkich projektów e2e.
- `e2e/shop`, `e2e/backoffice`: testy; każdy ma własny `playwright.config.ts`.
- `tooling/claude-plugins/qa-standards`: plugin sekcji QA (marketplace `qa-sekcja` w `.claude-plugin/marketplace.json`).

## Zasady pisania testów

- Warstwy: test (scenariusz) → język domeny (fixtures: `cart.add(...)`) → sterowanie (page objecty, klient API, baza). Selektor nie pojawia się w teście ani w fixture domenowym.
- Dane testowe tworzy fixture, nie test. Nazwy z prefiksem uruchomienia, sharda i workera (`e2e_<run>_s<shard>_w<worker>_`), sprzątanie w teardown fixture.
- Logowanie przez `storageState`, nie przez formularz w każdym teście.
- Każdy test ma tag (`@smoke`, `@shop`, `@backoffice`, `@exclusive`, `@quarantine`).

## Polecenia

- `pnpm test:smoke`, `pnpm test`, `pnpm --filter e2e-shop exec playwright test --workers=4 --repeat-each=2`
- `pnpm seed:check` sprawdza, czy po testach zostały dane z prefiksem `e2e_`.
- `pnpm typecheck` przed commitem.

Szczegółowe reguły dla katalogu `e2e/**` są w `.claude/rules/e2e.md`.

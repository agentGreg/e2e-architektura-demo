# Materiał do ćwiczenia 3A: nieudany build z porażkami różnych kategorii

Projekt `demo-failures` (nie biegnie domyślnie) zawiera testy, które padają z różnych powodów. Razem z testami koszyka z `tests/` uruchomionymi na 4 workerach dają raport, w którym trzeba odróżnić:

| Plik | Kategoria | Mechanizm |
|---|---|---|
| `collision.spec.ts` (i `tests/cart.spec.ts` na `main`) przy `--workers=4` | kolizja danych | wspólne konto i produkty o stałych nazwach (stan „przed” z 2A) |
| `flaky.spec.ts` | flaky | komunikat znika po losowym czasie 1–2 s, test czeka stałe 1,5 s |
| `bug.spec.ts` | bug | aplikacja uruchomiona z `SHOP_BUG_TOTAL=1` liczy sumę koszyka bez ilości |
| `permissions.spec.ts` | uprawnienia | test wchodzi do panelu admina na koncie bez roli admin |
| `environment.spec.ts` | środowisko | test woła backoffice, którego konfiguracja sklepu nie uruchamia |

Generowanie raportów (udana próba + nieudana próba, każda z trace):

```powershell
pnpm demo:failures
```

Wynik: `e2e/shop/demo-runs/ok/` i `e2e/shop/demo-runs/failed/` (każdy z `playwright-report/`, `results.json`, `junit.xml`, `test-results/` z trace). Skill „analiza nieudanego buildu” dostaje ścieżkę do `failed/`.

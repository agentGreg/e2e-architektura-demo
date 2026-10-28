# Materiał do ćwiczenia 3A: nieudany build backoffice

Projekt `demo-failures` (nie biegnie domyślnie) zawiera testy w stanie „przed”, niezależne od gałęzi: logują się przez UI i używają zamówień o stałych numerach. Dzięki temu raport z porażkami dla backoffice powstaje także na `solution/2a` i później, gdzie właściwy zestaw `tests/` jest już zielony.

| Plik | Kategoria | Mechanizm |
|---|---|---|
| `orders-collision.spec.ts` | kolizja danych | zamówienie `ORD-DEMO-1` seedowane w `beforeAll` każdego workera; jeden worker anuluje, drugi oczekuje „Nowe” |
| `maintenance-race.spec.ts` | kolizja danych (zasób globalny) | dwa testy przełączają tryb konserwacji bez `lock` |
| `permissions.spec.ts` | uprawnienia | konto bez roli operatora próbuje zmienić ustawienia |
| `environment.spec.ts` | środowisko | test woła adres z innego portu, którego nikt nie uruchamia |

Generowanie (razem ze sklepem): `pnpm demo:failures` → `e2e/backoffice/demo-runs/{ok,failed}/`.

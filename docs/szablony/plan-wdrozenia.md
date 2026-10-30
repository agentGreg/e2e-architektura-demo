# Plan wdrożenia po szkoleniu

16:00–16:16 (16 min). Wypełniamy wspólnie na tablicy. Wynik trafia do kierownika sekcji w ciągu 2 dni po szkoleniu.

## Cel

Każdy artefakt z dzisiejszego dnia ma właściciela, termin i pierwszy krok, który da się zrobić w tym tygodniu. Działania dla deweloperów i dla IT są zapisane osobno, bo sekcja testów ich nie wykona sama.

## Lista działań sekcji testów

| # | Co (artefakt) | Pierwszy projekt | Kto | Do kiedy | Pierwszy krok (w tym tygodniu) |
|---|---|---|---|---|---|
| 1 | Karta wymagań dla pipeline’u przekazana DevOpsom; `fullyParallel` i sharding w projekcie pilotażowym | | | | |
| 2 | Fixtures z prefiksem i sprzątaniem zamiast `afterEach`/`try/finally` | | | | |
| 3 | Marketplace sekcji w Azure Repos z pluginem `qa-standards` 0.1.0 | | | | |
| 4 | `.claude/settings.json` z marketplace’em i pluginem w repo pilotażowym | | | | |
| 5 | Skill „analiza nieudanego buildu” z profilem dla dwóch projektów | | | | |
| 6 | ADR „pierwszy wspólny pakiet test-core” | | | | |
| 7 | Kwarantanna: tag, osobne zadanie w pipeline, właściciel i termin dla każdego testu | | | | |
| 8 | Zasady marketplace’u w repo (`ZASADY.md`) | | | | |

## Dla deweloperów

| # | Problem w aplikacji (z drabiny decyzyjnej, szczebel 4) | Projekt | Kto zgłasza | Do kiedy |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | `data-testid` dla elementów z dynamicznymi ID | | | |

## Dla IT

| # | Co | Kto przekazuje | Do kiedy |
|---|---|---|---|
| 1 | Karta dla IT: managed settings, auto-update, poświadczenia git bez promptu | | |
| 2 | Node 24 LTS na stacjach (minimum 22.13 dla repo szkoleniowego) | | |
| 3 | Proxy i certyfikat dla Claude Code, npm i git | | |

## Po 2 tygodniach

Termin przeglądu: ……………  Kto zwołuje: ……………

Co sprawdzamy: czas pipeline’u w projekcie pilotażowym przed i po, liczba testów `flaky` i w kwarantannie, liczba projektów z pluginem z marketplace’u.

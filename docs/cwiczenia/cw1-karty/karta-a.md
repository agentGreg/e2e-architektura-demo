# Ćwiczenie 1 · Karta A: bronisz podziału A

Blok 1, ćwiczenie 9:41–10:06, ADR do 10:10. Pary. **Tej kartki nie pokazuj „deweloperowi”.**

**Przygotowanie (5 min, przed rundą 1).** Uzupełnij „Twoje liczby” i kolumnę „Twój projekt” w rachunku kosztu kopiowania niżej. Argument z liczbą z Twojego projektu działa najlepiej.

**Runda 1 (6 min).** Masz 3 minuty na obronę podziału A. „Deweloper” ma kartę zastrzeżeń i dopytuje. Pozostałe 3 minuty to wymiana. Argument działa, gdy odwołuje się do kosztu zmiany albo kosztu utrzymania („zmiana logowania to jeden commit zamiast ośmiu”). „Tak się robi” nie działa. W rundzie 2 grasz dewelopera i dostajesz kartę zastrzeżeń.

## Podział A: monorepo z aplikacjami i wspólnym pakietem

```text
repo/
  apps/shop/              aplikacja (system pod testem)
  apps/backoffice/        aplikacja
  packages/test-core/     fixtures, klient API, seed, adapter bazy
  e2e/shop/               testy sklepu + playwright.config.ts
  e2e/backoffice/         testy backoffice + playwright.config.ts
```

Trzy decyzje, których bronisz:

1. Testy leżą w `e2e/` w tym samym repo co aplikacje. PR dewelopera uruchamia testy na tej samej wersji kodu.
2. Wspólna warstwa testowa (fixtures, klient API, seed) jest jednym pakietem `packages/test-core`, podpiętym przez `workspace:*`. Jedna wersja dla wszystkich, zmiana widoczna od razu.
3. Seed i sprzątanie danych są w pakiecie wspólnym; projekty ich nie kopiują.

Twoje liczby do argumentów (uzupełnij przed rundą):

- Ile projektów robi dziś tę samą rzecz osobno (logowanie, tworzenie danych, sprzątanie)? ……
- Ile razy w ostatnim kwartale zmiana w aplikacji wymusiła poprawki w kilku repo testowych? ……

## Rachunek kosztu kopiowania (argument i krok 1 ADR)

K_kopia = liczba repo × zmiany wspólnego kodu w roku × czas jednej zmiany w jednym repo<br>
K_paczka = zmiany × (czas zmiany + czas publikacji) + liczba repo × zmiany × czas podbicia wersji

| | Twój projekt | Przykład (założenia) |
|---|---|---|
| liczba repo z kopią | | 4 |
| zmiany wspólnego kodu w roku | | 12 |
| czas jednej zmiany w jednym repo (h) | | 1 |
| `K_kopia` (h / rok) | | 4 × 12 × 1 = 48 |
| czas publikacji wersji (h) | | 0,5 |
| czas podbicia wersji w repo (h) | | 0,1 |
| `K_paczka` (h / rok) | | 12 × 1,5 + 4 × 12 × 0,1 ≈ 23 |

Rachunek pomija rozjazd kopii: poprawkę wprowadzoną w jednym repo i zapomnianą w pozostałych. Jeśli to się zdarzyło, dopisz przypadek do kontekstu ADR.

**Po rundach.** Para zapisuje 2 argumenty, które przekonały „dewelopera”, i 1 zastrzeżenie bez odpowiedzi. Szkic ADR: szablon `docs/szablony/adr.md` w repo demo; w swoim repo bierzesz kolejny wolny numer (w repo demo 0001 jest zajęty).

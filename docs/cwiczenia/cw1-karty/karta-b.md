# Ćwiczenie 1 · Karta B: bronisz podziału B

Blok 1, ćwiczenie 9:41–10:06, ADR do 10:10. Pary. **Tej kartki nie pokazuj „deweloperowi”.**

**Przygotowanie (5 min, przed rundą 1).** Uzupełnij „Twoje liczby” i kolumnę „Twój projekt” w rachunku kosztu kopiowania niżej. Argument z liczbą z Twojego projektu działa najlepiej.

**Runda 2 (6 min).** Masz 3 minuty na obronę podziału B. „Deweloper” ma kartę zastrzeżeń i dopytuje. Pozostałe 3 minuty to wymiana. Argument działa, gdy odwołuje się do kosztu zmiany albo kosztu utrzymania („nowa wersja pakietu trafia do projektu, gdy zespół ma na nią sprint, a nie w środku wydania”). „Tak się robi” nie działa. W rundzie 1 grasz dewelopera z kartą zastrzeżeń.

## Podział B: osobne repo testowe ze wspólnym pakietem w rejestrze

```text
repo-testy-shop/          testy sklepu, zależność @qa/test-core@^1.4.0
repo-testy-backoffice/    testy backoffice, zależność @qa/test-core@^1.2.0
repo-test-core/           pakiet @qa/test-core, publikowany
                          do Azure Artifacts (npm)
```

Trzy decyzje, których bronisz:

1. Testy zostają w osobnych repo testowych, jak dziś. Zespół testowy ma własny cykl wydań.
2. Wspólna warstwa jest pakietem npm w prywatnym rejestrze. Każdy projekt pinuje wersję i migruje we własnym tempie.
3. Semver: zmiana łamiąca w `test-core` to nowa wersja główna z changelogiem i terminem wycofania starej.

Twoje liczby do argumentów (uzupełnij przed rundą):

- Ile projektów ma inny cykl wydań niż pozostałe? ……
- Ile czasu zajmuje dziś wypuszczenie zmiany w repo, które ma kilku odbiorców? ……

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

# ADR-0001: Testy E2E w monorepo z aplikacjami i wspólnym pakietem `test-core`

Data: 2026-11-02. Status: przyjęty (repo demo; w projekcie uczestnika do dokończenia argumentami z tablicy).

## Kontekst

Osiem projektów, każdy z własnym repo testowym, własnym POM i własnymi helperami (65 plików w jednym z nich, 1100 linii w page objekcie w innym). Ta sama zmiana (nowy nagłówek, nowy przepływ logowania) jest robiona osiem razy. Dane testowe sprzątane ręcznie w `afterEach` w siedmiu plikach. Nikt nie współdzieli kodu między projektami.

## Decyzja

Postanawiamy trzymać testy obok aplikacji w jednym monorepo (`e2e/<aplikacja>`), a wspólną warstwę (fixtures, klient API, seed, adapter bazy) w pakiecie `packages/test-core` wersjonowanym przez `workspace:*`.

- `apps/*` to system pod testem; testy nie importują kodu aplikacji.
- `packages/test-core` ma jednego właściciela i review; zmiana jest widoczna od razu we wszystkich projektach (jedna wersja).
- `e2e/<aplikacja>` zawiera tylko scenariusze i lokalne rozszerzenia fixtures; każdy ma własny `playwright.config.ts`.
- Seed i sprzątanie żyją w pakiecie wspólnym, nie w każdej aplikacji.

## Konsekwencje

- Tańsze: zmiana nagłówka albo logowania to jeden commit w `test-core`; nowy projekt startuje od gotowych fixtures.
- Droższe: zmiana łamiąca w `test-core` dotyka wszystkich naraz (brak pinowania wersji); wymaga review właściciela i terminu migracji.
- Ryzyko bez odpowiedzi: zespoły, które mają testy w osobnym repo i inny cykl wydawniczy niż aplikacja, muszą albo przenieść testy, albo używać wariantu „pakiet w rejestrze” (Azure Artifacts) z semver i opóźnieniem publikacji.

## Alternatywy odrzucone

| Alternatywa | Dlaczego nie |
|---|---|
| Osobne repo testowe per projekt (stan obecny) | ośmiokrotny koszt każdej zmiany wspólnej; brak miejsca na standard |
| Jedno repo testowe dla wszystkich aplikacji, bez monorepo z aplikacjami | testy biegną na innej wersji niż kod; PR dewelopera nie uruchamia E2E |
| `test-core` jako pakiet w prywatnym rejestrze od pierwszego dnia | koszt publikacji i migracji wersji przy zespole, który dopiero zaczyna dzielić kod; zostaje jako krok 2 |

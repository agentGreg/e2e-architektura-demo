# ADR-0002: Pierwszy wspólny pakiet test-core

Data: 2026-11-02. Status: proponowany.

## Kontekst

Każdy projekt ma własne repo testowe, własne Page Objecty i własne helpery. Logowanie, tworzenie danych przez API i sprzątanie są napisane osobno w każdym repo, więc zmiana sposobu logowania oznacza poprawki w każdym z nich. Asercje siedzą w rozbudowanych Page Objectach, a katalog `helpers/` nie oddziela tworzenia danych od asercji. Sprzątanie danych jest ręczne: `afterEach`, `afterAll` i `try/finally` rozsiane po wielu plikach.

Część wspólnego kodu (logowanie, komponenty, helpery) jest już skopiowana między repo. Rachunek z ćwiczenia: przy 4 repo i 12 zmianach w roku kopiowanie kosztuje ok. 48 h rocznie (`K_kopia` = 4 × 12 × 1 h), paczka ok. 23 h (`K_paczka` = 12 × 1,5 h + 4 × 12 × 0,1 h); założenia do sprawdzenia. Kopie zaczynają się rozjeżdżać po pierwszej poprawce zrobionej tylko w jednym repo.

Testy leżą w osobnych repo i tak zostaje: przeniesienie ich do repo aplikacji wymaga zgody kilku zespołów deweloperskich.

## Decyzja

Postanawiamy wydzielić pakiet `@qa/test-core` z trzema rzeczami, które każdy projekt robi dziś osobno: klientem API do przygotowania danych, fixtures tworzącymi i sprzątającymi dane oraz logowaniem przez `storageState`.

- Pakiet ma osobne repo i jest publikowany do Azure Artifacts (npm).
- Projekty pinują wersję (`^1.x`) i przechodzą na nową wersję główną w ciągu jednego sprintu od wydania.
- Do pakietu nie trafiają Page Objecty ani asercje. Te zostają w projektach.
- Pierwszy odbiorca: jeden projekt pilotażowy. Drugi projekt dołącza po 2 tygodniach bez zmian łamiących.
- Właściciel pakietu: <osoba>. Każda zmiana przez PR z jego review.

## Konsekwencje

- Taniej: zmiana logowania albo endpointu do tworzenia danych to jedna wersja pakietu zamiast poprawek w każdym repo. Nowy projekt dostaje sprzątanie danych bez pisania go od nowa.
- Drożej: publikacja wersji i podbijanie zależności w projektach; ktoś musi pilnować changelogu.
- Ryzyko bez odpowiedzi: projekt z innym silnikiem bazy albo innym sposobem logowania może nie zmieścić się w pakiecie bez parametryzacji. Sprawdzimy na drugim projekcie.

## Alternatywy odrzucone

| Alternatywa | Dlaczego nie |
|---|---|
| Zostawić jak jest | koszt każdej wspólnej zmiany rośnie z liczbą projektów |
| Monorepo z aplikacjami (ADR-0001, karta A) | wymaga zgody zespołów deweloperskich; zostaje jako krok 2 |
| Wspólny pakiet z Page Objectami | Page Objecty są różne w każdym projekcie; pakiet urósłby do rozmiaru największego z nich |
| Kopiowanie wspólnego kodu między repo | koszt rośnie z liczbą repo (rachunek w kontekście); kopie rozjeżdżają się po pierwszej poprawce |

# Blok 2.3. Przypadki z sali: zasób wyłączny

13:00–13:45 (45 min). Ten arkusz obejmuje pierwsze 15 minut: rozbiór dwóch przypadków z ankiety (9 + 6 min). Potem niestabilne testy (slajdy) i karta wymagań dla pipeline’u (osobny druk). Liczenie shardów było w bloku 2.2 (arkusz „Policz shardy”); jego wynik przyda się przy karcie.

## Cel

Rozkładasz dwa prawdziwe testy „nie do zrównoleglenia” na części, dla każdej wybierasz szczebel drabiny decyzyjnej i porównujesz rozwiązanie autorskie (plik-blokada) z tym, co daje Playwright. Pierwszy przypadek ma zasób globalny, drugi zasób przypisany do sesji użytkownika.

## Drabina decyzyjna (z bloku 2.2)

Idziesz od góry i zatrzymujesz się na pierwszym szczeblu, który pasuje.

| Szczebel | Pytanie | Rozwiązanie |
|---|---|---|
| 1 | Dane da się utworzyć albo przydzielić osobno dla każdego workera? | partycjonuj: prefiks `e2e_<run>_s<shard>_w<worker>_` i fixture, który tworzy i sprząta; albo pula gotowych zasobów w fixture workera, przydział po `parallelIndex` |
| 2 | Zasób jest jeden, test trwa krótko? | `lock` z nazwą zasobu na teście albo `describe` |
| 3 | Zasób jest jeden, test długi albo ryzykowny? | osobny projekt z `workers: 1` i tagiem `@exclusive`, poza główną macierzą |
| 4 | Problem to stan globalny w aplikacji? | do deweloperów, punkt w planie wdrożenia |

## Przypadek 1: tryb edycji blokujący cały sklep (9 min, w parach)

Opis z ankiety, bez nazwy aplikacji i projektu:

> Aplikacja, w której edytuje się miesięczne dane pracowników sklepu. Zmiany wprowadza się w trybie edycji, a tryb edycji blokuje cały sklep: gdy jedna sesja edytuje, nikt inny nie zmieni niczego w tym sklepie. Zapis obejmuje cały miesiąc i jeden błędny dzień odrzuca zapis całego miesiąca. Wszystkie testy biegały na jednym sklepie testowym. Przy `workers: 1` przebieg trwał ponad 70 minut.
>
> Rozwiązanie autorskie: test losuje pracownika i sklep przez API, a wylosowany sklep rezerwuje plikiem-blokadą na dysku. Przy 3 workerach testy przechodzą. Pracowników i sklepów test nie tworzy: istnieją w systemie i każdy jest jedyny.

**Zadanie A.** Rozłóż przypadek na cztery elementy i przypisz każdemu szczebel drabiny (1–4). Uzasadnij jednym zdaniem.

| Element | Szczebel | Uzasadnienie |
|---|---|---|
| Dane miesiąca jednego pracownika | | |
| Tryb edycji blokujący cały sklep | | |
| Zapis odrzucający cały miesiąc przy jednym błędnym dniu | | |
| Jeden sklep testowy dla wszystkich testów | | |

**Zadanie B.** Porównaj plik-blokadę z rozwiązaniami z Playwrighta. Uzupełnij puste pola.

| Pytanie | Plik-blokada (autorskie) | `lock` w Playwright | Pula w fixture workera |
|---|---|---|---|
| Kto pilnuje, że dwa testy nie biorą tego samego sklepu? | własny kod | runner Playwright | przydział po `parallelIndex` |
| Działa między workerami na jednej maszynie? | tak | tak | tak |
| Działa między shardami na różnych agentach? | | | |
| Co się dzieje, gdy proces padnie w trakcie testu? | | | |
| Ile sklepów testowych potrzeba przy 4 workerach? | | | |
| Ile kodu trzeba utrzymywać? | | | |

**Zadanie C (dla szybkich par).** Szkic puli w fixture workera. Uzupełnij jedną linię: który sklep dostaje worker.

```ts
const STORES = (process.env.E2E_STORES ?? '').split(',');   // np. "S01,S02,S03,S04"

export const test = base.extend<{}, { store: string }>({
  store: [async ({}, use, workerInfo) => {
    // TODO: wybierz sklep dla tego workera. Uwzględnij shardy: workerInfo.config.shard
    //       ma postać { current, total } albo null.
    const store = STORES[/* uzupełnij */];
    if (!store) throw new Error(`Za mało sklepów testowych: ${STORES.length}`);
    await use(store);
  }, { scope: 'worker' }],
});
```

## Przypadek 2: wspólna sesja jednego konta (6 min, w parach)

Opis z ankiety, bez nazwy aplikacji i projektu:

> Aplikacja webowa do obliczeń dla wielu projektów. Okno obliczeń, nakładka (overlay) i komunikaty typu toast należą do sesji użytkownika: to, co otworzy jedna karta, widzą inne karty tego samego konta. Wszystkie testy działają na jednym koncie testowym, więc testy uruchomione równolegle łapią cudze komunikaty. Projekty, na których liczy aplikacja, da się tworzyć tylko w osobnej aplikacji desktopowej (ta sama baza), więc istnieje ich ograniczona pula. Dziś równolegle biegną tylko różne pliki, a testy wewnątrz pliku idą po kolei.

**Zadanie D.** Przypisz szczebel drabiny (1–4) i porównaj z przypadkiem 1.

| Element | Szczebel | Rozwiązanie w jednym zdaniu |
|---|---|---|
| Okno, overlay i toasty wspólne dla sesji jednego konta | | |
| Jedno konto testowe dla wszystkich testów | | |
| Ograniczona pula projektów, tworzonych tylko poza aplikacją webową | | |

| Pytanie | Przypadek 1 | Przypadek 2 |
|---|---|---|
| Czyj jest zasób, o który walczą testy: całego systemu czy jednego użytkownika? | | |
| Co trzeba mieć w liczbie równej liczbie workerów? | | |

## Kryterium „gotowe”

Para ma szczebel i uzasadnienie dla czterech elementów przypadku 1, wypełnioną kolumnę „Działa między shardami” w zadaniu B i obie tabele zadania D.

## Artefakt do zabrania

Klasyfikacja obu przypadków na drabinie. Przenieś ją na swój najtrudniejszy test; elementy ze szczebla 4 trafiają do planu wdrożenia w kolumnie „dla deweloperów”.

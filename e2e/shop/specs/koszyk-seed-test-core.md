# Plan testów koszyka sklepu Namssor

## Application Overview

Plan testów koszyka sklepu Namssor (http://localhost:4100). Obszary: dodawanie produktów do koszyka, liczba pozycji w koszyku, usuwanie pozycji, złożenie zamówienia. Seed: tests/seed-test-core.spec.ts (import test/expect z @demo/test-core; page zalogowana jako użytkownik workera przez storageState; fixture `product` tworzy świeży produkt z prefiksem workera i sprząta go w teardown). Wszystkie scenariusze zakładają pusty koszyk użytkownika workera i korzystają z danych fixture (product.name), nie z literałów nazw produktów ani loginów. Obserwacje z eksploracji: lista produktów (/) ma przyciski "Dodaj do koszyka: <nazwa>"; koszyk (/cart) pokazuje "Pozycji: N, razem: X zł", tabelę (Produkt, Ilość, Wartość), przyciski "Usuń: <nazwa>" i "Złóż zamówienie"; po złożeniu zamówienia przekierowanie na /orders?placed=ORD-xxxxx z wierszem o statusie "Nowe".

## Test Scenarios

### 1. Koszyk

**Seed:** `tests/seed-test-core.spec.ts`

#### 1.1. Dodanie produktu z fixture do koszyka

**File:** `tests/koszyk/dodanie-produktu.spec.ts`

**Steps:**
  1. Przejdź na stronę listy produktów (/) jako zalogowany użytkownik workera (seed).
    - expect: Na liście widoczny jest wiersz produktu z fixture (product.name) z przyciskiem "Dodaj do koszyka".
  2. Kliknij przycisk "Dodaj do koszyka" w wierszu produktu z fixture (product.name).
    - expect: Użytkownik pozostaje na liście produktów (adres z parametrem ?added=<product.name>).
  3. Przejdź do koszyka (link "Koszyk" w nawigacji).
    - expect: Tabela koszyka zawiera dokładnie jeden wiersz z produktem z fixture (product.name).
    - expect: Ilość w wierszu wynosi 1, a wartość równa się cenie produktu z fixture.
    - expect: Widoczne są przyciski "Usuń" dla tej pozycji oraz "Złóż zamówienie".

#### 1.2. Liczba pozycji i suma w koszyku po wielokrotnym dodaniu produktu

**File:** `tests/koszyk/liczba-pozycji.spec.ts`

**Steps:**
  1. Otwórz koszyk (/cart) przy pustym koszyku.
    - expect: Podsumowanie pokazuje "Pozycji: 0" i sumę 0,00 zł (lub komunikat o pustym koszyku); tabela nie zawiera wierszy z produktem z fixture (product.name).
  2. Na liście produktów dodaj produkt z fixture (product.name) do koszyka jeden raz, a następnie otwórz koszyk.
    - expect: Podsumowanie pokazuje "Pozycji: 1", a suma równa się cenie produktu z fixture.
  3. Wróć na listę produktów, dodaj ten sam produkt z fixture (product.name) ponownie i otwórz koszyk.
    - expect: Liczba pozycji i ilość w wierszu produktu z fixture rosną zgodnie z zachowaniem aplikacji (ilość 2 w jednym wierszu, bez duplikatu wiersza).
    - expect: Suma w podsumowaniu równa się ilości pomnożonej przez cenę produktu z fixture.

#### 1.3. Usunięcie pozycji z koszyka

**File:** `tests/koszyk/usuniecie-pozycji.spec.ts`

**Steps:**
  1. Dodaj produkt z fixture (product.name) do koszyka i otwórz koszyk.
    - expect: W koszyku widoczny jest wiersz produktu z fixture (product.name) oraz przycisk "Usuń: <product.name>".
  2. Kliknij przycisk "Usuń" przy produkcie z fixture (product.name).
    - expect: Wiersz produktu z fixture znika z tabeli koszyka.
    - expect: Podsumowanie pokazuje "Pozycji: 0" i sumę 0,00 zł.
    - expect: Po odświeżeniu strony koszyk nadal nie zawiera produktu z fixture (zmiana jest trwała).

#### 1.4. Złożenie zamówienia z produktem z fixture

**File:** `tests/koszyk/zlozenie-zamowienia.spec.ts`

**Steps:**
  1. Dodaj produkt z fixture (product.name) do koszyka i otwórz koszyk.
    - expect: Koszyk zawiera pozycję produktu z fixture z ilością 1 oraz aktywny przycisk "Złóż zamówienie".
  2. Kliknij przycisk "Złóż zamówienie".
    - expect: Użytkownik zostaje przekierowany na stronę "Twoje zamówienia" (/orders) z parametrem ?placed=<numer zamówienia> w formacie ORD-xxxxx.
  3. Sprawdź tabelę zamówień (kolumny: Numer, Produkt, Ilość, Status).
    - expect: Istnieje wiersz z numerem z parametru placed, produktem z fixture (product.name), ilością 1 i statusem "Nowe".
  4. Otwórz ponownie koszyk (/cart).
    - expect: Koszyk jest pusty (Pozycji: 0), produkt z fixture nie występuje w tabeli.

#### 1.5. Brak możliwości złożenia zamówienia przy pustym koszyku (negatywny)

**File:** `tests/koszyk/puste-zamowienie.spec.ts`

**Steps:**
  1. Otwórz koszyk (/cart) przy pustym koszyku użytkownika workera (produkt z fixture nie został dodany).
    - expect: Podsumowanie pokazuje "Pozycji: 0"; tabela nie zawiera produktu z fixture (product.name).
  2. Spróbuj złożyć zamówienie: jeśli przycisk "Złóż zamówienie" jest nieaktywny lub ukryty, sprawdź ten stan; jeśli aktywny, kliknij go.
    - expect: Zamówienie nie zostaje utworzone: brak przekierowania na /orders?placed=..., a w tabeli zamówień nie pojawia się nowy wiersz.
    - expect: Aplikacja nie zgłasza błędu serwera (brak strony błędu 5xx); ewentualny komunikat walidacyjny jest czytelny. Rozbieżność z tym oczekiwaniem należy zgłosić jako defekt.

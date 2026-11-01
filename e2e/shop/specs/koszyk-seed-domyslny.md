# Plan testów koszyka sklepu Namssor

## Application Overview

Plan testów koszyka w sklepie Namssor (http://localhost:4100). Zakres: dodawanie produktów do koszyka, licznik pozycji i suma w koszyku, usuwanie pozycji oraz składanie zamówienia. Katalog zawiera trzy produkty: Mydło (4,99 zł), Pasta do zębów (8,99 zł), Szampon (12,99 zł). Konto testowe: login `user`, hasło `user123`. Logowanie odbywa się pod /login, koszyk pod /cart, zamówienia pod /orders. Koszyk pokazuje podsumowanie w formacie „Pozycji: N, razem: X,XX zł”, gdzie N to liczba różnych pozycji (dwie sztuki tego samego produktu to jedna pozycja z ilością 2). Przycisk „Złóż zamówienie” jest nieaktywny przy pustym koszyku. Wszystkie scenariusze zakładają świeży stan: zalogowany użytkownik `user` z pustym koszykiem.

## Test Scenarios

### 1. Koszyk (seed domyślny)

**Seed:** `tests/seed.spec.ts`

#### 1.1. Dodanie produktu do koszyka

**File:** `tests/koszyk/dodanie-produktu.spec.ts`

**Steps:**
  1. Zaloguj się jako `user` / `user123` (strona /login), a następnie przejdź na stronę główną /.
    - expect: Wyświetla się lista produktów: Mydło, Pasta do zębów, Szampon.
    - expect: W nagłówku widać „Zalogowano jako user (user)”.
  2. Kliknij przycisk „Dodaj do koszyka: Mydło”.
    - expect: Adres zmienia się na /?added=Mydło, użytkownik pozostaje na liście produktów.
  3. Przejdź do koszyka (link „Koszyk”).
    - expect: Podsumowanie wskazuje „Pozycji: 1, razem: 4,99 zł”.
    - expect: W tabeli jest jeden wiersz: Mydło, ilość 1, wartość 4,99 zł, z przyciskiem „Usuń: Mydło”.
    - expect: Przycisk „Złóż zamówienie” jest aktywny.

#### 1.2. Wielokrotne dodanie tego samego produktu zwiększa ilość, a nie liczbę pozycji

**File:** `tests/koszyk/ilosc-i-liczba-pozycji.spec.ts`

**Steps:**
  1. Zaloguj się jako `user` i na liście produktów dwukrotnie kliknij „Dodaj do koszyka: Mydło”.
    - expect: Po każdym kliknięciu użytkownik pozostaje na liście produktów.
  2. Dodaj jeden raz „Szampon” i przejdź do koszyka.
    - expect: Podsumowanie wskazuje „Pozycji: 2, razem: 22,97 zł” (2 x 4,99 zł + 12,99 zł).
    - expect: Mydło ma ilość 2 i wartość 9,98 zł, Szampon ma ilość 1 i wartość 12,99 zł.
  3. Odśwież stronę koszyka (F5).
    - expect: Zawartość, liczba pozycji i suma pozostają bez zmian (koszyk jest zapamiętany po stronie serwera/sesji).

#### 1.3. Usunięcie pozycji z koszyka

**File:** `tests/koszyk/usuniecie-pozycji.spec.ts`

**Steps:**
  1. Zaloguj się jako `user`, dodaj do koszyka Mydło (2 razy) i Szampon (1 raz), przejdź do /cart.
    - expect: Podsumowanie: „Pozycji: 2, razem: 22,97 zł”.
  2. Kliknij „Usuń: Mydło”.
    - expect: Wiersz Mydło znika w całości (obie sztuki), pozostaje tylko Szampon, ilość 1.
    - expect: Podsumowanie: „Pozycji: 1, razem: 12,99 zł”.
  3. Kliknij „Usuń: Szampon”.
    - expect: Tabela jest pusta, podsumowanie: „Pozycji: 0, razem: 0,00 zł”.
    - expect: Przycisk „Złóż zamówienie” jest nieaktywny (disabled).

#### 1.4. Złożenie zamówienia z koszyka

**File:** `tests/koszyk/zlozenie-zamowienia.spec.ts`

**Steps:**
  1. Zaloguj się jako `user`, dodaj do koszyka Szampon (1 sztuka) i przejdź do /cart.
    - expect: Podsumowanie: „Pozycji: 1, razem: 12,99 zł”.
  2. Kliknij „Złóż zamówienie”.
    - expect: Następuje przekierowanie na /orders?placed=ORD-xxxxx (nowy numer zamówienia), tytuł strony „Twoje zamówienia”.
  3. Sprawdź tabelę zamówień (kolumny: Numer, Produkt, Ilość, Status).
    - expect: Na górze listy jest nowe zamówienie o numerze z parametru `placed`: produkt Szampon, ilość 1, status „Nowe”.
  4. Wróć do /cart.
    - expect: Koszyk jest pusty: „Pozycji: 0, razem: 0,00 zł”, przycisk „Złóż zamówienie” nieaktywny.

#### 1.5. Negatywny: pusty koszyk i koszyk bez logowania

**File:** `tests/koszyk/pusty-koszyk-i-brak-logowania.spec.ts`

**Steps:**
  1. Zaloguj się jako `user` (świeży stan, pusty koszyk) i otwórz /cart.
    - expect: Podsumowanie: „Pozycji: 0, razem: 0,00 zł”, tabela bez wierszy.
    - expect: Przycisk „Złóż zamówienie” jest nieaktywny i kliknięcie go nie tworzy zamówienia (lista /orders bez zmian).
  2. Wyloguj się („Wyloguj”) i spróbuj kliknąć „Dodaj do koszyka: Mydło” na liście produktów jako niezalogowany użytkownik, następnie otwórz /cart.
    - expect: Aplikacja nie dodaje produktu po cichu do cudzego koszyka: użytkownik jest przekierowany do /login albo koszyk jest pusty.
    - expect: Brak błędu serwera (strona 500) i brak nieobsłużonego wyjątku; faktyczne zachowanie należy zapisać jako obserwację przy implementacji testu.

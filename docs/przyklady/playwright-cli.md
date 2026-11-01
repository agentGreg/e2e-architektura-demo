# playwright-cli na sklepie (localhost:4100)

Sklep wymaga logowania przed dodaniem do koszyka, a każde „Dodaj do koszyka” to POST z przeładowaniem strony. Po każdym kliknięciu refy z poprzedniego snapshotu przestają działać („Ref … not found in the current page snapshot”), więc snapshot robimy po każdej akcji. Refy poniżej pochodzą z przebiegu na czystej bazie (Mydło, Pasta do zębów, Szampon). Przy innych danych będą inne, dlatego zawsze bierz je z ostatniego snapshotu.

```sh
# Otwórz stronę logowania sklepu w widocznej przeglądarce
playwright-cli open http://localhost:4100/login --headed

# Snapshot strony: drzewo dostępności z refami elementów
playwright-cli snapshot

# Zaloguj się kontem user / user123 (refy z snapshotu logowania)
playwright-cli fill e20 user
playwright-cli fill e23 user123
playwright-cli click e24

# Po przekierowaniu na listę produktów stare refy już nie działają: nowy snapshot
playwright-cli snapshot

# Dodaj Mydło do koszyka
playwright-cli click f1e37

# Strona się przeładowała (komunikat „Dodano do koszyka”), refy się zmieniły
playwright-cli snapshot

# Dodaj Pastę do zębów
playwright-cli click f2e45

playwright-cli snapshot

# Dodaj Szampon
playwright-cli click f3e52

playwright-cli snapshot

# Przejdź do koszyka linkiem w nawigacji
playwright-cli click f4e10

# Snapshot koszyka: 3 pozycje, razem 26,97 zł, przycisk „Złóż zamówienie”
playwright-cli snapshot

# Złóż zamówienie (zmniejsza stan magazynowy produktów)
playwright-cli click f5e50

# Snapshot po złożeniu zamówienia
playwright-cli snapshot

# Zamknij przeglądarkę
playwright-cli close
```

## Wariant bez refów

`click` i `fill` przyjmują też lokator Playwrighta. Taki przebieg nie wymaga snapshotu po każdym kroku i jest dobrym mostem do rozmowy o tym, czemu testy używają ról i nazw dostępnych, a nie refów.

```sh
playwright-cli open http://localhost:4100/login --headed
playwright-cli fill "getByLabel('Login')" user
playwright-cli fill "getByLabel('Hasło')" user123
playwright-cli click "getByRole('button', { name: 'Zaloguj' })"
playwright-cli click "getByRole('button', { name: 'Dodaj do koszyka: Mydło' })"
playwright-cli click "getByRole('button', { name: 'Dodaj do koszyka: Pasta do zębów' })"
playwright-cli click "getByRole('button', { name: 'Dodaj do koszyka: Szampon' })"
playwright-cli click "getByRole('link', { name: 'Koszyk' })"
playwright-cli snapshot
playwright-cli close
```

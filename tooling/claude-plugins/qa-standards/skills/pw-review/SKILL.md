---
name: pw-review
description: Przegląd testu Playwright wg checklisty sekcji (tag, fixture zamiast logowania przez UI, brak literałów danych, ścieżka negatywna, lokatory). Użyj przed PR z nowym albo zmienionym plikiem .spec.ts.
argument-hint: [ścieżka do pliku .spec.ts]
allowed-tools: Read, Grep, Glob
---

Przejrzyj plik testu: `$ARGUMENTS` (jeśli pusty, zapytaj o ścieżkę; nie zgaduj).

1. Przeczytaj `${CLAUDE_SKILL_DIR}/references/checklist.md`. To jest lista obowiązkowych elementów; nie dodawaj własnych kryteriów.
2. Przeczytaj plik testu i pliki fixtures, które importuje (tylko te).
3. Dla każdego punktu checklisty podaj: spełniony / niespełniony, numer linii jako dowód, jednozdaniowa poprawka.
4. Nie edytuj plików. Wynik to tabela i lista poprawek w kolejności od najtańszej.

Format odpowiedzi:

| # | Kryterium | Status | Linia | Poprawka |
|---|---|---|---|---|

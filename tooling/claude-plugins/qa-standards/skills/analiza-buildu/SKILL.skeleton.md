---
name: analiza-buildu
description: Analiza nieudanego buildu E2E (Playwright): czyta raport, porównuje z udaną próbą, klasyfikuje każdą porażkę (bug, flaky, kolizja danych, uszkodzone dane, uprawnienia, środowisko) i proponuje działanie z właścicielem. Użyj po czerwonym buildzie, zanim ktoś zacznie poprawiać testy.
argument-hint: [katalog z raportem] [--ok katalog udanej próby]
allowed-tools: Read, Glob, Grep, Bash(node *)
---

# Analiza nieudanego buildu E2E
Nie zmieniaj plików; wynik to raport dla zespołu.

## 1. Profil projektu (obowiązkowy)
Katalog raportu: `$ARGUMENTS` (bez argumentu zapytaj).
Znajdź `.claude/test-profile.md`, idąc od katalogu raportu w górę do `${CLAUDE_PROJECT_DIR}`.
Jeśli profilu nie ma: zatrzymaj się i poproś o utworzenie z szablonu
`${CLAUDE_SKILL_DIR}/references/test-profile.template.md`. Nie zgaduj adresów, kont ani ścieżek.
TODO: wypisz, które pola profilu są potrzebne w dalszych krokach.

## 2. Zbierz porażki
TODO: jak dostać listę porażek z results.json / junit.xml i wynik tego samego testu
w próbie udanej (skrypt w scripts/ albo instrukcja dla modelu). Nie czytaj results.json
w całości: to dziesiątki tysięcy linii.

## 3. Dowody per porażka
Dla każdej porażki przeczytaj error-context.md. Porównanie prób z trace:
`${CLAUDE_SKILL_DIR}/references/trace.md`.
TODO: czego szukać (lista sygnałów).

## 4. Klasyfikacja
Kategorie, sygnały i działania: `${CLAUDE_SKILL_DIR}/references/kategorie.md`.
TODO: reguła rozstrzygania, gdy pasują dwie kategorie.

## 5. Wynik
Tabela: `test | kategoria | dowód (cytat z błędu + ścieżka trace) | działanie | właściciel`.
Właściciela bierz z profilu. Potem 3 zdania dla kierownika sekcji.

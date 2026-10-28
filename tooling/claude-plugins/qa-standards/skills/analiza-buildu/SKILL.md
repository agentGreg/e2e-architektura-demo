---
name: analiza-buildu
description: Analiza nieudanego buildu E2E (Playwright): czyta raport, porównuje z udaną próbą, klasyfikuje każdą porażkę (bug, flaky, kolizja danych, uszkodzone dane, uprawnienia, środowisko) i proponuje działanie z właścicielem. Użyj po czerwonym buildzie, zanim ktoś zacznie poprawiać testy.
argument-hint: [katalog z raportem (results.json / junit.xml / blob)] [--ok katalog udanej próby]
allowed-tools: Read, Glob, Grep, Bash(node *), Bash(npx playwright merge-reports *)
---

# Analiza nieudanego buildu E2E

Warstwa wspólna sekcji: proces i kategorie są tu, szczegóły projektu w jego profilu.
Nie zmieniaj plików; wynik to raport dla zespołu.

## 1. Profil projektu (obowiązkowy)

Katalog raportu: `$ARGUMENTS` (pierwszy argument; bez niego zapytaj).
Znajdź profil `.claude/test-profile.md`, idąc od katalogu raportu w górę do korzenia repo
(`${CLAUDE_PROJECT_DIR}`). Przeczytaj go w całości.

Jeśli profilu nie ma: **zatrzymaj się** i poproś o utworzenie z szablonu
`${CLAUDE_PROJECT_DIR}/docs/test-profile.template.md` (albo `${CLAUDE_PLUGIN_ROOT}/skills/analiza-buildu/references/test-profile.template.md`).
Nie zgaduj adresów, kont, ścieżek ani konwencji.

Z profilu bierzesz: skąd raporty i trace, adres środowiska, konta i role, konwencję nazw danych
(prefiks), zasoby wyłączne, kto jest właścicielem jakich decyzji.

## 2. Zbierz porażki skryptem

```
node "${CLAUDE_SKILL_DIR}/scripts/parse-report.mjs" <katalog raportu> [--ok <katalog udanej próby>]
```

Skrypt czyta `results.json` (reporter `json`) albo `junit.xml`, grupuje powtórzenia testu
i dla każdej porażki podaje pierwszą linię błędu, ścieżki `trace.zip` i `error-context.md`,
a gdy obok jest próba udana, jej wynik dla tego samego testu. Dla blobów najpierw
`npx playwright merge-reports --reporter json <blob-report> > results.json`.
Nie czytaj `results.json` ręcznie; to kilkadziesiąt tysięcy linii.

## 3. Dowody per porażka

Dla każdej porażki przeczytaj `error-context.md` (snapshot strony w chwili błędu).
Trace: `${CLAUDE_SKILL_DIR}/references/trace.md` mówi, jak porównać udaną i nieudaną próbę
bez otwierania UI. Szukaj: wartości „o 1 za dużo/za mało”, rekordów o nazwach spoza
prefiksu projektu, kodów 401/403/503, `ECONNREFUSED`, `waitForTimeout` w teście.

## 4. Klasyfikacja

Kategorie, sygnały i działania: `${CLAUDE_SKILL_DIR}/references/kategorie.md`.
Jedna kategoria na porażkę; jeśli dwie pasują, wybierz tę wyżej na liście
(środowisko > uprawnienia > uszkodzone dane > kolizja danych > flaky > bug) i napisz dlaczego.
Reguła: ten sam test zielony w próbie udanej (1 worker) i czerwony w nieudanej (N workerów)
to kolizja danych albo flaky; czerwony w obu to bug, uprawnienia, dane albo środowisko.

## 5. Wynik

Tabela: `test | kategoria | dowód (cytat z błędu + ścieżka trace) | działanie | właściciel`.
Właściciela i konwencje bierz z profilu projektu. Potem 3 zdania dla kierownika sekcji:
ile porażek, ile z nich to aplikacja, co blokuje zielony build.

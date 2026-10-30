# Zasady marketplace’u sekcji testów

Szablon do wypełnienia na sali (blok 3.2, 15:52–16:00). Jedna strona. Po szkoleniu trafia do repo marketplace’u jako `ZASADY.md`.

Marketplace: `…………………` (pole `name` w `marketplace.json`)  Repo: `https://dev.azure.com/…/_git/…………`  Wersja zasad: …… z dnia ……

## 1. Właściciele

| Rola | Kto | Zastępca |
|---|---|---|
| Właściciel marketplace’u (scala PR do `marketplace.json`, pilnuje zasad) | | |
| Administrator po stronie IT (managed settings, poświadczenia git) | | |

| Plugin | Właściciel (pole `author` w `plugin.json`) | Projekty, które go używają |
|---|---|---|
| | | |
| | | |

## 2. Wersjonowanie

- Każda zmiana pluginu podbija `version` w `plugin.json`. Bez tego użytkownicy instalujący z repo nie dostaną zmiany.
- `version` ustawiamy tylko w `plugin.json`, nie we wpisie w `marketplace.json`.
- Rodzaj zmiany (uzupełnij przykładami):
  - patch (0.3.**1**): ……………………………… (np. treść `references/`, poprawka opisu)
  - minor (0.**4**.0): ……………………………… (np. nowy krok, nowy skill)
  - major (**1**.0.0): ……………………………… (np. zmiana pól profilu projektu, która wymaga poprawek w repo projektów)
- Każda wersja ma wpis w `CHANGELOG.md` pluginu.
- Aktualizacje u użytkowników: do wdrożenia karty dla IT ręcznie (`claude plugin marketplace update <marketplace>`, `claude plugin update <plugin>@<marketplace>`), potem auto-update z managed settings.
- Zmiana major: termin migracji …… sprintu; do tego czasu projekty, które nie zdążyły, mogą przypiąć `ref`/`sha` w swoim wpisie.

## 3. Przegląd zmian

- Zmiany tylko przez PR w Azure Repos. Review: właściciel pluginu + ………
- W PR obowiązkowo: `claude plugin validate .` bez błędów, wpis w CHANGELOG, opis, w którym projekcie zmiana była sprawdzona.
- Zakaz sekretów w pluginach (tokeny, hasła, connection stringi); pilnuje go też hook `PreToolUse` w pluginie (w repo demo: `qa-standards/scripts/no-secrets.mjs`). Dane projektu trafiają do profilu projektu w repo projektu.
- Skill nie zawiera adresów, kont ani ścieżek konkretnego projektu (kryterium z ćwiczenia 3A).

## 4. Nazewnictwo

- Plugin: ……………… (np. `qa-<obszar>`, małe litery, myślnik zamiast spacji)
- Skill: ……………… (np. czasownik lub rzeczownik czynności: `analiza-buildu`, `pw-review`)
- Profil projektu: plik ……………… sekcja ……………… (np. `.claude/test-profile.md`, sekcja wg nazwy skilla). Każdy projekt e2e ma profil z szablonu (w repo demo: `docs/test-profile.template.md`); skill zespołowy bez profilu się zatrzymuje.
- Nazwy `name` w `marketplace.json` i w `plugin.json` muszą być takie same. Nazwy pluginu nie zmieniamy; do zmiany etykiety służy `displayName`.

## 5. Wycofywanie

- Plugin wycofujemy przez usunięcie wpisu z `plugins` i dodanie go do mapy `renames` z wartością `null`.
- Wpis w CHANGELOG z datą i zamiennikiem: ………………
- Usuwać z komputerów użytkowników (`forceRemoveDeletedPlugins: true`)? tak / nie
- Przegląd listy pluginów: co ……… (np. kwartał); kto: ………; co sprawdzamy: nieużywane pluginy, koszt kontekstu skilli (`/skill-doctor`).

## 6. Skąd biorą się nowe pluginy

- Skill, którego używasz w swoim projekcie co najmniej ……… razy, zgłaszasz jako PR do marketplace’u.
- Przed PR: przebudowa na warstwę wspólną i profil projektu (wzór z ćwiczenia 3A).

## 7. Pierwszy tydzień

| Działanie | Kto | Do kiedy |
|---|---|---|
| Założenie repo marketplace’u w Azure Repos | | |
| `marketplace.json` z pierwszym pluginem (wersja 0.1.0) | | |
| Sprawdzenie `claude plugin marketplace add <URL z /_git/>` na jednej stacji | | |
| `.claude/settings.json` z `extraKnownMarketplaces` i `enabledPlugins` w jednym repo pilotażowym | | |
| Karta dla IT (`docs/karta-it.md`) przekazana administratorowi (managed settings, auto-update, poświadczenia git) | | |
| Ustalenie, kto jest adminem marketplace’u i kto go zastępuje | | |

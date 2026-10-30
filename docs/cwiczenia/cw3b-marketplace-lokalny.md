# Ćwiczenie 3B. Skill w marketplace: lokalnie, z wersją i aktualizacją

Blok 3.2, 15:10–16:00 (50 min): struktura pluginu i marketplace’u (6 min), ćwiczenie (15:16–15:41, 25 min), dystrybucja i karta dla IT (11 min), zasady marketplace’u (8 min). Praca indywidualna.

## Cel

Skill z ćwiczenia 3A trafia do pluginu, plugin do marketplace’u, a marketplace na Twój komputer. Wydajesz nową wersję i aktualizujesz ją u siebie. Wszystko robisz na swoim koncie Claude, bez uprawnień administratora organizacji.

Przy okazji widzisz różnicę, która decyduje o tym, jak sekcja będzie dostarczać zmiany:

- marketplace dodany ze ścieżki lokalnej czyta pliki pluginu na miejscu, więc zmiana jest widoczna po `/reload-plugins` niezależnie od wersji;
- marketplace z repozytorium git (GitHub, Azure Repos) instaluje kopię, więc użytkownik dostaje zmianę dopiero wtedy, gdy zmieni się `version`.

## Materiał wejściowy

- Klon repo demo z Twoim skillem `analiza-buildu` z ćwiczenia 3A w `tooling/claude-plugins/qa-standards/skills/` (albo gałąź `solution/3a`).
- `.claude-plugin/marketplace.json` w katalogu głównym repo: marketplace `qa-sekcja`, plugin `qa-standards` ze źródłem `./tooling/claude-plugins/qa-standards`.
- `tooling/claude-plugins/qa-standards/.claude-plugin/plugin.json`: `"version": "0.2.0"`.
- `tooling/claude-plugins/qa-standards/CHANGELOG.md` z zasadą semver sekcji.
- Gałąź `solution/3b`: gotowa wersja 0.3.0 (skill `analiza-buildu` wydany, checklista `pw-review` z punktami 8 i 9, wpis w CHANGELOG).
- `.claude/settings.json` repo deklaruje ten sam marketplace `qa-sekcja` ze źródłem `directory`, `./` (ten sam katalog). Dodanie marketplace’u w kroku 2 nie wchodzi z tym w konflikt.

## Struktura (ściąga)

```text
repo/
  .claude-plugin/marketplace.json        name, owner, plugins[]
  tooling/claude-plugins/qa-standards/
    .claude-plugin/plugin.json           name (wymagane), version, description, author
    skills/analiza-buildu/SKILL.md       wywołanie: /qa-standards:analiza-buildu
    skills/pw-review/SKILL.md
    hooks/hooks.json
    .mcp.json                            Playwright MCP
    CHANGELOG.md
```

Identyfikator instalacji to `<nazwa pluginu>@<nazwa marketplace’u>`, czyli `qa-standards@qa-sekcja`. Nazwa marketplace’u pochodzi z pola `name` w `marketplace.json`; nazwa katalogu ani repozytorium nie ma znaczenia.

## Kroki

Wszystkie polecenia w PowerShell, z katalogu głównego klonu repo demo.

1. **Walidacja pluginu i marketplace’u**
   ```powershell
   claude plugin validate tooling/claude-plugins/qa-standards
   claude plugin validate .
   ```
   Ostatnia linia: `✔ Validation passed`. Uwagi z sekcji „Plugin directory checks” (za krótki README, brak ikony) dotyczą publikacji w katalogu pluginów Anthropic i nie zmieniają wyniku; można je pominąć.
2. **Dodanie marketplace’u ze ścieżki lokalnej.** Ścieżka musi zaczynać się od `./` albo być absolutna. Sama kropka (`.`) daje błąd `Invalid marketplace source format`.
   ```powershell
   claude plugin marketplace add ./
   ```
   Oczekiwany wynik: `Successfully added marketplace: qa-sekcja (declared in user settings)`.
3. **Instalacja pluginu**
   ```powershell
   claude plugin install qa-standards@qa-sekcja
   claude plugin list
   ```
   Zapisz, co pokazują pola `Version` (0.2.0) i `Read from` (katalog pluginu w Twoim klonie).
4. **Uruchomienie skilla z marketplace’u.** Otwórz sesję `claude` w katalogu głównym repo i wpisz `/qa-standards:analiza-buildu e2e/shop/demo-runs/failed`.
5. **Zmiana bez wersji.** Dopisz do `references/kategorie.md` nowy sygnał (np. dla kategorii „środowisko”). W otwartej sesji wpisz `/reload-plugins` i uruchom skill ponownie. Zmiana działa, choć `version` się nie zmienił.
6. **Wydanie wersji 0.3.0.** Wybierz jedną drogę:
   - **własna zmiana:** w `plugin.json` zmień `"version": "0.2.0"` na `"0.3.0"`, w `CHANGELOG.md` dopisz `## 0.3.0` (co się zmieniło i dlaczego minor: nowy skill), potem
     ```powershell
     claude plugin validate .
     git add -A
     git commit -m "qa-standards 0.3.0: skill analiza-buildu"
     ```
   - **gotowa wersja:** `git switch solution/3b` (najpierw zatwierdź albo odłóż własne zmiany: `git stash`).
7. **Aktualizacja u siebie**
   ```powershell
   claude plugin marketplace update qa-sekcja
   claude plugin update qa-standards@qa-sekcja
   claude plugin list
   ```
   Oczekiwany wynik `update`: `Plugin "qa-standards" updated from 0.2.0 to 0.3.0 for scope user. Restart to apply changes.` Nowa wersja ładuje się w następnej sesji albo po `/reload-plugins`.
8. **Podgląd szczegółów:** `claude plugin list --json`. Porównaj pola `version` (zapisana przy instalacji albo aktualizacji) i `folderVersion` (odczytana z katalogu). Po `git switch main` `folderVersion` wraca do 0.2.0, bo plugin jest czytany z bieżących plików klonu.
9. **Sprzątanie po ćwiczeniu** (marketplace sekcji dodasz później z Azure Repos):
   ```powershell
   claude plugin marketplace remove qa-sekcja
   ```
   Polecenie usuwa marketplace i odinstalowuje jego pluginy.

## Co działa na każdym koncie, a co wymaga administratora

| Działanie | Kto | Gdzie |
|---|---|---|
| `marketplace add` ze ścieżki, z GitHuba, z URL git (także Azure Repos z `/_git/`) | każdy | ustawienia użytkownika |
| `plugin install`, `update`, `disable`, `uninstall`, `validate` | każdy | shell albo `/plugin` |
| Marketplace i pluginy w repo projektu: `extraKnownMarketplaces` i `enabledPlugins` w `.claude/settings.json`; po zaufaniu folderowi Claude Code proponuje instalację | każdy z prawem zapisu do repo | repo projektu |
| Auto-update dla siebie: `/plugin` → Marketplaces → wybór marketplace’u → Enable auto-update | każdy | `/plugin` |
| Plugin wymuszony u wszystkich (`enabledPlugins: true` w managed settings), zablokowany (`false`), lista dozwolonych marketplace’ów (`strictKnownMarketplaces`) | administrator stacji (IT) | plik managed settings na komputerze |
| Auto-update włączony dla wszystkich (`autoUpdate: true` w managed `extraKnownMarketplaces`) | administrator stacji (IT) | plik managed settings |
| Dystrybucja przez ustawienia organizacji na claude.ai (Organization settings → Plugins & skills, połączenie z GitHub albo GitLab) | administrator organizacji Claude, plan Team/Enterprise | claude.ai |

Trzy ostatnie wiersze trener pokazuje na swoim koncie i swojej organizacji. U Was to zadania dla IT, opisane na karcie dla IT (`docs/karta-it.md` w repo demo). Przykład pliku managed settings: `docs/przyklady/managed-settings.example.json`.

Auto-update w tle wymaga poświadczeń git, które odpowiadają bez pytania (Git Credential Manager z zapisanym tokenem albo klucz SSH w agencie). Jeśli helper musiałby zapytać o hasło, aktualizacja cicho zawodzi i zostaje poprzednia wersja.

## Kryterium „gotowe”

1. `claude plugin validate .` kończy się `✔ Validation passed`.
2. `claude plugin list` pokazuje `qa-standards@qa-sekcja` w wersji 0.3.0.
3. `/qa-standards:analiza-buildu` zainstalowany z marketplace’u działa dla raportu sklepu i backoffice, a po kroku 5 korzysta ze zmienionego `references/kategorie.md`.
4. `CHANGELOG.md` ma wpis 0.3.0 z uzasadnieniem rodzaju zmiany.
5. Umiesz powiedzieć, dlaczego w kroku 5 zmiana zadziałała bez nowej wersji i dlaczego w marketplace z Azure Repos użytkownicy nie dostaliby jej bez podbicia `version`.

## Artefakt do zabrania

- Struktura pluginu z wersją i changelogiem, gotowa do przeniesienia do repo marketplace’u sekcji w Azure Repos.
- Szablon zasad marketplace’u (`docs/szablony/zasady-marketplace.md`), wypełniany wspólnie w ostatnich 8 minutach bloku.

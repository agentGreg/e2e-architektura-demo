# Ćwiczenie 3A. Skill zespołowy „analiza nieudanego buildu E2E”

Blok 3.1, 14:17–14:55 (38 min), po przerwie domknięcie 15:10–15:13 (3 min: kto nie skończył, `git stash` i `git switch solution/3a`, bo 3B potrzebuje działającego skilla; kto skończył, sprawdza kryterium 4). Wcześniej w bloku: „gdzie co umieścić” (11 min) i demo Playwright MCP (11 min). Praca indywidualna albo w parach.

## Cel

Budujesz skill, który po czerwonym buildzie przechodzi przez wyniki testów i dla każdej porażki mówi, do której kategorii należy, jaki jest dowód i kto ma się tym zająć. Skill ma dwie warstwy:

- **warstwa wspólna** w pluginie `qa-standards`: `SKILL.md` (proces), `references/` (kategorie, porównanie prób), `scripts/` (odczyt raportu). Jedna dla całej sekcji, trafia do marketplace’u.
- **profil projektu** `.claude/test-profile.md` w katalogu projektu e2e: skąd raporty, adres środowiska, konta i role, prefiks danych, zasoby wyłączne, właściciele. Jeden na projekt.

Skill, który ma w procedurze wpisany URL, nazwę konta albo ścieżkę konkretnego projektu, nie przenosi się do drugiego projektu. To najczęstsza przyczyna, dla której skille zostają u autora.

## Materiał wejściowy

Repo demo, gałąź `main`:

- Skill w stanie „przed”: `e2e/shop/.claude/skills/analiza-buildu/SKILL.md`. Działa tylko w sklepie: ma wpisane adresy, konta, nazwy produktów, ścieżki raportów i nazwy plików testów.
- Plugin `tooling/claude-plugins/qa-standards/` (ma skill `pw-review` jako wzór formatu).
- Szkielet skilla: `tooling/claude-plugins/qa-standards/skills/analiza-buildu/SKILL.skeleton.md`. Claude Code go nie ładuje, dopóki nie zmienisz nazwy na `SKILL.md` (krok 3).
- Szablon profilu projektu: `docs/test-profile.template.md`.
- Generator nieudanego buildu: `pnpm demo:failures` (działa na każdej gałęzi). Dla sklepu i backoffice daje `e2e/<app>/demo-runs/ok/` (próba udana, 1 worker) i `e2e/<app>/demo-runs/failed/` (próba nieudana: `--workers=4 --repeat-each=3 --retries=1`), w każdym `results.json`, `junit.xml`, `playwright-report/`, `test-results/` z trace. Kolizje i flaky są losowe, więc liczby różnią się między uruchomieniami (pomiar z 30.10):

  | Gałąź | Sklep: testy / nieudane / flaky | Backoffice: testy / nieudane / flaky | Czas generatora |
  |---|---|---|---|
  | `main` | 48 / 12–14 / 4–5 | 33 / 8 / 3–4 | ok. 1,5 min |
  | `solution/3a` | 55 / 11–12 / 3–5 | 37 / 6 / 4–5 | ok. 2,5 min |

  Porażki pięciu kategorii opisuje `e2e/shop/demo-failures/README.md` (np. flaky: komunikat znika po losowych 1–2 s, a test czeka stałe 1,2 s).
- `.claude/agents/flaky-triage.md`: subagent z podobnymi kategoriami (możesz skopiować opisy).

## Kategorie porażek (warstwa wspólna)

Kolejność to priorytet, gdy pasują dwie: wyżej wygrywa.

| Kategoria | Typowe sygnały | Działanie |
|---|---|---|
| środowisko | `ECONNREFUSED`, timeout na `/health` albo pierwszym `goto`, 502/504; pada wszystko na tym środowisku | zgłoszenie do DevOpsów albo poprawa `webServer` |
| uprawnienia | 401/403, „Brak uprawnień”, przekierowanie na logowanie w środku testu | właściwa rola przez `storageState` |
| uszkodzone dane | dane wyjściowe inne niż seed już na początku testu; pada też na 1 workerze | odtworzenie danych bazowych, seed idempotentny |
| kolizja danych | wartość o 1–2 inna od oczekiwanej, „już anulowane”, „nie znaleziono”; zielony na 1 workerze, czerwony na N | dane per worker (prefiks), `lock`, projekt `workers: 1` |
| flaky | `waitForTimeout`, krótki `timeout`, wynik `flaky` (przeszedł po retry); mieszane wyniki przy `--repeat-each` na 1 workerze | asercja z auto-wait, kwarantanna z właścicielem |
| bug | ta sama porażka w każdej próbie, także na 1 workerze; aplikacja liczy źle, błąd 500 | zgłoszenie do deweloperów z trace |

Reguła porównania prób: test zielony w próbie udanej (1 worker) i czerwony w nieudanej (N workerów) to kolizja danych albo flaky. Czerwony w obu to bug, uprawnienia, dane albo środowisko. Status `flaky` w raporcie sam niczego nie rozstrzyga: przy retry kolizja też go dostaje. Odróżnisz ją po danych (nazwy bez prefiksu workera, wartości „o 1 za dużo”) i po tym, że test jest stabilny na 1 workerze.

## Szkielet SKILL.md

Plik `tooling/claude-plugins/qa-standards/skills/analiza-buildu/SKILL.skeleton.md` w repo. Ma frontmatter i pięć kroków; miejsca do uzupełnienia oznaczone `TODO`:

1. Profil projektu: które pola profilu są potrzebne w dalszych krokach.
2. Zbierz porażki: jak dostać listę porażek z `results.json` / `junit.xml` i wynik tego samego testu w próbie udanej. Nie czytaj `results.json` w całości: to dziesiątki tysięcy linii.
3. Dowody per porażka: czego szukać (lista sygnałów).
4. Klasyfikacja: reguła rozstrzygania, gdy pasują dwie kategorie.
5. Wynik: tabela `test | kategoria | dowód | działanie | właściciel` (gotowe, bez `TODO`).

Pliki do utworzenia obok `SKILL.md`:

- `references/kategorie.md`: tabela kategorii z tego arkusza, rozwinięta o kolumnę „jak potwierdzić” i o sygnały z Twojego doświadczenia.
- `references/test-profile.template.md`: kopia `docs/test-profile.template.md` (treść niżej).
- `references/trace.md` i `scripts/parse-report.mjs`: odczyt trace bez UI i skrypt, który z `results.json` albo `junit.xml` wyciąga porażki i porównuje je z próbą udaną. Nie są sednem ćwiczenia, więc możesz je wziąć gotowe z gałęzi rozwiązania:
  ```powershell
  git checkout origin/solution/3a -- tooling/claude-plugins/qa-standards/skills/analiza-buildu/references/trace.md tooling/claude-plugins/qa-standards/skills/analiza-buildu/scripts/parse-report.mjs
  ```

## Szablon profilu projektu

Plik `e2e/<projekt>/.claude/test-profile.md`, jeden na projekt. Szablon w repo: `docs/test-profile.template.md`.

```yaml
projekt: <nazwa, np. shop>
srodowisko:
  url: <adres aplikacji>
  health: <adres health-checka>
  uruchomienie: <polecenie uruchamiające testy; czy aplikacja startuje przez webServer>
raporty:
  lokalnie: <katalog raportu HTML; katalog test-results z error-context.md i trace.zip>
  z_pipelinu: <nazwa artefaktu z raportem po merge-reports; gdzie junit.xml>
  format: <json / junit / html / blob>
konta_i_role:
  - rola: <nazwa roli>
    skad: <fixture / storageState z projektu setup / konto bazowe>
dane_testowe:
  prefiks: <konwencja nazw danych tworzonych przez testy>
  bazowe: <rekordy "od zawsze", których testy nie modyfikują>
  sprzatanie: <gdzie jest teardown; jak sprawdzić, że nic nie zostało>
zasoby_wylaczne:
  - <zasób globalny i mechanizm: lock / projekt workers: 1>
konwencje:
  tagi: <lista tagów>
  nazwy_testow: <wzorzec>
  lokatory: <strategia; lista data-testid>
wlasciciele:
  test-core: <osoba>
  dane_testowe: <osoba>
  srodowisko: <zespół / osoba>
  deweloperzy: <zespół / kanał zgłoszeń>
znane_problemy:
  - <rzeczy, które mylą analizę: animacje, flagi, zależne serwisy>
```

## Kroki

PowerShell, z katalogu głównego repo.

1. **Wygeneruj czerwone buildy** (z dowolnej gałęzi):
   ```powershell
   pnpm demo:failures
   ```
   Wynik: `e2e/shop/demo-runs/{ok,failed}/` i `e2e/backoffice/demo-runs/{ok,failed}/`. Katalogi `demo-runs/` nie są śledzone przez git, więc zostają po zmianie gałęzi.
2. **Sprawdź skill „przed”.** W `e2e/shop` uruchom `claude`, potem `/analiza-buildu demo-runs/failed`. Działa. Teraz zaznacz w jego `SKILL.md` każdą linię, która dotyczy tylko sklepu.
3. **Rozdziel warstwy.** Zmień nazwę szkieletu i skopiuj szablon profilu do pluginu:
   ```powershell
   $skill = "tooling/claude-plugins/qa-standards/skills/analiza-buildu"
   Move-Item "$skill/SKILL.skeleton.md" "$skill/SKILL.md"
   New-Item -ItemType Directory -Force "$skill/references" | Out-Null
   Copy-Item docs/test-profile.template.md "$skill/references/test-profile.template.md"
   ```
   ```bash
   skill=tooling/claude-plugins/qa-standards/skills/analiza-buildu
   mv "$skill/SKILL.skeleton.md" "$skill/SKILL.md"
   mkdir -p "$skill/references" && cp docs/test-profile.template.md "$skill/references/"
   ```
   Proces i kategorie przenieś do `SKILL.md` (uzupełnij `TODO`), wszystko, co zaznaczyłeś w kroku 2, do `e2e/shop/.claude/test-profile.md`. Utwórz `references/kategorie.md`. Usuń skill z `e2e/shop/.claude/skills/`, żeby nie zostały dwie wersje:
   ```powershell
   git rm -r e2e/shop/.claude/skills/analiza-buildu
   ```
4. **Profil backoffice.** Utwórz `e2e/backoffice/.claude/test-profile.md`. Skill zostaje bez zmian.
5. **Uruchom skill z pluginu** (bez marketplace’u, to będzie w 3B), z katalogu głównego repo:
   ```powershell
   claude --plugin-dir tooling/claude-plugins/qa-standards
   ```
   W sesji: `/qa-standards:analiza-buildu e2e/shop/demo-runs/failed --ok e2e/shop/demo-runs/ok`, potem `/qa-standards:analiza-buildu e2e/backoffice/demo-runs/failed --ok e2e/backoffice/demo-runs/ok`.
6. **Sprawdź brak profilu:** przenieś na chwilę `e2e/backoffice/.claude/test-profile.md` w inne miejsce i uruchom skill dla backoffice.

## Kryterium „gotowe”

1. `SKILL.md` nie zawiera adresu, roli ani selektora:
   ```powershell
   Select-String -Path tooling/claude-plugins/qa-standards/skills/analiza-buildu/SKILL.md -Pattern 'localhost|http|getBy'
   ```
   ```bash
   grep -nE 'localhost|http|getBy' tooling/claude-plugins/qa-standards/skills/analiza-buildu/SKILL.md
   ```
   zwraca 0 linii.
2. Jeden skill, dwa profile: ten sam skill w sklepie i w backoffice daje tabelę z kategorią, dowodem i właścicielem dla każdej porażki. Między uruchomieniami zmienia się tylko profil.
3. W sklepie kategorie zgadzają się z `e2e/shop/demo-failures/README.md`: kolizja danych, flaky, bug, uprawnienia, środowisko. Kolizja nie jest pomylona z flaky. Uwaga: próba nieudana biegnie z `--retries=1`, więc kolizja, która przeszła po ponowieniu, też ma w raporcie status `flaky`. Kategorię rozstrzyga porównanie z próbą udaną (`demo-runs/ok`, 1 worker) i nazwy danych w błędzie: produkt o stałej nazwie zamiast nazwy z prefiksem workera to kolizja.
4. Bez profilu skill zatrzymuje się i prosi o profil.
5. `SKILL.md` ma mniej niż 150 linii; szczegóły są w `references/` i `scripts/`.

## Alternatywa: własny skill

Jeśli masz skill, który działa tylko w Twoim projekcie, możesz przebudować go zamiast szkieletu:

1. Wypisz wszystko, co w nim jest projektowe: organizacja w trackerze, adresy, sposób logowania, role, konwencje stanów, osoby do decyzji, sposób pozyskania danych.
2. Przenieś to do profilu projektu (dodatkowe pola w `test-profile.md` albo osobna sekcja).
3. W `SKILL.md` zostaw proces i odwołania do pól profilu. Skrypty pomocnicze parametryzuj wartościami z profilu.
4. Napisz drugi profil dla innego projektu (choćby wymyślonego) i sprawdź, czy skill nie wymaga zmian.

Kryteria 1, 4 i 5 obowiązują bez zmian. Kryterium 2: dwa profile, jeden skill.

## Artefakt do zabrania

Katalog skilla `analiza-buildu/` (warstwa wspólna) i profil projektu. Skill jest wejściem do ćwiczenia 3B, gdzie trafia do marketplace’u.

## Rozwiązanie wzorcowe

Repo demo, gałąź `solution/3a`:

- `SKILL.md` (57 linii): pięć kroków (profil, porażki ze skryptu, dowody, klasyfikacja, wynik). Szuka profilu od katalogu raportu w górę, więc jeden skill uruchomiony z katalogu głównego obsługuje oba projekty.
- `references/kategorie.md`: kategorie z kolumnami „sygnały”, „jak potwierdzić”, „działanie”, „typowy właściciel” i kolejnością priorytetu.
- `references/trace.md`: jak wypisać akcje z `trace.zip` bez UI i porównać próby.
- `scripts/parse-report.mjs`: czyta `results.json` albo `junit.xml`, grupuje powtórzenia, podaje pierwszą linię błędu, ścieżki trace i `error-context.md` oraz wynik w próbie udanej. Działa też bez Claude:
  ```powershell
  node tooling/claude-plugins/qa-standards/skills/analiza-buildu/scripts/parse-report.mjs e2e/shop/demo-runs/failed
  ```
- Profile `e2e/shop/.claude/test-profile.md` i `e2e/backoffice/.claude/test-profile.md`: różnią się adresem, kontami, zasobami wyłącznymi (tryb konserwacji tylko w backoffice) i właścicielami.

```powershell
git diff main origin/solution/3a -- tooling e2e/shop/.claude e2e/backoffice/.claude
```

# Karta wymagań dla pipeline’u E2E

Do uzupełnienia na sali (blok 2.3, ok. 10 min; liczby z arkusza „Policz shardy” z bloku 2.2) i przekazania DevOpsom. Sekcja testów dostarcza konfigurację po stronie Playwright: `playwright.config.ts`, skrypty, reporter `blob`. Pipeline w Azure DevOps konfigurują DevOpsi. Na szkoleniu nie konfigurowaliśmy ADO.

Przykład do pokazania DevOpsom: `azure-pipelines.yml` w repo demo. Oznaczenie w pliku: przykład, nie testowany w ADO. Zadanie scalające raporty jest naszym tłumaczeniem przykładu z GitHub Actions, bo przykład Azure Pipelines w dokumentacji Playwright pokazuje tylko macierz shardów.

Projekt: ………………………………  Osoba z sekcji testów: ………………………  Data: …………

## Wymagania

| # | Wymaganie | Po co | Wartość dla projektu | Potwierdza DevOps |
|---|---|---|---|---|
| 1 | **Wersja Playwright na agencie** = wersja `@playwright/test` w repo. Obraz `mcr.microsoft.com/playwright:v<wersja>-noble` albo `npx playwright install --with-deps` | przeglądarki i biblioteki systemowe pasują do wersji pakietu | wersja: ………… | ☐ |
| 2 | **Node** w wersji wymaganej przez repo, `corepack enable` dla pnpm | Playwright wymaga aktualnego 22.x, 24.x albo 26.x | wersja: ………… | ☐ |
| 3 | **Macierz zadań** `projekt × shard`, polecenie z `--shard=<i>/<N>` | czas pipeline’u dzielony przez liczbę shardów | projekty: ………… N: ………… | ☐ |
| 4 | **Równoległe zadania w ADO**: tyle agentów (równoległych jobów), ile shardów w macierzy | jeśli agentów jest mniej, shardy czekają w kolejce i zysk znika | dostępne: ………… potrzebne: ………… | ☐ |
| 5 | **Workery na agencie**: liczba rdzeni agenta znana sekcji testów | `workers` w konfiguracji ustawiamy pod agenta | rdzenie: ………… `workers`: ………… | ☐ |
| 6 | **Zmienne środowiskowe**: `CI=true`; identyfikator uruchomienia wspólny dla wszystkich shardów (numer buildu: `$(Build.BuildId)`; repo demo czyta go samo ze zmiennej `BUILD_BUILDID` albo z `E2E_RUN_ID`); adres środowiska testowego | `CI` włącza retries, reporter `blob` i `forbidOnly`; identyfikator i numer sharda trafiają do prefiksu danych (`e2e_<run>_s<shard>_w<worker>_`), więc po konkretnym buildzie da się posprzątać | nazwy zmiennych: ………… | ☐ |
| 7 | **Sekrety** (konta testowe, connection stringi) w zmiennych tajnych pipeline’u albo grupie zmiennych, nie w repo | | grupa zmiennych: ………… | ☐ |
| 8 | **Artefakt blob z każdego sharda**: publikacja katalogu `blob-report` per zadanie, nazwa z numerem sharda, także gdy testy padły (`condition: succeededOrFailed()`) | bez blobów z czerwonych shardów nie ma pełnego raportu | ścieżka: ………… | ☐ |
| 9 | **Zadanie scalające** po macierzy: pobranie wszystkich blobów, `npx playwright merge-reports --reporter html,junit <katalog>`, publikacja raportu HTML jako artefaktu | jeden raport z wszystkich shardów | | ☐ |
| 10 | **JUnit do ADO**: `PublishTestResults@2` z pliku JUnit ze scalania | zakładka testów i trend w ADO | plik: ………… | ☐ |
| 11 | **Retries tylko na CI** (np. 2), lokalnie 0 | lokalnie retry maskuje kolizje danych | retries: ………… | ☐ |
| 12 | **Testy niestabilne**: decyzja, czy `flaky` ma blokować build (`failOnFlakyTests`) | w JUnit test `flaky` wygląda jak zaliczony (sprawdzone na Playwright 1.64.1), więc trend flaky trzeba brać z raportu HTML/JSON | decyzja: ………… | ☐ |
| 13 | **Kwarantanna**: osobne zadanie z `--grep @quarantine`, bez wpływu na status (`continueOnError: true`) | testy w kwarantannie dalej zbierają dane, ale nie blokują wydań | | ☐ |
| 14 | **Testy na zasobach wyłącznych** (`workers: 1`, osobny projekt): osobne zadanie poza macierzą albo jeden shard | nie mogą biec równolegle z resztą | projekt: ………… | ☐ |
| 15 | **Cache** store pnpm i przeglądarek (gdy bez kontenera) | krótszy narzut każdego zadania | | ☐ |
| 16 | **Czas**: limit czasu zadania (`timeoutInMinutes`) większy niż najdłuższy shard + narzut | ADO nie może ubić zadania przed końcem testów | limit: ………… | ☐ |
| 17 | **Środowisko testowe** dostępne z agentów i wytrzymujące `N × workers` równoczesnych sesji | więcej równoległości to większe obciążenie aplikacji i bazy | sesje: ………… | ☐ |

## Liczby z arkusza „Policz shardy” (blok 2.2)

| | Wartość |
|---|---|
| Czas pipeline’u dziś | |
| Docelowy czas | |
| Shardy `N` × workery na agencie | |
| Narzut jednego zadania | |
| Testy poza macierzą i ich czas | |

## Do sprawdzenia przez DevOpsów

- Zadanie scalające z przykładu w repo demo (nie było testowane w ADO).
- Czy `merge-reports` widzi bloby po pobraniu artefaktów (struktura katalogów po `DownloadPipelineArtifact@2`).
- Zmienna `PLAYWRIGHT_JUNIT_INCLUDE_RETRIES=1` (nieudokumentowana, sprawdzona na 1.64.1) liczy w JUnit nieudane próby przed retry jako porażki: zielony build pokaże wtedy w ADO czerwone testy. Decyzja, czy jej używać.

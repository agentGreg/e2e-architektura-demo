# Karta wymagań dla pipeline’u E2E (do przekazania DevOpsom)

Sekcja testów dostarcza konfigurację po stronie Playwright (`playwright.config.ts`, skrypty, reporter `blob`). Poniżej lista tego, co musi być po stronie pipeline’u, z uzasadnieniem. Przykład: `azure-pipelines.yml` w tym repo (nie testowany w ADO, do weryfikacji przez DevOpsów) i `.github/workflows/e2e.yml` (wzór z dokumentacji Playwright).

| # | Wymaganie | Po co | Jak (przykład) |
|---|---|---|---|
| 1 | Obraz `mcr.microsoft.com/playwright:v1.64.1-noble` albo `npx playwright install --with-deps` na agencie | przeglądarki i zależności systemowe w tej samej wersji co `@playwright/test` | `container:` w zadaniu; wersja obrazu = wersja pakietu |
| 2 | Node 24 LTS (minimum 22.13) i `corepack enable` | `node:sqlite` w repo demo; pnpm z `packageManager` | `UseNode@1` z `version: '24'` |
| 3 | Macierz zadań `project × shard` z `--shard=$(shard)` | czas pipeline’u dzielony przez liczbę shardów | `strategy.matrix` jak w `azure-pipelines.yml`; liczba shardów = czas całości / docelowy czas zadania |
| 4 | `CI=true` | `retries`, reporter `blob`, `forbidOnly`, brak reużycia serwera | `variables` albo `env` zadania |
| 5 | `E2E_RUN_ID=$(Build.BuildId)` | prefiks danych testowych `e2e_<run>_w<worker>_`; sprzątanie i diagnoza po numerze buildu | `env` zadania; lokalnie `Date.now()` |
| 6 | Sekrety (konta testowe, connection string) w zmiennych pipeline’u, nie w repo | | zmienne tajne / grupa zmiennych |
| 7 | `PublishPipelineArtifact@1` z `blob-report` per zadanie, nazwa z numerem sharda | bloby z każdego sharda do scalenia | `artifact: blob-report-$(app)-$(System.JobPositionInPhase)`, `condition: succeededOrFailed()` |
| 8 | Zadanie scalające po macierzy | jeden raport HTML + JUnit z wszystkich shardów | `DownloadPipelineArtifact@2` wszystkich blobów → `merge-reports --reporter html,junit` → publikacja `playwright-report` + `PublishTestResults@2` |
| 9 | `condition: succeededOrFailed()` na publikacji i scalaniu | raport także z czerwonego buildu | |
| 10 | Osobne zadanie `quarantine` (`--grep @quarantine`) bez wpływu na status | testy w kwarantannie nadal biegną i zbierają dane, nie blokują | `continueOnError: true` |
| 11 | `retries: 2` tylko na CI; `failOnFlakyTests` wg decyzji zespołu | lokalnie 0, żeby nie maskować kolizji | w `playwright.config.ts`, sterowane `CI` |
| 12 | `workers` = liczba rdzeni agenta (albo `'50%'`) | | w konfiguracji: `workers: process.env.CI ? 4 : undefined` |
| 13 | Cache `node_modules`/store pnpm i przeglądarek | czas instalacji | `Cache@2` na `~/.local/share/pnpm/store` i `~/.cache/ms-playwright` (gdy bez kontenera) |
| 14 | Baza testowa dostępna z agenta, z izolacją danych per uruchomienie | workery i shardy piszą równocześnie | prefiks z pkt 5; w repo demo plik SQLite per agent |

Uwagi:
- W XML JUnit test `flaky` wygląda jak `passed` (sprawdzone w źródle reportera, nie w docs); trend flaky bierzemy z raportu HTML/JSON albo `PLAYWRIGHT_JUNIT_INCLUDE_RETRIES=1` (nieudokumentowane, do sprawdzenia na Waszej wersji).
- Przykład Azure Pipelines w dokumentacji Playwright pokazuje macierz shardów bez zadania scalającego; zadanie scalające w `azure-pipelines.yml` jest naszym tłumaczeniem przykładu z GitHub Actions.

# e2e-architektura-demo

Repo demo do warsztatu „Architektura automatyzacji testów i agenci AI w skali zespołu” (2.11.2026). Monorepo pnpm: dwie małe aplikacje (sklep i backoffice), wspólny pakiet testowy i dwa projekty Playwright. Baza: SQLite przez wbudowany `node:sqlite`, bez zależności natywnych.

```
apps/shop            sklep: logowanie, produkty, koszyk, zamówienia, panel admina (port 4100)
apps/backoffice      zamówienia, anulowanie, tryb konserwacji sklepu (port 4200)
packages/app-kit     wspólny kod aplikacji (baza, mini-router); nie jest częścią frameworka testowego
packages/test-core   fixtures, klient API, seed, adapter bazy (query/exec/transaction)
e2e/shop             testy sklepu; examples/ = trzy warianty jednego testu; demo-failures/ = materiał do 3A
e2e/backoffice       testy backoffice
tooling/claude-plugins/qa-standards   plugin Claude Code (marketplace `qa-sekcja` w .claude-plugin/)
docs/                ADR, ćwiczenia, szablony, karty wymagań (pipeline, IT), szablon profilu projektu
scripts/             uruchamianie aplikacji, reset bazy, sharding, scalanie raportów, paczka offline
```

Gałęzie: `main` (stan „przed”: kolizje przy 4 workerach), `solution/2a`, `solution/3a`, `solution/3b`.

## Materiały szkolenia

- Ćwiczenia: [`docs/cwiczenia/`](docs/cwiczenia/README.md): 2A fixtures i dane, policz shardy, przypadki z sali (zasób wyłączny), 3A skill `analiza-buildu`, 3B marketplace lokalnie.
- Szablony: [`docs/szablony/`](docs/szablony/): [ADR](docs/szablony/adr.md), [zasady marketplace’u](docs/szablony/zasady-marketplace.md), [plan wdrożenia](docs/szablony/plan-wdrozenia.md). Szablon profilu projektu dla skilli: [`docs/test-profile.template.md`](docs/test-profile.template.md).
- Karta wymagań dla pipeline’u (dla DevOpsów): [`docs/pipeline-requirements.md`](docs/pipeline-requirements.md).
- Karta dla IT (managed settings, marketplace, proxy): [`docs/karta-it.md`](docs/karta-it.md); przykład pliku managed settings: [`docs/przyklady/managed-settings.example.json`](docs/przyklady/managed-settings.example.json).
- Szkielety do ćwiczeń: `packages/test-core/src/fixtures.skeleton.ts` (2A), `tooling/claude-plugins/qa-standards/skills/analiza-buildu/SKILL.skeleton.md` (3A).
- Rozwiązania wzorcowe: gałęzie `solution/2a` (fixtures z izolacją, storageState, `lock`, pula zasobów, sharding), `solution/3a` (skill zespołowy w pluginie i profile projektów), `solution/3b` (plugin 0.3.0). Każda następna zawiera poprzednią. Porównanie: `git diff main origin/solution/2a -- packages/test-core e2e/shop`.
- Po szkoleniu stan repo z dnia szkolenia zostanie oznaczony tagiem `szkolenie-2026-11-02`.

## Wymagania

- Windows 11 (lub macOS/Linux), **Node.js >= 22.13** (zalecane 24 LTS). Sprawdź: `node --version`. Node 20 nie zadziała (brak `node:sqlite`, Playwright 1.64 też go nie wspiera).
- Git, PowerShell. Claude Code do bloku 3 (`claude --version`).
- pnpm instaluje się przez Corepack (jest w Node), nic więcej.

## Start (PowerShell)

Repo sklonuj do katalogu lokalnego **poza OneDrive** (np. `C:\e2e`). Plik bazy `data\shop.db` jest w trybie WAL i wiele procesów pisze do niego naraz; na folderze synchronizowanym albo udziale sieciowym to się psuje. Jeśli repo musi leżeć w OneDrive, ustaw `$env:E2E_DB_PATH = "C:\e2e\shop.db"`.

```powershell
git clone https://github.com/agentGreg/e2e-architektura-demo.git C:\e2e\e2e-architektura-demo
cd C:\e2e\e2e-architektura-demo
corepack enable
pnpm install
pnpm exec playwright install chromium
pnpm test:smoke
```

`pnpm test:smoke` uruchamia jeden test (aplikacja startuje sama przez `webServer`). Zielony = środowisko gotowe.

Inne polecenia:

```powershell
pnpm dev                       # obie aplikacje w jednym terminalu (http://localhost:4100, :4200)
pnpm test                      # oba projekty e2e (backoffice biegnie także, gdy sklep padnie)
pnpm --filter e2e-shop exec playwright test --workers=4 --repeat-each=2   # kolizje na main
pnpm --filter e2e-shop exec playwright test --ui
pnpm db:reset                  # świeża baza (przy zatrzymanych aplikacjach)
pnpm seed:check                # czy po testach zostały dane z prefiksem e2e_
pnpm test:shard                # 2 shardy + bloby; potem pnpm report:merge
pnpm typecheck
```

Jeśli po `pnpm db:reset` testy zachowują się dziwnie, sprawdź, czy nie działa stary proces na porcie 4100/4200 (`Get-NetTCPConnection -LocalPort 4100`): stary proces trzyma stary plik bazy.

## Claude Code i Playwright MCP

Repo ma `.mcp.json` (zakres projektu) z serwerem `playwright` (`npx @playwright/mcp@latest --isolated --caps=testing`). Po otwarciu repo w Claude Code zatwierdź serwer; `claude mcp list` w katalogu klonu pokaże status. Nie dodawaj drugiego serwera `playwright` przez `claude mcp add` (wpis lokalny przesłania ten z repo); jeśli chcesz mieć go poza repo, podaj te same flagi:

```powershell
claude mcp add playwright --scope user -- npx @playwright/mcp@latest --isolated --caps=testing
```

Jeśli na Windows serwer stdio przez `npx` nie startuje, w `.mcp.json` użyj wariantu:

```json
{ "mcpServers": { "playwright": { "command": "cmd", "args": ["/c", "npx", "@playwright/mcp@latest", "--isolated", "--caps=testing"] } } }
```

Plugin sekcji: `.claude/settings.json` deklaruje marketplace `qa-sekcja` ze źródłem `directory ./` (katalog klonu), bez wymuszonych pluginów (`enabledPlugins` puste). Plugin `qa-standards` instalujesz sam w ćwiczeniu 3B:

```powershell
claude plugin validate .
claude plugin marketplace add C:\e2e\e2e-architektura-demo
claude plugin install qa-standards@qa-sekcja
```

## Proxy firmowe

```powershell
$env:HTTPS_PROXY = "http://proxy.firma:8080"
$env:HTTP_PROXY  = $env:HTTPS_PROXY
$env:NO_PROXY    = "localhost,127.0.0.1"
$env:NODE_EXTRA_CA_CERTS = "C:\certs\firma-ca.pem"   # certyfikat proxy inspekcyjnego
npm config set proxy $env:HTTPS_PROXY
npm config set https-proxy $env:HTTPS_PROXY
npm config set cafile C:\certs\firma-ca.pem
```

Pobranie przeglądarek przez proxy: `pnpm exec playwright install chromium` używa `HTTPS_PROXY`. Gdy nie ma dostępu do GitHuba ani npm: paczka offline.

## Paczka offline

Trener ma pendrive z zipem: repo + `node_modules` + przeglądarki. Rozpakuj do `C:\e2e`, w PowerShell:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "C:\e2e\ms-playwright"
cd C:\e2e\e2e-architektura-demo
corepack enable
pnpm test:smoke
```

Skrypt budujący paczkę: `pnpm offline:pack` (szczegóły w `scripts/offline-pack.mjs`).

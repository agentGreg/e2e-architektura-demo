# qa-standards

Plugin sekcji testów. Instalacja z marketplace’u tego repo:

```powershell
claude plugin marketplace add agentGreg/e2e-architektura-demo
claude plugin install qa-standards@qa-sekcja --scope project
```

Lokalnie (własny klon jako marketplace; kroki i oczekiwane wyniki: `docs/cwiczenia/cw3b-marketplace-lokalny.md`). Polecenia z katalogu głównego klonu, nie z katalogu pluginu:

```powershell
claude plugin validate .
claude plugin marketplace add ./
claude plugin install qa-standards@qa-sekcja
```

Zawartość: `skills/` (`/qa-standards:pw-review`, `/qa-standards:analiza-buildu`), `hooks/hooks.json` (zakaz sekretów), `.mcp.json` (Playwright MCP), `CHANGELOG.md`.

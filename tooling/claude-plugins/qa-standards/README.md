# qa-standards

Plugin sekcji testów. Instalacja z marketplace’u tego repo:

```powershell
claude plugin marketplace add agentGreg/e2e-architektura-demo
claude plugin install qa-standards@qa-sekcja --scope project
```

Lokalnie (własny klon jako marketplace, ćwiczenie 3B część 1):

```powershell
claude plugin validate .
claude plugin marketplace add C:\e2e\e2e-architektura-demo
claude plugin install qa-standards@qa-sekcja
```

Zawartość: `skills/` (`/qa-standards:pw-review`), `hooks/hooks.json` (zakaz sekretów), `.mcp.json` (Playwright MCP), `CHANGELOG.md`.

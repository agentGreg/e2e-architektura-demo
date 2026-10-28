# Changelog: qa-standards

Semver: patch = treść referencji (checklista, przykłady); minor = nowy krok w skillu albo nowy skill; major = zmiana profilu projektu wymagająca migracji w repozytoriach.

## Niewydane (ćwiczenie 3A)

- Skill `analiza-buildu`: analiza nieudanego buildu E2E; proces i kategorie w pluginie, dane projektu w `.claude/test-profile.md` projektu e2e; skrypt `scripts/parse-report.mjs` (json/junit, porównanie z próbą udaną).

## 0.2.0

- Skill `pw-review`: przegląd pliku testu wg `references/checklist.md`.
- Hook `PreToolUse` blokujący sekrety w `tooling/claude-plugins/**`.
- `.mcp.json` z Playwright MCP (`--isolated`, `--caps=testing`); narzędzia widoczne jako `mcp__plugin_qa-standards_playwright__*`.

## 0.1.0

- Szkielet pluginu.

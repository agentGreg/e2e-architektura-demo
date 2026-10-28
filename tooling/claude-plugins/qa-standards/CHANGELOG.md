# Changelog: qa-standards

Semver: patch = treść referencji (checklista, przykłady); minor = nowy krok w skillu albo nowy skill; major = zmiana profilu projektu wymagająca migracji w repozytoriach.

## 0.2.0

- Skill `pw-review`: przegląd pliku testu wg `references/checklist.md`.
- Hook `PreToolUse` blokujący sekrety w `tooling/claude-plugins/**`.
- `.mcp.json` z Playwright MCP (`--isolated`, `--caps=testing`); narzędzia widoczne jako `mcp__plugin_qa-standards_playwright__*`.

## 0.1.0

- Szkielet pluginu.

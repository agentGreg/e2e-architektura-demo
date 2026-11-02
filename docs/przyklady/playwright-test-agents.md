# Playwright Test Agents na sklepie (gałąź `extra/test-agents`)

Zadanie dodatkowe na koniec dnia, jeśli zostanie czasu. Agenci Playwright (planner, generator, healer) piszą testy koszyka od zera. Porównujemy dwa wyniki: z domyślnym seedem i z seedem, który używa pakietu wspólnego. Pytanie na koniec: co agent może robić w naszym repo sam, a co tylko z review.

## Co jest na gałęzi

Gałąź wychodzi z `solution/2a` (gotowe fixtures w `packages/test-core`). Testy sklepu z `e2e/shop/tests/` są usunięte, został tylko `auth.setup.ts`.

| Plik | Skąd |
|---|---|
| `e2e/shop/.claude/agents/playwright-test-{planner,generator,healer}.md` | `pnpm exec playwright init-agents --loop=claude` (Playwright 1.64.1) |
| `e2e/shop/.mcp.json` | to samo polecenie: serwer MCP `playwright-test` (`npx playwright run-test-mcp-server`) |
| `e2e/shop/tests/seed.spec.ts` | seed domyślny z `init-agents`: pusty test z `@playwright/test` |
| `e2e/shop/tests/seed-test-core.spec.ts` | seed z `@demo/test-core`: `page` zalogowana jako użytkownik workera, świeży `product` |
| `e2e/shop/specs/koszyk-seed-*.md` | plany od plannera, po jednym na seed |
| `e2e/shop/tests/seed-domyslny/`, `tests/seed-test-core/` | testy od generatora, bez poprawek |

Historia gałęzi jest częścią materiału: osobne commity dla planu i testów z każdego seeda, potem commit healera. `git log --oneline solution/2a..extra/test-agents` i `git show <commit>` pokazują, co zrobił który agent.

## Uruchomienie

0. Zainstaluj Playwright test agents:
```
npx playwright init-agents --loop=claude
```

```powershell
git switch extra/test-agents
pnpm install
pnpm dev                      # osobny terminal; agenci eksplorują działający sklep
```

Testy wygenerowane wcześniej (kryterium jak w 2A):

```powershell
cd e2e/shop
pnpm exec playwright test tests/seed-domyslny --workers=1
pnpm exec playwright test tests/seed-test-core --workers=4 --repeat-each=2
pnpm exec playwright test tests/seed-test-core --workers=4 --repeat-each=3 --shuffle
```

## Generowanie samemu

Claude Code uruchamiamy w `e2e/shop`, bo tam są definicje agentów i `.mcp.json`. Przy pierwszym starcie Claude Code pyta o zgodę na serwer MCP `playwright-test` z `.mcp.json`.

```powershell
cd e2e/shop
claude
```

Polecenie dla Claude (wariant z pakietem wspólnym; dla wariantu domyślnego seed `tests/seed.spec.ts` i konto `user` / `user123`):

```text
Użyj subagenta playwright-test-planner: przygotuj plan testów koszyka w sklepie pod http://localhost:4100
(dodawanie produktów, liczba pozycji, usuwanie pozycji, złożenie zamówienia). Seed: tests/seed-test-core.spec.ts.
Maksymalnie 5 scenariuszy, plan po polsku, zapisz do specs/koszyk-moj.md. Potem użyj subagenta
playwright-test-generator, żeby wygenerować testy dla każdego scenariusza z tego planu do katalogu tests/moj/.
Nie uruchamiaj healera.
```

Naprawa padających testów:

```text
Użyj subagenta playwright-test-healer, żeby naprawić padające testy w tests/moj/ (uruchamiaj z --workers=1).
```

Po healerze: `git diff` i szukanie `test.skip` / `test.fixme`. Wg dokumentacji Playwright healer może oznaczyć test jako pominięty, jeśli uzna, że funkcja jest zepsuta.

Bez Claude Code w trybie interaktywnym (tak powstały pliki na gałęzi):

```powershell
claude -p "<polecenie wyżej>" --mcp-config .mcp.json --strict-mcp-config --permission-mode acceptEdits `
  --allowedTools "mcp__playwright-test" "Read" "Glob" "Grep" "Write" "Edit" "Task" "Agent" "Bash(pnpm exec playwright test:*)" `
  --max-budget-usd 6
```

Po aktualizacji Playwright definicje agentów trzeba wygenerować ponownie: `pnpm exec playwright init-agents --loop=claude`.

## Wynik przebiegu przygotowawczego (1.11.2026)

Claude Code 2.1.309, agenci na `model: sonnet` (z definicji `init-agents`), sklep na pustej bazie demo.

| Krok | Czas | Koszt | Wynik |
|---|---|---|---|
| planner + generator, seed domyślny | 5,5 min | 1,56 USD | 5 testów: import z `@playwright/test`, login `user` / `user123` i nazwy produktów wpisane w test, logowanie formularzem w każdym teście, brak sprzątania |
| planner + generator, seed z `test-core` | 4 min | 1,06 USD | 5 testów: import z `@demo/test-core`, dane z fixture `product`, `page` już zalogowana, sprzątanie w fixtures |
| healer na testach z seeda domyślnego | < 1 min | 0,66 USD | nowy `helpers.ts` z `clearCart()` (usuwa wszystko z koszyka konta `user`) i jeden lokator poprawiony z `getByRole('cell')` na `getByTestId('product-name')`; nic nie oznaczył jako `skip` |

Uruchomienie wygenerowanych testów:

| Zestaw | `--workers=1` | `--workers=4 --repeat-each=2` |
|---|---|---|
| seed domyślny, przed healerem | 5 z 5 failed (resztki w koszyku po eksploracji agentów, jeden lokator niejednoznaczny) | 10 failed |
| seed domyślny, po healerze | 5 z 5 passed | 3 failed w każdym przebiegu: `clearCart` jednego workera czyści koszyk drugiego |
| seed z `test-core` | 5 z 5 passed | passed; także 3 × `--repeat-each=3 --shuffle` bez porażki, `pnpm seed:check` czysty |

Healer zrobił testy zielone na jednym workerze i przeniósł problem do równoległości. Agent orkiestrujący sam zauważył, że testy z seeda domyślnego łamią reguły z `.claude/rules/e2e.md`, ale generator ich nie zastosował. Zadziałał dopiero seed.

## Uwaga: agenci zostawiają dane

Planner i generator klikają w działającym sklepie, więc składają zamówienia i zostawiają produkty w koszyku konta, którego używają. Po zabawie z wariantem domyślnym (konto `user`) zrób świeżą bazę: zatrzymaj `pnpm dev`, potem `pnpm db:reset` i znowu `pnpm dev`.

## Pytania do dyskusji (10–15 min)

1. Co dało, że testy z drugiego seeda przechodzą przy 4 workerach? Ile z tego zrobił agent, a ile seed?
2. Healer naprawił testy na jednym workerze dodaniem `clearCart()` na wspólnym koncie. Czy to naprawa? Jak byście to wyłapali w review, zanim trafi do pipeline’u z 4 workerami?
3. Agent czytał reguły repo (`.claude/rules/e2e.md`), a testy z seeda domyślnego i tak je łamią. Gdzie reguła działa lepiej: w seedzie, w regule, w hooku, w review?
4. Co agent może robić w naszym repo sam, co z review, czego nigdy: wygenerować test, naprawić test, oznaczyć test `skip`, zmienić `test-core`, zrobić commit. Wynik dopisujemy do zasad marketplace’u albo do CLAUDE.md projektu.
5. Lista kontrolna review testu od agenta: dane z fixture z prefiksem, brak sztywnych czekań, stabilne lokatory, brak wspólnego konta, test przechodzi przy `--workers=4 --repeat-each=2`.
